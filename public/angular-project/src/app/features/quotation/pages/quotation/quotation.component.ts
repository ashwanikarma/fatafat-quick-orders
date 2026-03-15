import { Component, OnInit, signal, computed, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { Subject, debounceTime, takeUntil } from 'rxjs';

import { AuthService } from '../../../../core/services/auth.service';
import { QuotationService } from '../../../../core/services/quotation.service';
import { ToastService } from '../../../../core/services/toast.service';
import { StepIndicatorComponent } from '../../../../shared/components/step-indicator/step-indicator.component';
import { SponsorStepComponent } from '../../components/sponsor-step/sponsor-step.component';
// Import other step components similarly...
import { SponsorData, Member, KYCData } from '../../../../core/models/quotation.model';

const emptyKYC: KYCData = {
  nationalAddress: { buildingNumber: '', additionalNumber: '', unitNumber: '', postalCode: '', street: '', district: '', city: '' },
  businessDetails: { businessType: '', companyRevenue: '', numberOfEmployees: '', taxRegistrationNumber: '', ibanNumber: '', bankName: '' },
  compliance: { isPEP: null, isBoardMember: null, boardMembers: [], hasMajorShareholder: null, shareholders: [], termsAccepted: false },
  completed: false,
};

@Component({
  selector: 'app-quotation',
  standalone: true,
  imports: [
    CommonModule, RouterLink,
    MatButtonModule, MatProgressSpinnerModule, MatCardModule, MatChipsModule,
    StepIndicatorComponent, SponsorStepComponent,
    // Add other step components here...
  ],
  template: `
    @if (auth.isLoading()) {
      <div class="flex min-h-screen items-center justify-center bg-section-alt">
        <mat-spinner diameter="32"></mat-spinner>
        <span class="ml-3 text-muted-foreground">Loading...</span>
      </div>
    } @else if (!auth.isAuthenticated()) {
      <!-- Will be handled by authGuard -->
    } @else if (!isInitialized()) {
      <div class="flex min-h-screen items-center justify-center bg-section-alt">
        <mat-spinner diameter="32"></mat-spinner>
        <span class="ml-3 text-muted-foreground">Loading quotation...</span>
      </div>
    } @else {
      <div class="min-h-screen bg-section-alt">
        <!-- Header -->
        <header class="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur-md">
          <div class="container mx-auto flex h-16 items-center justify-between px-4 lg:px-8">
            <div class="flex items-center gap-2 sm:gap-4 min-w-0">
              <a routerLink="/dashboard">
                <button mat-icon-button>←</button>
              </a>
              <div class="min-w-0">
                <h1 class="text-base sm:text-lg font-heading font-bold text-foreground truncate">New Policy Quotation</h1>
                <p class="text-xs text-muted-foreground hidden sm:block">Health Insurance — Quotation Module</p>
              </div>
            </div>
            <div class="flex items-center gap-3">
              @if (isSaving()) {
                <mat-chip class="text-xs">Saving...</mat-chip>
              }
              <div class="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                {{ auth.user()?.avatar }}
              </div>
            </div>
          </div>
        </header>

        <!-- Main Content -->
        <main class="container mx-auto px-3 sm:px-4 py-4 sm:py-8 lg:px-8 max-w-4xl pb-24 sm:pb-8">
          <app-step-indicator [currentStep]="step()"></app-step-indicator>

          @switch (step()) {
            @case (0) {
              <app-sponsor-step
                [data]="sponsorData()"
                (onChange)="sponsorData.set($event)"
                (onNext)="goToStep(1)">
              </app-sponsor-step>
            }
            @case (1) {
              <!-- <app-members-step [members]="members()" ...> -->
              <p class="text-center text-muted-foreground py-12">Members Step Component</p>
            }
            @case (2) {
              <!-- <app-health-declaration-step ...> -->
              <p class="text-center text-muted-foreground py-12">Health Declaration Step Component</p>
            }
            @case (3) {
              <!-- <app-quotation-step ...> -->
              <p class="text-center text-muted-foreground py-12">Quotation Step Component</p>
            }
            @case (4) {
              <!-- <app-kyc-step ...> -->
              <p class="text-center text-muted-foreground py-12">KYC Step Component</p>
            }
            @case (5) {
              <!-- <app-payment-step ...> -->
              <p class="text-center text-muted-foreground py-12">Payment Step Component</p>
            }
          }
        </main>
      </div>
    }
  `,
})
export class QuotationComponent implements OnInit, OnDestroy {
  auth = inject(AuthService);
  private quotationService = inject(QuotationService);
  private toast = inject(ToastService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  step = signal(0);
  sponsorData = signal<SponsorData>({ sponsorNumber: '', policyEffectiveDate: null });
  members = signal<Member[]>([]);
  kycData = signal<KYCData>(emptyKYC);
  quotationId = signal<string | null>(null);
  isInitialized = signal(false);
  isSaving = signal(false);

  private saveSubject = new Subject<void>();
  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    // Auto-save debounce
    this.saveSubject.pipe(
      debounceTime(1000),
      takeUntil(this.destroy$),
    ).subscribe(() => this.save());

    // Initialize
    const resumeId = this.route.snapshot.queryParamMap.get('id');
    this.initialize(resumeId);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private async initialize(resumeId: string | null): Promise<void> {
    const user = this.auth.user();
    if (!user) return;

    if (resumeId) {
      const loaded = await this.quotationService.loadQuotation(resumeId);
      if (loaded) {
        this.quotationId.set(loaded.id);
        this.step.set(loaded.currentStep);
        this.sponsorData.set(loaded.sponsorData);
        this.members.set(loaded.members);
        this.kycData.set(loaded.kycData);
        this.isInitialized.set(true);
        return;
      }
    }

    // Create new draft
    const res = await this.quotationService.createDraft(user.id);
    if (res.success && res.data) {
      this.quotationId.set(res.data.id);
    }
    this.isInitialized.set(true);
  }

  goToStep(nextStep: number): void {
    this.step.set(nextStep);
    this.save();
  }

  triggerAutoSave(): void {
    this.saveSubject.next();
  }

  private async save(): Promise<void> {
    const id = this.quotationId();
    if (!id) return;
    this.isSaving.set(true);
    await this.quotationService.saveState(
      id, this.step(), this.sponsorData(), this.members(), this.kycData(),
    );
    this.isSaving.set(false);
  }
}
