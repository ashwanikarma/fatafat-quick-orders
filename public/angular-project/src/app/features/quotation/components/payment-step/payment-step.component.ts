import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Member, SponsorData, ClassSelection } from '../../../../core/models/quotation.model';
import { SarCurrencyPipe } from '../../../../shared/pipes/format-currency.pipe';
import { ToastService } from '../../../../core/services/toast.service';

const BASE_PREMIUMS: Record<ClassSelection, number> = { VIP: 8500, A: 5500, B: 3500, C: 2200, LM: 1200 };

function calculatePremium(members: Member[]): number[] {
  return members.map(m => {
    let premium = BASE_PREMIUMS[m.classSelection] || 3500;
    if (m.memberType === 'Dependent') premium *= 0.75;
    if (m.healthDeclaration === 'Yes') premium *= 1.15;
    return Math.round(premium);
  });
}

type PaymentState = 'idle' | 'processing' | 'success' | 'failed';

@Component({
  selector: 'app-payment-step',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe, SarCurrencyPipe],
  template: `
    <div class="space-y-6 pb-20 sm:pb-0">
      <!-- Success State -->
      @if (paymentState === 'success') {
        <!-- Success Card -->
        <div class="bg-primary/5 border border-primary/30 rounded-2xl p-10 text-center space-y-4">
          <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <span class="material-icons text-3xl text-primary">check_circle</span>
          </div>
          <h2 class="text-2xl font-bold text-foreground">Policy Issued Successfully!</h2>
          <p class="text-muted-foreground">Your health insurance policy has been activated.</p>
        </div>

        <!-- Policy Confirmation -->
        <div class="bg-card border border-border rounded-2xl overflow-hidden">
          <div class="p-6 pb-3"><h3 class="text-lg font-bold">Policy Confirmation</h3></div>
          <div class="px-6 pb-6">
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p class="text-muted-foreground">Policy Number</p>
                <p class="font-semibold text-foreground">{{ policyNumber }}</p>
              </div>
              <div>
                <p class="text-muted-foreground">Members</p>
                <p class="font-semibold text-foreground">{{ members.length }}</p>
              </div>
              <div>
                <p class="text-muted-foreground">Premium Paid</p>
                <p class="font-semibold text-primary">{{ totalPremium | sarCurrency }}</p>
              </div>
              <div>
                <p class="text-muted-foreground">Effective Date</p>
                <p class="font-semibold text-foreground">{{ sponsorData.policyEffectiveDate ? (sponsorData.policyEffectiveDate | date:'dd MMM yyyy') : '—' }}</p>
              </div>
            </div>
            <hr class="my-4 border-border" />
            <div class="overflow-auto max-h-[250px]">
              <table class="w-full text-sm">
                <thead class="sticky top-0 bg-card">
                  <tr class="border-b border-border text-left">
                    <th class="py-2 px-3 font-semibold text-muted-foreground">#</th>
                    <th class="py-2 px-3 font-semibold text-muted-foreground">Member</th>
                    <th class="py-2 px-3 font-semibold text-muted-foreground">Type</th>
                    <th class="py-2 px-3 font-semibold text-muted-foreground">Class</th>
                    <th class="py-2 px-3 font-semibold text-muted-foreground text-right">Premium</th>
                  </tr>
                </thead>
                <tbody>
                  @for (m of members; track m.id; let i = $index) {
                    <tr class="border-b border-border last:border-0">
                      <td class="py-2 px-3 text-muted-foreground">{{ i + 1 }}</td>
                      <td class="py-2 px-3 font-medium text-foreground">{{ m.memberName }}</td>
                      <td class="py-2 px-3"><span class="text-xs px-2 py-0.5 rounded-full border">{{ m.memberType }}</span></td>
                      <td class="py-2 px-3"><span class="text-xs px-2 py-0.5 rounded-full bg-secondary">{{ m.classSelection }}</span></td>
                      <td class="py-2 px-3 text-right font-semibold">{{ premiums[i] | sarCurrency }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Download Actions -->
        <div class="bg-card border border-border rounded-2xl p-5">
          <div class="flex flex-wrap gap-3">
            <button (click)="print()" class="flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors text-sm">
              <span class="material-icons text-sm">download</span> Download Policy
            </button>
            <button (click)="print()" class="flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors text-sm">
              <span class="material-icons text-sm">receipt</span> Download Invoice
            </button>
            <button (click)="print()" class="flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors text-sm">
              <span class="material-icons text-sm">print</span> Print Documents
            </button>
          </div>
        </div>
      }

      <!-- Payment Form -->
      @else {
        <!-- Payment Summary -->
        <div class="bg-card border border-primary/20 rounded-2xl p-5">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-muted-foreground">Total Premium</p>
              <p class="text-2xl font-bold text-primary">{{ totalPremium | sarCurrency }}</p>
            </div>
            <span class="bg-primary/10 text-primary border-primary/20 px-3 py-1 rounded-full border text-sm">{{ members.length }} Members</span>
          </div>
        </div>

        @if (paymentState === 'failed') {
          <div class="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3">
            <span class="material-icons text-red-500">cancel</span>
            <div>
              <p class="font-medium text-foreground">Payment Failed</p>
              <p class="text-sm text-muted-foreground">Transaction was declined. Please try again or use a different card.</p>
            </div>
          </div>
        }

        <!-- Payment Method -->
        <div class="bg-card border border-border rounded-2xl overflow-hidden">
          <div class="p-6 pb-3 flex items-center gap-2">
            <span class="material-icons text-primary">credit_card</span>
            <h3 class="text-lg font-bold">Payment Method</h3>
          </div>
          <div class="px-6 pb-6 space-y-5">
            <div class="flex gap-4">
              <label class="flex items-center gap-2">
                <input type="radio" name="payType" value="credit" [(ngModel)]="paymentType" /> Credit Card
              </label>
              <label class="flex items-center gap-2">
                <input type="radio" name="payType" value="debit" [(ngModel)]="paymentType" /> Debit Card
              </label>
            </div>

            <div class="space-y-4">
              <div>
                <label class="text-sm font-medium">Cardholder Name *</label>
                <input [(ngModel)]="cardName" placeholder="Name on card"
                  class="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm mt-1" />
                @if (errors['cardName']) { <p class="text-xs text-red-500 mt-1">{{ errors['cardName'] }}</p> }
              </div>
              <div>
                <label class="text-sm font-medium">Card Number *</label>
                <input [ngModel]="cardNumber" (ngModelChange)="cardNumber = formatCardNumber($event)"
                  placeholder="0000 0000 0000 0000" maxlength="19"
                  class="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm mt-1" />
                @if (errors['cardNumber']) { <p class="text-xs text-red-500 mt-1">{{ errors['cardNumber'] }}</p> }
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="text-sm font-medium">Expiry Date *</label>
                  <input [ngModel]="expiry" (ngModelChange)="expiry = formatExpiry($event)"
                    placeholder="MM/YY" maxlength="5"
                    class="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm mt-1" />
                  @if (errors['expiry']) { <p class="text-xs text-red-500 mt-1">{{ errors['expiry'] }}</p> }
                </div>
                <div>
                  <label class="text-sm font-medium">CVV *</label>
                  <input type="password" [ngModel]="cvv" (ngModelChange)="cvv = $event.replace(/\\D/g, '').slice(0, 4)"
                    placeholder="•••" maxlength="4"
                    class="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm mt-1" />
                  @if (errors['cvv']) { <p class="text-xs text-red-500 mt-1">{{ errors['cvv'] }}</p> }
                </div>
              </div>
            </div>

            <div class="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
              <span class="material-icons text-primary text-sm">lock</span>
              <span>Your payment details are encrypted and secure. This is a simulated payment gateway.</span>
            </div>
          </div>
        </div>

        <!-- Navigation -->
        <div class="hidden sm:flex justify-between">
          <button (click)="back.emit()" class="px-6 py-2.5 border border-border rounded-lg hover:bg-muted transition-colors">Back</button>
          <button (click)="handlePay()" [disabled]="paymentState === 'processing'"
            class="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 min-w-[160px] flex items-center justify-center gap-2">
            @if (paymentState === 'processing') {
              <span class="material-icons animate-spin text-sm">refresh</span> Processing...
            } @else {
              Pay {{ totalPremium | sarCurrency }}
            }
          </button>
        </div>

        <div class="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 backdrop-blur-md p-3 flex gap-3 sm:hidden">
          <button (click)="back.emit()" class="flex-1 px-4 py-2.5 border border-border rounded-lg">Back</button>
          <button (click)="handlePay()" [disabled]="paymentState === 'processing'"
            class="flex-1 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg disabled:opacity-50 flex items-center justify-center gap-2">
            @if (paymentState === 'processing') {
              <span class="material-icons animate-spin text-sm">refresh</span> Processing...
            } @else {
              Pay {{ totalPremium | sarCurrency }}
            }
          </button>
        </div>
      }
    </div>
  `,
})
export class PaymentStepComponent {
  @Input() members: Member[] = [];
  @Input() sponsorData: SponsorData = { sponsorNumber: '', policyEffectiveDate: undefined };
  @Output() back = new EventEmitter<void>();
  @Output() paymentSuccess = new EventEmitter<{ policyNumber: string; totalPremium: number }>();

  paymentType = 'credit';
  cardNumber = '';
  expiry = '';
  cvv = '';
  cardName = '';
  paymentState: PaymentState = 'idle';
  errors: Record<string, string> = {};

  policyNumber = `POL-${Date.now().toString(36).toUpperCase()}`;

  constructor(private toastService: ToastService) {}

  get premiums(): number[] { return calculatePremium(this.members); }
  get totalPremium(): number { return this.premiums.reduce((a, b) => a + b, 0); }

  formatCardNumber(val: string): string {
    const digits = val.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
  }

  formatExpiry(val: string): string {
    const digits = val.replace(/\D/g, '').slice(0, 4);
    if (digits.length > 2) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return digits;
  }

  async handlePay(): Promise<void> {
    if (!this.validate()) return;
    this.paymentState = 'processing';
    await new Promise(r => setTimeout(r, 2500));
    const success = Math.random() > 0.1;
    if (success) {
      this.paymentState = 'success';
      this.toastService.show('Payment Successful', `Policy ${this.policyNumber} has been issued.`);
      this.paymentSuccess.emit({ policyNumber: this.policyNumber, totalPremium: this.totalPremium });
    } else {
      this.paymentState = 'failed';
      this.toastService.show('Payment Failed', 'Please try again or use a different card.', 'error');
    }
  }

  print(): void { window.print(); }

  private validate(): boolean {
    const e: Record<string, string> = {};
    const digits = this.cardNumber.replace(/\s/g, '');
    if (digits.length !== 16) e['cardNumber'] = 'Must be 16 digits';
    if (!this.cardName.trim()) e['cardName'] = 'Required';
    if (this.expiry.length !== 5) e['expiry'] = 'MM/YY format';
    if (this.cvv.length < 3) e['cvv'] = '3-4 digits';
    this.errors = e;
    return Object.keys(e).length === 0;
  }
}
