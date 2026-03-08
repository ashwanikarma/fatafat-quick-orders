import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Navigate, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft, FileText, Users, Calendar, CreditCard,
  Loader2, Download, Plus, Trash2, ArrowRight, Clock, CheckCircle, Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useQuotationPersistence, type QuotationRecord } from "@/hooks/useQuotationPersistence";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { downloadDocument } from "@/lib/download-document";
import { ListPageSkeleton } from "@/components/skeletons/PageSkeletons";

const fadeUp = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } };

const stepLabels = ["Sponsor", "Members", "Health", "Quotation", "KYC", "Payment"];

const statusConfig: Record<string, { label: string; class: string; icon: typeof Clock }> = {
  draft: { label: "In Progress", class: "bg-muted text-muted-foreground border-border", icon: Clock },
  completed: { label: "Completed", class: "bg-primary/10 text-primary border-primary/20", icon: CheckCircle },
  paid: { label: "Paid", class: "bg-primary/10 text-primary border-primary/20", icon: Shield },
};

const Quotations = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { listQuotations } = useQuotationPersistence(user?.id);
  const [quotations, setQuotations] = useState<QuotationRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const all = await listQuotations();
    setQuotations(all);
    setLoading(false);
  }, [listQuotations]);

  useEffect(() => { if (user?.id) load(); }, [user?.id, load]);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const { error } = await supabase.from("quotations").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: "Failed to delete quotation", variant: "destructive" });
    } else {
      toast({ title: "Deleted", description: "Quotation removed" });
      load();
    }
  };

  const handleDownload = (e: React.MouseEvent, q: QuotationRecord) => {
    e.stopPropagation();
    downloadDocument(q, q.policy_number ? "policy" : "quotation");
    toast({ title: "Downloaded", description: "Document saved to your device" });
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
              <h1 className="text-lg font-heading font-bold text-foreground">My Quotations</h1>
            </div>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8 lg:px-8 max-w-5xl">
          <ListPageSkeleton count={4} />
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
            <h1 className="text-lg font-heading font-bold text-foreground">My Quotations</h1>
          </div>
          <Button size="sm" className="gap-2" onClick={() => navigate("/quotation")}>
            <Plus className="h-4 w-4" /> New Quotation
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 lg:px-8 max-w-5xl">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : quotations.length === 0 ? (
          <motion.div {...fadeUp} className="text-center py-20">
            <FileText className="mx-auto h-16 w-16 text-muted-foreground/30 mb-4" />
            <h2 className="text-xl font-heading font-bold text-foreground mb-2">No Quotations Yet</h2>
            <p className="text-muted-foreground mb-6">Start your first insurance quotation to see it here.</p>
            <Button onClick={() => navigate("/quotation")} className="gap-2">
              <Plus className="h-4 w-4" /> Start New Quotation
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {quotations.map((q, i) => {
              const sponsor = q.sponsor_data as any;
              const memberCount = Array.isArray(q.members) ? q.members.length : 0;
              const cfg = statusConfig[q.status] || statusConfig.draft;
              const StatusIcon = cfg.icon;
              return (
                <motion.div key={q.id} {...fadeUp} transition={{ duration: 0.3, delay: i * 0.05 }}>
                  <Card
                    className="border-border hover:shadow-md transition-all cursor-pointer"
                    onClick={() => navigate(`/quotation?id=${q.id}`)}
                  >
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                              <FileText className="h-5 w-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-heading font-bold text-foreground">
                                {sponsor?.sponsorName || sponsor?.sponsorNumber || "Draft Quotation"}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {q.quotation_id || `Step: ${stepLabels[q.current_step] || "Sponsor"}`}
                              </p>
                            </div>
                            <Badge variant="outline" className={`shrink-0 text-xs ${cfg.class}`}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {cfg.label}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Users className="h-4 w-4" />
                              <span>{memberCount} member{memberCount !== 1 ? "s" : ""}</span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <CreditCard className="h-4 w-4" />
                              <span>SAR {(q.total_premium || 0).toLocaleString()}</span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              <span>{sponsor?.policyEffectiveDate ? new Date(sponsor.policyEffectiveDate).toLocaleDateString() : "—"}</span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Clock className="h-4 w-4" />
                              <span>{new Date(q.updated_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 md:flex-col md:items-end">
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5 text-xs"
                            onClick={(e) => handleDownload(e, q)}
                          >
                            <Download className="h-3.5 w-3.5" /> Download
                          </Button>
                          {q.status === "draft" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-1.5 text-xs text-destructive hover:text-destructive"
                              onClick={(e) => handleDelete(e, q.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" /> Delete
                            </Button>
                          )}
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

export default Quotations;
