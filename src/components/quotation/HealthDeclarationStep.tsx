import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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

  const selectedMember = members.find((m) => m.id === selectedMemberId);

  return (
    <div className="space-y-6">
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
                      onClick={() => {
                        handleToggleDeclaration(m.id, "Yes");
                      }}
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
        <Button onClick={onNext} disabled={!allDeclared}>
          {allDeclared ? "Generate Quotation" : "Complete all declarations"}
        </Button>
      </div>
    </div>
  );
};

export default HealthDeclarationStep;
