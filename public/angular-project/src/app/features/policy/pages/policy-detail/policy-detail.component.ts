import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatTableModule } from '@angular/material/table';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AuthService } from '../../../../core/services/auth.service';
import { QuotationService } from '../../../../core/services/quotation.service';
import { EndorsementService } from '../../../../core/services/endorsement.service';
import { ToastService } from '../../../../core/services/toast.service';
import { SarCurrencyPipe } from '../../../../shared/pipes/format-currency.pipe';
import { QuotationRecord, Member, calculatePremium } from '../../../../core/models/quotation.model';
import { EndorsementHistoryItem } from '../../../../core/models/endorsement.model';

@Component({
  selector: 'app-policy-detail',
  standalone: true,
  imports: [
    CommonModule, RouterLink,
    MatCardModule, MatButtonModule, MatTabsModule, MatChipsModule,
    MatTableModule, MatDividerModule, MatProgressSpinnerModule,
    SarCurrencyPipe,
  ],
  template: `
    <div class="min-h-screen bg-section-alt">
      <!-- Header -->
      <header class="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur-md">
        <div class="container mx-auto flex h-16 items-center justify-between px-4 lg:px-8">
          <div class="flex items-center gap-4">
            <a routerLink="/policies"><button mat-icon-button>←</button></a>
            <div>
              <h1 class="text-lg font-heading font-bold text-foreground">
                {{ policy()?.policyNumber || policy()?.quotationId || 'Policy' }}
              </h1>
              <p class="text-xs text-muted-foreground">{{ sponsorName() }}</p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button mat-stroked-button (click)="handleDownload()">📥 Download</button>
          </div>
        </div>
      </header>

      @if (loading()) {
        <main class="container mx-auto px-4 py-8 lg:px-8 max-w-5xl text-center">
          <mat-spinner diameter="40" class="mx-auto"></mat-spinner>
        </main>
      } @else if (policy()) {
        <main class="container mx-auto px-4 py-8 lg:px-8 max-w-5xl space-y-6">

          @if (endorsementView() !== 'none') {
            <!-- Endorsement Views -->
            <div>
              @switch (endorsementView()) {
                @case ('add') {
                  <!-- <app-add-member-endorsement ...> -->
                  <mat-card>
                    <mat-card-content class="p-8 text-center">
                      <p>Add Member Endorsement Component</p>
                      <button mat-button (click)="endorsementView.set('none')">Cancel</button>
                    </mat-card-content>
                  </mat-card>
                }
                @case ('update') {
                  <mat-card>
                    <mat-card-content class="p-8 text-center">
                      <p>Update Member Endorsement Component</p>
                      <button mat-button (click)="endorsementView.set('none')">Cancel</button>
                    </mat-card-content>
                  </mat-card>
                }
                @case ('delete') {
                  <mat-card>
                    <mat-card-content class="p-8 text-center">
                      <p>Delete Member Endorsement Component</p>
                      <button mat-button (click)="endorsementView.set('none')">Cancel</button>
                    </mat-card-content>
                  </mat-card>
                }
              }
            </div>
          } @else {
            <!-- Summary Cards -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              @for (s of summaryCards(); track s.label) {
                <mat-card>
                  <mat-card-content class="p-4 flex items-center gap-3">
                    <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl {{ s.tone }}">
                      {{ s.icon }}
                    </div>
                    <div class="min-w-0">
                      <p class="text-xs text-muted-foreground">{{ s.label }}</p>
                      <p class="text-sm font-heading font-bold text-foreground truncate">{{ s.value }}</p>
                    </div>
                  </mat-card-content>
                </mat-card>
              }
            </div>

            <!-- Endorsement Actions -->
            <mat-card>
              <mat-card-header>
                <mat-card-title class="font-heading text-lg">Endorsements</mat-card-title>
                <mat-card-subtitle>Modify your policy members through endorsements.</mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
                  <button mat-stroked-button class="h-auto py-4" (click)="endorsementView.set('add')">
                    <div class="text-center">
                      <p class="text-sm font-semibold">👤+ Add Member</p>
                      <p class="text-xs text-muted-foreground mt-1">Add new members with health declaration</p>
                    </div>
                  </button>
                  <button mat-stroked-button class="h-auto py-4" (click)="endorsementView.set('update')">
                    <div class="text-center">
                      <p class="text-sm font-semibold">✏️ Update Member</p>
                      <p class="text-xs text-muted-foreground mt-1">Edit basic personal details</p>
                    </div>
                  </button>
                  <button mat-stroked-button class="h-auto py-4" (click)="endorsementView.set('delete')">
                    <div class="text-center">
                      <p class="text-sm font-semibold">🗑️ Delete Member</p>
                      <p class="text-xs text-muted-foreground mt-1">Remove members with refund</p>
                    </div>
                  </button>
                </div>
              </mat-card-content>
            </mat-card>

            <!-- Tabs: Overview / Members / Endorsements -->
            <mat-tab-group [(selectedIndex)]="selectedTab">
              <mat-tab label="Overview">
                <mat-card class="mt-4">
                  <mat-card-content class="p-6">
                    <div class="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6 text-sm">
                      <div><p class="text-muted-foreground">Policy Number</p><p class="font-semibold">{{ policy()?.policyNumber || '—' }}</p></div>
                      <div><p class="text-muted-foreground">Quotation ID</p><p class="font-semibold">{{ policy()?.quotationId || '—' }}</p></div>
                      <div><p class="text-muted-foreground">Sponsor Name</p><p class="font-semibold">{{ sponsorName() }}</p></div>
                      <div><p class="text-muted-foreground">Total Premium</p><p class="font-semibold text-primary">{{ policy()?.totalPremium | sarCurrency }}</p></div>
                    </div>
                  </mat-card-content>
                </mat-card>
              </mat-tab>

              <mat-tab [label]="'Members (' + members().length + ')'">
                <mat-card class="mt-4">
                  <mat-card-content class="p-0">
                    <table mat-table [dataSource]="members()" class="w-full">
                      <ng-container matColumnDef="index">
                        <th mat-header-cell *matHeaderCellDef>#</th>
                        <td mat-cell *matCellDef="let m; let i = index">{{ i + 1 }}</td>
                      </ng-container>
                      <ng-container matColumnDef="name">
                        <th mat-header-cell *matHeaderCellDef>Name</th>
                        <td mat-cell *matCellDef="let m">{{ m.memberName }}</td>
                      </ng-container>
                      <ng-container matColumnDef="type">
                        <th mat-header-cell *matHeaderCellDef>Type</th>
                        <td mat-cell *matCellDef="let m"><mat-chip>{{ m.memberType }}</mat-chip></td>
                      </ng-container>
                      <ng-container matColumnDef="class">
                        <th mat-header-cell *matHeaderCellDef>Class</th>
                        <td mat-cell *matCellDef="let m"><mat-chip>{{ m.classSelection }}</mat-chip></td>
                      </ng-container>
                      <ng-container matColumnDef="premium">
                        <th mat-header-cell *matHeaderCellDef>Premium</th>
                        <td mat-cell *matCellDef="let m; let i = index">{{ premiums()[i] | sarCurrency }}</td>
                      </ng-container>
                      <tr mat-header-row *matHeaderRowDef="memberColumns"></tr>
                      <tr mat-row *matRowDef="let row; columns: memberColumns"></tr>
                    </table>
                  </mat-card-content>
                </mat-card>
              </mat-tab>

              <mat-tab [label]="'Endorsements (' + endorsementHistory().length + ')'">
                <mat-card class="mt-4">
                  <mat-card-content class="p-4">
                    @if (endorsementHistory().length === 0) {
                      <p class="text-center text-muted-foreground py-8">No endorsement history yet.</p>
                    } @else {
                      <div class="space-y-3">
                        @for (item of endorsementHistory(); track item.id) {
                          <div class="flex items-start gap-3 rounded-xl border border-border p-4">
                            <div class="flex-1">
                              <div class="flex items-center gap-2 mb-1">
                                <p class="text-sm font-semibold text-foreground">{{ item.description }}</p>
                                <mat-chip class="text-xs">{{ item.status }}</mat-chip>
                              </div>
                              <p class="text-xs text-muted-foreground">{{ item.date | date:'medium' }}</p>
                              @if (item.details) {
                                <p class="text-xs text-muted-foreground mt-1">{{ item.details }}</p>
                              }
                            </div>
                            @if (item.premiumImpact != null && item.premiumImpact !== 0) {
                              <p class="text-sm font-bold"
                                 [class.text-primary]="item.premiumImpact > 0"
                                 [class.text-destructive]="item.premiumImpact < 0">
                                {{ item.premiumImpact > 0 ? '+' : '' }}{{ item.premiumImpact | sarCurrency }}
                              </p>
                            }
                          </div>
                        }
                      </div>
                    }
                  </mat-card-content>
                </mat-card>
              </mat-tab>
            </mat-tab-group>
          }
        </main>
      }
    </div>
  `,
})
export class PolicyDetailComponent implements OnInit {
  private auth = inject(AuthService);
  private quotationService = inject(QuotationService);
  private endorsementService = inject(EndorsementService);
  private toast = inject(ToastService);
  private route = inject(ActivatedRoute);

  policy = signal<QuotationRecord | null>(null);
  loading = signal(true);
  endorsementView = signal<'none' | 'add' | 'update' | 'delete'>('none');
  endorsementHistory = signal<EndorsementHistoryItem[]>([]);
  selectedTab = 0;

  memberColumns = ['index', 'name', 'type', 'class', 'premium'];

  members = computed(() => this.policy()?.members ?? []);
  premiums = computed(() => calculatePremium(this.members()));
  sponsorName = computed(() => {
    const sponsor = this.policy()?.sponsorData;
    return sponsor?.sponsorName || sponsor?.sponsorNumber || '—';
  });

  summaryCards = computed(() => {
    const p = this.policy();
    if (!p) return [];
    return [
      { label: 'Total Premium', value: `SAR ${(p.totalPremium || 0).toLocaleString()}`, icon: '💳', tone: 'bg-primary/10 text-primary' },
      { label: 'Members', value: String(this.members().length), icon: '👥', tone: 'bg-secondary text-secondary-foreground' },
      { label: 'Status', value: p.status === 'paid' ? 'Active' : 'Completed', icon: '🛡️', tone: 'bg-primary/10 text-primary' },
      { label: 'Effective Date', value: p.sponsorData?.policyEffectiveDate ? new Date(p.sponsorData.policyEffectiveDate).toLocaleDateString() : '—', icon: '📅', tone: 'bg-accent text-accent-foreground' },
    ];
  });

  async ngOnInit(): Promise<void> {
    const policyId = this.route.snapshot.queryParamMap.get('id');
    if (!policyId) return;

    this.loading.set(true);
    const data = await this.quotationService.loadQuotation(policyId);
    if (data) {
      this.policy.set(data);

      // Load endorsement history
      const history = await this.endorsementService.getHistory(policyId);
      this.endorsementHistory.set(history.items);
    }
    this.loading.set(false);
  }

  handleDownload(): void {
    const p = this.policy();
    if (!p) return;
    this.quotationService.downloadDocument(p.id, 'policy');
    this.toast.success('Downloaded', 'Policy document saved');
  }
}
