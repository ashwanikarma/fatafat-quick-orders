import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { QuotationService } from '../../../../core/services/quotation.service';
import { SponsorData } from '../../../../core/models/quotation.model';
import { addDays, addWeeks } from 'date-fns';

@Component({
  selector: 'app-sponsor-step',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatFormFieldModule, MatInputModule, MatButtonModule,
    MatDatepickerModule, MatNativeDateModule, MatProgressSpinnerModule, MatCardModule,
  ],
  template: `
    <div class="pb-20 sm:pb-0">
      <mat-card class="max-w-lg mx-auto">
        <mat-card-header>
          <mat-card-title class="font-heading text-xl">Sponsor Details</mat-card-title>
          <mat-card-subtitle>Enter the sponsor number and select the policy effective date.</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content class="space-y-5 pt-4">
          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Sponsor Number *</mat-label>
            <input matInput [(ngModel)]="data.sponsorNumber"
                   (ngModelChange)="onChange.emit(data)"
                   placeholder="e.g. SP12345" />
          </mat-form-field>

          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Policy Effective Date *</mat-label>
            <input matInput [matDatepicker]="picker"
                   [(ngModel)]="data.policyEffectiveDate"
                   (ngModelChange)="onChange.emit(data)"
                   [min]="minDate"
                   [max]="maxDate" />
            <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
            <mat-datepicker #picker></mat-datepicker>
          </mat-form-field>

          @if (error()) {
            <p class="text-sm text-destructive font-medium">{{ error() }}</p>
          }

          <button mat-flat-button color="primary" class="w-full hidden sm:block"
                  (click)="handleNext()" [disabled]="loading()">
            @if (loading()) { <mat-spinner diameter="20"></mat-spinner> }
            {{ loading() ? 'Validating with Wathaq...' : 'Next' }}
          </button>
        </mat-card-content>
      </mat-card>

      <!-- Mobile bottom bar -->
      <div class="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 backdrop-blur-md p-3 sm:hidden">
        <button mat-flat-button color="primary" class="w-full"
                (click)="handleNext()" [disabled]="loading()">
          {{ loading() ? 'Validating...' : 'Next' }}
        </button>
      </div>
    </div>
  `,
})
export class SponsorStepComponent {
  @Input() data: SponsorData = { sponsorNumber: '', policyEffectiveDate: null };
  @Output() onChange = new EventEmitter<SponsorData>();
  @Output() onNext = new EventEmitter<void>();

  loading = signal(false);
  error = signal('');

  minDate = addDays(new Date(), 1);
  maxDate = addWeeks(addDays(new Date(), 1), 3);

  constructor(private quotationService: QuotationService) {}

  async handleNext(): Promise<void> {
    this.error.set('');
    if (!this.data.sponsorNumber.trim()) {
      this.error.set('Sponsor Number is required.');
      return;
    }
    if (!this.data.policyEffectiveDate) {
      this.error.set('Policy Effective Date is required.');
      return;
    }

    this.loading.set(true);
    try {
      const result = await this.quotationService.validateSponsor(this.data.sponsorNumber);
      if (result.success && result.data) {
        this.data.sponsorName = result.data.sponsorName;
        this.data.sponsorStatus = result.data.sponsorStatus;
        this.onChange.emit(this.data);
        this.onNext.emit();
      } else {
        this.error.set(result.message || 'Validation failed.');
      }
    } catch {
      this.error.set('Service unavailable. Please try again.');
    } finally {
      this.loading.set(false);
    }
  }
}
