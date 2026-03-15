// ─── Generic API Response Models ───────────────────────

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: string[];
}

export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

export interface SponsorValidationResponse {
  sponsorName: string;
  sponsorStatus: string;
}

export interface DashboardSummary {
  totalQuotations: number;
  draftCount: number;
  completedCount: number;
  paidCount: number;
  totalPremium: number;
  recentQuotations: any[];
}
