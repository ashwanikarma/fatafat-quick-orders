import { useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import { Printer, Eye, FileText, Download, ChevronDown, ChevronUp, Hospital, Ban, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { calculatePremium } from "@/lib/quotation-api";
import type { Member, SponsorData, ClassSelection } from "@/types/quotation";

interface QuotationStepProps {
  members: Member[];
  sponsorData: SponsorData;
  onBack: () => void;
}

const QuotationStep = ({ members, sponsorData, onBack }: QuotationStepProps) => {
  const printRef = useRef<HTMLDivElement>(null);

  const premiums = useMemo(() => calculatePremium(members), [members]);
  const totalPremium = useMemo(() => premiums.reduce((a, b) => a + b, 0), [premiums]);
  const quotationId = useMemo(() => `QT-${Date.now().toString(36).toUpperCase()}`, []);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6" ref={printRef}>
      {/* Summary Card */}
      <Card className="border-primary/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="font-heading text-xl">Quotation Summary</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Quotation ID: {quotationId}</p>
            </div>
            <Badge className="bg-primary/10 text-primary border-primary/20 text-base px-4 py-1.5">
              SAR {totalPremium.toLocaleString()}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Sponsor</p>
              <p className="font-semibold text-foreground">{sponsorData.sponsorName || sponsorData.sponsorNumber}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Policy Effective Date</p>
              <p className="font-semibold text-foreground">
                {sponsorData.policyEffectiveDate ? format(sponsorData.policyEffectiveDate, "dd MMM yyyy") : "—"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Total Members</p>
              <p className="font-semibold text-foreground">{members.length}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Total Annual Premium</p>
              <p className="font-semibold text-foreground text-primary">SAR {totalPremium.toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Member Premiums Table */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="font-heading text-lg">Member Premiums</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto max-h-[350px]">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-card z-10">
                <tr className="border-b border-border text-left">
                  <th className="py-2.5 px-3 font-semibold text-muted-foreground">#</th>
                  <th className="py-2.5 px-3 font-semibold text-muted-foreground">Name</th>
                  <th className="py-2.5 px-3 font-semibold text-muted-foreground">Type</th>
                  <th className="py-2.5 px-3 font-semibold text-muted-foreground">Class</th>
                  <th className="py-2.5 px-3 font-semibold text-muted-foreground hidden sm:table-cell">Health</th>
                  <th className="py-2.5 px-3 font-semibold text-muted-foreground text-right">Premium (SAR)</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m, i) => (
                  <tr key={m.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                    <td className="py-2.5 px-3 text-muted-foreground">{i + 1}</td>
                    <td className="py-2.5 px-3 font-medium text-foreground">{m.memberName}</td>
                    <td className="py-2.5 px-3">
                      <Badge variant="outline" className={m.memberType === "Employee" ? "border-primary/30 text-primary" : ""}>{m.memberType}</Badge>
                    </td>
                    <td className="py-2.5 px-3"><Badge variant="secondary">{m.classSelection}</Badge></td>
                    <td className="py-2.5 px-3 hidden sm:table-cell">
                      <Badge variant={m.healthDeclaration === "No" ? "secondary" : "outline"} className={m.healthDeclaration === "Yes" ? "border-destructive/30 text-destructive" : ""}>
                        {m.healthDeclaration === "No" ? "Clear" : "Declared"}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-3 text-right font-semibold text-foreground">{premiums[i].toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-border">
                  <td colSpan={5} className="py-3 px-3 font-heading font-bold text-foreground">Total</td>
                  <td className="py-3 px-3 text-right font-heading font-bold text-primary text-lg">SAR {totalPremium.toLocaleString()}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Class Benefits */}
      <BenefitsByClass members={members} />

      {/* Actions */}
      <Card className="border-border">
        <CardContent className="py-5">
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" className="gap-2" onClick={handlePrint}>
              <Printer className="h-4 w-4" /> Print Quotation
            </Button>
            <Button variant="outline" className="gap-2" onClick={handlePrint}>
              <FileText className="h-4 w-4" /> Print Member List
            </Button>
            <Button variant="outline" className="gap-2" onClick={handlePrint}>
              <Download className="h-4 w-4" /> Print Benefits
            </Button>
            <Button variant="outline" className="gap-2">
              <Eye className="h-4 w-4" /> View Full Policy Details
            </Button>
          </div>
        </CardContent>
      </Card>

      <Separator />

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>Back to Health Declaration</Button>
        <Button>Confirm &amp; Proceed</Button>
      </div>
    </div>
  );
};

const CLASS_BENEFITS: Record<ClassSelection, {
  coverage: string;
  hospitals: string;
  maternity: string;
  dental: string;
  optical: string;
  exclusions: string[];
}> = {
  VIP: {
    coverage: "SAR 500,000",
    hospitals: "All network hospitals including international affiliates",
    maternity: "Full coverage including complications",
    dental: "SAR 5,000 annual limit",
    optical: "SAR 3,000 annual limit",
    exclusions: ["Cosmetic surgery", "Experimental treatments"],
  },
  A: {
    coverage: "SAR 250,000",
    hospitals: "All network hospitals (200+ facilities)",
    maternity: "SAR 30,000 per event",
    dental: "SAR 3,500 annual limit",
    optical: "SAR 2,000 annual limit",
    exclusions: ["Cosmetic surgery", "Experimental treatments", "Non-emergency international care"],
  },
  B: {
    coverage: "SAR 150,000",
    hospitals: "Network hospitals (150+ facilities)",
    maternity: "SAR 20,000 per event",
    dental: "SAR 2,500 annual limit",
    optical: "SAR 1,500 annual limit",
    exclusions: ["Cosmetic surgery", "Experimental treatments", "International care", "Alternative medicine"],
  },
  C: {
    coverage: "SAR 100,000",
    hospitals: "Network hospitals (100+ facilities)",
    maternity: "SAR 10,000 per event",
    dental: "SAR 1,500 annual limit",
    optical: "SAR 800 annual limit",
    exclusions: ["Cosmetic surgery", "Experimental treatments", "International care", "Alternative medicine", "Psychiatric care beyond 30 days"],
  },
  LM: {
    coverage: "SAR 50,000 (CCHI minimum)",
    hospitals: "Government & select private hospitals",
    maternity: "Emergency only",
    dental: "Emergency extraction only",
    optical: "Not covered",
    exclusions: ["Cosmetic surgery", "Experimental treatments", "International care", "Alternative medicine", "Elective procedures", "Pre-existing (12-month wait)"],
  },
};

const BenefitsByClass = ({ members }: { members: Member[] }) => {
  const [expanded, setExpanded] = useState<ClassSelection | null>(null);
  const usedClasses = useMemo(() => {
    const set = new Set(members.map((m) => m.classSelection));
    return Array.from(set) as ClassSelection[];
  }, [members]);

  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <CardTitle className="font-heading text-lg">Benefit Details by Class</CardTitle>
        <p className="text-sm text-muted-foreground">Coverage, network & exclusions per selected class.</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {usedClasses.map((cls) => {
          const b = CLASS_BENEFITS[cls];
          const isOpen = expanded === cls;
          const count = members.filter((m) => m.classSelection === cls).length;
          return (
            <div key={cls} className="rounded-xl border border-border overflow-hidden">
              <button
                onClick={() => setExpanded(isOpen ? null : cls)}
                className="flex w-full items-center justify-between p-4 hover:bg-muted/50 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className="text-sm font-bold px-3">{cls}</Badge>
                  <span className="text-sm font-medium text-foreground">{b.coverage}</span>
                  <span className="text-xs text-muted-foreground">({count} member{count !== 1 ? "s" : ""})</span>
                </div>
                {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
              </button>
              {isOpen && (
                <div className="border-t border-border bg-muted/30 p-4 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div className="flex items-start gap-2">
                      <Hospital className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <div>
                        <p className="font-medium text-foreground">Network Hospitals</p>
                        <p className="text-muted-foreground">{b.hospitals}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <DollarSign className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <div>
                        <p className="font-medium text-foreground">Max Coverage</p>
                        <p className="text-muted-foreground">{b.coverage}</p>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div className="rounded-lg bg-card border border-border p-3">
                      <p className="text-xs text-muted-foreground mb-1">Maternity</p>
                      <p className="font-medium text-foreground">{b.maternity}</p>
                    </div>
                    <div className="rounded-lg bg-card border border-border p-3">
                      <p className="text-xs text-muted-foreground mb-1">Dental</p>
                      <p className="font-medium text-foreground">{b.dental}</p>
                    </div>
                    <div className="rounded-lg bg-card border border-border p-3">
                      <p className="text-xs text-muted-foreground mb-1">Optical</p>
                      <p className="font-medium text-foreground">{b.optical}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <Ban className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium text-foreground mb-1">Exclusions</p>
                      <div className="flex flex-wrap gap-1.5">
                        {b.exclusions.map((ex) => (
                          <Badge key={ex} variant="outline" className="text-xs border-destructive/20 text-destructive">{ex}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default QuotationStep;
