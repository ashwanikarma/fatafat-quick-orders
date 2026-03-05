import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Loader2, Mail, ShieldCheck } from "lucide-react";

interface OtpVerificationFormProps {
  title: string;
  description: string;
  recipient: string;
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onResend: () => void;
  submitLabel?: string;
  isSubmitting?: boolean;
  isResending?: boolean;
}

const OtpVerificationForm = ({
  title,
  description,
  recipient,
  value,
  onChange,
  onSubmit,
  onResend,
  submitLabel = "Verify code",
  isSubmitting = false,
  isResending = false,
}: OtpVerificationFormProps) => {
  return (
    <div className="space-y-5 rounded-[calc(var(--radius)*1.25)] border border-border bg-card p-5 shadow-sm">
      <div className="space-y-2 text-center sm:text-left">
        <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-lg font-heading font-semibold text-foreground">{title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-secondary/50 p-3 text-sm text-secondary-foreground">
        <div className="flex items-center gap-2 font-medium">
          <Mail className="h-4 w-4 text-primary" />
          Code sent to
        </div>
        <p className="mt-1 break-all text-muted-foreground">{recipient}</p>
      </div>

      <div className="space-y-3">
        <label className="block text-sm font-medium text-foreground">Enter 6-digit code</label>
        <div className="flex justify-center sm:justify-start">
          <InputOTP maxLength={6} value={value} onChange={onChange}>
            <InputOTPGroup className="gap-2">
              {Array.from({ length: 6 }).map((_, index) => (
                <InputOTPSlot
                  key={index}
                  index={index}
                  className="h-12 w-12 rounded-2xl border border-input bg-background text-base font-semibold"
                />
              ))}
            </InputOTPGroup>
          </InputOTP>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button className="flex-1 rounded-full" onClick={onSubmit} disabled={value.length !== 6 || isSubmitting}>
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {submitLabel}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="rounded-full"
          onClick={onResend}
          disabled={isResending}
        >
          {isResending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Resend code
        </Button>
      </div>
    </div>
  );
};

export default OtpVerificationForm;
