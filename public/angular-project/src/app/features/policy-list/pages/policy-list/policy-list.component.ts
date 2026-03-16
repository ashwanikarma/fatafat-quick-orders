import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { QuotationService } from '../../../../core/services/quotation.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../core/services/toast.service';
import { SarCurrencyPipe } from '../../../../shared/pipes/format-currency.pipe';
import { QuotationRecord } from '../../../../core/models/quotation.model';

@Component({
  selector: 'app-policy-list',
  standalone: true,
  imports: [CommonModule, RouterLink, SarCurrencyPipe, DatePipe],
  template: `
    <div class="min-h-screen bg-muted/30">
      <!-- Header -->
      <header class="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur-md">
        <div class="container mx-auto flex h-16 items-center justify-between px-4 lg:px-8">
          <div class="flex items-center gap-4">
            <a routerLink="/dashboard" class="p-2 rounded-lg hover:bg-muted transition-colors">
              <span class="material-icons text-xl">arrow_back</span>
            </a>
            <h1 class="text-lg font-bold text-foreground">Issued Policies</h1>
          </div>
        </div>
      </header>

      <main class="container mx-auto px-4 py-8 lg:px-8 max-w-5xl">
        @if (loading) {
          <div class="space-y-4">
            @for (i of [1,2,3]; track i) {
              <div class="h-40 rounded-2xl bg-card border border-border animate-pulse"></div>
            }
          </div>
        }

        @else if (policies.length === 0) {
          <div class="text-center py-20">
            <span class="material-icons text-6xl text-muted-foreground/30 mb-4">shield</span>
            <h2 class="text-xl font-bold text-foreground mb-2">No Policies Yet</h2>
            <p class="text-muted-foreground mb-6">Complete a quotation and payment to see your policies here.</p>
            <button (click)="router.navigate(['/quotation'])"
              class="flex items-center gap-2 mx-auto px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors">
              <span class="material-icons text-sm">description</span> Start New Quotation
            </button>
          </div>
        }

        @else {
          <div class="space-y-4">
            @for (p of policies; track p.id; let i = $index) {
              <div class="bg-card border border-border rounded-2xl p-6 hover:shadow-md transition-all cursor-pointer"
                   (click)="openPolicy(p.id)">
                <div class="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div class="flex-1 space-y-3">
                    <div class="flex items-center gap-3">
                      <div class="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <span class="material-icons">shield</span>
                      </div>
                      <div class="flex-1 min-w-0">
                        <h3 class="font-bold text-foreground">{{ p.policyNumber || p.quotationId || 'Policy' }}</h3>
                        <p class="text-sm text-muted-foreground">{{ p.sponsorData?.sponsorName || p.sponsorData?.sponsorNumber || '—' }}</p>
                      </div>
                      <span class="shrink-0 bg-primary/10 text-primary border-primary/20 text-xs px-2.5 py-1 rounded-full border">
                        {{ p.status === 'paid' ? 'Paid' : 'Completed' }}
                      </span>
                    </div>

                    <div class="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div class="flex items-center gap-2 text-muted-foreground">
                        <span class="material-icons text-base">group</span>
                        <span>{{ getMemberCount(p) }} member{{ getMemberCount(p) !== 1 ? 's' : '' }}</span>
                      </div>
                      <div class="flex items-center gap-2 text-muted-foreground">
                        <span class="material-icons text-base">credit_card</span>
                        <span>{{ p.totalPremium | sarCurrency }}</span>
                      </div>
                      <div class="flex items-center gap-2 text-muted-foreground">
                        <span class="material-icons text-base">event</span>
                        <span>{{ p.sponsorData?.policyEffectiveDate ? (p.sponsorData.policyEffectiveDate | date:'mediumDate') : '—' }}</span>
                      </div>
                      <div class="flex items-center gap-2 text-muted-foreground">
                        <span class="material-icons text-base">description</span>
                        <span>{{ p.quotationId || '—' }}</span>
                      </div>
                    </div>

                    <!-- Member badges -->
                    @if (getMemberCount(p) > 0) {
                      <div class="border-t border-border pt-3 mt-3">
                        <p class="text-xs font-medium text-muted-foreground mb-2">Members</p>
                        <div class="flex flex-wrap gap-2">
                          @for (m of getMembers(p).slice(0, 5); track m.id) {
                            <span class="text-xs px-2 py-1 rounded-full bg-secondary text-secondary-foreground">
                              {{ m.memberName || m.identityNumber }} — {{ m.classSelection }}
                            </span>
                          }
                          @if (getMemberCount(p) > 5) {
                            <span class="text-xs px-2 py-1 rounded-full border border-border text-muted-foreground">
                              +{{ getMemberCount(p) - 5 }} more
                            </span>
                          }
                        </div>
                      </div>
                    }
                  </div>

                  <div class="flex items-center md:items-end">
                    <button (click)="download($event, p)"
                      class="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-border rounded-lg hover:bg-muted transition-colors">
                      <span class="material-icons text-sm">download</span> Download
                    </button>
                  </div>
                </div>
              </div>
            }
          </div>
        }
      </main>
    </div>
  `,
})
export class PolicyListComponent implements OnInit {
  private quotationService = inject(QuotationService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  router = inject(Router);

  policies: QuotationRecord[] = [];
  loading = true;

  async ngOnInit(): Promise<void> {
    this.loading = true;
    const userId = this.authService.currentUser()?.id;
    if (userId) {
      this.policies = await this.quotationService.getPolicies(userId);
    }
    this.loading = false;
  }

  getMemberCount(q: QuotationRecord): number {
    return Array.isArray(q.members) ? q.members.length : 0;
  }

  getMembers(q: QuotationRecord): any[] {
    return Array.isArray(q.members) ? q.members : [];
  }

  openPolicy(id: string): void {
    this.router.navigate(['/policy'], { queryParams: { id } });
  }

  download(event: Event, p: QuotationRecord): void {
    event.stopPropagation();
    this.quotationService.downloadDocument(p.id, 'policy');
    this.toastService.show('Downloaded', 'Policy document saved to your device');
  }
}
