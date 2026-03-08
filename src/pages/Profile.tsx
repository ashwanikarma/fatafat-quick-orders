import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { Navigate, Link, useNavigate } from "react-router-dom";
import {
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  FileText,
  LogOut,
  ArrowLeft,
  Download,
  ChevronRight,
  ShieldCheck,
  KeyRound,
  Loader2,
  PencilLine,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import OtpVerificationForm from "@/components/auth/OtpVerificationForm";
import { newPasswordSchema, otpSchema, profileSchema } from "@/lib/auth-schemas";
import { ProfileSkeleton } from "@/components/skeletons/PageSkeletons";

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

const documents = [
  { name: "Health Shield Plus - Policy Document", size: "2.4 MB" },
  { name: "Motor Protect - Policy Document", size: "1.8 MB" },
  { name: "Life Secure 360 - Policy Document", size: "3.1 MB" },
  { name: "KYC Verification Certificate", size: "540 KB" },
];

const nominees = [
  { name: "Priya Kumar", relation: "Spouse", share: "60%" },
  { name: "Arjun Kumar", relation: "Son", share: "40%" },
];

const Profile = () => {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading, logout, sendEmailOtp, verifyEmailOtp, updateProfile, updatePassword } = useAuth();
  const navigate = useNavigate();

  const [editOpen, setEditOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [editStep, setEditStep] = useState<"form" | "verify">("form");
  const [passwordStep, setPasswordStep] = useState<"form" | "verify">("form");
  const [editForm, setEditForm] = useState({ name: "", phone: "", address: "", panNumber: "" });
  const [passwordForm, setPasswordForm] = useState({ password: "", confirmPassword: "" });
  const [otpCode, setOtpCode] = useState("");
  const [saving, setSaving] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    setEditForm({
      name: user.name,
      phone: user.phone === "Not added yet" ? "" : user.phone,
      address: user.address === "Add your address" ? "" : user.address,
      panNumber: user.panNumber === "Add your PAN" ? "" : user.panNumber,
    });
  }, [user]);

  const personalInfo = useMemo(
    () => [
      { label: "Full Name", value: user?.name ?? "", icon: User },
      { label: "Email Address", value: user?.email ?? "", icon: Mail },
      { label: "Phone Number", value: user?.phone ?? "", icon: Phone },
      { label: "Member Since", value: user?.memberSince ?? "", icon: Calendar },
      { label: "Address", value: user?.address ?? "", icon: MapPin },
      { label: "PAN Number", value: user?.panNumber ?? "", icon: FileText },
    ],
    [user],
  );

  if (isLoading) {
    return <ProfileSkeleton />;
  }

  if (!isAuthenticated || !user) return <Navigate to="/login" replace />;

  const resetVerificationState = () => {
    setOtpCode("");
    setOtpLoading(false);
    setResendLoading(false);
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const requestProfileOtp = async () => {
    setOtpLoading(true);
    const { error } = await sendEmailOtp(user.email);
    setOtpLoading(false);

    if (error) {
      toast({ title: "Could not send code", description: error, variant: "destructive" });
      return false;
    }

    toast({ title: "Verification code sent", description: `We sent a code to ${user.email}.` });
    return true;
  };

  const handleStartProfileUpdate = async () => {
    const normalized = { ...editForm, panNumber: editForm.panNumber.toUpperCase() };
    const parsed = profileSchema.safeParse(normalized);

    if (!parsed.success) {
      toast({ title: "Check your details", description: parsed.error.issues[0].message, variant: "destructive" });
      return;
    }

    const hasChanges =
      parsed.data.name !== user.name ||
      parsed.data.phone !== (user.phone === "Not added yet" ? "" : user.phone) ||
      parsed.data.address !== (user.address === "Add your address" ? "" : user.address) ||
      parsed.data.panNumber !== (user.panNumber === "Add your PAN" ? "" : user.panNumber);

    if (!hasChanges) {
      toast({ title: "Nothing to update", description: "Change a field before saving." });
      return;
    }

    const sent = await requestProfileOtp();
    if (!sent) return;

    setEditForm({
      name: parsed.data.name,
      phone: parsed.data.phone,
      address: parsed.data.address,
      panNumber: parsed.data.panNumber,
    });
    setEditStep("verify");
    resetVerificationState();
  };

  const handleConfirmProfileUpdate = async () => {
    const parsed = otpSchema.safeParse({ code: otpCode });
    if (!parsed.success) {
      toast({ title: "Enter the code", description: parsed.error.issues[0].message, variant: "destructive" });
      return;
    }

    setSaving(true);
    const verification = await verifyEmailOtp(user.email, parsed.data.code);
    if (verification.error) {
      setSaving(false);
      toast({ title: "Verification failed", description: verification.error, variant: "destructive" });
      return;
    }

    const update = await updateProfile(editForm);
    setSaving(false);

    if (update.error) {
      toast({ title: "Update failed", description: update.error, variant: "destructive" });
      return;
    }

    toast({ title: "Profile updated", description: "Your details were updated after verification." });
    setEditOpen(false);
    setEditStep("form");
    resetVerificationState();
  };

  const handleStartPasswordChange = async () => {
    const parsed = newPasswordSchema.safeParse(passwordForm);

    if (!parsed.success) {
      toast({ title: "Check your password", description: parsed.error.issues[0].message, variant: "destructive" });
      return;
    }

    const sent = await requestProfileOtp();
    if (!sent) return;

    setPasswordForm({
      password: parsed.data.password,
      confirmPassword: parsed.data.confirmPassword,
    });
    setPasswordStep("verify");
    resetVerificationState();
  };

  const handleConfirmPasswordChange = async () => {
    const parsed = otpSchema.safeParse({ code: otpCode });
    if (!parsed.success) {
      toast({ title: "Enter the code", description: parsed.error.issues[0].message, variant: "destructive" });
      return;
    }

    setSaving(true);
    const verification = await verifyEmailOtp(user.email, parsed.data.code);
    if (verification.error) {
      setSaving(false);
      toast({ title: "Verification failed", description: verification.error, variant: "destructive" });
      return;
    }

    const passwordUpdate = await updatePassword(passwordForm.password);
    setSaving(false);

    if (passwordUpdate.error) {
      toast({ title: "Password update failed", description: passwordUpdate.error, variant: "destructive" });
      return;
    }

    toast({ title: "Password changed", description: "Your password is now protected by the new credentials." });
    setPasswordOpen(false);
    setPasswordStep("form");
    setPasswordForm({ password: "", confirmPassword: "" });
    resetVerificationState();
  };

  const handleResendCode = async () => {
    setResendLoading(true);
    const { error } = await sendEmailOtp(user.email);
    setResendLoading(false);

    if (error) {
      toast({ title: "Could not resend code", description: error, variant: "destructive" });
      return;
    }

    toast({ title: "Code resent", description: "Check your email for the latest code." });
  };

  return (
    <div className="min-h-screen bg-section-alt">
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 lg:px-8">
          <Link to="/dashboard" className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
            <span className="text-sm font-medium">Back to Dashboard</span>
          </Link>
          <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout">
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <main className="container mx-auto max-w-5xl space-y-6 px-4 py-8 lg:px-8">
        <motion.div {...fadeUp} transition={{ duration: 0.4 }}>
          <Card className="overflow-hidden border-border shadow-sm">
            <div className="h-36 bg-[linear-gradient(135deg,hsl(var(--primary))_0%,hsl(var(--primary)/0.7)_100%)]" />
            <CardContent className="relative px-6 pb-6">
              <div className="-mt-12 flex flex-col gap-4 sm:flex-row sm:items-end">
                <div className="flex h-24 w-24 items-center justify-center rounded-[1.75rem] border-4 border-card bg-card shadow-lg">
                  <span className="text-3xl font-heading font-bold text-primary">{user.avatar}</span>
                </div>
                <div className="flex-1 pb-1">
                  <h1 className="text-2xl font-heading font-bold text-foreground">{user.name}</h1>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <Badge className="border-primary/20 bg-primary/10 text-primary">{user.membershipTier}</Badge>
                    <span className="text-sm text-muted-foreground">· {user.policyCount} Active Policies</span>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="gap-2" onClick={() => setEditOpen(true)}>
                  <PencilLine className="h-4 w-4" /> Edit Profile
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <motion.div {...fadeUp} transition={{ duration: 0.4, delay: 0.1 }} className="space-y-6">
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-lg font-heading">Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-0">
                {personalInfo.map((info, index) => (
                  <div key={info.label}>
                    <div className="flex items-center gap-4 py-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <info.icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-muted-foreground">{info.label}</p>
                        <p className="truncate text-sm font-medium text-foreground">{info.value}</p>
                      </div>
                    </div>
                    {index < personalInfo.length - 1 && <Separator />}
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-heading">Nominees</CardTitle>
                  <Button variant="ghost" size="sm" className="gap-1 text-primary">
                    Manage <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {nominees.map((nominee) => (
                  <div key={nominee.name} className="flex items-center justify-between rounded-2xl bg-section-alt p-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <User className="h-5 w-5" />
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

          <motion.div {...fadeUp} transition={{ duration: 0.4, delay: 0.2 }} className="space-y-6">
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-lg font-heading">Security & Verification</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-2xl border border-border bg-secondary/50 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-foreground">Verified changes only</p>
                      <p className="text-sm text-muted-foreground">
                        Any profile or password change requires a fresh email OTP before it is applied.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl border border-border bg-card p-4">
                  <p className="text-sm font-medium text-foreground">Primary verification channel</p>
                  <p className="mt-1 text-sm text-muted-foreground">Email OTP is active now. SMS verification can be connected later.</p>
                </div>
                <Button className="w-full rounded-full" onClick={() => setPasswordOpen(true)}>
                  <KeyRound className="h-4 w-4" />
                  Change password securely
                </Button>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-lg font-heading">Documents</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {documents.map((doc) => (
                  <div key={doc.name} className="group flex cursor-pointer items-center justify-between rounded-2xl bg-section-alt p-3 transition-colors hover:bg-muted">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm font-medium text-foreground">{doc.name}</p>
                        <p className="text-xs text-muted-foreground">{doc.size}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="opacity-0 transition-opacity group-hover:opacity-100">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>

      <Dialog
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open);
          if (!open) {
            setEditStep("form");
            resetVerificationState();
          }
        }}
      >
        <DialogContent className="max-w-xl border-border bg-card">
          <DialogHeader>
            <DialogTitle>Edit profile</DialogTitle>
            <DialogDescription>We’ll verify the change by email before saving your updated details.</DialogDescription>
          </DialogHeader>

          {editStep === "form" ? (
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Full name</label>
                <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">Phone</label>
                  <Input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">PAN number</label>
                  <Input
                    value={editForm.panNumber}
                    onChange={(e) => setEditForm({ ...editForm, panNumber: e.target.value.toUpperCase() })}
                  />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Address</label>
                <Input value={editForm.address} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} />
              </div>
              <Button className="w-full rounded-full" onClick={handleStartProfileUpdate} disabled={otpLoading}>
                {otpLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                Verify and save changes
              </Button>
            </div>
          ) : (
            <OtpVerificationForm
              title="Verify profile update"
              description="Enter the code from your email to confirm these profile changes."
              recipient={user.email}
              value={otpCode}
              onChange={setOtpCode}
              onSubmit={handleConfirmProfileUpdate}
              onResend={handleResendCode}
              isSubmitting={saving}
              isResending={resendLoading}
              submitLabel="Confirm update"
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={passwordOpen}
        onOpenChange={(open) => {
          setPasswordOpen(open);
          if (!open) {
            setPasswordStep("form");
            setPasswordForm({ password: "", confirmPassword: "" });
            resetVerificationState();
          }
        }}
      >
        <DialogContent className="max-w-xl border-border bg-card">
          <DialogHeader>
            <DialogTitle>Change password</DialogTitle>
            <DialogDescription>We’ll email a one-time verification code before your password is updated.</DialogDescription>
          </DialogHeader>

          {passwordStep === "form" ? (
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">New password</label>
                <Input
                  type="password"
                  value={passwordForm.password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, password: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Confirm new password</label>
                <Input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                />
              </div>
              <Button className="w-full rounded-full" onClick={handleStartPasswordChange} disabled={otpLoading}>
                {otpLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                Send verification code
              </Button>
            </div>
          ) : (
            <OtpVerificationForm
              title="Verify password change"
              description="Enter the code from your email to finish changing your password."
              recipient={user.email}
              value={otpCode}
              onChange={setOtpCode}
              onSubmit={handleConfirmPasswordChange}
              onResend={handleResendCode}
              isSubmitting={saving}
              isResending={resendLoading}
              submitLabel="Update password"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Profile;
