import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  KYCData, NationalAddress, BusinessDetails, ComplianceData,
  BusinessType, RevenueRange, EmployeeRange, BoardMember, Shareholder,
} from '../../../../core/models/quotation.model';
import { ToastService } from '../../../../core/services/toast.service';

const BANK_MAP: Record<string, string> = {
  '10': 'National Commercial Bank (NCB)', '15': 'Al Rajhi Bank', '20': 'Riyad Bank',
  '45': 'Saudi British Bank (SABB)', '55': 'Banque Saudi Fransi', '60': 'Bank AlJazira',
  '65': 'Saudi Investment Bank', '80': 'Arab National Bank', '05': 'Alinma Bank',
  '30': 'Arab Banking Corporation (ABC)', '40': 'Saudi Awwal Bank (SAB)',
  '50': 'Gulf International Bank', '76': 'Bank AlBilad',
};

@Component({
  selector: 'app-kyc-step',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6 pb-20 sm:pb-0">
      <!-- National Address -->
      <div class="bg-card border border-border rounded-2xl overflow-hidden">
        <div class="p-6 pb-3 flex items-center gap-2">
          <span class="material-icons text-primary">location_on</span>
          <h3 class="text-lg font-bold">National Address</h3>
        </div>
        <div class="px-6 pb-6 space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            @for (field of addressFields; track field.key) {
              <div>
                <label class="text-sm font-medium">{{ field.label }} *</label>
                <input [ngModel]="getAddrField(field.key)" (ngModelChange)="setAddr(field.key, $event)"
                  [placeholder]="field.placeholder"
                  class="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm mt-1" />
                @if (errors[field.key]) {
                  <p class="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <span class="material-icons text-xs">error</span> {{ errors[field.key] }}
                  </p>
                }
              </div>
            }
          </div>
        </div>
      </div>

      <!-- Business Details -->
      <div class="bg-card border border-border rounded-2xl overflow-hidden">
        <div class="p-6 pb-3 flex items-center gap-2">
          <span class="material-icons text-primary">business</span>
          <h3 class="text-lg font-bold">Business Details</h3>
        </div>
        <div class="px-6 pb-6 space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label class="text-sm font-medium">Business Type *</label>
              <select [ngModel]="kycData.businessDetails.businessType" (ngModelChange)="setBiz('businessType', $event)"
                class="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm mt-1">
                <option value="">Select type</option>
                <option value="LLC">LLC</option>
                <option value="Sole Proprietorship">Sole Proprietorship</option>
                <option value="Partnership">Partnership</option>
                <option value="Corporation">Corporation</option>
              </select>
              @if (errors['businessType']) { <p class="text-xs text-red-500 mt-1">{{ errors['businessType'] }}</p> }
            </div>
            <div>
              <label class="text-sm font-medium">Company Revenue *</label>
              <select [ngModel]="kycData.businessDetails.companyRevenue" (ngModelChange)="setBiz('companyRevenue', $event)"
                class="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm mt-1">
                <option value="">Select range</option>
                <option value="< 1 Million">&lt; 1 Million</option>
                <option value="1M – 10M">1M – 10M</option>
                <option value="10M – 50M">10M – 50M</option>
                <option value="50M+">50M+</option>
              </select>
              @if (errors['companyRevenue']) { <p class="text-xs text-red-500 mt-1">{{ errors['companyRevenue'] }}</p> }
            </div>
            <div>
              <label class="text-sm font-medium">Number of Employees *</label>
              <select [ngModel]="kycData.businessDetails.numberOfEmployees" (ngModelChange)="setBiz('numberOfEmployees', $event)"
                class="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm mt-1">
                <option value="">Select range</option>
                <option value="1–10">1–10</option>
                <option value="11–50">11–50</option>
                <option value="51–100">51–100</option>
                <option value="100+">100+</option>
              </select>
              @if (errors['numberOfEmployees']) { <p class="text-xs text-red-500 mt-1">{{ errors['numberOfEmployees'] }}</p> }
            </div>
          </div>
          <div>
            <label class="text-sm font-medium">Tax Registration Number (TRN) *</label>
            <input [ngModel]="kycData.businessDetails.taxRegistrationNumber"
              (ngModelChange)="setBiz('taxRegistrationNumber', $event.replace(/\\D/g, '').slice(0, 15))"
              placeholder="3XXXXXXXXXXXXX3" maxlength="15"
              class="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm mt-1" />
            <p class="text-xs text-muted-foreground mt-1">15 digits, must start and end with 3</p>
            @if (errors['taxRegistrationNumber']) { <p class="text-xs text-red-500 mt-1">{{ errors['taxRegistrationNumber'] }}</p> }
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="text-sm font-medium">IBAN Number *</label>
              <input [ngModel]="kycData.businessDetails.ibanNumber" (ngModelChange)="handleIbanChange($event)"
                placeholder="SA0000000000000000000000" maxlength="24"
                class="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm mt-1" />
              <p class="text-xs text-muted-foreground mt-1">24 characters, starts with SA</p>
              @if (errors['ibanNumber']) { <p class="text-xs text-red-500 mt-1">{{ errors['ibanNumber'] }}</p> }
            </div>
            <div>
              <label class="text-sm font-medium">Bank Name</label>
              <input [ngModel]="kycData.businessDetails.bankName" readonly
                placeholder="Auto-detected from IBAN"
                class="w-full px-3 py-2 border border-border rounded-lg bg-muted text-sm mt-1" />
              @if (errors['bankName']) { <p class="text-xs text-red-500 mt-1">{{ errors['bankName'] }}</p> }
            </div>
          </div>
        </div>
      </div>

      <!-- Compliance -->
      <div class="bg-card border border-border rounded-2xl overflow-hidden">
        <div class="p-6 pb-3 flex items-center gap-2">
          <span class="material-icons text-primary">fact_check</span>
          <h3 class="text-lg font-bold">Compliance Questions</h3>
        </div>
        <div class="px-6 pb-6 space-y-6">
          <!-- PEP -->
          <div>
            <label class="text-sm font-medium">Are you a Politically Exposed Person (PEP)? *</label>
            <div class="flex gap-4 mt-2">
              <label class="flex items-center gap-2"><input type="radio" name="pep" [checked]="kycData.compliance.isPEP === true" (change)="setComp('isPEP', true)" /> Yes</label>
              <label class="flex items-center gap-2"><input type="radio" name="pep" [checked]="kycData.compliance.isPEP === false" (change)="setComp('isPEP', false)" /> No</label>
            </div>
            @if (errors['isPEP']) { <p class="text-xs text-red-500 mt-1">{{ errors['isPEP'] }}</p> }
          </div>

          <hr class="border-border" />

          <!-- Board Member -->
          <div>
            <label class="text-sm font-medium">Are you a Board Member or Executive Officer in a listed company? *</label>
            <div class="flex gap-4 mt-2">
              <label class="flex items-center gap-2"><input type="radio" name="bm" [checked]="kycData.compliance.isBoardMember === true" (change)="setComp('isBoardMember', true)" /> Yes</label>
              <label class="flex items-center gap-2"><input type="radio" name="bm" [checked]="kycData.compliance.isBoardMember === false" (change)="setComp('isBoardMember', false); kycData.compliance.boardMembers = []" /> No</label>
            </div>
            @if (errors['isBoardMember']) { <p class="text-xs text-red-500 mt-1">{{ errors['isBoardMember'] }}</p> }
            @if (kycData.compliance.isBoardMember) {
              <div class="mt-4 space-y-3">
                @for (bm of kycData.compliance.boardMembers; track bm.id) {
                  <div class="flex gap-2 items-start p-3 rounded-lg border border-border bg-muted/30">
                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 flex-1">
                      <input [(ngModel)]="bm.name" placeholder="Name" class="px-3 py-2 border border-border rounded-lg bg-background text-sm" />
                      <input [(ngModel)]="bm.identityNumber" placeholder="ID Number" class="px-3 py-2 border border-border rounded-lg bg-background text-sm" />
                      <input [(ngModel)]="bm.address" placeholder="Address" class="px-3 py-2 border border-border rounded-lg bg-background text-sm" />
                    </div>
                    <button (click)="removeBoardMember(bm.id)" class="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                      <span class="material-icons text-sm">delete</span>
                    </button>
                  </div>
                }
                <button (click)="addBoardMember()" class="flex items-center gap-1 px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-muted transition-colors">
                  <span class="material-icons text-sm">add</span> Add Member
                </button>
                @if (errors['boardMembers']) { <p class="text-xs text-red-500 mt-1">{{ errors['boardMembers'] }}</p> }
              </div>
            }
          </div>

          <hr class="border-border" />

          <!-- Major Shareholder -->
          <div>
            <label class="text-sm font-medium">Is there any shareholder owning 25% or more of company shares? *</label>
            <div class="flex gap-4 mt-2">
              <label class="flex items-center gap-2"><input type="radio" name="sh" [checked]="kycData.compliance.hasMajorShareholder === true" (change)="setComp('hasMajorShareholder', true)" /> Yes</label>
              <label class="flex items-center gap-2"><input type="radio" name="sh" [checked]="kycData.compliance.hasMajorShareholder === false" (change)="setComp('hasMajorShareholder', false); kycData.compliance.shareholders = []" /> No</label>
            </div>
            @if (errors['hasMajorShareholder']) { <p class="text-xs text-red-500 mt-1">{{ errors['hasMajorShareholder'] }}</p> }
            @if (kycData.compliance.hasMajorShareholder) {
              <div class="mt-4 space-y-3">
                @for (sh of kycData.compliance.shareholders; track sh.id) {
                  <div class="flex gap-2 items-start p-3 rounded-lg border border-border bg-muted/30">
                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 flex-1">
                      <input [(ngModel)]="sh.name" placeholder="Name" class="px-3 py-2 border border-border rounded-lg bg-background text-sm" />
                      <input [(ngModel)]="sh.address" placeholder="Address" class="px-3 py-2 border border-border rounded-lg bg-background text-sm" />
                      <input [(ngModel)]="sh.contributionPercent" placeholder="Share %" class="px-3 py-2 border border-border rounded-lg bg-background text-sm" />
                    </div>
                    <button (click)="removeShareholder(sh.id)" class="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                      <span class="material-icons text-sm">delete</span>
                    </button>
                  </div>
                }
                <button (click)="addShareholder()" class="flex items-center gap-1 px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-muted transition-colors">
                  <span class="material-icons text-sm">add</span> Add Shareholder
                </button>
                @if (errors['shareholders']) { <p class="text-xs text-red-500 mt-1">{{ errors['shareholders'] }}</p> }
              </div>
            }
          </div>

          <hr class="border-border" />

          <!-- Terms -->
          <div>
            <label class="flex items-start gap-2">
              <input type="checkbox" [(ngModel)]="kycData.compliance.termsAccepted" class="mt-1" />
              <span class="text-sm">I accept the Terms and Conditions, Privacy Policy, and declare that all information provided is accurate.</span>
            </label>
            @if (errors['terms']) { <p class="text-xs text-red-500 mt-1">{{ errors['terms'] }}</p> }
          </div>
        </div>
      </div>

      <!-- Navigation -->
      <div class="hidden sm:flex justify-between">
        <button (click)="back.emit()" class="px-6 py-2.5 border border-border rounded-lg hover:bg-muted transition-colors">Back</button>
        <button (click)="handleSave()" class="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
          Save & Continue
        </button>
      </div>

      <div class="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 backdrop-blur-md p-3 flex gap-3 sm:hidden">
        <button (click)="back.emit()" class="flex-1 px-4 py-2.5 border border-border rounded-lg">Back</button>
        <button (click)="handleSave()" class="flex-1 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg">Save & Continue</button>
      </div>
    </div>
  `,
})
export class KycStepComponent {
  @Input() kycData!: KYCData;
  @Output() kycDataChange = new EventEmitter<KYCData>();
  @Output() next = new EventEmitter<void>();
  @Output() back = new EventEmitter<void>();

  errors: Record<string, string> = {};

  addressFields = [
    { key: 'buildingNumber', label: 'Building Number', placeholder: 'e.g. 1234' },
    { key: 'additionalNumber', label: 'Additional Number', placeholder: 'e.g. 5678' },
    { key: 'unitNumber', label: 'Unit Number', placeholder: 'e.g. 1' },
    { key: 'street', label: 'Street', placeholder: 'Street name' },
    { key: 'district', label: 'District', placeholder: 'District name' },
    { key: 'city', label: 'City', placeholder: 'e.g. Riyadh' },
    { key: 'postalCode', label: 'Postal Code', placeholder: 'e.g. 12345' },
  ];

  constructor(private toastService: ToastService) {}

  getAddrField(key: string): string {
    return (this.kycData.nationalAddress as any)[key] || '';
  }

  setAddr(key: string, value: string): void {
    const addr = { ...this.kycData.nationalAddress, [key]: value };
    this.kycDataChange.emit({ ...this.kycData, nationalAddress: addr });
  }

  setBiz(key: string, value: any): void {
    const biz = { ...this.kycData.businessDetails, [key]: value };
    this.kycDataChange.emit({ ...this.kycData, businessDetails: biz });
  }

  setComp(key: string, value: any): void {
    const comp = { ...this.kycData.compliance, [key]: value };
    this.kycDataChange.emit({ ...this.kycData, compliance: comp });
  }

  handleIbanChange(val: string): void {
    const upper = val.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 24);
    let bankName = '';
    if (upper.length >= 6) bankName = BANK_MAP[upper.substring(4, 6)] || '';
    this.setBiz('ibanNumber', upper);
    setTimeout(() => this.setBiz('bankName', bankName));
  }

  addBoardMember(): void {
    const members = [...this.kycData.compliance.boardMembers, { id: crypto.randomUUID(), name: '', identityNumber: '', address: '' }];
    this.setComp('boardMembers', members);
  }

  removeBoardMember(id: string): void {
    this.setComp('boardMembers', this.kycData.compliance.boardMembers.filter(m => m.id !== id));
  }

  addShareholder(): void {
    const shareholders = [...this.kycData.compliance.shareholders, { id: crypto.randomUUID(), name: '', address: '', contributionPercent: '' }];
    this.setComp('shareholders', shareholders);
  }

  removeShareholder(id: string): void {
    this.setComp('shareholders', this.kycData.compliance.shareholders.filter(s => s.id !== id));
  }

  handleSave(): void {
    if (!this.validate()) {
      this.toastService.show('Validation Error', 'Please fix all highlighted fields.', 'error');
      return;
    }
    this.kycDataChange.emit({ ...this.kycData, completed: true });
    this.toastService.show('KYC Saved', 'Your KYC data has been saved successfully.');
    this.next.emit();
  }

  private validate(): boolean {
    const e: Record<string, string> = {};
    const addr = this.kycData.nationalAddress;
    const biz = this.kycData.businessDetails;
    const comp = this.kycData.compliance;

    // Address
    for (const f of this.addressFields) {
      if (!(addr as any)[f.key]?.trim()) e[f.key] = 'Required';
    }
    // Business
    if (!biz.businessType) e['businessType'] = 'Required';
    if (!biz.companyRevenue) e['companyRevenue'] = 'Required';
    if (!biz.numberOfEmployees) e['numberOfEmployees'] = 'Required';
    if (!biz.taxRegistrationNumber.trim()) e['taxRegistrationNumber'] = 'Required';
    else if (biz.taxRegistrationNumber.length !== 15) e['taxRegistrationNumber'] = 'Must be 15 digits';
    else if (!biz.taxRegistrationNumber.startsWith('3') || !biz.taxRegistrationNumber.endsWith('3')) e['taxRegistrationNumber'] = 'Must start and end with 3';
    if (!biz.ibanNumber.trim()) e['ibanNumber'] = 'Required';
    else if (biz.ibanNumber.length !== 24) e['ibanNumber'] = 'Must be 24 characters';
    else if (!biz.ibanNumber.startsWith('SA')) e['ibanNumber'] = 'Must start with SA';
    if (!biz.bankName) e['bankName'] = 'Could not detect bank from IBAN';
    // Compliance
    if (comp.isPEP === null) e['isPEP'] = 'Required';
    if (comp.isBoardMember === null) e['isBoardMember'] = 'Required';
    if (comp.isBoardMember && comp.boardMembers.length === 0) e['boardMembers'] = 'Add at least one member';
    if (comp.hasMajorShareholder === null) e['hasMajorShareholder'] = 'Required';
    if (comp.hasMajorShareholder && comp.shareholders.length === 0) e['shareholders'] = 'Add at least one shareholder';
    if (!comp.termsAccepted) e['terms'] = 'You must accept Terms and Conditions';

    this.errors = e;
    return Object.keys(e).length === 0;
  }
}
