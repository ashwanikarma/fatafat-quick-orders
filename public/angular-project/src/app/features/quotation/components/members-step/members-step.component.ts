import { Component, EventEmitter, Input, Output, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Member, MemberType, ClassSelection, Gender, MaritalStatus } from '../../../../core/models/quotation.model';

const CLASS_OPTIONS: ClassSelection[] = ['VIP', 'A', 'B', 'C', 'LM'];

@Component({
  selector: 'app-members-step',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6 pb-20 sm:pb-0">
      <!-- Members Card -->
      <div class="bg-card border border-border rounded-2xl overflow-hidden">
        <div class="p-6 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h3 class="text-xl font-bold">Members</h3>
          <div class="flex flex-wrap gap-2">
            <button (click)="downloadTemplate()" class="flex items-center gap-1.5 px-3 py-1.5 text-sm hover:bg-muted rounded-lg transition-colors">
              <span class="material-icons text-sm">download</span> <span class="hidden xs:inline">Template</span>
            </button>
            <label for="excel-upload" class="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-border rounded-lg cursor-pointer hover:bg-muted transition-colors">
              <span class="material-icons text-sm">upload</span> Upload
            </label>
            <input id="excel-upload" type="file" accept=".xlsx,.xls" class="hidden" (change)="onExcelUpload($event)" />
            <button (click)="openAdd()" class="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
              <span class="material-icons text-sm">add</span> Add
            </button>
          </div>
        </div>
        <div class="px-6 pb-6">
          @if (uploadErrors.length > 0) {
            <div class="mb-4 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-600 space-y-1">
              <p class="font-semibold">Upload Errors:</p>
              @for (err of uploadErrors; track err) {
                <p>• {{ err }}</p>
              }
            </div>
          }

          @if (members.length === 0) {
            <div class="text-center py-12 text-muted-foreground">
              <p class="text-sm">No members added yet. Click "Add" or upload an Excel file.</p>
              <p class="text-xs mt-2">Excel columns: MemberType, MemberName, IdentityNumber, DateOfBirth, Gender, MaritalStatus, Class, SponsorNumber</p>
            </div>
          } @else {
            <div class="overflow-auto max-h-[420px]">
              <table class="w-full text-sm">
                <thead class="sticky top-0 bg-card z-10">
                  <tr class="border-b border-border text-left">
                    <th class="py-2.5 px-3 font-semibold text-muted-foreground">Name</th>
                    <th class="py-2.5 px-3 font-semibold text-muted-foreground">Type</th>
                    <th class="py-2.5 px-3 font-semibold text-muted-foreground hidden sm:table-cell">Sponsor #</th>
                    <th class="py-2.5 px-3 font-semibold text-muted-foreground">Class</th>
                    <th class="py-2.5 px-3 font-semibold text-muted-foreground hidden md:table-cell">Marital</th>
                    <th class="py-2.5 px-3 font-semibold text-muted-foreground text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  @for (m of members; track m.id) {
                    <tr class="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                      <td class="py-2.5 px-3 font-medium text-foreground">{{ m.memberName }}</td>
                      <td class="py-2.5 px-3">
                        <span class="text-xs px-2 py-0.5 rounded-full border" [class.border-primary/30]="m.memberType === 'Employee'" [class.text-primary]="m.memberType === 'Employee'">
                          {{ m.memberType }}
                        </span>
                      </td>
                      <td class="py-2.5 px-3 text-muted-foreground hidden sm:table-cell">{{ m.sponsorNumber }}</td>
                      <td class="py-2.5 px-3"><span class="text-xs px-2 py-0.5 rounded-full bg-secondary">{{ m.classSelection }}</span></td>
                      <td class="py-2.5 px-3 text-muted-foreground hidden md:table-cell">{{ m.maritalStatus }}</td>
                      <td class="py-2.5 px-3 text-right">
                        <button (click)="openEdit(m)" class="p-1.5 rounded hover:bg-muted"><span class="material-icons text-sm">edit</span></button>
                        <button (click)="deleteMember(m.id)" class="p-1.5 rounded hover:bg-red-50 text-red-500"><span class="material-icons text-sm">delete</span></button>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
          <p class="text-xs text-muted-foreground mt-3">{{ members.length }} member(s) added</p>
        </div>
      </div>

      <!-- Navigation -->
      <div class="hidden sm:flex justify-between">
        <button (click)="back.emit()" class="px-6 py-2.5 border border-border rounded-lg hover:bg-muted transition-colors">Back</button>
        <button (click)="goNext()" [disabled]="members.length === 0"
          class="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50">Continue</button>
      </div>

      <!-- Mobile Bottom Bar -->
      <div class="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 backdrop-blur-md p-3 flex gap-3 sm:hidden">
        <button (click)="back.emit()" class="flex-1 px-4 py-2.5 border border-border rounded-lg">Back</button>
        <button (click)="goNext()" [disabled]="members.length === 0"
          class="flex-1 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg disabled:opacity-50">Continue</button>
      </div>

      <!-- Add/Edit Dialog Overlay -->
      @if (dialogOpen) {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50" (click)="dialogOpen = false">
          <div class="bg-card rounded-2xl border border-border shadow-xl w-full max-w-md mx-4 p-6" (click)="$event.stopPropagation()">
            <h3 class="text-lg font-bold mb-4">{{ editingId ? 'Edit' : 'Add' }} Member</h3>
            <div class="space-y-4">
              <!-- Member Type -->
              <div class="space-y-1.5">
                <label class="text-sm font-medium">Member Type</label>
                <select [(ngModel)]="form.memberType" (ngModelChange)="form.employeeId = undefined"
                  class="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm">
                  <option value="Employee">Employee</option>
                  <option value="Dependent">Dependent</option>
                </select>
              </div>

              @if (form.memberType === 'Dependent') {
                <div class="space-y-1.5">
                  <label class="text-sm font-medium">Select Employee *</label>
                  <select [(ngModel)]="form.employeeId"
                    class="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm">
                    <option value="">Choose employee</option>
                    @for (emp of employees(); track emp.id) {
                      <option [value]="emp.id">{{ emp.memberName }} ({{ emp.identityNumber }})</option>
                    }
                  </select>
                  @if (employees().length === 0) {
                    <p class="text-xs text-red-500">Add an employee first.</p>
                  }
                </div>
              }

              <div class="space-y-1.5">
                <label class="text-sm font-medium">Member Name *</label>
                <input [(ngModel)]="form.memberName" class="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm" />
              </div>

              <div class="space-y-1.5">
                <label class="text-sm font-medium">Identity Number *</label>
                <input [(ngModel)]="form.identityNumber" class="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm" />
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div class="space-y-1.5">
                  <label class="text-sm font-medium">Date of Birth *</label>
                  <input type="date" [(ngModel)]="form.dateOfBirth" class="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm" />
                </div>
                <div class="space-y-1.5">
                  <label class="text-sm font-medium">Gender</label>
                  <select [(ngModel)]="form.gender" class="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm">
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div class="space-y-1.5">
                  <label class="text-sm font-medium">Marital Status</label>
                  <select [(ngModel)]="form.maritalStatus" class="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm">
                    <option value="Single">Single</option>
                    <option value="Married">Married</option>
                  </select>
                </div>
                <div class="space-y-1.5">
                  <label class="text-sm font-medium">Class *</label>
                  <select [(ngModel)]="form.classSelection" class="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm">
                    @for (c of classOptions; track c) {
                      <option [value]="c">{{ c }}</option>
                    }
                  </select>
                </div>
              </div>

              @if (formError) {
                <p class="text-sm text-red-500">{{ formError }}</p>
              }
            </div>

            <div class="flex justify-end gap-3 mt-6">
              <button (click)="dialogOpen = false" class="px-4 py-2 border border-border rounded-lg hover:bg-muted text-sm">Cancel</button>
              <button (click)="saveMember()" class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 text-sm">
                {{ editingId ? 'Update' : 'Add' }}
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class MembersStepComponent {
  @Input() members: Member[] = [];
  @Input() sponsorNumber = '';
  @Output() membersChange = new EventEmitter<Member[]>();
  @Output() next = new EventEmitter<void>();
  @Output() back = new EventEmitter<void>();

  classOptions = CLASS_OPTIONS;
  dialogOpen = false;
  editingId: string | null = null;
  formError = '';
  uploadErrors: string[] = [];

  form: Omit<Member, 'id'> = this.emptyMember();

  employees = computed(() => {
    const membersSignal = signal(this.members);
    return membersSignal().filter(m => m.memberType === 'Employee');
  });

  private emptyMember(): Omit<Member, 'id'> {
    return {
      memberType: 'Employee', memberName: '', identityNumber: '',
      dateOfBirth: '', gender: 'Male', maritalStatus: 'Single',
      classSelection: 'B', sponsorNumber: this.sponsorNumber,
    };
  }

  openAdd(): void {
    this.form = this.emptyMember();
    this.editingId = null;
    this.formError = '';
    this.dialogOpen = true;
  }

  openEdit(member: Member): void {
    const { id, ...rest } = member;
    this.form = { ...rest };
    this.editingId = id;
    this.formError = '';
    this.dialogOpen = true;
  }

  deleteMember(id: string): void {
    const member = this.members.find(m => m.id === id);
    if (member?.memberType === 'Employee') {
      this.membersChange.emit(this.members.filter(m => m.id !== id && m.employeeId !== id));
    } else {
      this.membersChange.emit(this.members.filter(m => m.id !== id));
    }
  }

  saveMember(): void {
    const err = this.validate();
    if (err) { this.formError = err; return; }

    const finalSponsor = this.form.memberType === 'Employee'
      ? this.sponsorNumber
      : this.members.find(m => m.id === this.form.employeeId)?.identityNumber || this.sponsorNumber;

    if (this.editingId) {
      this.membersChange.emit(
        this.members.map(m => m.id === this.editingId
          ? { ...this.form, id: this.editingId!, sponsorNumber: finalSponsor }
          : m
        )
      );
    } else {
      this.membersChange.emit([
        ...this.members,
        { ...this.form, id: crypto.randomUUID(), sponsorNumber: finalSponsor },
      ]);
    }
    this.dialogOpen = false;
  }

  private validate(): string {
    if (!this.form.memberName.trim()) return 'Member Name is required.';
    if (!this.form.identityNumber.trim()) return 'Identity Number is required.';
    if (!this.form.dateOfBirth) return 'Date of Birth is required.';
    if (this.form.memberType === 'Dependent' && !this.form.employeeId) return 'Please select the Employee for this dependent.';
    return '';
  }

  goNext(): void {
    if (this.members.length > 0) this.next.emit();
  }

  downloadTemplate(): void {
    // In real app, use xlsx library
    alert('Template download — integrate xlsx library for production');
  }

  onExcelUpload(event: Event): void {
    // In real app, parse using xlsx library
    alert('Excel upload — integrate xlsx library for production');
  }
}
