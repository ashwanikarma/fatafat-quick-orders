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
  employeeId?: string; // For dependents, the employee they belong to
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
