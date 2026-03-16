import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Member, SponsorData, ClassSelection } from '../../../../core/models/quotation.model';
import { SarCurrencyPipe } from '../../../../shared/pipes/format-currency.pipe';

// Premium calculation (mirrors React calculatePremium)
const BASE_PREMIUMS: Record<ClassSelection, number> = { VIP: 8500, A: 5500, B: 3500, C: 2200, LM: 1200 };

function calculatePremium(members: Member[]): number[] {
  return members.map(m => {
    let premium = BASE_PREMIUMS[m.classSelection] || 3500;
    if (m.memberType === 'Dependent') premium *= 0.75;
    if (m.healthDeclaration === 'Yes') premium *= 1.15;
    return Math.round(premium);
  });
}

const CLASS_BENEFITS: Record<ClassSelection, { coverage: string; hospitals: string; maternity: string; dental: string; optical: string; exclusions: string[] }> = {
  VIP:  { coverage: 'SAR 500,000', hospitals: 'All network hospitals including international affiliates', maternity: 'Full coverage including complications', dental: 'SAR 5,000 annual limit', optical: 'SAR 3,000 annual limit', exclusions: ['Cosmetic surgery', 'Experimental treatments'] },
  A:    { coverage: 'SAR 250,000', hospitals: 'All network hospitals (200+ facilities)', maternity: 'SAR 30,000 per event', dental: 'SAR 3,500 annual limit', optical: 'SAR 2,000 annual limit', exclusions: ['Cosmetic surgery', 'Experimental treatments', 'Non-emergency international care'] },
  B:    { coverage: 'SAR 150,000', hospitals: 'Network hospitals (150+ facilities)', maternity: 'SAR 20,000 per event', dental: 'SAR 2,500 annual limit', optical: 'SAR 1,500 annual limit', exclusions: ['Cosmetic surgery', 'Experimental treatments', 'International care', 'Alternative medicine'] },
  C:    { coverage: 'SAR 100,000', hospitals: 'Network hospitals (100+ facilities)', maternity: 'SAR 10,000 per event', dental: 'SAR 1,500 annual limit', optical: 'SAR 800 annual limit', exclusions: ['Cosmetic surgery', 'Experimental treatments', 'International care', 'Alternative medicine', 'Psychiatric care beyond 30 days'] },
  LM:   { coverage: 'SAR 50,000 (CCHI minimum)', hospitals: 'Government & select private hospitals', maternity: 'Emergency only', dental: 'Emergency extraction only', optical: 'Not covered', exclusions: ['Cosmetic surgery', 'Experimental treatments', 'International care', 'Alternative medicine', 'Elective procedures', 'Pre-existing (12-month wait)'] },
};

@Component({
  selector: 'app-quotation-step',
  standalone: true,
  imports: [CommonModule, DatePipe, SarCurrencyPipe],
  template: `
    <div class="space-y-6 pb-20 sm:pb-0">
      <!-- Summary Card -->
      <div class="bg-card border border-primary/20 rounded-2xl overflow-hidden">
        <div class="p-6 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 class="text-xl font-bold">Quotation Summary</h3>
            <p class="text-sm text-muted-foreground mt-1">Quotation ID: {{ quotationId }}</p>
          </div>
          <span class="self-start sm:self-auto bg-primary/10 text-primary border-primary/20 text-base px-4 py-1.5 rounded-full border font-semibold">
            {{ totalPremium | sarCurrency }}
          </span>
        </div>
        <div class="px-6 pb-6">
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p class="text-muted-foreground">Sponsor</p>
              <p class="font-semibold text-foreground">{{ sponsorData.sponsorName || sponsorData.sponsorNumber }}</p>
            </div>
            <div>
              <p class="text-muted-foreground">Policy Effective Date</p>
              <p class="font-semibold text-foreground">{{ sponsorData.policyEffectiveDate ? (sponsorData.policyEffectiveDate | date:'dd MMM yyyy') : '—' }}</p>
            </div>
            <div>
              <p class="text-muted-foreground">Total Members</p>
              <p class="font-semibold text-foreground">{{ members.length }}</p>
            </div>
            <div>
              <p class="text-muted-foreground">Total Annual Premium</p>
              <p class="font-semibold text-primary">{{ totalPremium | sarCurrency }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Member Premiums Table -->
      <div class="bg-card border border-border rounded-2xl overflow-hidden">
        <div class="p-6 pb-3"><h3 class="text-lg font-bold">Member Premiums</h3></div>
        <div class="px-6 pb-6">
          <div class="overflow-auto max-h-[350px]">
            <table class="w-full text-sm">
              <thead class="sticky top-0 bg-card z-10">
                <tr class="border-b border-border text-left">
                  <th class="py-2.5 px-3 font-semibold text-muted-foreground">#</th>
                  <th class="py-2.5 px-3 font-semibold text-muted-foreground">Name</th>
                  <th class="py-2.5 px-3 font-semibold text-muted-foreground">Type</th>
                  <th class="py-2.5 px-3 font-semibold text-muted-foreground">Class</th>
                  <th class="py-2.5 px-3 font-semibold text-muted-foreground hidden sm:table-cell">Health</th>
                  <th class="py-2.5 px-3 font-semibold text-muted-foreground text-right">Premium (SAR)</th>
                </tr>
              </thead>
              <tbody>
                @for (m of members; track m.id; let i = $index) {
                  <tr class="border-b border-border last:border-0 hover:bg-muted/50">
                    <td class="py-2.5 px-3 text-muted-foreground">{{ i + 1 }}</td>
                    <td class="py-2.5 px-3 font-medium text-foreground">{{ m.memberName }}</td>
                    <td class="py-2.5 px-3">
                      <span class="text-xs px-2 py-0.5 rounded-full border" [class.border-primary/30]="m.memberType === 'Employee'" [class.text-primary]="m.memberType === 'Employee'">{{ m.memberType }}</span>
                    </td>
                    <td class="py-2.5 px-3"><span class="text-xs px-2 py-0.5 rounded-full bg-secondary">{{ m.classSelection }}</span></td>
                    <td class="py-2.5 px-3 hidden sm:table-cell">
                      <span class="text-xs px-2 py-0.5 rounded-full"
                        [class]="m.healthDeclaration === 'No' ? 'bg-secondary' : 'border border-red-300 text-red-500'">
                        {{ m.healthDeclaration === 'No' ? 'Clear' : 'Declared' }}
                      </span>
                    </td>
                    <td class="py-2.5 px-3 text-right font-semibold text-foreground">{{ premiums[i] | number }}</td>
                  </tr>
                }
              </tbody>
              <tfoot>
                <tr class="border-t-2 border-border">
                  <td colspan="5" class="py-3 px-3 font-bold text-foreground">Total</td>
                  <td class="py-3 px-3 text-right font-bold text-primary text-lg">{{ totalPremium | sarCurrency }}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      <!-- Class Benefits -->
      <div class="bg-card border border-border rounded-2xl overflow-hidden">
        <div class="p-6 pb-3">
          <h3 class="text-lg font-bold">Benefit Details by Class</h3>
          <p class="text-sm text-muted-foreground">Coverage, network & exclusions per selected class.</p>
        </div>
        <div class="px-6 pb-6 space-y-3">
          @for (cls of usedClasses; track cls) {
            <div class="rounded-xl border border-border overflow-hidden">
              <button (click)="expandedClass = expandedClass === cls ? null : cls"
                class="flex w-full items-center justify-between p-4 hover:bg-muted/50 transition-colors text-left">
                <div class="flex items-center gap-3">
                  <span class="text-sm font-bold px-3 py-0.5 rounded-full bg-secondary">{{ cls }}</span>
                  <span class="text-sm font-medium text-foreground">{{ getBenefits(cls).coverage }}</span>
                  <span class="text-xs text-muted-foreground">({{ getClassCount(cls) }} member{{ getClassCount(cls) !== 1 ? 's' : '' }})</span>
                </div>
                <span class="material-icons text-muted-foreground">{{ expandedClass === cls ? 'expand_less' : 'expand_more' }}</span>
              </button>
              @if (expandedClass === cls) {
                <div class="border-t border-border bg-muted/30 p-4 space-y-4">
                  <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                    <div class="rounded-lg bg-card border border-border p-3">
                      <p class="text-xs text-muted-foreground mb-1">Maternity</p>
                      <p class="font-medium text-foreground">{{ getBenefits(cls).maternity }}</p>
                    </div>
                    <div class="rounded-lg bg-card border border-border p-3">
                      <p class="text-xs text-muted-foreground mb-1">Dental</p>
                      <p class="font-medium text-foreground">{{ getBenefits(cls).dental }}</p>
                    </div>
                    <div class="rounded-lg bg-card border border-border p-3">
                      <p class="text-xs text-muted-foreground mb-1">Optical</p>
                      <p class="font-medium text-foreground">{{ getBenefits(cls).optical }}</p>
                    </div>
                  </div>
                  <div class="text-sm">
                    <p class="font-medium text-foreground mb-1">Exclusions</p>
                    <div class="flex flex-wrap gap-1.5">
                      @for (ex of getBenefits(cls).exclusions; track ex) {
                        <span class="text-xs px-2 py-0.5 rounded-full border border-red-200 text-red-500">{{ ex }}</span>
                      }
                    </div>
                  </div>
                </div>
              }
            </div>
          }
        </div>
      </div>

      <!-- Print Actions -->
      <div class="bg-card border border-border rounded-2xl p-5">
        <div class="flex flex-wrap gap-3">
          <button (click)="print()" class="flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors text-sm">
            <span class="material-icons text-sm">print</span> Print Quotation
          </button>
          <button (click)="print()" class="flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors text-sm">
            <span class="material-icons text-sm">description</span> Print Member List
          </button>
          <button (click)="print()" class="flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors text-sm">
            <span class="material-icons text-sm">download</span> Print Benefits
          </button>
        </div>
      </div>

      <!-- Navigation -->
      <div class="hidden sm:flex justify-between">
        <button (click)="back.emit()" class="px-6 py-2.5 border border-border rounded-lg hover:bg-muted transition-colors">Back</button>
        <button (click)="next.emit()" class="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
          Confirm &amp; Proceed
        </button>
      </div>

      <div class="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 backdrop-blur-md p-3 flex gap-3 sm:hidden">
        <button (click)="back.emit()" class="flex-1 px-4 py-2.5 border border-border rounded-lg">Back</button>
        <button (click)="next.emit()" class="flex-1 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg">Confirm & Proceed</button>
      </div>
    </div>
  `,
})
export class QuotationStepComponent {
  @Input() members: Member[] = [];
  @Input() sponsorData: SponsorData = { sponsorNumber: '', policyEffectiveDate: undefined };
  @Output() next = new EventEmitter<void>();
  @Output() back = new EventEmitter<void>();

  expandedClass: ClassSelection | null = null;

  get premiums(): number[] { return calculatePremium(this.members); }
  get totalPremium(): number { return this.premiums.reduce((a, b) => a + b, 0); }
  get quotationId(): string { return `QT-${Date.now().toString(36).toUpperCase()}`; }

  get usedClasses(): ClassSelection[] {
    return [...new Set(this.members.map(m => m.classSelection))];
  }

  getBenefits(cls: ClassSelection) { return CLASS_BENEFITS[cls]; }
  getClassCount(cls: ClassSelection): number { return this.members.filter(m => m.classSelection === cls).length; }
  print(): void { window.print(); }
}
