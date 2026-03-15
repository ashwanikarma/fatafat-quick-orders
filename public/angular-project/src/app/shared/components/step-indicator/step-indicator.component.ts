import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-step-indicator',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex items-center justify-center gap-2 mb-8">
      @for (step of steps; track step.index; let i = $index) {
        <div class="flex items-center gap-2">
          <div class="flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-colors"
               [class.bg-primary]="i <= currentStep"
               [class.text-primary-foreground]="i <= currentStep"
               [class.bg-muted]="i > currentStep"
               [class.text-muted-foreground]="i > currentStep">
            {{ i + 1 }}
          </div>
          <span class="text-xs font-medium hidden sm:inline"
                [class.text-foreground]="i <= currentStep"
                [class.text-muted-foreground]="i > currentStep">
            {{ step.label }}
          </span>
          @if (i < steps.length - 1) {
            <div class="w-8 h-0.5 transition-colors"
                 [class.bg-primary]="i < currentStep"
                 [class.bg-border]="i >= currentStep">
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class StepIndicatorComponent {
  @Input() currentStep = 0;

  steps = [
    { index: 0, label: 'Sponsor' },
    { index: 1, label: 'Members' },
    { index: 2, label: 'Health' },
    { index: 3, label: 'Quotation' },
    { index: 4, label: 'KYC' },
    { index: 5, label: 'Payment' },
  ];
}
