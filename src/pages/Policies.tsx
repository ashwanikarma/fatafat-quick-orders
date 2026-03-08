import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Navigate, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Shield, Users, Calendar, CreditCard, FileText, Loader2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useQuotationPersistence, type QuotationRecord } from "@/hooks/useQuotationPersistence";
import { useToast } from "@/hooks/use-toast";
import { downloadDocument } from "@/lib/download-document";
import { ListPageSkeleton } from "@/components/skeletons/PageSkeletons";

const fadeUp = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } };

const Policies = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { listQuotations } = useQuotationPersistence(user?.id);
  const [policies, setPolicies] = useState<QuotationRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const all = await listQuotations();
    setPolicies(all.filter((q) => q.status === "completed" || q.status === "paid" || q.policy_number));
    setLoading(false);
  }, [listQuotations]);

  useEffect(() => { if (user?.id) load(); }, [user?.id, load]);

  const handleDownload = (e: React.MouseEvent, p: QuotationRecord) => {
    e.stopPropagation();
    downloadDocument(p, "policy");
    toast({ title: "Downloaded", description: "Policy document saved to your device" });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-section-alt">
        <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur-md">
          <div className="container mx-auto flex h-16 items-center justify-between px-4 lg:px-8">
            <div className="flex items-center gap-4">
              <Link to="/dashboard">
                <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
              </Link>
              <h1 className="text-lg font-heading font-bold text-foreground">Issued Policies</h1>
            </div>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8 lg:px-8 max-w-5xl">
          <ListPageSkeleton count={3} />
        </main>
      </div>
    );
  }

  if (!isAuthenticated || !user) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen bg-section-alt">
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 lg:px-8">
          <div className="flex items-center gap-4">
            <Link to="/dashboard">
              <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
            </Link>
            <h1 className="text-lg font-heading font-bold text-foreground">Issued Policies</h1>
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
            {user.avatar}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 lg:px-8 max-w-5xl">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : policies.length === 0 ? (
          <motion.div {...fadeUp} className="text-center py-20">
            <Shield className="mx-auto h-16 w-16 text-muted-foreground/30 mb-4" />
            <h2 className="text-xl font-heading font-bold text-foreground mb-2">No Policies Yet</h2>
            <p className="text-muted-foreground mb-6">Complete a quotation and payment to see your policies here.</p>
            <Button onClick={() => navigate("/quotation")} className="gap-2">
              <FileText className="h-4 w-4" /> Start New Quotation
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {policies.map((p, i) => {
              const sponsor = p.sponsor_data as any;
              const memberCount = Array.isArray(p.members) ? p.members.length : 0;
              const members = (p.members as any[]) || [];
              return (
                <motion.div key={p.id} {...fadeUp} transition={{ duration: 0.3, delay: i * 0.05 }}>
                  <Card
                    className="border-border hover:shadow-md transition-all cursor-pointer"
                    onClick={() => navigate(`/quotation?id=${p.id}`)}
                  >
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                              <Shield className="h-5 w-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-heading font-bold text-foreground">
                                {p.policy_number || p.quotation_id || "Policy"}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {sponsor?.sponsorName || sponsor?.sponsorNumber || "—"}
                              </p>
                            </div>
                            <Badge variant="outline" className="shrink-0 bg-primary/10 text-primary border-primary/20 text-xs">
                              {p.status === "paid" ? "Paid" : "Completed"}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Users className="h-4 w-4" />
                              <span>{memberCount} member{memberCount !== 1 ? "s" : ""}</span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <CreditCard className="h-4 w-4" />
                              <span>SAR {(p.total_premium || 0).toLocaleString()}</span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              <span>{sponsor?.policyEffectiveDate ? new Date(sponsor.policyEffectiveDate).toLocaleDateString() : "—"}</span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <FileText className="h-4 w-4" />
                              <span>{p.quotation_id || "—"}</span>
                            </div>
                          </div>

                          {members.length > 0 && (
                            <div className="border-t border-border pt-3 mt-3">
                              <p className="text-xs font-medium text-muted-foreground mb-2">Members</p>
                              <div className="flex flex-wrap gap-2">
                                {members.slice(0, 5).map((m: any) => (
                                  <Badge key={m.id} variant="secondary" className="text-xs">
                                    {m.memberName || m.identityNumber} — {m.classSelection}
                                  </Badge>
                                ))}
                                {members.length > 5 && (
                                  <Badge variant="outline" className="text-xs">+{members.length - 5} more</Badge>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center md:items-end">
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5 text-xs"
                            onClick={(e) => handleDownload(e, p)}
                          >
                            <Download className="h-3.5 w-3.5" /> Download
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default Policies;
