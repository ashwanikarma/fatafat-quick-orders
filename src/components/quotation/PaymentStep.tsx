import { useState, useMemo } from "react";
import { CreditCard, CheckCircle2, XCircle, Download, Printer, FileText, Loader2, Shield } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { calculatePremium } from "@/lib/quotation-api";
import type { Member, SponsorData } from "@/types/quotation";

type PaymentType = "debit" | "credit";
type PaymentState = "idle" | "processing" | "success" | "failed";

interface PaymentStepProps {
  members: Member[];
  sponsorData: SponsorData;
  onBack: () => void;
  onPaymentSuccess?: (policyNumber: string, totalPremium: number) => void;
}

const PaymentStep = ({ members, sponsorData, onBack, onPaymentSuccess }: PaymentStepProps) => {
  const { toast } = useToast();
  const [paymentType, setPaymentType] = useState<PaymentType>("credit");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardName, setCardName] = useState("");
  const [paymentState, setPaymentState] = useState<PaymentState>("idle");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const premiums = useMemo(() => calculatePremium(members), [members]);
  const totalPremium = useMemo(() => premiums.reduce((a, b) => a + b, 0), [premiums]);
  const policyNumber = useMemo(() => `POL-${Date.now().toString(36).toUpperCase()}`, []);

  const formatCardNumber = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 16);
    return digits.replace(/(\d{4})(?=\d)/g, "$1 ");
  };

  const formatExpiry = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 4);
    if (digits.length > 2) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return digits;
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    const digits = cardNumber.replace(/\s/g, "");
    if (digits.length !== 16) e.cardNumber = "Must be 16 digits";
    if (!cardName.trim()) e.cardName = "Required";
    if (expiry.length !== 5) e.expiry = "MM/YY format";
    if (cvv.length < 3) e.cvv = "3-4 digits";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handlePay = async () => {
    if (!validate()) return;
    setPaymentState("processing");
    // Simulate payment gateway
    await new Promise((r) => setTimeout(r, 2500));
    // 90% success rate simulation
    const success = Math.random() > 0.1;
    if (success) {
      setPaymentState("success");
      toast({ title: "Payment Successful", description: `Policy ${policyNumber} has been issued.` });
      onPaymentSuccess?.(policyNumber, totalPremium);
    } else {
      setPaymentState("failed");
      toast({ title: "Payment Failed", description: "Please try again or use a different card.", variant: "destructive" });
    }
  };

  const handlePrint = () => window.print();

  if (paymentState === "success") {
    return (
      <div className="space-y-6 pb-20 sm:pb-0">
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="py-10 text-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle2 className="h-8 w-8 text-primary" />
            </div>
            <h2 className="font-heading text-2xl font-bold text-foreground">Policy Issued Successfully!</h2>
            <p className="text-muted-foreground">Your health insurance policy has been activated.</p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="font-heading text-lg">Policy Confirmation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Policy Number</p>
                <p className="font-semibold text-foreground">{policyNumber}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Members</p>
                <p className="font-semibold text-foreground">{members.length}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Premium Paid</p>
                <p className="font-semibold text-primary">SAR {totalPremium.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Effective Date</p>
                <p className="font-semibold text-foreground">
                  {sponsorData.policyEffectiveDate ? format(sponsorData.policyEffectiveDate, "dd MMM yyyy") : "—"}
                </p>
              </div>
            </div>

            <Separator className="my-4" />

            <div className="overflow-auto max-h-[250px]">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-card">
                  <tr className="border-b border-border text-left">
                    <th className="py-2 px-3 font-semibold text-muted-foreground">#</th>
                    <th className="py-2 px-3 font-semibold text-muted-foreground">Member</th>
                    <th className="py-2 px-3 font-semibold text-muted-foreground">Type</th>
                    <th className="py-2 px-3 font-semibold text-muted-foreground">Class</th>
                    <th className="py-2 px-3 font-semibold text-muted-foreground text-right">Premium</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((m, i) => (
                    <tr key={m.id} className="border-b border-border last:border-0">
                      <td className="py-2 px-3 text-muted-foreground">{i + 1}</td>
                      <td className="py-2 px-3 font-medium text-foreground">{m.memberName}</td>
                      <td className="py-2 px-3"><Badge variant="outline">{m.memberType}</Badge></td>
                      <td className="py-2 px-3"><Badge variant="secondary">{m.classSelection}</Badge></td>
                      <td className="py-2 px-3 text-right font-semibold">SAR {premiums[i].toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="py-5">
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" className="gap-2" onClick={handlePrint}>
                <Download className="h-4 w-4" /> Download Policy
              </Button>
              <Button variant="outline" className="gap-2" onClick={handlePrint}>
                <FileText className="h-4 w-4" /> Download Invoice
              </Button>
              <Button variant="outline" className="gap-2" onClick={handlePrint}>
                <Printer className="h-4 w-4" /> Print Documents
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Payment Summary */}
      <Card className="border-primary/20">
        <CardContent className="py-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Premium</p>
              <p className="text-2xl font-heading font-bold text-primary">SAR {totalPremium.toLocaleString()}</p>
            </div>
            <Badge className="bg-primary/10 text-primary border-primary/20 px-3 py-1">{members.length} Members</Badge>
          </div>
        </CardContent>
      </Card>

      {paymentState === "failed" && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="py-4 flex items-center gap-3">
            <XCircle className="h-5 w-5 text-destructive shrink-0" />
            <div>
              <p className="font-medium text-foreground">Payment Failed</p>
              <p className="text-sm text-muted-foreground">Transaction was declined. Please try again or use a different card.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Type */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            <CardTitle className="font-heading text-lg">Payment Method</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <RadioGroup value={paymentType} onValueChange={(v) => setPaymentType(v as PaymentType)} className="flex gap-4">
            <div className="flex items-center gap-2">
              <RadioGroupItem value="credit" id="credit" />
              <Label htmlFor="credit">Credit Card</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="debit" id="debit" />
              <Label htmlFor="debit">Debit Card</Label>
            </div>
          </RadioGroup>

          <div className="space-y-4">
            <div>
              <Label>Cardholder Name *</Label>
              <Input value={cardName} onChange={(e) => setCardName(e.target.value)} placeholder="Name on card" />
              {errors.cardName && <p className="text-xs text-destructive mt-1">{errors.cardName}</p>}
            </div>
            <div>
              <Label>Card Number *</Label>
              <Input
                value={cardNumber}
                onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                placeholder="0000 0000 0000 0000"
                maxLength={19}
              />
              {errors.cardNumber && <p className="text-xs text-destructive mt-1">{errors.cardNumber}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Expiry Date *</Label>
                <Input
                  value={expiry}
                  onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                  placeholder="MM/YY"
                  maxLength={5}
                />
                {errors.expiry && <p className="text-xs text-destructive mt-1">{errors.expiry}</p>}
              </div>
              <div>
                <Label>CVV *</Label>
                <Input
                  type="password"
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  placeholder="•••"
                  maxLength={4}
                />
                {errors.cvv && <p className="text-xs text-destructive mt-1">{errors.cvv}</p>}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
            <Shield className="h-4 w-4 text-primary shrink-0" />
            <span>Your payment details are encrypted and secure. This is a simulated payment gateway.</span>
          </div>
        </CardContent>
      </Card>

      <div className="hidden sm:flex justify-between">
        <Button variant="outline" onClick={onBack}>Back</Button>
        <Button onClick={handlePay} disabled={paymentState === "processing"} className="gap-2 min-w-[160px]">
          {paymentState === "processing" ? <><Loader2 className="h-4 w-4 animate-spin" />Processing...</> : <>Pay SAR {totalPremium.toLocaleString()}</>}
        </Button>
      </div>

      {/* Sticky mobile bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 backdrop-blur-md p-3 flex gap-3 sm:hidden">
        <Button variant="outline" onClick={onBack} className="flex-1">Back</Button>
        <Button onClick={handlePay} disabled={paymentState === "processing"} className="flex-1 gap-2">
          {paymentState === "processing" ? <><Loader2 className="h-4 w-4 animate-spin" />Processing...</> : <>Pay SAR {totalPremium.toLocaleString()}</>}
        </Button>
      </div>
    </div>
  );
};

export default PaymentStep;
