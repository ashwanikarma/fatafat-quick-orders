import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { QuotationService } from '../../../../core/services/quotation.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../core/services/toast.service';
import { SarCurrencyPipe } from '../../../../shared/pipes/format-currency.pipe';
import { QuotationRecord } from '../../../../core/models/quotation.model';

const STEP_LABELS = ['Sponsor', 'Members', 'Health', 'Quotation', 'KYC', 'Payment'];

interface StatusConfig {
  label: string;
  cssClass: string;
  icon: string;
}

const STATUS_CONFIG: Record<string, StatusConfig> = {
  draft:     { label: 'In Progress', cssClass: 'bg-muted text-muted-foreground border-border', icon: 'schedule' },
  completed: { label: 'Completed',   cssClass: 'bg-primary/10 text-primary border-primary/20', icon: 'check_circle' },
  paid:      { label: 'Paid',        cssClass: 'bg-primary/10 text-primary border-primary/20', icon: 'verified_user' },
};

@Component({
  selector: 'app-quotation-list',
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
            <h1 class="text-lg font-bold text-foreground">My Quotations</h1>
          </div>
          <button (click)="newQuotation()" class="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
            <span class="material-icons text-sm">add</span> New Quotation
          </button>
        </div>
      </header>

      <main class="container mx-auto px-4 py-8 lg:px-8 max-w-5xl">
        <!-- Loading -->
        @if (loading) {
          <div class="space-y-4">
            @for (i of [1,2,3]; track i) {
              <div class="h-32 rounded-2xl bg-card border border-border animate-pulse"></div>
            }
          </div>
        }

        <!-- Empty State -->
        @else if (quotations.length === 0) {
          <div class="text-center py-20">
            <span class="material-icons text-6xl text-muted-foreground/30 mb-4">description</span>
            <h2 class="text-xl font-bold text-foreground mb-2">No Quotations Yet</h2>
            <p class="text-muted-foreground mb-6">Start your first insurance quotation to see it here.</p>
            <button (click)="newQuotation()" class="flex items-center gap-2 mx-auto px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors">
              <span class="material-icons text-sm">add</span> Start New Quotation
            </button>
          </div>
        }

        <!-- Quotation Cards -->
        @else {
          <div class="space-y-4">
            @for (q of quotations; track q.id; let i = $index) {
              <div class="bg-card border border-border rounded-2xl p-6 hover:shadow-md transition-all cursor-pointer"
                   (click)="openQuotation(q.id)">
                <div class="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div class="flex-1 space-y-3">
                    <!-- Title row -->
                    <div class="flex items-center gap-3">
                      <div class="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <span class="material-icons">description</span>
                      </div>
                      <div class="flex-1 min-w-0">
                        <h3 class="font-bold text-foreground">
                          {{ q.sponsorData?.sponsorName || q.sponsorData?.sponsorNumber || 'Draft Quotation' }}
                        </h3>
                        <p class="text-sm text-muted-foreground">
                          {{ q.quotationId || ('Step: ' + getStepLabel(q.currentStep)) }}
                        </p>
                      </div>
                      <span class="shrink-0 text-xs px-2.5 py-1 rounded-full border"
                            [ngClass]="getStatusConfig(q.status).cssClass">
                        <span class="material-icons text-xs mr-1 align-middle">{{ getStatusConfig(q.status).icon }}</span>
                        {{ getStatusConfig(q.status).label }}
                      </span>
                    </div>

                    <!-- Stats row -->
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div class="flex items-center gap-2 text-muted-foreground">
                        <span class="material-icons text-base">group</span>
                        <span>{{ getMemberCount(q) }} member{{ getMemberCount(q) !== 1 ? 's' : '' }}</span>
                      </div>
                      <div class="flex items-center gap-2 text-muted-foreground">
                        <span class="material-icons text-base">credit_card</span>
                        <span>{{ q.totalPremium | sarCurrency }}</span>
                      </div>
                      <div class="flex items-center gap-2 text-muted-foreground">
                        <span class="material-icons text-base">event</span>
                        <span>{{ q.sponsorData?.policyEffectiveDate ? (q.sponsorData.policyEffectiveDate | date:'mediumDate') : '—' }}</span>
                      </div>
                      <div class="flex items-center gap-2 text-muted-foreground">
                        <span class="material-icons text-base">schedule</span>
                        <span>{{ q.updatedAt | date:'mediumDate' }}</span>
                      </div>
                    </div>
                  </div>

                  <!-- Actions -->
                  <div class="flex items-center gap-2 md:flex-col md:items-end">
                    <button (click)="download($event, q)" class="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-border rounded-lg hover:bg-muted transition-colors">
                      <span class="material-icons text-sm">download</span> Download
                    </button>
                    @if (q.status === 'draft') {
                      <button (click)="delete($event, q.id)" class="flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                        <span class="material-icons text-sm">delete</span> Delete
                      </button>
                    }
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
export class QuotationListComponent implements OnInit {
  private quotationService = inject(QuotationService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  quotations: QuotationRecord[] = [];
  loading = true;

  async ngOnInit(): Promise<void> {
    await this.load();
  }

  async load(): Promise<void> {
    this.loading = true;
    const userId = this.authService.currentUser()?.id;
    if (userId) {
      this.quotations = await this.quotationService.listQuotations(userId);
    }
    this.loading = false;
  }

  getStepLabel(step: number): string {
    return STEP_LABELS[step] || 'Sponsor';
  }

  getStatusConfig(status: string): StatusConfig {
    return STATUS_CONFIG[status] || STATUS_CONFIG['draft'];
  }

  getMemberCount(q: QuotationRecord): number {
    return Array.isArray(q.members) ? q.members.length : 0;
  }

  newQuotation(): void {
    this.router.navigate(['/quotation']);
  }

  openQuotation(id: string): void {
    this.router.navigate(['/quotation'], { queryParams: { id } });
  }

  download(event: Event, q: QuotationRecord): void {
    event.stopPropagation();
    this.quotationService.downloadDocument(q.id, q.policyNumber ? 'policy' : 'quotation');
    this.toastService.show('Downloaded', 'Document saved to your device');
  }

  async delete(event: Event, id: string): Promise<void> {
    event.stopPropagation();
    const success = await this.quotationService.deleteQuotation(id);
    if (success) {
      this.toastService.show('Deleted', 'Quotation removed');
      await this.load();
    } else {
      this.toastService.show('Error', 'Failed to delete quotation', 'error');
    }
  }
}
