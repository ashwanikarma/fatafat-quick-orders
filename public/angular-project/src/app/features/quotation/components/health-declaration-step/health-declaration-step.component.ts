import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Member } from '../../../../core/models/quotation.model';

const HEALTH_QUESTIONS = [
  'Do you suffer from chronic diseases (e.g., diabetes, hypertension, asthma)?',
  'Have you had any surgery in the past 2 years?',
  'Are you currently on long-term medication?',
  'Have you been hospitalized in the last 12 months?',
  'Do you have any diagnosed medical conditions not listed above?',
];

@Component({
  selector: 'app-health-declaration-step',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6 pb-20 sm:pb-0">
      <!-- Physical Details -->
      <div class="bg-card border border-border rounded-2xl overflow-hidden">
        <div class="p-6 pb-3">
          <h3 class="text-xl font-bold">Member Physical Details</h3>
          <p class="text-sm text-muted-foreground mt-1">Enter height, weight, and maternity details for each member.</p>
        </div>
        <div class="px-6 pb-6 space-y-4">
          @for (m of members; track m.id) {
            <div class="rounded-xl border border-border p-4 space-y-3">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-foreground">{{ m.memberName }}</p>
                  <p class="text-xs text-muted-foreground">{{ m.memberType }} · {{ m.gender }} · {{ m.classSelection }}</p>
                </div>
              </div>
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label class="text-xs font-medium">Height (cm) *</label>
                  <input [ngModel]="m.heightCm" (ngModelChange)="updateMember(m.id, { heightCm: $event })"
                    class="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm mt-1" placeholder="e.g. 170" />
                  @if (errors['height_' + m.id]) {
                    <p class="text-xs text-red-500 mt-1">{{ errors['height_' + m.id] }}</p>
                  }
                </div>
                <div>
                  <label class="text-xs font-medium">Weight (kg) *</label>
                  <input [ngModel]="m.weightKg" (ngModelChange)="updateMember(m.id, { weightKg: $event })"
                    class="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm mt-1" placeholder="e.g. 70" />
                  @if (errors['weight_' + m.id]) {
                    <p class="text-xs text-red-500 mt-1">{{ errors['weight_' + m.id] }}</p>
                  }
                </div>
                @if (m.heightCm && m.weightKg && +m.heightCm > 0 && +m.weightKg > 0) {
                  <div class="col-span-2 sm:col-span-2 flex items-end">
                    <span class="text-xs px-2.5 py-1 rounded-full border border-border">
                      BMI: {{ (+m.weightKg / ((+m.heightCm / 100) * (+m.heightCm / 100))).toFixed(1) }}
                    </span>
                  </div>
                }
              </div>

              @if (m.gender === 'Female') {
                <div class="border-t border-border pt-3 space-y-3">
                  <div class="flex items-center gap-4">
                    <label class="text-xs font-medium">Is the member currently pregnant?</label>
                    <div class="flex gap-3">
                      <label class="flex items-center gap-1.5 text-xs">
                        <input type="radio" [name]="'preg-' + m.id" [value]="true" [checked]="m.isPregnant === true"
                          (change)="updateMember(m.id, { isPregnant: true })" /> Yes
                      </label>
                      <label class="flex items-center gap-1.5 text-xs">
                        <input type="radio" [name]="'preg-' + m.id" [value]="false" [checked]="m.isPregnant !== true"
                          (change)="updateMember(m.id, { isPregnant: false, expectedDeliveryDate: '', maternityDays: '' })" /> No
                      </label>
                    </div>
                  </div>
                  @if (m.isPregnant) {
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label class="text-xs font-medium">Expected Delivery Date *</label>
                        <input type="date" [ngModel]="m.expectedDeliveryDate" (ngModelChange)="updateMember(m.id, { expectedDeliveryDate: $event })"
                          class="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm mt-1" />
                        @if (errors['edd_' + m.id]) {
                          <p class="text-xs text-red-500 mt-1">{{ errors['edd_' + m.id] }}</p>
                        }
                      </div>
                      <div>
                        <label class="text-xs font-medium">Maternity Leave Days</label>
                        <input [ngModel]="m.maternityDays" (ngModelChange)="updateMember(m.id, { maternityDays: $event })"
                          class="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm mt-1" placeholder="e.g. 90" />
                      </div>
                    </div>
                  }
                </div>
              }
            </div>
          }
        </div>
      </div>

      <!-- Health Declaration -->
      <div class="bg-card border border-border rounded-2xl overflow-hidden">
        <div class="p-6 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 class="text-xl font-bold">Health Declaration</h3>
            <p class="text-sm text-muted-foreground mt-1">Declare health status for each member per CCHI standards.</p>
          </div>
          <button (click)="declareAllNo()" class="self-start sm:self-auto px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-muted transition-colors">
            Declare All "No"
          </button>
        </div>
        <div class="px-6 pb-6 space-y-3">
          @for (m of members; track m.id) {
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl border border-border p-3 hover:bg-muted/50 transition-colors">
              <div>
                <p class="text-sm font-medium text-foreground">{{ m.memberName }}</p>
                <p class="text-xs text-muted-foreground">{{ m.memberType }} · {{ m.classSelection }}</p>
              </div>
              <div class="flex items-center gap-2 self-end sm:self-auto">
                @if (m.healthDeclaration) {
                  <span class="text-xs px-2 py-0.5 rounded-full"
                    [class]="m.healthDeclaration === 'No' ? 'bg-secondary text-secondary-foreground' : 'border border-primary text-primary'">
                    {{ m.healthDeclaration === 'No' ? 'Healthy' : 'Declared' }}
                  </span>
                }
                <div class="flex gap-1.5">
                  <button (click)="toggleDeclaration(m.id, 'No')"
                    class="h-7 px-2.5 text-xs rounded-lg transition-colors"
                    [class]="m.healthDeclaration === 'No' ? 'bg-primary text-primary-foreground' : 'border border-border hover:bg-muted'">No</button>
                  <button (click)="toggleDeclaration(m.id, 'Yes')"
                    class="h-7 px-2.5 text-xs rounded-lg transition-colors"
                    [class]="m.healthDeclaration === 'Yes' ? 'bg-primary text-primary-foreground' : 'border border-border hover:bg-muted'">Yes</button>
                </div>
              </div>
            </div>
          }
        </div>
      </div>

      <!-- Health Questions for selected member -->
      @if (selectedMember && selectedMember.healthDeclaration === 'Yes') {
        <div class="bg-primary/5 border border-primary/20 rounded-2xl overflow-hidden">
          <div class="p-6 pb-3">
            <h3 class="text-lg font-bold">Health Questions — {{ selectedMember.memberName }}</h3>
          </div>
          <div class="px-6 pb-6 space-y-4">
            @for (q of healthQuestions; track q; let i = $index) {
              <div class="space-y-2">
                <p class="text-sm text-foreground font-medium">{{ i + 1 }}. {{ q }}</p>
                <div class="flex gap-4">
                  <label class="flex items-center gap-1.5 text-sm">
                    <input type="radio" [name]="'hq-' + i" [checked]="selectedMember.healthAnswers?.[i] === true"
                      (change)="answerChange(selectedMember.id, i, true)" /> Yes
                  </label>
                  <label class="flex items-center gap-1.5 text-sm">
                    <input type="radio" [name]="'hq-' + i" [checked]="selectedMember.healthAnswers?.[i] !== true"
                      (change)="answerChange(selectedMember.id, i, false)" /> No
                  </label>
                </div>
              </div>
            }
          </div>
        </div>
      }

      <!-- Other declared members links -->
      @if (otherDeclaredMembers.length > 0) {
        <div class="flex flex-wrap gap-2">
          <span class="text-xs text-muted-foreground self-center">View questions for:</span>
          @for (m of otherDeclaredMembers; track m.id) {
            <button (click)="selectedMemberId = m.id" class="h-7 px-3 text-xs border border-border rounded-lg hover:bg-muted transition-colors">
              {{ m.memberName }}
            </button>
          }
        </div>
      }

      <!-- Navigation -->
      <div class="hidden sm:flex justify-between">
        <button (click)="back.emit()" class="px-6 py-2.5 border border-border rounded-lg hover:bg-muted transition-colors">Back</button>
        <button (click)="handleNext()" [disabled]="!allDeclared"
          class="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50">
          {{ allDeclared ? 'Generate Quotation' : 'Complete all declarations' }}
        </button>
      </div>

      <div class="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 backdrop-blur-md p-3 flex gap-3 sm:hidden">
        <button (click)="back.emit()" class="flex-1 px-4 py-2.5 border border-border rounded-lg">Back</button>
        <button (click)="handleNext()" [disabled]="!allDeclared"
          class="flex-1 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg disabled:opacity-50 text-xs">
          {{ allDeclared ? 'Generate Quotation' : 'Complete declarations' }}
        </button>
      </div>
    </div>
  `,
})
export class HealthDeclarationStepComponent {
  @Input() members: Member[] = [];
  @Output() membersChange = new EventEmitter<Member[]>();
  @Output() next = new EventEmitter<void>();
  @Output() back = new EventEmitter<void>();

  healthQuestions = HEALTH_QUESTIONS;
  selectedMemberId: string | null = null;
  errors: Record<string, string> = {};

  get allDeclared(): boolean {
    return this.members.every(m => m.healthDeclaration === 'Yes' || m.healthDeclaration === 'No');
  }

  get selectedMember(): Member | undefined {
    return this.members.find(m => m.id === this.selectedMemberId);
  }

  get otherDeclaredMembers(): Member[] {
    return this.members.filter(m => m.healthDeclaration === 'Yes' && m.id !== this.selectedMemberId);
  }

  updateMember(id: string, patch: Partial<Member>): void {
    this.membersChange.emit(this.members.map(m => m.id === id ? { ...m, ...patch } : m));
  }

  declareAllNo(): void {
    this.membersChange.emit(this.members.map(m => ({ ...m, healthDeclaration: 'No' as const, healthAnswers: undefined })));
  }

  toggleDeclaration(id: string, value: 'Yes' | 'No'): void {
    this.membersChange.emit(
      this.members.map(m => m.id === id
        ? { ...m, healthDeclaration: value, healthAnswers: value === 'Yes' ? new Array(5).fill(false) : undefined }
        : m
      )
    );
    if (value === 'Yes') this.selectedMemberId = id;
    else if (this.selectedMemberId === id) this.selectedMemberId = null;
  }

  answerChange(memberId: string, qIndex: number, answer: boolean): void {
    this.membersChange.emit(
      this.members.map(m => {
        if (m.id !== memberId) return m;
        const answers = [...(m.healthAnswers || new Array(5).fill(false))];
        answers[qIndex] = answer;
        return { ...m, healthAnswers: answers };
      })
    );
  }

  handleNext(): void {
    if (!this.allDeclared) return;
    if (!this.validatePhysical()) return;
    this.next.emit();
  }

  private validatePhysical(): boolean {
    const e: Record<string, string> = {};
    this.members.forEach(m => {
      if (!m.heightCm?.trim()) e[`height_${m.id}`] = 'Required';
      else if (isNaN(+m.heightCm) || +m.heightCm < 30 || +m.heightCm > 250) e[`height_${m.id}`] = 'Enter valid height (30-250 cm)';
      if (!m.weightKg?.trim()) e[`weight_${m.id}`] = 'Required';
      else if (isNaN(+m.weightKg) || +m.weightKg < 2 || +m.weightKg > 300) e[`weight_${m.id}`] = 'Enter valid weight (2-300 kg)';
      if (m.gender === 'Female' && m.isPregnant && !m.expectedDeliveryDate?.trim()) e[`edd_${m.id}`] = 'Expected delivery date required';
    });
    this.errors = e;
    return Object.keys(e).length === 0;
  }
}
