import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate, Link, useNavigate } from "react-router-dom";
import {
  User, Mail, Phone, Shield, Calendar, MapPin, FileText,
  LogOut, ArrowLeft, Edit, Download, ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

const Profile = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  if (!isAuthenticated || !user) return <Navigate to="/login" replace />;

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const personalInfo = [
    { label: "Full Name", value: user.name, icon: User },
    { label: "Email Address", value: user.email, icon: Mail },
    { label: "Phone Number", value: user.phone, icon: Phone },
    { label: "Member Since", value: user.memberSince, icon: Calendar },
    { label: "Address", value: "42, MG Road, Bengaluru, Karnataka - 560001", icon: MapPin },
    { label: "PAN Number", value: "ABCPK1234A", icon: FileText },
  ];

  const nominees = [
    { name: "Priya Kumar", relation: "Spouse", share: "60%" },
    { name: "Arjun Kumar", relation: "Son", share: "40%" },
  ];

  return (
    <div className="min-h-screen bg-section-alt">
      {/* Top Bar */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border">
        <div className="container mx-auto flex items-center justify-between h-16 px-4 lg:px-8">
          <Link to="/dashboard" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Back to Dashboard</span>
          </Link>
          <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout">
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 lg:px-8 py-8 max-w-4xl space-y-6">
        {/* Profile Header */}
        <motion.div {...fadeUp} transition={{ duration: 0.4 }}>
          <Card className="border-border overflow-hidden">
            <div className="h-32 bg-gradient-to-r from-primary to-primary/70" />
            <CardContent className="relative px-6 pb-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 -mt-12">
                <div className="w-24 h-24 rounded-2xl bg-card border-4 border-card flex items-center justify-center shadow-lg">
                  <span className="text-3xl font-heading font-bold text-primary">{user.avatar}</span>
                </div>
                <div className="flex-1 pb-1">
                  <h1 className="text-2xl font-heading font-bold text-foreground">{user.name}</h1>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className="bg-primary/10 text-primary border-primary/20">{user.role}</Badge>
                    <span className="text-sm text-muted-foreground">· {user.policyCount} Active Policies</span>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="gap-2">
                  <Edit className="w-4 h-4" /> Edit Profile
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Personal Information */}
        <motion.div {...fadeUp} transition={{ duration: 0.4, delay: 0.1 }}>
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-lg font-heading">Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-0">
              {personalInfo.map((info, i) => (
                <div key={info.label}>
                  <div className="flex items-center gap-4 py-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <info.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground">{info.label}</p>
                      <p className="text-sm font-medium text-foreground truncate">{info.value}</p>
                    </div>
                  </div>
                  {i < personalInfo.length - 1 && <Separator />}
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* Nominees */}
        <motion.div {...fadeUp} transition={{ duration: 0.4, delay: 0.2 }}>
          <Card className="border-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-heading">Nominees</CardTitle>
                <Button variant="ghost" size="sm" className="text-primary gap-1">
                  Manage <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {nominees.map((nominee) => (
                <div key={nominee.name} className="flex items-center justify-between p-3 rounded-lg bg-section-alt">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{nominee.name}</p>
                      <p className="text-xs text-muted-foreground">{nominee.relation}</p>
                    </div>
                  </div>
                  <Badge variant="outline">{nominee.share}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* Documents */}
        <motion.div {...fadeUp} transition={{ duration: 0.4, delay: 0.3 }}>
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-lg font-heading">Documents</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { name: "Health Shield Plus - Policy Document", size: "2.4 MB" },
                { name: "Motor Protect - Policy Document", size: "1.8 MB" },
                { name: "Life Secure 360 - Policy Document", size: "3.1 MB" },
                { name: "KYC Verification Certificate", size: "540 KB" },
              ].map((doc) => (
                <div key={doc.name} className="flex items-center justify-between p-3 rounded-lg bg-section-alt hover:bg-muted transition-colors group cursor-pointer">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{doc.name}</p>
                      <p className="text-xs text-muted-foreground">{doc.size}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
};

export default Profile;
