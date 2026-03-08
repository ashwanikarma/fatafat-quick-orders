import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Navigate, Link, useSearchParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, Save, CheckCircle2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useQuotationPersistence } from "@/hooks/useQuotationPersistence";
import StepIndicator from "@/components/quotation/StepIndicator";
import SponsorStep from "@/components/quotation/SponsorStep";
import MembersStep from "@/components/quotation/MembersStep";
import HealthDeclarationStep from "@/components/quotation/HealthDeclarationStep";
import QuotationStep from "@/components/quotation/QuotationStep";
import KYCStep from "@/components/quotation/KYCStep";
import PaymentStep from "@/components/quotation/PaymentStep";
import type { SponsorData, Member, KYCData } from "@/types/quotation";

const emptyKYC: KYCData = {
  nationalAddress: { buildingNumber: "", additionalNumber: "", unitNumber: "", postalCode: "", street: "", district: "", city: "" },
  businessDetails: { businessType: "", companyRevenue: "", numberOfEmployees: "", taxRegistrationNumber: "", ibanNumber: "", bankName: "" },
  compliance: { isPEP: null, isBoardMember: null, boardMembers: [], hasMajorShareholder: null, shareholders: [], termsAccepted: false },
  completed: false,
};

const Quotation = () => {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const resumeId = searchParams.get("id");

  const [step, setStep] = useState(0);
  const [sponsorData, setSponsorData] = useState<SponsorData>({ sponsorNumber: "", policyEffectiveDate: undefined });
  const [members, setMembers] = useState<Member[]>([]);
  const [kycData, setKycData] = useState<KYCData>(emptyKYC);
  const [isInitialized, setIsInitialized] = useState(false);

  const { quotationId, isSaving, createDraft, saveState, debouncedSave, loadQuotation, setQuotationId } =
    useQuotationPersistence(user?.id);

  const [isPaidPolicy, setIsPaidPolicy] = useState(false);
  const [policyNumber, setPolicyNumber] = useState<string | null>(null);

  // Initialize: load existing or create new draft
  useEffect(() => {
    if (!user || isInitialized) return;
    const init = async () => {
      if (resumeId) {
        const loaded = await loadQuotation(resumeId);
        if (loaded) {
          // If already paid, mark as read-only
          if (loaded.status === "paid" || loaded.status === "completed") {
            setIsPaidPolicy(true);
            setPolicyNumber(loaded.policyNumber || null);
            setSponsorData(loaded.sponsorData);
            setMembers(loaded.members);
            setKycData(loaded.kycData);
            setStep(loaded.currentStep);
            setIsInitialized(true);
            return;
          }
          setStep(loaded.currentStep);
          setSponsorData(loaded.sponsorData);
          setMembers(loaded.members);
          setKycData(loaded.kycData);
          setIsInitialized(true);
          return;
        }
      }
      // Create new draft
      await createDraft();
      setIsInitialized(true);
    };
    init();
  }, [user, resumeId, isInitialized, loadQuotation, createDraft]);

  // Auto-save on state changes
  useEffect(() => {
    if (!quotationId || !isInitialized) return;
    debouncedSave(quotationId, step, sponsorData, members, kycData);
  }, [quotationId, step, sponsorData, members, kycData, isInitialized, debouncedSave]);

  // Step change with immediate save
  const goToStep = useCallback(
    (nextStep: number) => {
      setStep(nextStep);
      if (quotationId) {
        saveState(quotationId, nextStep, sponsorData, members, kycData);
      }
    },
    [quotationId, sponsorData, members, kycData, saveState],
  );

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-section-alt">
        <div className="inline-flex items-center gap-3 rounded-full border border-border bg-card px-5 py-3 text-sm text-muted-foreground shadow-sm">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />Loading...
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) return <Navigate to="/login" replace />;

  if (!isInitialized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-section-alt">
        <div className="inline-flex items-center gap-3 rounded-full border border-border bg-card px-5 py-3 text-sm text-muted-foreground shadow-sm">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />Loading quotation...
        </div>
      </div>
    );
  }

  if (isPaidPolicy) {
    return (
      <div className="min-h-screen bg-section-alt">
        <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur-md">
          <div className="container mx-auto flex h-16 items-center justify-between px-4 lg:px-8">
            <div className="flex items-center gap-4">
              <Link to="/dashboard">
                <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
              </Link>
              <div>
                <h1 className="text-lg font-heading font-bold text-foreground">Policy Details</h1>
                <p className="text-xs text-muted-foreground">This quotation has been completed and paid.</p>
              </div>
            </div>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8 lg:px-8 max-w-2xl">
          <Card className="border-primary/20">
            <CardContent className="p-8 text-center space-y-4">
              <CheckCircle2 className="h-16 w-16 text-primary mx-auto" />
              <h2 className="text-2xl font-heading font-bold text-foreground">Policy Issued</h2>
              <p className="text-muted-foreground">This quotation has already been paid and a policy has been issued. No further changes can be made.</p>
              {policyNumber && (
                <Badge variant="outline" className="text-lg px-4 py-2 border-primary/30 text-primary">
                  <FileText className="h-4 w-4 mr-2" /> Policy: {policyNumber}
                </Badge>
              )}
              <div className="text-sm text-muted-foreground space-y-1 pt-4">
                <p><strong>Sponsor:</strong> {sponsorData.sponsorName || sponsorData.sponsorNumber || "N/A"}</p>
                <p><strong>Members:</strong> {members.length}</p>
              </div>
              <div className="flex gap-3 justify-center pt-4">
                <Link to="/dashboard"><Button variant="outline">Back to Dashboard</Button></Link>
                <Link to="/policies"><Button>View All Policies</Button></Link>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-section-alt">
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 lg:px-8">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <Link to="/dashboard">
              <Button variant="ghost" size="icon" className="shrink-0"><ArrowLeft className="h-5 w-5" /></Button>
            </Link>
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-heading font-bold text-foreground truncate">New Policy Quotation</h1>
              <p className="text-xs text-muted-foreground hidden sm:block">Health Insurance — Quotation Module</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isSaving && (
              <Badge variant="outline" className="gap-1.5 text-xs text-muted-foreground">
                <Save className="h-3 w-3 animate-pulse" /> Saving...
              </Badge>
            )}
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              {user.avatar}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 lg:px-8 max-w-4xl">
        <StepIndicator currentStep={step} />

        {step === 0 && <SponsorStep data={sponsorData} onChange={setSponsorData} onNext={() => goToStep(1)} />}
        {step === 1 && <MembersStep members={members} sponsorNumber={sponsorData.sponsorNumber} onChange={setMembers} onNext={() => goToStep(2)} onBack={() => goToStep(0)} />}
        {step === 2 && <HealthDeclarationStep members={members} onChange={setMembers} onNext={() => goToStep(3)} onBack={() => goToStep(1)} />}
        {step === 3 && <QuotationStep members={members} sponsorData={sponsorData} onBack={() => goToStep(2)} onNext={() => goToStep(4)} />}
        {step === 4 && <KYCStep kycData={kycData} onChange={setKycData} onNext={() => goToStep(5)} onBack={() => goToStep(3)} />}
        {step === 5 && (
          <PaymentStep
            members={members}
            sponsorData={sponsorData}
            onBack={() => goToStep(4)}
            onPaymentSuccess={(policyNum, premium) => {
              if (quotationId) {
                saveState(quotationId, step, sponsorData, members, kycData, "paid", premium, undefined, policyNum);
              }
            }}
          />
        )}
      </main>
    </div>
  );
};

export default Quotation;
