import { useState, useMemo, useCallback } from "react";
import { Plus, Trash2, Building2, MapPin, FileCheck, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import type {
  KYCData, NationalAddress, BusinessDetails, ComplianceData,
  BusinessType, RevenueRange, EmployeeRange, BoardMember, Shareholder,
} from "@/types/quotation";

// IBAN bank code mapping (digits 5-6)
const BANK_MAP: Record<string, string> = {
  "10": "National Commercial Bank (NCB)",
  "15": "Al Rajhi Bank",
  "20": "Riyad Bank",
  "45": "Saudi British Bank (SABB)",
  "55": "Banque Saudi Fransi",
  "60": "Bank AlJazira",
  "65": "Saudi Investment Bank",
  "80": "Arab National Bank",
  "05": "Alinma Bank",
  "30": "Arab Banking Corporation (ABC)",
  "40": "Saudi Awwal Bank (SAB)",
  "50": "Gulf International Bank",
  "76": "Bank AlBilad",
};

const emptyAddress: NationalAddress = {
  buildingNumber: "", additionalNumber: "", unitNumber: "",
  postalCode: "", street: "", district: "", city: "",
};

const emptyBusiness: BusinessDetails = {
  businessType: "", companyRevenue: "", numberOfEmployees: "",
  taxRegistrationNumber: "", ibanNumber: "", bankName: "",
};

const emptyCompliance: ComplianceData = {
  isPEP: null, isBoardMember: null, boardMembers: [],
  hasMajorShareholder: null, shareholders: [], termsAccepted: false,
};

interface KYCStepProps {
  kycData: KYCData;
  onChange: (data: KYCData) => void;
  onNext: () => void;
  onBack: () => void;
}

const KYCStep = ({ kycData, onChange, onNext, onBack }: KYCStepProps) => {
  const { toast } = useToast();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const addr = kycData.nationalAddress;
  const biz = kycData.businessDetails;
  const comp = kycData.compliance;

  const setAddr = useCallback((patch: Partial<NationalAddress>) => {
    onChange({ ...kycData, nationalAddress: { ...addr, ...patch } });
  }, [kycData, addr, onChange]);

  const setBiz = useCallback((patch: Partial<BusinessDetails>) => {
    onChange({ ...kycData, businessDetails: { ...biz, ...patch } });
  }, [kycData, biz, onChange]);

  const setComp = useCallback((patch: Partial<ComplianceData>) => {
    onChange({ ...kycData, compliance: { ...comp, ...patch } });
  }, [kycData, comp, onChange]);

  // IBAN → bank auto-detect
  const handleIbanChange = useCallback((val: string) => {
    const upper = val.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 24);
    let bankName = "";
    if (upper.length >= 6) {
      const code = upper.substring(4, 6);
      bankName = BANK_MAP[code] || "";
    }
    setBiz({ ibanNumber: upper, bankName });
  }, [setBiz]);

  // Validation
  const validate = (): boolean => {
    const e: Record<string, string> = {};
    // Address
    if (!addr.buildingNumber.trim()) e.buildingNumber = "Required";
    if (!addr.additionalNumber.trim()) e.additionalNumber = "Required";
    if (!addr.unitNumber.trim()) e.unitNumber = "Required";
    if (!addr.postalCode.trim()) e.postalCode = "Required";
    if (!addr.street.trim()) e.street = "Required";
    if (!addr.district.trim()) e.district = "Required";
    if (!addr.city.trim()) e.city = "Required";
    // Business
    if (!biz.businessType) e.businessType = "Required";
    if (!biz.companyRevenue) e.companyRevenue = "Required";
    if (!biz.numberOfEmployees) e.numberOfEmployees = "Required";
    if (!biz.taxRegistrationNumber.trim()) {
      e.taxRegistrationNumber = "Required";
    } else if (biz.taxRegistrationNumber.length !== 15) {
      e.taxRegistrationNumber = "Must be 15 digits";
    } else if (!biz.taxRegistrationNumber.startsWith("3") || !biz.taxRegistrationNumber.endsWith("3")) {
      e.taxRegistrationNumber = "Must start and end with 3";
    }
    if (!biz.ibanNumber.trim()) {
      e.ibanNumber = "Required";
    } else if (biz.ibanNumber.length !== 24) {
      e.ibanNumber = "Must be 24 characters";
    } else if (!biz.ibanNumber.startsWith("SA")) {
      e.ibanNumber = "Must start with SA";
    }
    if (!biz.bankName) e.bankName = "Could not detect bank from IBAN";
    // Compliance
    if (comp.isPEP === null) e.isPEP = "Required";
    if (comp.isBoardMember === null) e.isBoardMember = "Required";
    if (comp.isBoardMember && comp.boardMembers.length === 0) e.boardMembers = "Add at least one member";
    if (comp.hasMajorShareholder === null) e.hasMajorShareholder = "Required";
    if (comp.hasMajorShareholder && comp.shareholders.length === 0) e.shareholders = "Add at least one shareholder";
    if (!comp.termsAccepted) e.terms = "You must accept Terms and Conditions";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) {
      toast({ title: "Validation Error", description: "Please fix all highlighted fields.", variant: "destructive" });
      return;
    }
    onChange({ ...kycData, completed: true });
    toast({ title: "KYC Saved", description: "Your KYC data has been saved successfully." });
    onNext();
  };

  // Board members helpers
  const addBoardMember = () => {
    setComp({ boardMembers: [...comp.boardMembers, { id: crypto.randomUUID(), name: "", identityNumber: "", address: "" }] });
  };
  const removeBoardMember = (id: string) => {
    setComp({ boardMembers: comp.boardMembers.filter((m) => m.id !== id) });
  };
  const updateBoardMember = (id: string, patch: Partial<BoardMember>) => {
    setComp({ boardMembers: comp.boardMembers.map((m) => m.id === id ? { ...m, ...patch } : m) });
  };

  // Shareholder helpers
  const addShareholder = () => {
    setComp({ shareholders: [...comp.shareholders, { id: crypto.randomUUID(), name: "", address: "", contributionPercent: "" }] });
  };
  const removeShareholder = (id: string) => {
    setComp({ shareholders: comp.shareholders.filter((s) => s.id !== id) });
  };
  const updateShareholder = (id: string, patch: Partial<Shareholder>) => {
    setComp({ shareholders: comp.shareholders.map((s) => s.id === id ? { ...s, ...patch } : s) });
  };

  const FieldError = ({ field }: { field: string }) =>
    errors[field] ? <p className="text-xs text-destructive mt-1 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors[field]}</p> : null;

  return (
    <div className="space-y-6 pb-20 sm:pb-0">
      {/* Section 1: National Address */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            <CardTitle className="font-heading text-lg">National Address</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label>Building Number *</Label>
              <Input value={addr.buildingNumber} onChange={(e) => setAddr({ buildingNumber: e.target.value })} placeholder="e.g. 1234" />
              <FieldError field="buildingNumber" />
            </div>
            <div>
              <Label>Additional Number *</Label>
              <Input value={addr.additionalNumber} onChange={(e) => setAddr({ additionalNumber: e.target.value })} placeholder="e.g. 5678" />
              <FieldError field="additionalNumber" />
            </div>
            <div>
              <Label>Unit Number *</Label>
              <Input value={addr.unitNumber} onChange={(e) => setAddr({ unitNumber: e.target.value })} placeholder="e.g. 1" />
              <FieldError field="unitNumber" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Street *</Label>
              <Input value={addr.street} onChange={(e) => setAddr({ street: e.target.value })} placeholder="Street name" />
              <FieldError field="street" />
            </div>
            <div>
              <Label>District *</Label>
              <Input value={addr.district} onChange={(e) => setAddr({ district: e.target.value })} placeholder="District name" />
              <FieldError field="district" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>City *</Label>
              <Input value={addr.city} onChange={(e) => setAddr({ city: e.target.value })} placeholder="e.g. Riyadh" />
              <FieldError field="city" />
            </div>
            <div>
              <Label>Postal Code *</Label>
              <Input value={addr.postalCode} onChange={(e) => setAddr({ postalCode: e.target.value })} placeholder="e.g. 12345" />
              <FieldError field="postalCode" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Business Details */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            <CardTitle className="font-heading text-lg">Business Details</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label>Business Type *</Label>
              <Select value={biz.businessType} onValueChange={(v) => setBiz({ businessType: v as BusinessType })}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="LLC">LLC</SelectItem>
                  <SelectItem value="Sole Proprietorship">Sole Proprietorship</SelectItem>
                  <SelectItem value="Partnership">Partnership</SelectItem>
                  <SelectItem value="Corporation">Corporation</SelectItem>
                </SelectContent>
              </Select>
              <FieldError field="businessType" />
            </div>
            <div>
              <Label>Company Revenue *</Label>
              <Select value={biz.companyRevenue} onValueChange={(v) => setBiz({ companyRevenue: v as RevenueRange })}>
                <SelectTrigger><SelectValue placeholder="Select range" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="< 1 Million">{"< 1 Million"}</SelectItem>
                  <SelectItem value="1M – 10M">1M – 10M</SelectItem>
                  <SelectItem value="10M – 50M">10M – 50M</SelectItem>
                  <SelectItem value="50M+">50M+</SelectItem>
                </SelectContent>
              </Select>
              <FieldError field="companyRevenue" />
            </div>
            <div>
              <Label>Number of Employees *</Label>
              <Select value={biz.numberOfEmployees} onValueChange={(v) => setBiz({ numberOfEmployees: v as EmployeeRange })}>
                <SelectTrigger><SelectValue placeholder="Select range" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1–10">1–10</SelectItem>
                  <SelectItem value="11–50">11–50</SelectItem>
                  <SelectItem value="51–100">51–100</SelectItem>
                  <SelectItem value="100+">100+</SelectItem>
                </SelectContent>
              </Select>
              <FieldError field="numberOfEmployees" />
            </div>
          </div>
          <div>
            <Label>Tax Registration Number (TRN) *</Label>
            <Input
              value={biz.taxRegistrationNumber}
              onChange={(e) => setBiz({ taxRegistrationNumber: e.target.value.replace(/\D/g, "").slice(0, 15) })}
              placeholder="3XXXXXXXXXXXXX3"
              maxLength={15}
            />
            <p className="text-xs text-muted-foreground mt-1">15 digits, must start and end with 3</p>
            <FieldError field="taxRegistrationNumber" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>IBAN Number *</Label>
              <Input
                value={biz.ibanNumber}
                onChange={(e) => handleIbanChange(e.target.value)}
                placeholder="SA0000000000000000000000"
                maxLength={24}
              />
              <p className="text-xs text-muted-foreground mt-1">24 characters, starts with SA</p>
              <FieldError field="ibanNumber" />
            </div>
            <div>
              <Label>Bank Name</Label>
              <Input value={biz.bankName} readOnly className="bg-muted" placeholder="Auto-detected from IBAN" />
              <FieldError field="bankName" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 3: Compliance */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <FileCheck className="h-5 w-5 text-primary" />
            <CardTitle className="font-heading text-lg">Compliance Questions</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* PEP */}
          <div>
            <Label className="text-sm font-medium">Are you a Politically Exposed Person (PEP)? *</Label>
            <RadioGroup
              value={comp.isPEP === null ? "" : comp.isPEP ? "yes" : "no"}
              onValueChange={(v) => setComp({ isPEP: v === "yes" })}
              className="flex gap-4 mt-2"
            >
              <div className="flex items-center gap-2"><RadioGroupItem value="yes" id="pep-yes" /><Label htmlFor="pep-yes">Yes</Label></div>
              <div className="flex items-center gap-2"><RadioGroupItem value="no" id="pep-no" /><Label htmlFor="pep-no">No</Label></div>
            </RadioGroup>
            <FieldError field="isPEP" />
          </div>

          <Separator />

          {/* Board Member */}
          <div>
            <Label className="text-sm font-medium">Are you a Board Member, Audit Committee Member, or Executive Officer in a listed company? *</Label>
            <RadioGroup
              value={comp.isBoardMember === null ? "" : comp.isBoardMember ? "yes" : "no"}
              onValueChange={(v) => setComp({ isBoardMember: v === "yes", boardMembers: v === "yes" ? comp.boardMembers : [] })}
              className="flex gap-4 mt-2"
            >
              <div className="flex items-center gap-2"><RadioGroupItem value="yes" id="bm-yes" /><Label htmlFor="bm-yes">Yes</Label></div>
              <div className="flex items-center gap-2"><RadioGroupItem value="no" id="bm-no" /><Label htmlFor="bm-no">No</Label></div>
            </RadioGroup>
            <FieldError field="isBoardMember" />
            {comp.isBoardMember && (
              <div className="mt-4 space-y-3">
                {comp.boardMembers.map((bm) => (
                  <div key={bm.id} className="flex gap-2 items-start p-3 rounded-lg border border-border bg-muted/30">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 flex-1">
                      <Input placeholder="Name" value={bm.name} onChange={(e) => updateBoardMember(bm.id, { name: e.target.value })} />
                      <Input placeholder="ID Number" value={bm.identityNumber} onChange={(e) => updateBoardMember(bm.id, { identityNumber: e.target.value })} />
                      <Input placeholder="Address" value={bm.address} onChange={(e) => updateBoardMember(bm.id, { address: e.target.value })} />
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => removeBoardMember(bm.id)} className="text-destructive shrink-0"><Trash2 className="h-4 w-4" /></Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={addBoardMember} className="gap-1"><Plus className="h-4 w-4" />Add Member</Button>
                <FieldError field="boardMembers" />
              </div>
            )}
          </div>

          <Separator />

          {/* Major Shareholder */}
          <div>
            <Label className="text-sm font-medium">Is there any shareholder owning 25% or more of company shares? *</Label>
            <RadioGroup
              value={comp.hasMajorShareholder === null ? "" : comp.hasMajorShareholder ? "yes" : "no"}
              onValueChange={(v) => setComp({ hasMajorShareholder: v === "yes", shareholders: v === "yes" ? comp.shareholders : [] })}
              className="flex gap-4 mt-2"
            >
              <div className="flex items-center gap-2"><RadioGroupItem value="yes" id="sh-yes" /><Label htmlFor="sh-yes">Yes</Label></div>
              <div className="flex items-center gap-2"><RadioGroupItem value="no" id="sh-no" /><Label htmlFor="sh-no">No</Label></div>
            </RadioGroup>
            <FieldError field="hasMajorShareholder" />
            {comp.hasMajorShareholder && (
              <div className="mt-4 space-y-3">
                {comp.shareholders.map((sh) => (
                  <div key={sh.id} className="flex gap-2 items-start p-3 rounded-lg border border-border bg-muted/30">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 flex-1">
                      <Input placeholder="Name" value={sh.name} onChange={(e) => updateShareholder(sh.id, { name: e.target.value })} />
                      <Input placeholder="Address" value={sh.address} onChange={(e) => updateShareholder(sh.id, { address: e.target.value })} />
                      <Input placeholder="Contribution %" value={sh.contributionPercent} onChange={(e) => updateShareholder(sh.id, { contributionPercent: e.target.value.replace(/[^\d.]/g, "") })} />
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => removeShareholder(sh.id)} className="text-destructive shrink-0"><Trash2 className="h-4 w-4" /></Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={addShareholder} className="gap-1"><Plus className="h-4 w-4" />Add Shareholder</Button>
                <FieldError field="shareholders" />
              </div>
            )}
          </div>

          <Separator />

          {/* Terms */}
          <div className="flex items-start gap-2">
            <Checkbox
              id="terms"
              checked={comp.termsAccepted}
              onCheckedChange={(v) => setComp({ termsAccepted: v === true })}
            />
            <Label htmlFor="terms" className="text-sm leading-relaxed cursor-pointer">
              I agree to the <span className="text-primary font-medium underline">Terms and Conditions</span>
            </Label>
          </div>
          <FieldError field="terms" />
        </CardContent>
      </Card>

      <div className="hidden sm:flex justify-between">
        <Button variant="outline" onClick={onBack}>Back to Quotation</Button>
        <Button onClick={handleSave}>Save KYC & Proceed to Payment</Button>
      </div>

      {/* Sticky mobile bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 backdrop-blur-md p-3 flex gap-3 sm:hidden">
        <Button variant="outline" onClick={onBack} className="flex-1">Back</Button>
        <Button onClick={handleSave} className="flex-1 text-xs">Save & Proceed</Button>
      </div>
    </div>
  );
};

export default KYCStep;
