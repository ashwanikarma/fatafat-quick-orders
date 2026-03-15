import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../../core/services/auth.service';
import { QuotationService } from '../../../../core/services/quotation.service';
import { ToastService } from '../../../../core/services/toast.service';
import { QuotationRecord } from '../../../../core/models/quotation.model';
import { SarCurrencyPipe } from '../../../../shared/pipes/format-currency.pipe';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, RouterLink,
    MatCardModule, MatButtonModule, MatMenuModule, MatBadgeModule,
    MatChipsModule, MatDividerModule, MatProgressSpinnerModule,
    SarCurrencyPipe,
  ],
  template: `
    <div class="min-h-screen bg-section-alt">
      <!-- Header -->
      <header class="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur-md">
        <div class="container mx-auto flex h-16 items-center justify-between px-4 lg:px-8">
          <a routerLink="/" class="flex items-center gap-2">
            <div class="flex items-center gap-1">
              <div class="h-3 w-3 rounded-full bg-primary"></div>
              <div class="h-3 w-3 rounded-full bg-primary"></div>
            </div>
            <span class="text-xl font-heading font-bold tracking-tight text-foreground">FataFat</span>
          </a>
          <div class="flex items-center gap-3">
            <!-- Notification Bell -->
            <button mat-icon-button [matMenuTriggerFor]="notifMenu">
              🔔
              @if (unreadCount() > 0) {
                <span class="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary"></span>
              }
            </button>
            <mat-menu #notifMenu="matMenu" class="w-80">
              <div class="px-4 py-3 flex items-center justify-between">
                <p class="text-sm font-heading font-semibold">Notifications</p>
                @if (unreadCount() > 0) {
                  <mat-chip class="text-xs">{{ unreadCount() }} new</mat-chip>
                }
              </div>
              <mat-divider></mat-divider>
              @for (n of notifications(); track n.id) {
                <button mat-menu-item (click)="markOneRead(n.id)">
                  <div class="flex flex-col py-1">
                    <span class="text-sm font-medium">{{ n.title }}</span>
                    <span class="text-xs text-muted-foreground">{{ n.desc }}</span>
                    <span class="text-xs text-muted-foreground/70 mt-1">{{ n.time }}</span>
                  </div>
                </button>
              }
              <mat-divider></mat-divider>
              <button mat-menu-item (click)="markAllRead()" [disabled]="unreadCount() === 0">
                {{ unreadCount() === 0 ? 'All caught up!' : 'Mark all as read' }}
              </button>
            </mat-menu>

            <!-- Profile -->
            <a routerLink="/profile">
              <button mat-button class="gap-2">
                <div class="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {{ auth.user()?.avatar }}
                </div>
                <span class="hidden sm:inline text-sm font-medium">{{ auth.user()?.name }}</span>
              </button>
            </a>

            <!-- Logout -->
            <button mat-icon-button (click)="handleLogout()" title="Logout">🚪</button>
          </div>
        </div>
      </header>

      <!-- Main -->
      <main class="container mx-auto space-y-8 px-4 py-8 lg:px-8">
        <!-- Welcome -->
        <div class="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p class="text-sm font-medium uppercase tracking-[0.24em] text-primary">Policy command center</p>
            <h1 class="mt-3 text-2xl font-heading font-bold text-foreground md:text-3xl">
              Welcome back, {{ auth.user()?.name?.split(' ')?.[0] }} 👋
            </h1>
            <p class="mt-2 text-muted-foreground">Track claims, billing, and member details from one secure dashboard.</p>
          </div>
          <mat-card>
            <mat-card-content class="flex h-full flex-col justify-between gap-4 p-5">
              <div>
                <p class="text-sm text-muted-foreground">Membership</p>
                <p class="mt-1 text-xl font-heading font-semibold">{{ auth.user()?.membershipTier }}</p>
              </div>
              <div class="flex flex-wrap gap-2 text-sm text-muted-foreground">
                <mat-chip class="bg-primary/10 text-primary">{{ auth.user()?.policyCount }} active policies</mat-chip>
                <mat-chip>Member since {{ auth.user()?.memberSince }}</mat-chip>
              </div>
            </mat-card-content>
          </mat-card>
        </div>

        <!-- Stats -->
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          @for (stat of dashboardStats; track stat.label) {
            <mat-card class="hover:shadow-md transition-shadow">
              <mat-card-content class="flex items-center gap-4 p-5">
                <div class="flex h-12 w-12 items-center justify-center rounded-2xl {{ stat.tone }}">
                  {{ stat.icon }}
                </div>
                <div>
                  <p class="text-sm text-muted-foreground">{{ stat.label }}</p>
                  <p class="text-2xl font-heading font-bold text-foreground">{{ stat.value }}</p>
                </div>
              </mat-card-content>
            </mat-card>
          }
        </div>

        <!-- Quotations -->
        @if (quotations().length > 0) {
          <div>
            <div class="mb-4 flex items-center justify-between">
              <h2 class="text-lg font-heading font-bold">Your Quotations</h2>
              <a routerLink="/quotations"><button mat-button color="primary">View All →</button></a>
            </div>
            <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              @for (q of quotations().slice(0, 6); track q.id) {
                <mat-card class="cursor-pointer hover:shadow-lg transition-all"
                          (click)="navigateToQuotation(q)">
                  <mat-card-content class="p-5">
                    <div class="flex items-center justify-between mb-3">
                      <p class="font-heading font-bold text-foreground text-sm">
                        {{ q.quotationId || q.id.slice(0, 8) }}
                      </p>
                      <mat-chip class="text-xs">{{ q.status }}</mat-chip>
                    </div>
                    <p class="text-sm text-muted-foreground">
                      {{ q.members.length }} members · {{ q.totalPremium | sarCurrency }}
                    </p>
                    <div class="mt-3 flex justify-end">
                      <button mat-icon-button color="warn" (click)="deleteQuotation($event, q.id)">🗑️</button>
                    </div>
                  </mat-card-content>
                </mat-card>
              }
            </div>
          </div>
        }

        <!-- New Quotation Button -->
        <div class="text-center">
          <a routerLink="/quotation">
            <button mat-flat-button color="primary" class="gap-2">
              + Start New Quotation
            </button>
          </a>
        </div>
      </main>
    </div>
  `,
})
export class DashboardComponent implements OnInit {
  auth = inject(AuthService);
  private quotationService = inject(QuotationService);
  private toast = inject(ToastService);
  private router = inject(Router);

  quotations = signal<QuotationRecord[]>([]);
  notifications = signal([
    { id: 1, title: 'Claim Approved', desc: 'Your claim CLM-1023 for ₹45,000 has been approved.', time: '2 hours ago', read: false },
    { id: 2, title: 'Payment Reminder', desc: 'Health Shield Plus premium of ₹18,500 is due on 15 Mar.', time: '1 day ago', read: false },
    { id: 3, title: 'Claim Under Review', desc: 'Claim CLM-1024 for Motor Protect is being reviewed.', time: '3 days ago', read: true },
  ]);

  unreadCount = signal(2);

  dashboardStats = [
    { label: 'Active Policies', value: '3', icon: '🛡️', tone: 'bg-primary/10 text-primary' },
    { label: 'Total Coverage', value: '₹65 Lakh', icon: '📈', tone: 'bg-secondary text-secondary-foreground' },
    { label: 'Annual Premium', value: '₹50,700', icon: '💳', tone: 'bg-accent text-accent-foreground' },
    { label: 'Open Claims', value: '2', icon: '📄', tone: 'bg-muted text-muted-foreground' },
  ];

  async ngOnInit(): Promise<void> {
    const user = this.auth.user();
    if (user) {
      const quotations = await this.quotationService.listQuotations(user.id);
      this.quotations.set(quotations);
    }
  }

  markAllRead(): void {
    this.notifications.update(n => n.map(item => ({ ...item, read: true })));
    this.unreadCount.set(0);
  }

  markOneRead(id: number): void {
    this.notifications.update(n => n.map(item => item.id === id ? { ...item, read: true } : item));
    this.unreadCount.set(this.notifications().filter(n => !n.read).length);
  }

  navigateToQuotation(q: QuotationRecord): void {
    if (q.status === 'paid' || q.policyNumber) {
      this.router.navigate(['/policy'], { queryParams: { id: q.id } });
    } else {
      this.router.navigate(['/quotation'], { queryParams: { id: q.id } });
    }
  }

  async deleteQuotation(event: Event, id: string): Promise<void> {
    event.stopPropagation();
    const success = await this.quotationService.deleteQuotation(id);
    if (success) {
      this.quotations.update(list => list.filter(q => q.id !== id));
      this.toast.success('Deleted', 'Quotation removed');
    } else {
      this.toast.error('Error', 'Failed to delete');
    }
  }

  async handleLogout(): Promise<void> {
    await this.auth.logout();
  }
}
