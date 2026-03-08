import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { SponsorData, Member, KYCData } from "@/types/quotation";

export interface QuotationRecord {
  id: string;
  user_id: string;
  status: string;
  current_step: number;
  sponsor_data: SponsorData;
  members: Member[];
  kyc_data: KYCData;
  total_premium: number;
  quotation_id: string | null;
  policy_number: string | null;
  created_at: string;
  updated_at: string;
}

const emptyKYC: KYCData = {
  nationalAddress: { buildingNumber: "", additionalNumber: "", unitNumber: "", postalCode: "", street: "", district: "", city: "" },
  businessDetails: { businessType: "", companyRevenue: "", numberOfEmployees: "", taxRegistrationNumber: "", ibanNumber: "", bankName: "" },
  compliance: { isPEP: null, isBoardMember: null, boardMembers: [], hasMajorShareholder: null, shareholders: [], termsAccepted: false },
  completed: false,
};

export function useQuotationPersistence(userId: string | undefined) {
  const { toast } = useToast();
  const [quotationId, setQuotationId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const saveTimeout = useRef<ReturnType<typeof setTimeout>>();

  // Create a new quotation draft
  const createDraft = useCallback(async () => {
    if (!userId) return null;
    const { data, error } = await supabase
      .from("quotations")
      .insert({ user_id: userId, status: "draft", current_step: 0 } as any)
      .select("id")
      .single();
    if (error) {
      console.error("Failed to create quotation draft", error);
      return null;
    }
    setQuotationId(data.id);
    return data.id;
  }, [userId]);

  // Save current state (debounced)
  const saveState = useCallback(
    async (
      id: string,
      step: number,
      sponsorData: SponsorData,
      members: Member[],
      kycData: KYCData,
      status: string = "draft",
      totalPremium: number = 0,
      quotationCode?: string,
      policyNumber?: string,
    ) => {
      if (!userId) return;
      setIsSaving(true);
      const { error } = await supabase
        .from("quotations")
        .update({
          current_step: step,
          sponsor_data: sponsorData as any,
          members: members as any,
          kyc_data: kycData as any,
          status,
          total_premium: totalPremium,
          quotation_id: quotationCode ?? null,
          policy_number: policyNumber ?? null,
        } as any)
        .eq("id", id);
      setIsSaving(false);
      if (error) console.error("Failed to save quotation", error);
    },
    [userId],
  );

  // Debounced auto-save
  const debouncedSave = useCallback(
    (...args: Parameters<typeof saveState>) => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
      saveTimeout.current = setTimeout(() => saveState(...args), 1000);
    },
    [saveState],
  );

  // Load an existing quotation
  const loadQuotation = useCallback(
    async (id: string) => {
      const { data, error } = await supabase
        .from("quotations")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error || !data) return null;
      setQuotationId(id);
      return {
        id: data.id,
        status: data.status,
        currentStep: data.current_step,
        sponsorData: (data.sponsor_data as any as SponsorData) ?? { sponsorNumber: "", policyEffectiveDate: undefined },
        members: (data.members as any as Member[]) ?? [],
        kycData: (data.kyc_data as any as KYCData) ?? emptyKYC,
        totalPremium: Number(data.total_premium) || 0,
        quotationCode: data.quotation_id,
        policyNumber: data.policy_number,
      };
    },
    [],
  );

  // List user's quotations
  const listQuotations = useCallback(async (): Promise<QuotationRecord[]> => {
    if (!userId) return [];
    const { data, error } = await supabase
      .from("quotations")
      .select("*")
      .order("updated_at", { ascending: false });
    if (error) {
      console.error("Failed to list quotations", error);
      return [];
    }
    return (data ?? []).map((d: any) => ({
      id: d.id,
      user_id: d.user_id,
      status: d.status,
      current_step: d.current_step,
      sponsor_data: d.sponsor_data as SponsorData,
      members: d.members as Member[],
      kyc_data: d.kyc_data as KYCData,
      total_premium: Number(d.total_premium) || 0,
      quotation_id: d.quotation_id,
      policy_number: d.policy_number,
      created_at: d.created_at,
      updated_at: d.updated_at,
    }));
  }, [userId]);

  // Cleanup
  useEffect(() => () => { if (saveTimeout.current) clearTimeout(saveTimeout.current); }, []);

  return { quotationId, setQuotationId, isSaving, createDraft, saveState, debouncedSave, loadQuotation, listQuotations };
}
