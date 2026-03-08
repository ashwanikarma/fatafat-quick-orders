import { useState } from "react";
import { format, addDays, addWeeks } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { validateSponsor } from "@/lib/quotation-api";
import type { SponsorData } from "@/types/quotation";

interface SponsorStepProps {
  data: SponsorData;
  onChange: (data: SponsorData) => void;
  onNext: () => void;
}

const SponsorStep = ({ data, onChange, onNext }: SponsorStepProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const tomorrow = addDays(new Date(), 1);
  const maxDate = addWeeks(tomorrow, 3);

  const handleNext = async () => {
    setError("");
    if (!data.sponsorNumber.trim()) {
      setError("Sponsor Number is required.");
      return;
    }
    if (!data.policyEffectiveDate) {
      setError("Policy Effective Date is required.");
      return;
    }

    setLoading(true);
    try {
      const result = await validateSponsor(data.sponsorNumber);
      if (result.success && result.data) {
        onChange({
          ...data,
          sponsorName: result.data.sponsorName,
          sponsorStatus: result.data.sponsorStatus,
        });
        onNext();
      } else {
        setError(result.error || "Validation failed.");
      }
    } catch {
      setError("Service unavailable. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-border max-w-lg mx-auto">
      <CardHeader>
        <CardTitle className="font-heading text-xl">Sponsor Details</CardTitle>
        <p className="text-sm text-muted-foreground">
          Enter the sponsor number and select the policy effective date.
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="sponsorNumber">Sponsor Number *</Label>
          <Input
            id="sponsorNumber"
            placeholder="e.g. SP12345"
            value={data.sponsorNumber}
            onChange={(e) => onChange({ ...data, sponsorNumber: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label>Policy Effective Date *</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn("w-full justify-start text-left font-normal", !data.policyEffectiveDate && "text-muted-foreground")}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {data.policyEffectiveDate ? format(data.policyEffectiveDate, "PPP") : "Select date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={data.policyEffectiveDate}
                onSelect={(date) => onChange({ ...data, policyEffectiveDate: date })}
                disabled={(date) => date < tomorrow || date > maxDate}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
          <p className="text-xs text-muted-foreground">
            Between {format(tomorrow, "dd MMM yyyy")} and {format(maxDate, "dd MMM yyyy")}
          </p>
        </div>

        {error && (
          <p className="text-sm text-destructive font-medium">{error}</p>
        )}

        <Button onClick={handleNext} disabled={loading} className="w-full">
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {loading ? "Validating with Wathaq..." : "Next"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default SponsorStep;
