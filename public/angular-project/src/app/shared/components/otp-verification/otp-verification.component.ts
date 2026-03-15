import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-otp-verification',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatFormFieldModule, MatInputModule, MatButtonModule, MatProgressSpinnerModule,
  ],
  template: `
    <div class="space-y-4">
      <div class="text-center mb-4">
        <h3 class="text-lg font-heading font-bold text-foreground">{{ title }}</h3>
        <p class="text-sm text-muted-foreground mt-1">{{ description }}</p>
        <p class="text-xs text-muted-foreground mt-2">Sent to: {{ recipient }}</p>
      </div>

      <mat-form-field appearance="outline" class="w-full">
        <mat-label>Verification Code</mat-label>
        <input matInput
               [(ngModel)]="value"
               (ngModelChange)="onChange.emit($event)"
               placeholder="Enter 6-digit code"
               maxlength="6"
               pattern="[0-9]*"
               inputmode="numeric" />
      </mat-form-field>

      <button mat-flat-button
              color="primary"
              class="w-full"
              [disabled]="isSubmitting || value.length !== 6"
              (click)="onSubmit.emit()">
        @if (isSubmitting) {
          <mat-spinner diameter="20" class="inline-block mr-2"></mat-spinner>
        }
        {{ submitLabel }}
      </button>

      <div class="text-center">
        <button mat-button
                color="primary"
                [disabled]="isResending"
                (click)="onResend.emit()">
          @if (isResending) {
            <mat-spinner diameter="16" class="inline-block mr-1"></mat-spinner>
          }
          Resend Code
        </button>
      </div>
    </div>
  `,
})
export class OtpVerificationComponent {
  @Input() title = 'Verify your identity';
  @Input() description = 'Enter the verification code sent to your email';
  @Input() recipient = '';
  @Input() value = '';
  @Input() isSubmitting = false;
  @Input() isResending = false;
  @Input() submitLabel = 'Verify';

  @Output() onChange = new EventEmitter<string>();
  @Output() onSubmit = new EventEmitter<void>();
  @Output() onResend = new EventEmitter<void>();
}
