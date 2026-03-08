import { useState, useCallback, useMemo } from "react";
import { Plus, Upload, Pencil, Trash2, Download } from "lucide-react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import type { Member, MemberType, ClassSelection, MaritalStatus, Gender } from "@/types/quotation";

const CLASS_OPTIONS: ClassSelection[] = ["VIP", "A", "B", "C", "LM"];

const emptyMember = (sponsorNumber: string): Omit<Member, "id"> => ({
  memberType: "Employee",
  memberName: "",
  identityNumber: "",
  dateOfBirth: "",
  gender: "Male",
  maritalStatus: "Single",
  classSelection: "B",
  sponsorNumber,
});

interface MembersStepProps {
  members: Member[];
  sponsorNumber: string;
  onChange: (members: Member[]) => void;
  onNext: () => void;
  onBack: () => void;
}

const MembersStep = ({ members, sponsorNumber, onChange, onNext, onBack }: MembersStepProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<Member, "id">>(emptyMember(sponsorNumber));
  const [formError, setFormError] = useState("");
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);

  const employees = useMemo(() => members.filter((m) => m.memberType === "Employee"), [members]);

  const openAdd = () => {
    setForm(emptyMember(sponsorNumber));
    setEditingId(null);
    setFormError("");
    setDialogOpen(true);
  };

  const openEdit = (member: Member) => {
    const { id, ...rest } = member;
    setForm(rest);
    setEditingId(id);
    setFormError("");
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    // Also remove dependents of this employee
    const member = members.find((m) => m.id === id);
    if (member?.memberType === "Employee") {
      onChange(members.filter((m) => m.id !== id && m.employeeId !== id));
    } else {
      onChange(members.filter((m) => m.id !== id));
    }
  };

  const validate = (): string => {
    if (!form.memberName.trim()) return "Member Name is required.";
    if (!form.identityNumber.trim()) return "Identity Number is required.";
    if (!form.dateOfBirth) return "Date of Birth is required.";
    if (form.memberType === "Dependent" && !form.employeeId) return "Please select the Employee for this dependent.";
    return "";
  };

  const handleSave = () => {
    const err = validate();
    if (err) { setFormError(err); return; }

    const finalSponsor = form.memberType === "Employee"
      ? sponsorNumber
      : members.find((m) => m.id === form.employeeId)?.identityNumber || sponsorNumber;

    if (editingId) {
      onChange(members.map((m) => m.id === editingId ? { ...form, id: editingId, sponsorNumber: finalSponsor } : m));
    } else {
      onChange([...members, { ...form, id: crypto.randomUUID(), sponsorNumber: finalSponsor }]);
    }
    setDialogOpen(false);
  };

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
        const newMembers: Member[] = [];

        rows.forEach((row, i) => {
          const rowNum = i + 2;
          const type = (row["MemberType"] || "").trim() as MemberType;
          if (type !== "Employee" && type !== "Dependent") {
            errors.push(`Row ${rowNum}: Invalid MemberType "${type}".`);
            return;
          }
          const name = (row["MemberName"] || "").trim();
          const identity = (row["IdentityNumber"] || "").trim();
          const dob = (row["DateOfBirth"] || "").trim();
          if (!name || !identity || !dob) {
            errors.push(`Row ${rowNum}: Missing required fields.`);
            return;
          }
          const gender = (row["Gender"] as Gender) || "Male";
          const marital = (row["MaritalStatus"] as MaritalStatus) || "Single";
          const cls = (row["Class"] as ClassSelection) || "B";
          const empSponsor = (row["SponsorNumber"] || "").trim();

          if (type === "Dependent") {
            if (!empSponsor) {
              errors.push(`Row ${rowNum}: SponsorNumber is required for Dependents.`);
              return;
            }
            // Check existing + newly added employees
            const allEmps = [...members, ...newMembers].filter((m) => m.memberType === "Employee");
            const matchEmp = allEmps.find((e) => e.identityNumber === empSponsor);
            if (!matchEmp) {
              errors.push(`Row ${rowNum}: No matching Employee with ID "${empSponsor}".`);
              return;
            }
          }

          newMembers.push({
            id: crypto.randomUUID(),
            memberType: type,
            memberName: name,
            identityNumber: identity,
            dateOfBirth: dob,
            gender,
            maritalStatus: marital,
            classSelection: CLASS_OPTIONS.includes(cls) ? cls : "B",
            sponsorNumber: type === "Employee" ? sponsorNumber : empSponsor,
            employeeId: type === "Dependent"
              ? [...members, ...newMembers].find((m) => m.memberType === "Employee" && m.identityNumber === empSponsor)?.id
              : undefined,
          });
        });

        if (errors.length) setUploadErrors(errors);
        if (newMembers.length) onChange([...members, ...newMembers]);
      } catch {
        setUploadErrors(["Failed to parse Excel file."]);
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = "";
  }, [members, sponsorNumber, onChange]);

  const handleDownloadTemplate = () => {
    const templateData = [
      { MemberType: "Employee", MemberName: "John Smith", IdentityNumber: "1234567890", DateOfBirth: "1990-01-15", Gender: "Male", MaritalStatus: "Married", Class: "A", SponsorNumber: "" },
      { MemberType: "Dependent", MemberName: "Jane Smith", IdentityNumber: "9876543210", DateOfBirth: "1992-05-20", Gender: "Female", MaritalStatus: "Married", Class: "A", SponsorNumber: "1234567890" },
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    ws["!cols"] = [{ wch: 12 }, { wch: 18 }, { wch: 16 }, { wch: 14 }, { wch: 8 }, { wch: 14 }, { wch: 6 }, { wch: 16 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Members");
    XLSX.writeFile(wb, "member_upload_template.xlsx");
  };

  return (
    <div className="space-y-6">
      <Card className="border-border">
        <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="font-heading text-xl">Members</CardTitle>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={handleDownloadTemplate}>
              <Download className="mr-1.5 h-4 w-4" /> Template
            </Button>
            <label htmlFor="excel-upload">
              <Button variant="outline" size="sm" asChild>
                <span className="cursor-pointer"><Upload className="mr-1.5 h-4 w-4" /> Upload Excel</span>
              </Button>
            </label>
            <input id="excel-upload" type="file" accept=".xlsx,.xls" className="hidden" onChange={handleExcelUpload} />
            <Button size="sm" onClick={openAdd}>
              <Plus className="mr-1.5 h-4 w-4" /> Add Member
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {uploadErrors.length > 0 && (
            <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive space-y-1">
              <p className="font-semibold">Upload Errors:</p>
              {uploadErrors.map((err, i) => <p key={i}>• {err}</p>)}
            </div>
          )}
          {members.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-sm">No members added yet. Click "Add Member" or upload an Excel file.</p>
              <p className="text-xs mt-2">Excel columns: MemberType, MemberName, IdentityNumber, DateOfBirth, Gender, MaritalStatus, Class, SponsorNumber</p>
            </div>
          ) : (
            <div className="overflow-auto max-h-[420px]">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-card z-10">
                  <tr className="border-b border-border text-left">
                    <th className="py-2.5 px-3 font-semibold text-muted-foreground">Name</th>
                    <th className="py-2.5 px-3 font-semibold text-muted-foreground">Type</th>
                    <th className="py-2.5 px-3 font-semibold text-muted-foreground hidden sm:table-cell">Sponsor #</th>
                    <th className="py-2.5 px-3 font-semibold text-muted-foreground">Class</th>
                    <th className="py-2.5 px-3 font-semibold text-muted-foreground hidden md:table-cell">Marital</th>
                    <th className="py-2.5 px-3 font-semibold text-muted-foreground text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((m) => (
                    <tr key={m.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                      <td className="py-2.5 px-3 font-medium text-foreground">{m.memberName}</td>
                      <td className="py-2.5 px-3">
                        <Badge variant="outline" className={m.memberType === "Employee" ? "border-primary/30 text-primary" : ""}>{m.memberType}</Badge>
                      </td>
                      <td className="py-2.5 px-3 text-muted-foreground hidden sm:table-cell">{m.sponsorNumber}</td>
                      <td className="py-2.5 px-3"><Badge variant="secondary">{m.classSelection}</Badge></td>
                      <td className="py-2.5 px-3 text-muted-foreground hidden md:table-cell">{m.maritalStatus}</td>
                      <td className="py-2.5 px-3 text-right">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(m)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(m.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="text-xs text-muted-foreground mt-3">{members.length} member(s) added</p>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>Back</Button>
        <Button
          onClick={() => { if (members.length === 0) return; onNext(); }}
          disabled={members.length === 0}
        >
          Continue
        </Button>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">{editingId ? "Edit" : "Add"} Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Member Type</Label>
              <Select value={form.memberType} onValueChange={(v) => setForm({ ...form, memberType: v as MemberType, employeeId: undefined })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Employee">Employee</SelectItem>
                  <SelectItem value="Dependent">Dependent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.memberType === "Dependent" && (
              <div className="space-y-1.5">
                <Label>Select Employee *</Label>
                <Select value={form.employeeId || ""} onValueChange={(v) => setForm({ ...form, employeeId: v })}>
                  <SelectTrigger><SelectValue placeholder="Choose employee" /></SelectTrigger>
                  <SelectContent>
                    {employees.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>{emp.memberName} ({emp.identityNumber})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {employees.length === 0 && <p className="text-xs text-destructive">Add an employee first.</p>}
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Member Name *</Label>
              <Input value={form.memberName} onChange={(e) => setForm({ ...form, memberName: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Identity Number *</Label>
              <Input value={form.identityNumber} onChange={(e) => setForm({ ...form, identityNumber: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Date of Birth *</Label>
                <Input type="date" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Gender</Label>
                <Select value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v as Gender })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Marital Status</Label>
                <Select value={form.maritalStatus} onValueChange={(v) => setForm({ ...form, maritalStatus: v as MaritalStatus })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Single">Single</SelectItem>
                    <SelectItem value="Married">Married</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Class *</Label>
                <Select value={form.classSelection} onValueChange={(v) => setForm({ ...form, classSelection: v as ClassSelection })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CLASS_OPTIONS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {formError && <p className="text-sm text-destructive">{formError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editingId ? "Update" : "Add"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MembersStep;
