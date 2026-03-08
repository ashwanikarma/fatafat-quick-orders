import { useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import StepIndicator from "@/components/quotation/StepIndicator";
import SponsorStep from "@/components/quotation/SponsorStep";
import MembersStep from "@/components/quotation/MembersStep";
import HealthDeclarationStep from "@/components/quotation/HealthDeclarationStep";
import QuotationStep from "@/components/quotation/QuotationStep";
import type { SponsorData, Member } from "@/types/quotation";
import { Loader2 } from "lucide-react";

const Quotation = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [step, setStep] = useState(0);
  const [sponsorData, setSponsorData] = useState<SponsorData>({
    sponsorNumber: "",
    policyEffectiveDate: undefined,
  });
  const [members, setMembers] = useState<Member[]>([]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-section-alt">
        <div className="inline-flex items-center gap-3 rounded-full border border-border bg-card px-5 py-3 text-sm text-muted-foreground shadow-sm">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          Loading...
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen bg-section-alt">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 lg:px-8">
          <div className="flex items-center gap-4">
            <Link to="/dashboard">
              <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
            </Link>
            <div>
              <h1 className="text-lg font-heading font-bold text-foreground">New Policy Quotation</h1>
              <p className="text-xs text-muted-foreground">Health Insurance — Quotation Module</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              {user.avatar}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 lg:px-8 max-w-4xl">
        <StepIndicator currentStep={step} />

        {step === 0 && (
          <SponsorStep data={sponsorData} onChange={setSponsorData} onNext={() => setStep(1)} />
        )}
        {step === 1 && (
          <MembersStep
            members={members}
            sponsorNumber={sponsorData.sponsorNumber}
            onChange={setMembers}
            onNext={() => setStep(2)}
            onBack={() => setStep(0)}
          />
        )}
        {step === 2 && (
          <HealthDeclarationStep
            members={members}
            onChange={setMembers}
            onNext={() => setStep(3)}
            onBack={() => setStep(1)}
          />
        )}
        {step === 3 && (
          <QuotationStep
            members={members}
            sponsorData={sponsorData}
            onBack={() => setStep(2)}
          />
        )}
      </main>
    </div>
  );
};

export default Quotation;
