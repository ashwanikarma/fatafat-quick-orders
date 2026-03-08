import { useState, useCallback, useMemo } from "react";
import { ArrowLeft, Trash2, Upload, CheckCircle2, AlertTriangle } from "lucide-react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { calculatePremium } from "@/lib/quotation-api";
import type { Member } from "@/types/quotation";

const DELETION_REASONS = [
  "Member left company",
  "Duplicate member",
  "Incorrect entry",
  "Policy downgrade",
  "Other",
];

type Step = "select" | "reason" | "review" | "success";

interface DeleteMemberEndorsementProps {
  members: Member[];
  sponsorNumber: string;
  onComplete: (updatedMembers: Member[], newPremium: number) => void;
  onCancel: () => void;
}

const DeleteMemberEndorsement = ({ members, sponsorNumber, onComplete, onCancel }: DeleteMemberEndorsementProps) => {
  const [step, setStep] = useState<Step>("select");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [reason, setReason] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === members.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(members.map(m => m.id)));
  };

  const selectedMembers = useMemo(() => members.filter(m => selectedIds.has(m.id)), [members, selectedIds]);
  const remainingMembers = useMemo(() => members.filter(m => !selectedIds.has(m.id)), [members, selectedIds]);

  const currentPremium = useMemo(() => calculatePremium(members).reduce((a, b) => a + b, 0), [members]);
  const selectedPremiums = useMemo(() => calculatePremium(selectedMembers), [selectedMembers]);
  const refundAmount = useMemo(() => selectedPremiums.reduce((a, b) => a + b, 0), [selectedPremiums]);
  const newPremium = currentPremium - refundAmount;

  const handleExcelUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadErrors([]);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const wb = XLSX.read(evt.target?.result, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<Record<string, string>>(ws);
        const errors: string[] = [];
        const ids = new Set(selectedIds);

        rows.forEach((row, i) => {
          const identity = (row["IdentityNumber"] || "").trim();
          if (!identity) { errors.push(`Row ${i + 2}: Missing IdentityNumber`); return; }
          const member = members.find(m => m.identityNumber === identity);
          if (!member) { errors.push(`Row ${i + 2}: No member found with ID "${identity}"`); return; }
          ids.add(member.id);
        });

        if (errors.length) setUploadErrors(errors);
        setSelectedIds(ids);
      } catch { setUploadErrors(["Failed to parse Excel file."]); }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = "";
  }, [members, selectedIds]);

  const handleSubmit = () => {
    setSubmitted(true);
    const remainingPremium = calculatePremium(remainingMembers).reduce((a, b) => a + b, 0);
    setTimeout(() => onComplete(remainingMembers, remainingPremium), 2000);
  };

  if (submitted) {
    return (
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="py-10 text-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <CheckCircle2 className="h-8 w-8 text-primary" />
          </div>
          <h2 className="font-heading text-2xl font-bold text-foreground">Deletion Endorsed!</h2>
          <p className="text-muted-foreground">{selectedMembers.length} member(s) removed. Refund of SAR {refundAmount.toLocaleString()} will be processed.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onCancel}><ArrowLeft className="h-5 w-5" /></Button>
        <div>
          <h2 className="text-lg font-heading font-bold text-foreground">Delete Member Endorsement</h2>
          <p className="text-sm text-muted-foreground">
            {step === "select" && "Select members to remove from the policy"}
            {step === "reason" && "Provide deletion reason"}
            {step === "review" && "Review refund and confirm"}
          </p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex gap-1">
        {["select", "reason", "review"].map((s, i) => (
          <div key={s} className={`h-1.5 flex-1 rounded-full transition-colors ${["select", "reason", "review"].indexOf(step) >= i ? "bg-destructive" : "bg-border"}`} />
        ))}
      </div>

      {step === "select" && (
        <div className="space-y-4">
          <Card className="border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="font-heading text-base">Select Members</CardTitle>
                <div className="flex gap-2">
                  <label htmlFor="delete-excel-upload">
                    <Button variant="outline" size="sm" asChild>
                      <span className="cursor-pointer gap-1"><Upload className="h-3.5 w-3.5" /> Bulk Upload</span>
                    </Button>
                  </label>
                  <input id="delete-excel-upload" type="file" accept=".xlsx,.xls" className="hidden" onChange={handleExcelUpload} />
                  <Button variant="outline" size="sm" onClick={selectAll}>
                    {selectedIds.size === members.length ? "Deselect All" : "Select All"}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {uploadErrors.length > 0 && (
                <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive space-y-1">
                  <p className="font-semibold">Upload Errors:</p>
                  {uploadErrors.map((err, i) => <p key={i}>• {err}</p>)}
                </div>
              )}
              <div className="space-y-2">
                {members.map(m => (
                  <div
                    key={m.id}
                    className={`flex items-center gap-3 rounded-xl border p-3 cursor-pointer transition-colors ${
                      selectedIds.has(m.id) ? "border-destructive/30 bg-destructive/5" : "border-border hover:bg-muted/50"
                    }`}
                    onClick={() => toggleSelect(m.id)}
                  >
                    <Checkbox checked={selectedIds.has(m.id)} onCheckedChange={() => toggleSelect(m.id)} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{m.memberName}</p>
                      <p className="text-xs text-muted-foreground">{m.memberType} · {m.identityNumber} · {m.classSelection}</p>
                    </div>
                    <Badge variant="secondary" className="shrink-0">{m.classSelection}</Badge>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-3">{selectedIds.size} of {members.length} selected</p>
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={onCancel}>Cancel</Button>
            <Button variant="destructive" onClick={() => setStep("reason")} disabled={selectedIds.size === 0}>Continue</Button>
          </div>
        </div>
      )}

      {step === "reason" && (
        <div className="space-y-4">
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="font-heading text-base">Deletion Reason</CardTitle>
              <p className="text-sm text-muted-foreground">Select a reason for removing {selectedIds.size} member(s).</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Reason *</Label>
                <Select value={reason} onValueChange={setReason}>
                  <SelectTrigger><SelectValue placeholder="Select reason" /></SelectTrigger>
                  <SelectContent>
                    {DELETION_REASONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-xl border border-border p-3 space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Members to be removed:</p>
                {selectedMembers.map(m => (
                  <p key={m.id} className="text-sm text-foreground">• {m.memberName} ({m.classSelection})</p>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep("select")}>Back</Button>
            <Button variant="destructive" onClick={() => setStep("review")} disabled={!reason}>Review & Confirm</Button>
          </div>
        </div>
      )}

      {step === "review" && (
        <div className="space-y-4">
          <Card className="border-destructive/20">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                <CardTitle className="font-heading text-lg">Confirm Deletion</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Current Policy Premium</span><span className="font-semibold text-foreground">SAR {currentPremium.toLocaleString()}</span></div>
                <Separator />
                {selectedMembers.map((m, i) => (
                  <div key={m.id} className="flex justify-between">
                    <span className="text-destructive">– {m.memberName} ({m.classSelection})</span>
                    <span className="font-semibold text-destructive">- SAR {selectedPremiums[i].toLocaleString()}</span>
                  </div>
                ))}
                <Separator />
                <div className="flex justify-between text-base">
                  <span className="font-heading font-bold text-foreground">Refund Amount</span>
                  <span className="font-heading font-bold text-primary">SAR {refundAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-base">
                  <span className="text-muted-foreground">New Total Premium</span>
                  <span className="font-semibold text-foreground">SAR {newPremium.toLocaleString()}</span>
                </div>
              </div>

              <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
                <p><strong>Reason:</strong> {reason}</p>
                <p><strong>Remaining Members:</strong> {remainingMembers.length}</p>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep("reason")}>Back</Button>
            <Button variant="destructive" onClick={handleSubmit} className="gap-1.5">
              <Trash2 className="h-4 w-4" /> Confirm Deletion
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeleteMemberEndorsement;
