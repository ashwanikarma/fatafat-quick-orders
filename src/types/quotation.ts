export interface SponsorData {
  sponsorNumber: string;
  policyEffectiveDate: Date | undefined;
  sponsorName?: string;
  sponsorStatus?: string;
}

export type MemberType = "Employee" | "Dependent";
export type ClassSelection = "VIP" | "A" | "B" | "C" | "LM";
export type MaritalStatus = "Single" | "Married";
export type Gender = "Male" | "Female";

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
  healthDeclaration?: "Yes" | "No";
  healthAnswers?: boolean[];
}

export interface QuotationSummary {
  members: Member[];
  sponsorData: SponsorData;
  totalPremium: number;
  memberPremiums: { memberId: string; premium: number }[];
  quotationId: string;
  generatedAt: string;
}

// KYC Types
export interface NationalAddress {
  buildingNumber: string;
  additionalNumber: string;
  unitNumber: string;
  postalCode: string;
  street: string;
  district: string;
  city: string;
}

export type BusinessType = "LLC" | "Sole Proprietorship" | "Partnership" | "Corporation";
export type RevenueRange = "< 1 Million" | "1M – 10M" | "10M – 50M" | "50M+";
export type EmployeeRange = "1–10" | "11–50" | "51–100" | "100+";

export interface BusinessDetails {
  businessType: BusinessType | "";
  companyRevenue: RevenueRange | "";
  numberOfEmployees: EmployeeRange | "";
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
