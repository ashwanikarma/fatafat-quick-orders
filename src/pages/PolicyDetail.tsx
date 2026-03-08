import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Navigate, Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft, Shield, Users, Calendar, CreditCard, FileText, Download, UserPlus,
  UserCog, UserMinus, ChevronRight, Loader2, History, Clock, CheckCircle2, XCircle, AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { useQuotationPersistence, type QuotationRecord } from "@/hooks/useQuotationPersistence";
import { useToast } from "@/hooks/use-toast";
import { downloadDocument } from "@/lib/download-document";
import { calculatePremium } from "@/lib/quotation-api";
import { ListPageSkeleton } from "@/components/skeletons/PageSkeletons";
import AddMemberEndorsement from "@/components/endorsement/AddMemberEndorsement";
import UpdateMemberEndorsement from "@/components/endorsement/UpdateMemberEndorsement";
import DeleteMemberEndorsement from "@/components/endorsement/DeleteMemberEndorsement";
import type { Member } from "@/types/quotation";

const fadeUp = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } };

type EndorsementHistoryItem = {
  id: string;
  type: "add_member" | "update_member" | "delete_member" | "policy_issued";
  description: string;
  date: string;
  status: "approved" | "pending" | "rejected";
  premiumImpact?: number;
  details?: string;
};

const getEndorsementIcon = (type: EndorsementHistoryItem["type"]) => {
  switch (type) {
    case "add_member": return <UserPlus className="h-4 w-4" />;
    case "update_member": return <UserCog className="h-4 w-4" />;
    case "delete_member": return <UserMinus className="h-4 w-4" />;
    case "policy_issued": return <Shield className="h-4 w-4" />;
  }
};

const getStatusBadge = (status: EndorsementHistoryItem["status"]) => {
  switch (status) {
    case "approved": return <Badge className="bg-primary/10 text-primary border-primary/20 gap-1"><CheckCircle2 className="h-3 w-3" /> Approved</Badge>;
    case "pending": return <Badge variant="outline" className="gap-1 border-amber-500/30 text-amber-600"><Clock className="h-3 w-3" /> Pending</Badge>;
    case "rejected": return <Badge variant="outline" className="gap-1 border-destructive/30 text-destructive"><XCircle className="h-3 w-3" /> Rejected</Badge>;
  }
};

const generateEndorsementHistory = (policy: QuotationRecord, members: Member[]): EndorsementHistoryItem[] => {
  const history: EndorsementHistoryItem[] = [];
  const baseDate = policy.created_at ? new Date(policy.created_at) : new Date();

  // Original policy issuance
  history.push({
    id: "txn-001",
    type: "policy_issued",
    description: `Policy issued with ${members.length} member${members.length !== 1 ? "s" : ""}`,
    date: baseDate.toISOString(),
    status: "approved",
    premiumImpact: policy.total_premium || 0,
    details: `Policy ${policy.policy_number || policy.quotation_id || ""} created. Total premium: SAR ${(policy.total_premium || 0).toLocaleString()}`,
  });

  return history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

const PolicyDetail = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const policyId = searchParams.get("id");
  const { loadQuotation, saveState } = useQuotationPersistence(user?.id);
  const [policy, setPolicy] = useState<QuotationRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [endorsementView, setEndorsementView] = useState<"none" | "add" | "update" | "delete">("none");
  const [endorsementHistory, setEndorsementHistory] = useState<EndorsementHistoryItem[]>([]);

  const load = useCallback(async () => {
    if (!policyId) return;
    setLoading(true);
    const data = await loadQuotation(policyId);
    if (data) {
      const policyData: QuotationRecord = {
        id: policyId,
        user_id: user?.id || "",
        status: data.status,
        current_step: data.currentStep,
        sponsor_data: data.sponsorData,
        members: data.members,
        kyc_data: data.kycData,
        total_premium: data.totalPremium,
        quotation_id: data.quotationCode || null,
        policy_number: data.policyNumber || null,
        created_at: "",
        updated_at: "",
      };
      setPolicy(policyData);
      setEndorsementHistory(generateEndorsementHistory(policyData, data.members || []));
    }
    setLoading(false);
  }, [policyId, loadQuotation, user?.id]);

  useEffect(() => { if (user?.id && policyId) load(); }, [user?.id, policyId, load]);

  const handleDownload = () => {
    if (!policy) return;
    downloadDocument(policy, "policy");
    toast({ title: "Downloaded", description: "Policy document saved to your device" });
  };

  const handleMembersUpdated = async (updatedMembers: Member[], newPremium: number) => {
    if (!policy || !user?.id) return;
    await saveState(
      policy.id, policy.current_step, policy.sponsor_data, updatedMembers,
      policy.kyc_data, policy.status, newPremium, policy.quotation_id || undefined,
      policy.policy_number || undefined,
    );

    // Determine what type of endorsement just happened
    const oldMembers = (policy.members as Member[]) || [];
    let newEntry: EndorsementHistoryItem;
    const premiumDiff = newPremium - (policy.total_premium || 0);

    if (updatedMembers.length > oldMembers.length) {
      const addedCount = updatedMembers.length - oldMembers.length;
      newEntry = {
        id: `txn-${Date.now()}`,
        type: "add_member",
        description: `Added ${addedCount} new member${addedCount > 1 ? "s" : ""} to policy`,
        date: new Date().toISOString(),
        status: "approved",
        premiumImpact: premiumDiff,
        details: `Additional premium: SAR ${premiumDiff.toLocaleString()}. Payment processed.`,
      };
    } else if (updatedMembers.length < oldMembers.length) {
      const removedCount = oldMembers.length - updatedMembers.length;
      newEntry = {
        id: `txn-${Date.now()}`,
        type: "delete_member",
        description: `Removed ${removedCount} member${removedCount > 1 ? "s" : ""} from policy`,
        date: new Date().toISOString(),
        status: "approved",
        premiumImpact: premiumDiff,
        details: `Refund amount: SAR ${Math.abs(premiumDiff).toLocaleString()}.`,
      };
    } else {
      newEntry = {
        id: `txn-${Date.now()}`,
        type: "update_member",
        description: "Updated member personal details",
        date: new Date().toISOString(),
        status: "approved",
        premiumImpact: 0,
        details: "Member details updated. No premium change.",
      };
    }

    setEndorsementHistory((prev) => [newEntry, ...prev]);
    setPolicy({ ...policy, members: updatedMembers, total_premium: newPremium });
    setEndorsementView("none");
    setActiveTab("endorsements");
    toast({ title: "Endorsement Applied", description: "Policy members have been updated successfully." });
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-section-alt">
        <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur-md">
          <div className="container mx-auto flex h-16 items-center px-4 lg:px-8 gap-4">
            <Link to="/policies"><Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button></Link>
            <h1 className="text-lg font-heading font-bold text-foreground">Policy Details</h1>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8 lg:px-8 max-w-5xl"><ListPageSkeleton count={3} /></main>
      </div>
    );
  }

  if (!isAuthenticated || !user) return <Navigate to="/login" replace />;
  if (!policy) return <Navigate to="/policies" replace />;

  const sponsor = policy.sponsor_data as any;
  const members = (policy.members as Member[]) || [];
  const premiums = calculatePremium(members);

  return (
    <div className="min-h-screen bg-section-alt">
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 lg:px-8">
          <div className="flex items-center gap-4">
            <Link to="/policies"><Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button></Link>
            <div>
              <h1 className="text-lg font-heading font-bold text-foreground">
                {policy.policy_number || policy.quotation_id || "Policy"}
              </h1>
              <p className="text-xs text-muted-foreground">{sponsor?.sponsorName || "—"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={handleDownload}>
              <Download className="h-3.5 w-3.5" /> Download
            </Button>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              {user.avatar}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 lg:px-8 max-w-5xl space-y-6">
        {endorsementView !== "none" ? (
          <motion.div {...fadeUp} transition={{ duration: 0.3 }}>
            {endorsementView === "add" && (
              <AddMemberEndorsement
                existingMembers={members}
                sponsorNumber={sponsor?.sponsorNumber || ""}
                onComplete={handleMembersUpdated}
                onCancel={() => setEndorsementView("none")}
              />
            )}
            {endorsementView === "update" && (
              <UpdateMemberEndorsement
                members={members}
                onComplete={handleMembersUpdated}
                onCancel={() => setEndorsementView("none")}
              />
            )}
            {endorsementView === "delete" && (
              <DeleteMemberEndorsement
                members={members}
                sponsorNumber={sponsor?.sponsorNumber || ""}
                onComplete={handleMembersUpdated}
                onCancel={() => setEndorsementView("none")}
              />
            )}
          </motion.div>
        ) : (
          <>
            {/* Policy Summary Cards */}
            <motion.div {...fadeUp} transition={{ duration: 0.3 }} className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Total Premium", value: `SAR ${(policy.total_premium || 0).toLocaleString()}`, icon: CreditCard, tone: "bg-primary/10 text-primary" },
                { label: "Members", value: String(members.length), icon: Users, tone: "bg-secondary text-secondary-foreground" },
                { label: "Status", value: policy.status === "paid" ? "Active" : "Completed", icon: Shield, tone: "bg-primary/10 text-primary" },
                { label: "Effective Date", value: sponsor?.policyEffectiveDate ? new Date(sponsor.policyEffectiveDate).toLocaleDateString() : "—", icon: Calendar, tone: "bg-accent text-accent-foreground" },
              ].map((s) => (
                <Card key={s.label} className="border-border">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${s.tone}`}>
                      <s.icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">{s.label}</p>
                      <p className="text-sm font-heading font-bold text-foreground truncate">{s.value}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </motion.div>

            {/* Endorsement Actions */}
            <motion.div {...fadeUp} transition={{ duration: 0.3, delay: 0.05 }}>
              <Card className="border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="font-heading text-lg">Endorsements</CardTitle>
                  <p className="text-sm text-muted-foreground">Modify your policy members through endorsements.</p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Button
                      variant="outline"
                      className="h-auto py-4 flex flex-col items-center gap-2 hover:border-primary/30 hover:bg-primary/5 transition-all"
                      onClick={() => setEndorsementView("add")}
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <UserPlus className="h-5 w-5" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-semibold text-foreground">Add Member</p>
                        <p className="text-xs text-muted-foreground">Add new members with health declaration</p>
                      </div>
                    </Button>
                    <Button
                      variant="outline"
                      className="h-auto py-4 flex flex-col items-center gap-2 hover:border-primary/30 hover:bg-primary/5 transition-all"
                      onClick={() => setEndorsementView("update")}
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground">
                        <UserCog className="h-5 w-5" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-semibold text-foreground">Update Member</p>
                        <p className="text-xs text-muted-foreground">Edit basic personal details</p>
                      </div>
                    </Button>
                    <Button
                      variant="outline"
                      className="h-auto py-4 flex flex-col items-center gap-2 hover:border-destructive/30 hover:bg-destructive/5 transition-all"
                      onClick={() => setEndorsementView("delete")}
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
                        <UserMinus className="h-5 w-5" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-semibold text-foreground">Delete Member</p>
                        <p className="text-xs text-muted-foreground">Remove members with refund calculation</p>
                      </div>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Tabs: Overview & Members */}
            <motion.div {...fadeUp} transition={{ duration: 0.3, delay: 0.1 }}>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="members">Members ({members.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="overview">
                  <Card className="border-border">
                    <CardContent className="p-6 space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6 text-sm">
                        <div><p className="text-muted-foreground">Policy Number</p><p className="font-semibold text-foreground">{policy.policy_number || "—"}</p></div>
                        <div><p className="text-muted-foreground">Quotation ID</p><p className="font-semibold text-foreground">{policy.quotation_id || "—"}</p></div>
                        <div><p className="text-muted-foreground">Sponsor Name</p><p className="font-semibold text-foreground">{sponsor?.sponsorName || "—"}</p></div>
                        <div><p className="text-muted-foreground">Sponsor Number</p><p className="font-semibold text-foreground">{sponsor?.sponsorNumber || "—"}</p></div>
                        <div><p className="text-muted-foreground">Effective Date</p><p className="font-semibold text-foreground">{sponsor?.policyEffectiveDate ? new Date(sponsor.policyEffectiveDate).toLocaleDateString() : "—"}</p></div>
                        <div><p className="text-muted-foreground">Total Premium</p><p className="font-semibold text-primary">SAR {(policy.total_premium || 0).toLocaleString()}</p></div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="members">
                  <Card className="border-border">
                    <CardContent className="p-0">
                      <div className="overflow-auto max-h-[500px]">
                        <table className="w-full text-sm">
                          <thead className="sticky top-0 bg-card z-10">
                            <tr className="border-b border-border text-left">
                              <th className="py-3 px-4 font-semibold text-muted-foreground">#</th>
                              <th className="py-3 px-4 font-semibold text-muted-foreground">Name</th>
                              <th className="py-3 px-4 font-semibold text-muted-foreground">Type</th>
                              <th className="py-3 px-4 font-semibold text-muted-foreground hidden sm:table-cell">ID Number</th>
                              <th className="py-3 px-4 font-semibold text-muted-foreground">Class</th>
                              <th className="py-3 px-4 font-semibold text-muted-foreground hidden md:table-cell">Gender</th>
                              <th className="py-3 px-4 font-semibold text-muted-foreground text-right">Premium</th>
                            </tr>
                          </thead>
                          <tbody>
                            {members.map((m, i) => (
                              <tr key={m.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                                <td className="py-3 px-4 text-muted-foreground">{i + 1}</td>
                                <td className="py-3 px-4 font-medium text-foreground">{m.memberName}</td>
                                <td className="py-3 px-4"><Badge variant="outline" className={m.memberType === "Employee" ? "border-primary/30 text-primary" : ""}>{m.memberType}</Badge></td>
                                <td className="py-3 px-4 text-muted-foreground hidden sm:table-cell">{m.identityNumber}</td>
                                <td className="py-3 px-4"><Badge variant="secondary">{m.classSelection}</Badge></td>
                                <td className="py-3 px-4 text-muted-foreground hidden md:table-cell">{m.gender}</td>
                                <td className="py-3 px-4 text-right font-semibold">SAR {(premiums[i] || 0).toLocaleString()}</td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr className="border-t-2 border-border bg-muted/30">
                              <td colSpan={6} className="py-3 px-4 font-heading font-bold text-foreground">Total</td>
                              <td className="py-3 px-4 text-right font-heading font-bold text-primary">SAR {premiums.reduce((a, b) => a + b, 0).toLocaleString()}</td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </motion.div>
          </>
        )}
      </main>
    </div>
  );
};

export default PolicyDetail;
