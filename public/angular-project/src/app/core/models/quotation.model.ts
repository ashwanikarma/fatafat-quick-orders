// ─── Quotation & Policy Models ─────────────────────────

export interface SponsorData {
  sponsorNumber: string;
  policyEffectiveDate: string | null;
  sponsorName?: string;
  sponsorStatus?: string;
}

export type MemberType = 'Employee' | 'Dependent';
export type ClassSelection = 'VIP' | 'A' | 'B' | 'C' | 'LM';
export type MaritalStatus = 'Single' | 'Married';
export type Gender = 'Male' | 'Female';

export interface Member {
  id: string;
  memberType: MemberType;
  memberName: string;
  identityNumber: string;
  dateOfBirth: string;
  gender: Gender;
  maritalStatus: MaritalStatus;
  classSelection: ClassSelection;
  sponsorNumber: string;
  employeeId?: string;
  healthDeclaration?: 'Yes' | 'No';
  healthAnswers?: boolean[];
  heightCm?: string;
  weightKg?: string;
  isPregnant?: boolean;
  expectedDeliveryDate?: string;
  maternityDays?: string;
}

// ─── KYC Types ─────────────────────────────────────────

export interface NationalAddress {
  buildingNumber: string;
  additionalNumber: string;
  unitNumber: string;
  postalCode: string;
  street: string;
  district: string;
  city: string;
}

export type BusinessType = 'LLC' | 'Sole Proprietorship' | 'Partnership' | 'Corporation';
export type RevenueRange = '< 1 Million' | '1M – 10M' | '10M – 50M' | '50M+';
export type EmployeeRange = '1–10' | '11–50' | '51–100' | '100+';

export interface BusinessDetails {
  businessType: BusinessType | '';
  companyRevenue: RevenueRange | '';
  numberOfEmployees: EmployeeRange | '';
  taxRegistrationNumber: string;
  ibanNumber: string;
  bankName: string;
}

export interface BoardMember {
  id: string;
  name: string;
  identityNumber: string;
  address: string;
}

export interface Shareholder {
  id: string;
  name: string;
  address: string;
  contributionPercent: string;
}

export interface ComplianceData {
  isPEP: boolean | null;
  isBoardMember: boolean | null;
  boardMembers: BoardMember[];
  hasMajorShareholder: boolean | null;
  shareholders: Shareholder[];
  termsAccepted: boolean;
}

export interface KYCData {
  nationalAddress: NationalAddress;
  businessDetails: BusinessDetails;
  compliance: ComplianceData;
  completed: boolean;
}

// ─── Quotation Record ──────────────────────────────────

export interface QuotationRecord {
  id: string;
  userId: string;
  status: string;
  currentStep: number;
  sponsorData: SponsorData;
  members: Member[];
  kycData: KYCData;
  totalPremium: number;
  quotationId: string | null;
  policyNumber: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Premium Calculation ───────────────────────────────

export const CLASS_PREMIUMS: Record<string, number> = {
  VIP: 12000,
  A: 8500,
  B: 6000,
  C: 4500,
  LM: 3000,
};

export function calculatePremium(members: { classSelection: string; healthDeclaration?: string }[]): number[] {
  return members.map((m) => {
    let base = CLASS_PREMIUMS[m.classSelection] || 4500;
    if (m.healthDeclaration === 'Yes') base *= 1.15;
    return Math.round(base);
  });
}

// ─── Class Benefits ────────────────────────────────────

export interface ClassBenefit {
  coverage: string;
  hospitals: string;
  maternity: string;
  dental: string;
  optical: string;
  exclusions: string[];
}

export const CLASS_BENEFITS: Record<ClassSelection, ClassBenefit> = {
  VIP: {
    coverage: 'SAR 500,000',
    hospitals: 'All network hospitals including international affiliates',
    maternity: 'Full coverage including complications',
    dental: 'SAR 5,000 annual limit',
    optical: 'SAR 3,000 annual limit',
    exclusions: ['Cosmetic surgery', 'Experimental treatments'],
  },
  A: {
    coverage: 'SAR 250,000',
    hospitals: 'All network hospitals (200+ facilities)',
    maternity: 'SAR 30,000 per event',
    dental: 'SAR 3,500 annual limit',
    optical: 'SAR 2,000 annual limit',
    exclusions: ['Cosmetic surgery', 'Experimental treatments', 'Non-emergency international care'],
  },
  B: {
    coverage: 'SAR 150,000',
    hospitals: 'Network hospitals (150+ facilities)',
    maternity: 'SAR 20,000 per event',
    dental: 'SAR 2,500 annual limit',
    optical: 'SAR 1,500 annual limit',
    exclusions: ['Cosmetic surgery', 'Experimental treatments', 'International care', 'Alternative medicine'],
  },
  C: {
    coverage: 'SAR 100,000',
    hospitals: 'Network hospitals (100+ facilities)',
    maternity: 'SAR 10,000 per event',
    dental: 'SAR 1,500 annual limit',
    optical: 'SAR 800 annual limit',
    exclusions: ['Cosmetic surgery', 'Experimental treatments', 'International care', 'Alternative medicine', 'Psychiatric care beyond 30 days'],
  },
  LM: {
    coverage: 'SAR 50,000 (CCHI minimum)',
    hospitals: 'Government & select private hospitals',
    maternity: 'Emergency only',
    dental: 'Emergency extraction only',
    optical: 'Not covered',
    exclusions: ['Cosmetic surgery', 'Experimental treatments', 'International care', 'Alternative medicine', 'Elective procedures', 'Pre-existing (12-month wait)'],
  },
};

// ─── IBAN Bank Mapping ─────────────────────────────────

export const BANK_MAP: Record<string, string> = {
  '10': 'National Commercial Bank (NCB)',
  '15': 'Al Rajhi Bank',
  '20': 'Riyad Bank',
  '45': 'Saudi British Bank (SABB)',
  '55': 'Banque Saudi Fransi',
  '60': 'Bank AlJazira',
  '65': 'Saudi Investment Bank',
  '80': 'Arab National Bank',
  '05': 'Alinma Bank',
  '30': 'Arab Banking Corporation (ABC)',
  '40': 'Saudi Awwal Bank (SAB)',
  '50': 'Gulf International Bank',
  '76': 'Bank AlBilad',
};

// ─── Health Questions ──────────────────────────────────

export const HEALTH_QUESTIONS: string[] = [
  'Do you suffer from chronic diseases (e.g., diabetes, hypertension, asthma)?',
  'Have you had any surgery in the past 2 years?',
  'Are you currently on long-term medication?',
  'Have you been hospitalized in the last 12 months?',
  'Do you have any diagnosed medical conditions not listed above?',
];

// ─── Deletion Reasons ──────────────────────────────────

export const DELETION_REASONS: string[] = [
  'Member left company',
  'Duplicate member',
  'Incorrect entry',
  'Policy downgrade',
  'Other',
];

// ─── Class Options ─────────────────────────────────────

export const CLASS_OPTIONS: ClassSelection[] = ['VIP', 'A', 'B', 'C', 'LM'];
