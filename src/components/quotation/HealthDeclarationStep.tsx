import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { AlertCircle } from "lucide-react";
import type { Member } from "@/types/quotation";

const HEALTH_QUESTIONS = [
  "Do you suffer from chronic diseases (e.g., diabetes, hypertension, asthma)?",
  "Have you had any surgery in the past 2 years?",
  "Are you currently on long-term medication?",
  "Have you been hospitalized in the last 12 months?",
  "Do you have any diagnosed medical conditions not listed above?",
];

interface HealthDeclarationStepProps {
  members: Member[];
  onChange: (members: Member[]) => void;
  onNext: () => void;
  onBack: () => void;
}

const HealthDeclarationStep = ({ members, onChange, onNext, onBack }: HealthDeclarationStepProps) => {
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const allDeclared = members.every((m) => m.healthDeclaration === "Yes" || m.healthDeclaration === "No");

  const handleDeclareAllNo = () => {
    onChange(members.map((m) => ({ ...m, healthDeclaration: "No" as const, healthAnswers: undefined })));
  };

  const handleToggleDeclaration = (id: string, value: "Yes" | "No") => {
    onChange(
      members.map((m) =>
        m.id === id
          ? { ...m, healthDeclaration: value, healthAnswers: value === "Yes" ? new Array(5).fill(false) : undefined }
          : m
      )
    );
    if (value === "Yes") setSelectedMemberId(id);
    else if (selectedMemberId === id) setSelectedMemberId(null);
  };

  const handleAnswerChange = (memberId: string, qIndex: number, answer: boolean) => {
    onChange(
      members.map((m) => {
        if (m.id !== memberId) return m;
        const answers = [...(m.healthAnswers || new Array(5).fill(false))];
        answers[qIndex] = answer;
        return { ...m, healthAnswers: answers };
      })
    );
  };

  const updateMember = (id: string, patch: Partial<Member>) => {
    onChange(members.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    members.forEach((m) => {
      if (!m.heightCm || !m.heightCm.trim()) e[`height_${m.id}`] = "Required";
      else if (isNaN(Number(m.heightCm)) || Number(m.heightCm) < 30 || Number(m.heightCm) > 250)
        e[`height_${m.id}`] = "Enter valid height (30-250 cm)";
      if (!m.weightKg || !m.weightKg.trim()) e[`weight_${m.id}`] = "Required";
      else if (isNaN(Number(m.weightKg)) || Number(m.weightKg) < 2 || Number(m.weightKg) > 300)
        e[`weight_${m.id}`] = "Enter valid weight (2-300 kg)";
      if (m.gender === "Female" && m.isPregnant) {
        if (!m.expectedDeliveryDate?.trim()) e[`edd_${m.id}`] = "Expected delivery date required";
      }
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (!allDeclared) return;
    if (!validate()) return;
    onNext();
  };

  const selectedMember = members.find((m) => m.id === selectedMemberId);

  const FieldError = ({ field }: { field: string }) =>
    errors[field] ? <p className="text-xs text-destructive mt-1 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors[field]}</p> : null;

  return (
    <div className="space-y-6">
      {/* Height & Weight + Maternity for each member */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="font-heading text-xl">Member Physical Details</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">Enter height, weight, and maternity details (if applicable) for each member.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {members.map((m) => (
            <div key={m.id} className="rounded-xl border border-border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">{m.memberName}</p>
                  <p className="text-xs text-muted-foreground">{m.memberType} · {m.gender} · {m.classSelection}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <Label className="text-xs">Height (cm) *</Label>
                  <Input
                    value={m.heightCm || ""}
                    onChange={(e) => updateMember(m.id, { heightCm: e.target.value.replace(/[^\d.]/g, "").slice(0, 5) })}
                    placeholder="e.g. 170"
                  />
                  <FieldError field={`height_${m.id}`} />
                </div>
                <div>
                  <Label className="text-xs">Weight (kg) *</Label>
                  <Input
                    value={m.weightKg || ""}
                    onChange={(e) => updateMember(m.id, { weightKg: e.target.value.replace(/[^\d.]/g, "").slice(0, 5) })}
                    placeholder="e.g. 70"
                  />
                  <FieldError field={`weight_${m.id}`} />
                </div>
                {m.heightCm && m.weightKg && Number(m.heightCm) > 0 && Number(m.weightKg) > 0 && (
                  <div className="col-span-2 sm:col-span-2 flex items-end">
                    <Badge variant="outline" className="text-xs">
                      BMI: {(Number(m.weightKg) / ((Number(m.heightCm) / 100) ** 2)).toFixed(1)}
                    </Badge>
                  </div>
                )}
              </div>

              {/* Maternity section for females */}
              {m.gender === "Female" && (
                <div className="border-t border-border pt-3 space-y-3">
                  <div className="flex items-center gap-4">
                    <Label className="text-xs font-medium">Is the member currently pregnant?</Label>
                    <RadioGroup
                      value={m.isPregnant ? "yes" : "no"}
                      onValueChange={(v) => updateMember(m.id, {
                        isPregnant: v === "yes",
                        expectedDeliveryDate: v === "no" ? "" : m.expectedDeliveryDate,
                        maternityDays: v === "no" ? "" : m.maternityDays,
                      })}
                      className="flex gap-3"
                    >
                      <div className="flex items-center gap-1.5">
                        <RadioGroupItem value="yes" id={`preg-yes-${m.id}`} />
                        <Label htmlFor={`preg-yes-${m.id}`} className="text-xs">Yes</Label>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <RadioGroupItem value="no" id={`preg-no-${m.id}`} />
                        <Label htmlFor={`preg-no-${m.id}`} className="text-xs">No</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  {m.isPregnant && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Expected Delivery Date *</Label>
                        <Input
                          type="date"
                          value={m.expectedDeliveryDate || ""}
                          onChange={(e) => updateMember(m.id, { expectedDeliveryDate: e.target.value })}
                        />
                        <FieldError field={`edd_${m.id}`} />
                      </div>
                      <div>
                        <Label className="text-xs">Maternity Leave Days</Label>
                        <Input
                          value={m.maternityDays || ""}
                          onChange={(e) => updateMember(m.id, { maternityDays: e.target.value.replace(/\D/g, "").slice(0, 3) })}
                          placeholder="e.g. 90"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Health Declaration */}
      <Card className="border-border">
        <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="font-heading text-xl">Health Declaration</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Declare health status for each member per CCHI standards.</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleDeclareAllNo}>
            Declare All "No"
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {members.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between rounded-xl border border-border p-3 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{m.memberName}</p>
                    <p className="text-xs text-muted-foreground">{m.memberType} · {m.classSelection}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {m.healthDeclaration && (
                    <Badge variant={m.healthDeclaration === "No" ? "secondary" : "outline"} className={m.healthDeclaration === "Yes" ? "border-primary text-primary" : ""}>
                      {m.healthDeclaration === "No" ? "Healthy" : "Declared"}
                    </Badge>
                  )}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={m.healthDeclaration === "No" ? "default" : "outline"}
                      className="h-7 text-xs px-3"
                      onClick={() => handleToggleDeclaration(m.id, "No")}
                    >
                      No
                    </Button>
                    <Button
                      size="sm"
                      variant={m.healthDeclaration === "Yes" ? "default" : "outline"}
                      className="h-7 text-xs px-3"
                      onClick={() => handleToggleDeclaration(m.id, "Yes")}
                    >
                      Yes
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Health Questions for selected member */}
      {selectedMember && selectedMember.healthDeclaration === "Yes" && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="font-heading text-lg">
              Health Questions — {selectedMember.memberName}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {HEALTH_QUESTIONS.map((q, i) => (
              <div key={i} className="space-y-2">
                <p className="text-sm text-foreground font-medium">{i + 1}. {q}</p>
                <RadioGroup
                  value={selectedMember.healthAnswers?.[i] ? "yes" : "no"}
                  onValueChange={(v) => handleAnswerChange(selectedMember.id, i, v === "yes")}
                  className="flex gap-4"
                >
                  <div className="flex items-center gap-1.5">
                    <RadioGroupItem value="yes" id={`q-${i}-yes`} />
                    <Label htmlFor={`q-${i}-yes`} className="text-sm">Yes</Label>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <RadioGroupItem value="no" id={`q-${i}-no`} />
                    <Label htmlFor={`q-${i}-no`} className="text-sm">No</Label>
                  </div>
                </RadioGroup>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Show clickable list for members with "Yes" but not currently viewing */}
      {members.filter((m) => m.healthDeclaration === "Yes" && m.id !== selectedMemberId).length > 0 && (
        <div className="flex flex-wrap gap-2">
          <span className="text-xs text-muted-foreground self-center">View questions for:</span>
          {members.filter((m) => m.healthDeclaration === "Yes" && m.id !== selectedMemberId).map((m) => (
            <Button key={m.id} variant="outline" size="sm" className="h-7 text-xs" onClick={() => setSelectedMemberId(m.id)}>
              {m.memberName}
            </Button>
          ))}
        </div>
      )}

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>Back</Button>
        <Button onClick={handleNext} disabled={!allDeclared}>
          {allDeclared ? "Generate Quotation" : "Complete all declarations"}
        </Button>
      </div>
    </div>
  );
};

export default HealthDeclarationStep;
