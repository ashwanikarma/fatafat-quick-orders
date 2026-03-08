import { useState, useMemo } from "react";
import { ArrowLeft, UserPlus, CreditCard, CheckCircle2, Loader2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { calculatePremium } from "@/lib/quotation-api";
import type { Member, MemberType, ClassSelection, MaritalStatus, Gender } from "@/types/quotation";

const CLASS_OPTIONS: ClassSelection[] = ["VIP", "A", "B", "C", "LM"];

const HEALTH_QUESTIONS = [
  "Do you suffer from chronic diseases (e.g., diabetes, hypertension, asthma)?",
  "Have you had any surgery in the past 2 years?",
  "Are you currently on long-term medication?",
  "Have you been hospitalized in the last 12 months?",
  "Do you have any diagnosed medical conditions not listed above?",
];

type Step = "member" | "health" | "premium" | "payment" | "success";

interface AddMemberEndorsementProps {
  existingMembers: Member[];
  sponsorNumber: string;
  onComplete: (updatedMembers: Member[], newPremium: number) => void;
  onCancel: () => void;
}

const AddMemberEndorsement = ({ existingMembers, sponsorNumber, onComplete, onCancel }: AddMemberEndorsementProps) => {
  const [step, setStep] = useState<Step>("member");
  const [newMembers, setNewMembers] = useState<Member[]>([]);
  const [form, setForm] = useState({
    memberType: "Employee" as MemberType,
    memberName: "",
    identityNumber: "",
    dateOfBirth: "",
    gender: "Male" as Gender,
    maritalStatus: "Single" as MaritalStatus,
    classSelection: "B" as ClassSelection,
    employeeId: "",
  });
  const [formError, setFormError] = useState("");
  const [paymentState, setPaymentState] = useState<"idle" | "processing" | "success">("idle");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardName, setCardName] = useState("");

  const allEmployees = useMemo(() =>
    [...existingMembers, ...newMembers].filter(m => m.memberType === "Employee"),
    [existingMembers, newMembers]
  );

  const existingPremiumTotal = useMemo(() => calculatePremium(existingMembers).reduce((a, b) => a + b, 0), [existingMembers]);
  const newMemberPremiums = useMemo(() => calculatePremium(newMembers), [newMembers]);
  const additionalPremium = useMemo(() => newMemberPremiums.reduce((a, b) => a + b, 0), [newMemberPremiums]);

  const handleAddMember = () => {
    if (!form.memberName.trim()) { setFormError("Member Name is required."); return; }
    if (!form.identityNumber.trim()) { setFormError("Identity Number is required."); return; }
    if (!form.dateOfBirth) { setFormError("Date of Birth is required."); return; }
    if (form.memberType === "Dependent" && !form.employeeId) { setFormError("Select employee for dependent."); return; }
    setFormError("");

    const member: Member = {
      id: crypto.randomUUID(),
      ...form,
      sponsorNumber: form.memberType === "Employee" ? sponsorNumber : form.employeeId,
      healthDeclaration: undefined,
      healthAnswers: undefined,
      heightCm: "",
      weightKg: "",
    };
    setNewMembers(prev => [...prev, member]);
    setForm({ ...form, memberName: "", identityNumber: "", dateOfBirth: "", employeeId: "" });
  };

  const handleRemoveNew = (id: string) => setNewMembers(prev => prev.filter(m => m.id !== id));

  const handleHealthToggle = (id: string, value: "Yes" | "No") => {
    setNewMembers(prev => prev.map(m =>
      m.id === id ? { ...m, healthDeclaration: value, healthAnswers: value === "Yes" ? new Array(5).fill(false) : undefined } : m
    ));
  };

  const handleHealthAnswer = (memberId: string, qIndex: number, answer: boolean) => {
    setNewMembers(prev => prev.map(m => {
      if (m.id !== memberId) return m;
      const answers = [...(m.healthAnswers || new Array(5).fill(false))];
      answers[qIndex] = answer;
      return { ...m, healthAnswers: answers };
    }));
  };

  const updateNewMember = (id: string, patch: Partial<Member>) => {
    setNewMembers(prev => prev.map(m => m.id === id ? { ...m, ...patch } : m));
  };

  const allHealthDeclared = newMembers.every(m => m.healthDeclaration === "Yes" || m.healthDeclaration === "No");

  const handlePay = async () => {
    setPaymentState("processing");
    await new Promise(r => setTimeout(r, 2000));
    setPaymentState("success");
    setTimeout(() => {
      const allMembers = [...existingMembers, ...newMembers];
      const totalPremium = calculatePremium(allMembers).reduce((a, b) => a + b, 0);
      onComplete(allMembers, totalPremium);
    }, 1500);
  };

  const [selectedHealthMember, setSelectedHealthMember] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onCancel}><ArrowLeft className="h-5 w-5" /></Button>
        <div>
          <h2 className="text-lg font-heading font-bold text-foreground">Add Member Endorsement</h2>
          <p className="text-sm text-muted-foreground">
            {step === "member" && "Add new members to the policy"}
            {step === "health" && "Complete health declarations"}
            {step === "premium" && "Review additional premium"}
            {step === "payment" && "Complete payment for endorsement"}
            {step === "success" && "Endorsement approved"}
          </p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex gap-1">
        {["member", "health", "premium", "payment"].map((s, i) => (
          <div key={s} className={`h-1.5 flex-1 rounded-full transition-colors ${
            ["member", "health", "premium", "payment", "success"].indexOf(step) >= i ? "bg-primary" : "bg-border"
          }`} />
        ))}
      </div>

      {step === "member" && (
        <div className="space-y-4">
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="font-heading text-base">New Member Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Member Type</Label>
                  <Select value={form.memberType} onValueChange={v => setForm({ ...form, memberType: v as MemberType, employeeId: "" })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Employee">Employee</SelectItem>
                      <SelectItem value="Dependent">Dependent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Class *</Label>
                  <Select value={form.classSelection} onValueChange={v => setForm({ ...form, classSelection: v as ClassSelection })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CLASS_OPTIONS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {form.memberType === "Dependent" && (
                <div className="space-y-1.5">
                  <Label className="text-xs">Select Employee *</Label>
                  <Select value={form.employeeId} onValueChange={v => setForm({ ...form, employeeId: v })}>
                    <SelectTrigger><SelectValue placeholder="Choose employee" /></SelectTrigger>
                    <SelectContent>
                      {allEmployees.map(e => <SelectItem key={e.id} value={e.id}>{e.memberName} ({e.identityNumber})</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-1.5">
                <Label className="text-xs">Member Name *</Label>
                <Input value={form.memberName} onChange={e => setForm({ ...form, memberName: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Identity Number *</Label>
                  <Input value={form.identityNumber} onChange={e => setForm({ ...form, identityNumber: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Date of Birth *</Label>
                  <Input type="date" value={form.dateOfBirth} onChange={e => setForm({ ...form, dateOfBirth: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Gender</Label>
                  <Select value={form.gender} onValueChange={v => setForm({ ...form, gender: v as Gender })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Marital Status</Label>
                  <Select value={form.maritalStatus} onValueChange={v => setForm({ ...form, maritalStatus: v as MaritalStatus })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Single">Single</SelectItem>
                      <SelectItem value="Married">Married</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {formError && <p className="text-sm text-destructive">{formError}</p>}
              <Button onClick={handleAddMember} className="gap-1.5"><UserPlus className="h-4 w-4" /> Add to List</Button>
            </CardContent>
          </Card>

          {newMembers.length > 0 && (
            <Card className="border-border">
              <CardHeader className="pb-3">
                <CardTitle className="font-heading text-base">New Members ({newMembers.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {newMembers.map(m => (
                    <div key={m.id} className="flex items-center justify-between rounded-xl border border-border p-3">
                      <div>
                        <p className="text-sm font-medium text-foreground">{m.memberName}</p>
                        <p className="text-xs text-muted-foreground">{m.memberType} · {m.classSelection} · {m.identityNumber}</p>
                      </div>
                      <Button variant="ghost" size="sm" className="text-destructive h-8" onClick={() => handleRemoveNew(m.id)}>Remove</Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-between">
            <Button variant="outline" onClick={onCancel}>Cancel</Button>
            <Button onClick={() => setStep("health")} disabled={newMembers.length === 0}>Continue to Health Declaration</Button>
          </div>
        </div>
      )}

      {step === "health" && (
        <div className="space-y-4">
          {/* Height/Weight */}
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="font-heading text-base">Physical Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {newMembers.map(m => (
                <div key={m.id} className="rounded-xl border border-border p-3 space-y-2">
                  <p className="text-sm font-medium text-foreground">{m.memberName} <span className="text-xs text-muted-foreground">· {m.classSelection}</span></p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div><Label className="text-xs">Height (cm)</Label><Input value={m.heightCm || ""} onChange={e => updateNewMember(m.id, { heightCm: e.target.value.replace(/[^\d.]/g, "").slice(0, 5) })} placeholder="170" /></div>
                    <div><Label className="text-xs">Weight (kg)</Label><Input value={m.weightKg || ""} onChange={e => updateNewMember(m.id, { weightKg: e.target.value.replace(/[^\d.]/g, "").slice(0, 5) })} placeholder="70" /></div>
                    {m.heightCm && m.weightKg && Number(m.heightCm) > 0 && Number(m.weightKg) > 0 && (
                      <div className="flex items-end"><Badge variant="outline" className="text-xs">BMI: {(Number(m.weightKg) / ((Number(m.heightCm) / 100) ** 2)).toFixed(1)}</Badge></div>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Health Declaration */}
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="font-heading text-base">Health Declaration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {newMembers.map(m => (
                <div key={m.id} className="flex items-center justify-between rounded-xl border border-border p-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{m.memberName}</p>
                    <p className="text-xs text-muted-foreground">{m.memberType}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {m.healthDeclaration && (
                      <Badge variant={m.healthDeclaration === "No" ? "secondary" : "outline"} className={m.healthDeclaration === "Yes" ? "border-primary text-primary" : ""}>
                        {m.healthDeclaration === "No" ? "Healthy" : "Declared"}
                      </Badge>
                    )}
                    <div className="flex gap-1.5">
                      <Button size="sm" variant={m.healthDeclaration === "No" ? "default" : "outline"} className="h-7 text-xs px-2.5" onClick={() => handleHealthToggle(m.id, "No")}>No</Button>
                      <Button size="sm" variant={m.healthDeclaration === "Yes" ? "default" : "outline"} className="h-7 text-xs px-2.5" onClick={() => { handleHealthToggle(m.id, "Yes"); setSelectedHealthMember(m.id); }}>Yes</Button>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Health questions for selected "Yes" member */}
          {selectedHealthMember && newMembers.find(m => m.id === selectedHealthMember)?.healthDeclaration === "Yes" && (
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="pb-3">
                <CardTitle className="font-heading text-base">Health Questions — {newMembers.find(m => m.id === selectedHealthMember)?.memberName}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {HEALTH_QUESTIONS.map((q, i) => (
                  <div key={i} className="space-y-2">
                    <p className="text-sm text-foreground font-medium">{i + 1}. {q}</p>
                    <RadioGroup
                      value={newMembers.find(m => m.id === selectedHealthMember)?.healthAnswers?.[i] ? "yes" : "no"}
                      onValueChange={v => handleHealthAnswer(selectedHealthMember, i, v === "yes")}
                      className="flex gap-4"
                    >
                      <div className="flex items-center gap-1.5"><RadioGroupItem value="yes" id={`eq-${i}-yes`} /><Label htmlFor={`eq-${i}-yes`} className="text-sm">Yes</Label></div>
                      <div className="flex items-center gap-1.5"><RadioGroupItem value="no" id={`eq-${i}-no`} /><Label htmlFor={`eq-${i}-no`} className="text-sm">No</Label></div>
                    </RadioGroup>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep("member")}>Back</Button>
            <Button onClick={() => setStep("premium")} disabled={!allHealthDeclared}>Review Premium</Button>
          </div>
        </div>
      )}

      {step === "premium" && (
        <div className="space-y-4">
          <Card className="border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="font-heading text-lg">Premium Difference</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Current Policy Premium</span><span className="font-semibold text-foreground">SAR {existingPremiumTotal.toLocaleString()}</span></div>
                <Separator />
                {newMembers.map((m, i) => (
                  <div key={m.id} className="flex justify-between">
                    <span className="text-muted-foreground">{m.memberName} ({m.classSelection})</span>
                    <span className="font-semibold text-foreground">SAR {newMemberPremiums[i].toLocaleString()}</span>
                  </div>
                ))}
                <Separator />
                <div className="flex justify-between text-base">
                  <span className="font-heading font-bold text-foreground">Additional Premium</span>
                  <span className="font-heading font-bold text-primary">SAR {additionalPremium.toLocaleString()}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-base">
                  <span className="text-muted-foreground">New Total Premium</span>
                  <span className="font-semibold text-foreground">SAR {(existingPremiumTotal + additionalPremium).toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep("health")}>Back</Button>
            <Button onClick={() => setStep("payment")}>Proceed to Payment</Button>
          </div>
        </div>
      )}

      {step === "payment" && paymentState !== "success" && (
        <div className="space-y-4">
          <Card className="border-primary/20">
            <CardContent className="py-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Additional Premium to Pay</p>
                  <p className="text-2xl font-heading font-bold text-primary">SAR {additionalPremium.toLocaleString()}</p>
                </div>
                <Badge className="bg-primary/10 text-primary border-primary/20">{newMembers.length} New Members</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                <CardTitle className="font-heading text-lg">Payment</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div><Label>Cardholder Name</Label><Input value={cardName} onChange={e => setCardName(e.target.value)} placeholder="Name on card" /></div>
              <div><Label>Card Number</Label><Input value={cardNumber} onChange={e => setCardNumber(e.target.value.replace(/\D/g, "").slice(0, 16).replace(/(\d{4})(?=\d)/g, "$1 "))} placeholder="0000 0000 0000 0000" maxLength={19} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Expiry</Label><Input value={expiry} onChange={e => { const d = e.target.value.replace(/\D/g, "").slice(0, 4); setExpiry(d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d); }} placeholder="MM/YY" maxLength={5} /></div>
                <div><Label>CVV</Label><Input type="password" value={cvv} onChange={e => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="•••" maxLength={4} /></div>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
                <Shield className="h-4 w-4 text-primary shrink-0" />
                <span>Simulated payment gateway. No real charges.</span>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep("premium")}>Back</Button>
            <Button onClick={handlePay} disabled={paymentState === "processing"} className="gap-2 min-w-[160px]">
              {paymentState === "processing" ? <><Loader2 className="h-4 w-4 animate-spin" />Processing...</> : <>Pay SAR {additionalPremium.toLocaleString()}</>}
            </Button>
          </div>
        </div>
      )}

      {(step === "payment" && paymentState === "success") || step === "success" ? (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="py-10 text-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle2 className="h-8 w-8 text-primary" />
            </div>
            <h2 className="font-heading text-2xl font-bold text-foreground">Endorsement Approved!</h2>
            <p className="text-muted-foreground">{newMembers.length} new member(s) added to the policy.</p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
};

export default AddMemberEndorsement;
