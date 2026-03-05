import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Eye, EyeOff, KeyRound, Loader2, Mail, Shield, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import OtpVerificationForm from "@/components/auth/OtpVerificationForm";
import {
  emailSchema,
  newPasswordSchema,
  otpSchema,
  signInSchema,
  signUpSchema,
} from "@/lib/auth-schemas";

type AuthView = "signin" | "signup" | "forgot" | "forgot-verify" | "forgot-reset";

const Login = () => {
  const { toast } = useToast();
  const { login, signUp, sendEmailOtp, verifyEmailOtp, updatePassword, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  const [view, setView] = useState<AuthView>("signin");
  const [signInForm, setSignInForm] = useState({ email: "", password: "" });
  const [signUpForm, setSignUpForm] = useState({ fullName: "", phone: "", email: "", password: "" });
  const [forgotEmail, setForgotEmail] = useState("");
  const [resetForm, setResetForm] = useState({ password: "", confirmPassword: "" });
  const [otpCode, setOtpCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showResetConfirmPassword, setShowResetConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  const currentTitle = useMemo(() => {
    switch (view) {
      case "signup":
        return "Create your policy portal";
      case "forgot":
      case "forgot-verify":
      case "forgot-reset":
        return "Recover your account";
      default:
        return "Welcome back";
    }
  }, [view]);

  if (isAuthenticated && !isLoading && view !== "forgot-reset") {
    return <Navigate to="/dashboard" replace />;
  }

  const resetForgotFlow = () => {
    setForgotEmail("");
    setResetForm({ password: "", confirmPassword: "" });
    setOtpCode("");
    setView("signin");
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = signInSchema.safeParse(signInForm);

    if (!parsed.success) {
      toast({ title: "Check your details", description: parsed.error.issues[0].message, variant: "destructive" });
      return;
    }

    setLoading(true);
    const { error } = await login(parsed.data.email, parsed.data.password);
    setLoading(false);

    if (error) {
      toast({ title: "Login failed", description: error, variant: "destructive" });
      return;
    }

    toast({ title: "Welcome back!", description: "Your insurance dashboard is ready." });
    navigate("/dashboard");
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = signUpSchema.safeParse(signUpForm);

    if (!parsed.success) {
      toast({ title: "Check your details", description: parsed.error.issues[0].message, variant: "destructive" });
      return;
    }

    setLoading(true);
    const { fullName, email, phone, password } = parsed.data;
    const { error, needsEmailConfirmation } = await signUp({ fullName, email, phone, password });
    setLoading(false);

    if (error) {
      toast({ title: "Signup failed", description: error, variant: "destructive" });
      return;
    }

    toast({
      title: needsEmailConfirmation ? "Verify your email" : "Account created",
      description: needsEmailConfirmation
        ? "We sent a confirmation link to your email. Confirm it, then sign in."
        : "Your account is ready.",
    });

    if (needsEmailConfirmation) {
      setView("signin");
      setSignInForm((prev) => ({ ...prev, email: parsed.data.email }));
    } else {
      navigate("/dashboard");
    }
  };

  const handleSendForgotOtp = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const parsed = emailSchema.safeParse({ email: forgotEmail });

    if (!parsed.success) {
      toast({ title: "Enter a valid email", description: parsed.error.issues[0].message, variant: "destructive" });
      return;
    }

    setOtpLoading(true);
    const { error } = await sendEmailOtp(parsed.data.email);
    setOtpLoading(false);

    if (error) {
      toast({ title: "Could not send code", description: error, variant: "destructive" });
      return;
    }

    toast({ title: "Verification code sent", description: "Use the code from your email to continue." });
    setView("forgot-verify");
    setOtpCode("");
  };

  const handleVerifyForgotOtp = async () => {
    const parsed = otpSchema.safeParse({ code: otpCode });

    if (!parsed.success) {
      toast({ title: "Enter the code", description: parsed.error.issues[0].message, variant: "destructive" });
      return;
    }

    setOtpLoading(true);
    const { error } = await verifyEmailOtp(forgotEmail, parsed.data.code);
    setOtpLoading(false);

    if (error) {
      toast({ title: "Verification failed", description: error, variant: "destructive" });
      return;
    }

    toast({ title: "Verified", description: "You can now set a new password." });
    setView("forgot-reset");
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = newPasswordSchema.safeParse(resetForm);

    if (!parsed.success) {
      toast({ title: "Check your password", description: parsed.error.issues[0].message, variant: "destructive" });
      return;
    }

    setLoading(true);
    const { error } = await updatePassword(parsed.data.password);
    setLoading(false);

    if (error) {
      toast({ title: "Could not update password", description: error, variant: "destructive" });
      return;
    }

    toast({ title: "Password updated", description: "You're now signed in securely." });
    navigate("/dashboard");
  };

  const handleResendForgotOtp = async () => {
    const parsed = emailSchema.safeParse({ email: forgotEmail });
    if (!parsed.success) return;

    setResendLoading(true);
    const { error } = await sendEmailOtp(parsed.data.email);
    setResendLoading(false);

    if (error) {
      toast({ title: "Could not resend code", description: error, variant: "destructive" });
      return;
    }

    toast({ title: "Code resent", description: "Check your inbox for the latest verification code." });
  };

  return (
    <div className="min-h-screen bg-section-alt px-4 py-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <motion.section
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          className="relative overflow-hidden rounded-[2rem] border border-border bg-hero-dark px-6 py-8 text-hero-dark-foreground shadow-2xl lg:px-10 lg:py-10"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/0.35),transparent_36%),radial-gradient(circle_at_bottom_left,hsl(var(--primary)/0.18),transparent_30%)]" />
          <div className="relative flex h-full flex-col justify-between gap-10">
            <div>
              <Link to="/" className="inline-flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <div className="h-3 w-3 rounded-full bg-primary" />
                  <div className="h-3 w-3 rounded-full bg-primary" />
                </div>
                <span className="text-xl font-heading font-bold">FataFat</span>
              </Link>
              <div className="mt-10 max-w-xl space-y-5">
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-sm text-primary-foreground/90">
                  <Shield className="h-4 w-4 text-primary" />
                  Insurance access with verified actions
                </div>
                <h1 className="text-4xl font-heading font-bold leading-tight sm:text-5xl">
                  Secure account access for your policy, claims, and billing journey.
                </h1>
                <p className="max-w-lg text-sm leading-6 text-hero-dark-foreground/75 sm:text-base">
                  Sign in, recover your password with email OTP, and verify every sensitive profile change before it goes through.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { label: "Password recovery", value: "OTP verified" },
                { label: "Sensitive updates", value: "Email protected" },
                { label: "SMS support", value: "Ready later" },
              ].map((item) => (
                <div key={item.label} className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                  <p className="text-xs uppercase tracking-[0.24em] text-hero-dark-foreground/50">{item.label}</p>
                  <p className="mt-2 text-lg font-semibold text-hero-dark-foreground">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center"
        >
          <div className="w-full rounded-[2rem] border border-border bg-card p-6 shadow-xl sm:p-8">
            <div className="mb-8 flex flex-wrap gap-2 rounded-full bg-secondary p-1">
              {[
                { key: "signin", label: "Sign in" },
                { key: "signup", label: "Create account" },
                { key: "forgot", label: "Forgot password" },
              ].map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => {
                    setView(item.key as AuthView);
                    setOtpCode("");
                  }}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    view.startsWith(item.key)
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="mb-6">
              <h2 className="text-3xl font-heading font-bold text-foreground">{currentTitle}</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {view === "signin" && "Access your dashboard with your registered email and password."}
                {view === "signup" && "Create a secure customer account powered by Lovable Cloud."}
                {view === "forgot" && "We’ll send a verification code to your registered email."}
                {view === "forgot-verify" && "Enter the verification code from your email."}
                {view === "forgot-reset" && "Set a strong new password to finish recovery."}
              </p>
            </div>

            {view === "signin" && (
              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">Email</label>
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={signInForm.email}
                    onChange={(e) => setSignInForm({ ...signInForm, email: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">Password</label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={signInForm.password}
                      onChange={(e) => setSignInForm({ ...signInForm, password: e.target.value })}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" className="w-full rounded-full" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Sign in
                </Button>
              </form>
            )}

            {view === "signup" && (
              <form onSubmit={handleSignUp} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">Full name</label>
                  <Input
                    placeholder="Rajesh Kumar"
                    value={signUpForm.fullName}
                    onChange={(e) => setSignUpForm({ ...signUpForm, fullName: e.target.value })}
                    required
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">Email</label>
                    <Input
                      type="email"
                      placeholder="rajesh@email.com"
                      value={signUpForm.email}
                      onChange={(e) => setSignUpForm({ ...signUpForm, email: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">Phone</label>
                    <Input
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={signUpForm.phone}
                      onChange={(e) => setSignUpForm({ ...signUpForm, phone: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">Password</label>
                  <div className="relative">
                    <Input
                      type={showCreatePassword ? "text" : "password"}
                      placeholder="Create a password"
                      value={signUpForm.password}
                      onChange={(e) => setSignUpForm({ ...signUpForm, password: e.target.value })}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowCreatePassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {showCreatePassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" className="w-full rounded-full" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                  Create account
                </Button>
              </form>
            )}

            {view === "forgot" && (
              <form onSubmit={handleSendForgotOtp} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">Registered email</label>
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full rounded-full" disabled={otpLoading}>
                  {otpLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                  Send verification code
                </Button>
              </form>
            )}

            {view === "forgot-verify" && (
              <OtpVerificationForm
                title="Verify your recovery request"
                description="Use the code we emailed you to unlock password reset."
                recipient={forgotEmail}
                value={otpCode}
                onChange={setOtpCode}
                onSubmit={handleVerifyForgotOtp}
                onResend={handleResendForgotOtp}
                isSubmitting={otpLoading}
                isResending={resendLoading}
                submitLabel="Verify and continue"
              />
            )}

            {view === "forgot-reset" && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">New password</label>
                  <div className="relative">
                    <Input
                      type={showResetPassword ? "text" : "password"}
                      placeholder="Enter a new password"
                      value={resetForm.password}
                      onChange={(e) => setResetForm({ ...resetForm, password: e.target.value })}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowResetPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {showResetPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">Confirm password</label>
                  <div className="relative">
                    <Input
                      type={showResetConfirmPassword ? "text" : "password"}
                      placeholder="Confirm your new password"
                      value={resetForm.confirmPassword}
                      onChange={(e) => setResetForm({ ...resetForm, confirmPassword: e.target.value })}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowResetConfirmPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {showResetConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" className="w-full rounded-full" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                  Update password
                </Button>
              </form>
            )}

            <div className="mt-6 rounded-2xl border border-border bg-secondary/50 p-4 text-sm text-muted-foreground">
              Sensitive actions are now powered by <span className="font-semibold text-foreground">Lovable Cloud</span> with email verification,
              profile storage, and secure password updates.
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
              <Link to="/" className="transition-colors hover:text-foreground">
                ← Back to home
              </Link>
              {view !== "signin" ? (
                <button type="button" onClick={resetForgotFlow} className="transition-colors hover:text-foreground">
                  Back to sign in
                </button>
              ) : null}
            </div>
          </div>
        </motion.section>
      </div>
    </div>
  );
};

export default Login;
