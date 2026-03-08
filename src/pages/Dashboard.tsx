import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Navigate, Link, useNavigate } from "react-router-dom";
import {
  Shield,
  FileText,
  CreditCard,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  ChevronRight,
  LogOut,
  User,
  Bell,
  Calendar,
  Activity,
  Heart,
  Loader2,
  Plus,
  ArrowRight,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useQuotationPersistence, type QuotationRecord } from "@/hooks/useQuotationPersistence";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const policies = [
  {
    id: "POL-2024-001",
    name: "Health Shield Plus",
    type: "Health Insurance",
    premium: "₹18,500/yr",
    coverage: "₹10,00,000",
    status: "Active",
    renewal: "15 Mar 2026",
    icon: Heart,
    tone: "bg-primary/10 text-primary",
  },
  {
    id: "POL-2024-002",
    name: "Motor Protect",
    type: "Vehicle Insurance",
    premium: "₹8,200/yr",
    coverage: "₹5,00,000",
    status: "Active",
    renewal: "22 Jul 2025",
    icon: Shield,
    tone: "bg-secondary text-secondary-foreground",
  },
  {
    id: "POL-2024-003",
    name: "Life Secure 360",
    type: "Life Insurance",
    premium: "₹24,000/yr",
    coverage: "₹50,00,000",
    status: "Active",
    renewal: "01 Jan 2027",
    icon: Activity,
    tone: "bg-accent text-accent-foreground",
  },
];

const claims = [
  { id: "CLM-1023", policy: "Health Shield Plus", amount: "₹45,000", date: "12 Jan 2025", status: "Approved" },
  { id: "CLM-1024", policy: "Motor Protect", amount: "₹12,500", date: "28 Feb 2025", status: "In Review" },
  { id: "CLM-1025", policy: "Health Shield Plus", amount: "₹8,200", date: "01 Mar 2025", status: "Pending" },
];

const payments = [
  { policy: "Health Shield Plus", amount: "₹18,500", date: "15 Mar 2025", status: "Upcoming" },
  { policy: "Life Secure 360", amount: "₹24,000", date: "01 Jan 2026", status: "Upcoming" },
  { policy: "Motor Protect", amount: "₹8,200", date: "22 Jul 2025", status: "Upcoming" },
];

const statusColors: Record<string, string> = {
  Active: "bg-primary/10 text-primary border-primary/20",
  Approved: "bg-primary/10 text-primary border-primary/20",
  "In Review": "bg-secondary text-secondary-foreground border-border",
  Pending: "bg-accent text-accent-foreground border-border",
  Upcoming: "bg-muted text-muted-foreground border-border",
};

const statusIcons: Record<string, typeof CheckCircle> = {
  Approved: CheckCircle,
  "In Review": Clock,
  Pending: AlertCircle,
};

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

const Dashboard = () => {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const navigate = useNavigate();
  const { listQuotations } = useQuotationPersistence(user?.id);
  const [quotations, setQuotations] = useState<QuotationRecord[]>([]);

  useEffect(() => {
    if (user?.id) {
      listQuotations().then(setQuotations);
    }
  }, [user?.id, listQuotations]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-section-alt">
        <div className="inline-flex items-center gap-3 rounded-full border border-border bg-card px-5 py-3 text-sm text-muted-foreground shadow-sm">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          Loading your insurance workspace...
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) return <Navigate to="/login" replace />;

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-section-alt">
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 lg:px-8">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <div className="h-3 w-3 rounded-full bg-primary" />
              <div className="h-3 w-3 rounded-full bg-primary" />
            </div>
            <span className="text-xl font-heading font-bold tracking-tight text-foreground">FataFat</span>
          </Link>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary" />
            </Button>
            <Link to="/profile">
              <Button variant="ghost" size="sm" className="gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {user.avatar}
                </div>
                <span className="hidden text-sm font-medium sm:inline">{user.name}</span>
              </Button>
            </Link>
            <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto space-y-8 px-4 py-8 lg:px-8">
        <motion.div {...fadeUp} transition={{ duration: 0.4 }} className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-primary">Policy command center</p>
            <h1 className="mt-3 text-2xl font-heading font-bold text-foreground md:text-3xl">
              Welcome back, {user.name.split(" ")[0]} 👋
            </h1>
            <p className="mt-2 text-muted-foreground">Track claims, billing, and member details from one secure dashboard.</p>
          </div>
          <Card className="border-border bg-card shadow-sm">
            <CardContent className="flex h-full flex-col justify-between gap-4 p-5">
              <div>
                <p className="text-sm text-muted-foreground">Membership</p>
                <p className="mt-1 text-xl font-heading font-semibold text-foreground">{user.membershipTier}</p>
              </div>
              <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                <Badge variant="outline" className="border-primary/20 bg-primary/10 text-primary">
                  {user.policyCount} active policies
                </Badge>
                <Badge variant="outline">Member since {user.memberSince}</Badge>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div {...fadeUp} transition={{ duration: 0.4, delay: 0.1 }} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Active Policies", value: String(user.policyCount), icon: Shield, tone: "bg-primary/10 text-primary" },
            { label: "Total Coverage", value: "₹65 Lakh", icon: TrendingUp, tone: "bg-secondary text-secondary-foreground" },
            { label: "Annual Premium", value: "₹50,700", icon: CreditCard, tone: "bg-accent text-accent-foreground" },
            { label: "Open Claims", value: "2", icon: FileText, tone: "bg-muted text-muted-foreground" },
          ].map((stat) => (
            <Card key={stat.label} className="border-border transition-shadow hover:shadow-md">
              <CardContent className="flex items-center gap-4 p-5">
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${stat.tone}`}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-heading font-bold text-foreground">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        <motion.div {...fadeUp} transition={{ duration: 0.4, delay: 0.2 }}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-heading font-bold text-foreground">Your Policies</h2>
            <Button variant="ghost" size="sm" className="gap-1 text-primary">
              View All <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {policies.map((policy) => (
              <Card key={policy.id} className="group cursor-pointer border-border transition-all hover:shadow-lg">
                <CardContent className="p-6">
                  <div className="mb-4 flex items-start justify-between">
                    <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${policy.tone}`}>
                      <policy.icon className="h-5 w-5" />
                    </div>
                    <Badge variant="outline" className={statusColors[policy.status]}>
                      {policy.status}
                    </Badge>
                  </div>
                  <h3 className="font-heading font-bold text-foreground">{policy.name}</h3>
                  <p className="mb-4 text-sm text-muted-foreground">{policy.type}</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Coverage</span>
                      <span className="font-semibold text-foreground">{policy.coverage}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Premium</span>
                      <span className="font-semibold text-foreground">{policy.premium}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Renewal</span>
                      <span className="font-semibold text-foreground">{policy.renewal}</span>
                    </div>
                  </div>
                  <div className="mt-4 border-t border-border pt-4">
                    <p className="text-xs text-muted-foreground">Policy ID: {policy.id}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <motion.div {...fadeUp} transition={{ duration: 0.4, delay: 0.3 }}>
            <Card className="border-border">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-heading">Recent Claims</CardTitle>
                  <Button variant="ghost" size="sm" className="gap-1 text-primary">
                    View All <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {claims.map((claim) => {
                  const Icon = statusIcons[claim.status] || Clock;
                  return (
                    <div key={claim.id} className="flex items-center justify-between rounded-2xl bg-section-alt p-3 transition-colors hover:bg-muted">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-card text-primary">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{claim.id}</p>
                          <p className="text-xs text-muted-foreground">
                            {claim.policy} · {claim.date}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-foreground">{claim.amount}</p>
                        <Badge variant="outline" className={`text-xs ${statusColors[claim.status]}`}>
                          {claim.status}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div {...fadeUp} transition={{ duration: 0.4, delay: 0.35 }}>
            <Card className="border-border">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-heading">Upcoming Payments</CardTitle>
                  <Button variant="ghost" size="sm" className="gap-1 text-primary">
                    Pay Now <CreditCard className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {payments.map((payment) => (
                  <div key={`${payment.policy}-${payment.date}`} className="flex items-center justify-between rounded-2xl bg-section-alt p-3 transition-colors hover:bg-muted">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm font-medium text-foreground">{payment.policy}</p>
                        <p className="text-xs text-muted-foreground">Due: {payment.date}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-foreground">{payment.amount}</p>
                      <Badge variant="outline" className={`text-xs ${statusColors[payment.status]}`}>
                        {payment.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Saved Quotations */}
        {quotations.length > 0 && (
          <motion.div {...fadeUp} transition={{ duration: 0.4, delay: 0.38 }}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-heading font-bold text-foreground">Your Quotations</h2>
              <Button variant="ghost" size="sm" className="gap-1 text-primary" onClick={() => navigate("/quotation")}>
                <Plus className="h-4 w-4" /> New Quotation
              </Button>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              {quotations.slice(0, 6).map((q) => {
                const stepLabels = ["Sponsor", "Members", "Health", "Quotation", "KYC", "Payment"];
                const sponsor = q.sponsor_data as any;
                const memberCount = Array.isArray(q.members) ? q.members.length : 0;
                const statusColor = q.status === "completed" ? "bg-primary/10 text-primary border-primary/20"
                  : q.status === "paid" ? "bg-primary/10 text-primary border-primary/20"
                  : "bg-muted text-muted-foreground border-border";
                return (
                  <Card
                    key={q.id}
                    className="group cursor-pointer border-border transition-all hover:border-primary/30 hover:shadow-md"
                    onClick={() => navigate(`/quotation?id=${q.id}`)}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            {sponsor?.sponsorName || sponsor?.sponsorNumber || "Draft Quotation"}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {q.quotation_id || `Step: ${stepLabels[q.current_step] || "Sponsor"}`}
                          </p>
                        </div>
                        <Badge variant="outline" className={`text-xs ${statusColor}`}>
                          {q.status === "draft" ? "In Progress" : q.status}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{memberCount} member{memberCount !== 1 ? "s" : ""}</span>
                        <span className="flex items-center gap-1">
                          Resume <ArrowRight className="h-3 w-3" />
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </motion.div>
        )}

        <motion.div {...fadeUp} transition={{ duration: 0.4, delay: 0.4 }}>
          <h2 className="mb-4 text-lg font-heading font-bold text-foreground">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {[
              { label: "File a Claim", icon: FileText, desc: "Submit new claim", href: "" },
              { label: "Buy New Policy", icon: Shield, desc: "Start quotation", href: "/quotation" },
              { label: "Make Payment", icon: CreditCard, desc: "Pay premium", href: "" },
              { label: "Get Support", icon: User, desc: "Talk to advisor", href: "" },
            ].map((action) => (
              <Card
                key={action.label}
                className="group cursor-pointer border-border transition-all hover:border-primary/30 hover:shadow-md"
                onClick={() => action.href && navigate(action.href)}
              >
                <CardContent className="p-5 text-center">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
                    <action.icon className="h-6 w-6" />
                  </div>
                  <p className="text-sm font-semibold text-foreground">{action.label}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{action.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default Dashboard;
