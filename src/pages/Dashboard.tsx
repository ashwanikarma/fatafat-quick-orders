import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate, Link, useNavigate } from "react-router-dom";
import {
  Shield, FileText, CreditCard, TrendingUp, AlertCircle,
  CheckCircle, Clock, ChevronRight, LogOut, User, Bell,
  IndianRupee, Calendar, Activity, Heart
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
    color: "text-rose-500",
    bgColor: "bg-rose-500/10",
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
    color: "text-primary",
    bgColor: "bg-primary/10",
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
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
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
  Active: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  Approved: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  "In Review": "bg-amber-500/10 text-amber-600 border-amber-500/20",
  Pending: "bg-primary/10 text-primary border-primary/20",
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
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  if (!isAuthenticated || !user) return <Navigate to="/login" replace />;

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-section-alt">
      {/* Top Bar */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border">
        <div className="container mx-auto flex items-center justify-between h-16 px-4 lg:px-8">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-primary" />
              <div className="w-3 h-3 rounded-full bg-primary" />
            </div>
            <span className="text-xl font-heading font-bold tracking-tight text-foreground">
              FataFat
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full" />
            </Button>
            <Link to="/profile">
              <Button variant="ghost" size="sm" className="gap-2">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                  {user.avatar}
                </div>
                <span className="hidden sm:inline text-sm font-medium">{user.name}</span>
              </Button>
            </Link>
            <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout">
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 lg:px-8 py-8 space-y-8">
        {/* Welcome */}
        <motion.div {...fadeUp} transition={{ duration: 0.4 }}>
          <h1 className="text-2xl md:text-3xl font-heading font-bold text-foreground">
            Welcome back, {user.name.split(" ")[0]} 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            Here's a summary of your insurance portfolio
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div {...fadeUp} transition={{ duration: 0.4, delay: 0.1 }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Active Policies", value: "3", icon: Shield, color: "text-primary", bg: "bg-primary/10" },
            { label: "Total Coverage", value: "₹65 Lakh", icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-500/10" },
            { label: "Annual Premium", value: "₹50,700", icon: IndianRupee, color: "text-amber-500", bg: "bg-amber-500/10" },
            { label: "Open Claims", value: "2", icon: FileText, color: "text-rose-500", bg: "bg-rose-500/10" },
          ].map((stat) => (
            <Card key={stat.label} className="border-border hover:shadow-md transition-shadow">
              <CardContent className="p-5 flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-heading font-bold text-foreground">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        {/* Policies */}
        <motion.div {...fadeUp} transition={{ duration: 0.4, delay: 0.2 }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-heading font-bold text-foreground">Your Policies</h2>
            <Button variant="ghost" size="sm" className="text-primary gap-1">
              View All <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {policies.map((policy) => (
              <Card key={policy.id} className="border-border hover:shadow-lg transition-all group cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-11 h-11 rounded-xl ${policy.bgColor} flex items-center justify-center`}>
                      <policy.icon className={`w-5 h-5 ${policy.color}`} />
                    </div>
                    <Badge variant="outline" className={statusColors[policy.status]}>
                      {policy.status}
                    </Badge>
                  </div>
                  <h3 className="font-heading font-bold text-foreground">{policy.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{policy.type}</p>
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
                  <div className="mt-4 pt-4 border-t border-border">
                    <p className="text-xs text-muted-foreground">Policy ID: {policy.id}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* Claims & Payments side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Claims */}
          <motion.div {...fadeUp} transition={{ duration: 0.4, delay: 0.3 }}>
            <Card className="border-border">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-heading">Recent Claims</CardTitle>
                  <Button variant="ghost" size="sm" className="text-primary gap-1">
                    View All <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {claims.map((claim) => {
                  const Icon = statusIcons[claim.status] || Clock;
                  return (
                    <div key={claim.id} className="flex items-center justify-between p-3 rounded-lg bg-section-alt hover:bg-muted transition-colors">
                      <div className="flex items-center gap-3">
                        <Icon className={`w-5 h-5 ${
                          claim.status === "Approved" ? "text-emerald-500" :
                          claim.status === "In Review" ? "text-amber-500" : "text-primary"
                        }`} />
                        <div>
                          <p className="text-sm font-medium text-foreground">{claim.id}</p>
                          <p className="text-xs text-muted-foreground">{claim.policy} · {claim.date}</p>
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

          {/* Payments */}
          <motion.div {...fadeUp} transition={{ duration: 0.4, delay: 0.35 }}>
            <Card className="border-border">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-heading">Upcoming Payments</CardTitle>
                  <Button variant="ghost" size="sm" className="text-primary gap-1">
                    Pay Now <CreditCard className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {payments.map((payment, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-section-alt hover:bg-muted transition-colors">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-muted-foreground" />
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

        {/* Quick Actions */}
        <motion.div {...fadeUp} transition={{ duration: 0.4, delay: 0.4 }}>
          <h2 className="text-lg font-heading font-bold text-foreground mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "File a Claim", icon: FileText, desc: "Submit new claim" },
              { label: "Buy Policy", icon: Shield, desc: "Explore plans" },
              { label: "Make Payment", icon: CreditCard, desc: "Pay premium" },
              { label: "Get Support", icon: User, desc: "Talk to advisor" },
            ].map((action) => (
              <Card key={action.label} className="border-border hover:shadow-md hover:border-primary/30 transition-all cursor-pointer group">
                <CardContent className="p-5 text-center">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <action.icon className="w-6 h-6 text-primary" />
                  </div>
                  <p className="text-sm font-semibold text-foreground">{action.label}</p>
                  <p className="text-xs text-muted-foreground mt-1">{action.desc}</p>
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
