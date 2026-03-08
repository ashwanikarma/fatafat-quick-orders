import { useState } from "react";
import { ArrowLeft, Pencil, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { calculatePremium } from "@/lib/quotation-api";
import type { Member, Gender, MaritalStatus } from "@/types/quotation";

interface UpdateMemberEndorsementProps {
  members: Member[];
  onComplete: (updatedMembers: Member[], newPremium: number) => void;
  onCancel: () => void;
}

const UpdateMemberEndorsement = ({ members, onComplete, onCancel }: UpdateMemberEndorsementProps) => {
  const [updatedMembers, setUpdatedMembers] = useState<Member[]>(members);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ memberName: "", gender: "Male" as Gender, maritalStatus: "Single" as MaritalStatus, dateOfBirth: "" });
  const [submitted, setSubmitted] = useState(false);

  const openEdit = (m: Member) => {
    setEditingId(m.id);
    setForm({ memberName: m.memberName, gender: m.gender, maritalStatus: m.maritalStatus, dateOfBirth: m.dateOfBirth });
  };

  const handleSave = () => {
    if (!editingId || !form.memberName.trim()) return;
    setUpdatedMembers(prev => prev.map(m => m.id === editingId ? { ...m, memberName: form.memberName, gender: form.gender, maritalStatus: form.maritalStatus, dateOfBirth: form.dateOfBirth } : m));
    setEditingId(null);
  };

  const handleSubmit = () => {
    const totalPremium = calculatePremium(updatedMembers).reduce((a, b) => a + b, 0);
    setSubmitted(true);
    setTimeout(() => onComplete(updatedMembers, totalPremium), 1500);
  };

  const hasChanges = JSON.stringify(members) !== JSON.stringify(updatedMembers);

  if (submitted) {
    return (
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="py-10 text-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <CheckCircle2 className="h-8 w-8 text-primary" />
          </div>
          <h2 className="font-heading text-2xl font-bold text-foreground">Update Applied!</h2>
          <p className="text-muted-foreground">Member details have been updated. No approval required.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onCancel}><ArrowLeft className="h-5 w-5" /></Button>
        <div>
          <h2 className="text-lg font-heading font-bold text-foreground">Update Member Endorsement</h2>
          <p className="text-sm text-muted-foreground">Edit basic personal details. Changes are applied automatically.</p>
        </div>
      </div>

      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="font-heading text-base">Policy Members</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {updatedMembers.map(m => (
              <div key={m.id} className="flex items-center justify-between rounded-xl border border-border p-3 hover:bg-muted/50 transition-colors">
                <div>
                  <p className="text-sm font-medium text-foreground">{m.memberName}</p>
                  <p className="text-xs text-muted-foreground">{m.memberType} · {m.gender} · {m.maritalStatus} · DOB: {m.dateOfBirth || "—"}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{m.classSelection}</Badge>
                  <Button variant="outline" size="sm" className="h-8 gap-1" onClick={() => openEdit(m)}>
                    <Pencil className="h-3 w-3" /> Edit
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={!hasChanges}>Submit Update</Button>
      </div>

      <Dialog open={!!editingId} onOpenChange={() => setEditingId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle className="font-heading">Edit Member Details</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Member Name *</Label>
              <Input value={form.memberName} onChange={e => setForm({ ...form, memberName: e.target.value })} />
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
            <div className="space-y-1.5">
              <Label className="text-xs">Date of Birth</Label>
              <Input type="date" value={form.dateOfBirth} onChange={e => setForm({ ...form, dateOfBirth: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingId(null)}>Cancel</Button>
            <Button onClick={handleSave}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UpdateMemberEndorsement;
