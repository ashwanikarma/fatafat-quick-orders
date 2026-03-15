import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  QuotationRecord, SponsorData, Member, KYCData,
} from '../models/quotation.model';
import {
  ApiResponse, PaginatedResponse, SponsorValidationResponse,
  DashboardSummary,
} from '../models/api-response.model';

@Injectable({ providedIn: 'root' })
export class QuotationService {
  private readonly api = `${environment.apiUrl}/api/Quotation`;

  constructor(private http: HttpClient) {}

  // ─── Sponsor Validation ──────────────────────────────

  async validateSponsor(sponsorNumber: string): Promise<ApiResponse<SponsorValidationResponse>> {
    return firstValueFrom(
      this.http.get<ApiResponse<SponsorValidationResponse>>(
        `${this.api}/validate-sponsor/${sponsorNumber}`
      )
    );
  }

  // ─── CRUD Operations ────────────────────────────────

  async createDraft(userId: string): Promise<ApiResponse<{ id: string }>> {
    return firstValueFrom(
      this.http.post<ApiResponse<{ id: string }>>(`${this.api}/draft`, { userId })
    );
  }

  async saveState(
    id: string,
    step: number,
    sponsorData: SponsorData,
    members: Member[],
    kycData: KYCData,
    status: string = 'draft',
    totalPremium: number = 0,
    quotationCode?: string,
    policyNumber?: string,
  ): Promise<void> {
    await firstValueFrom(
      this.http.put(`${this.api}/${id}`, {
        currentStep: step,
        sponsorData,
        members,
        kycData,
        status,
        totalPremium,
        quotationId: quotationCode ?? null,
        policyNumber: policyNumber ?? null,
      })
    );
  }

  async loadQuotation(id: string): Promise<QuotationRecord | null> {
    try {
      const res = await firstValueFrom(
        this.http.get<ApiResponse<QuotationRecord>>(`${this.api}/${id}`)
      );
      return res.data ?? null;
    } catch {
      return null;
    }
  }

  async listQuotations(userId: string): Promise<QuotationRecord[]> {
    try {
      const res = await firstValueFrom(
        this.http.get<ApiResponse<QuotationRecord[]>>(`${this.api}/user/${userId}`)
      );
      return res.data ?? [];
    } catch {
      return [];
    }
  }

  async deleteQuotation(id: string): Promise<boolean> {
    try {
      await firstValueFrom(this.http.delete(`${this.api}/${id}`));
      return true;
    } catch {
      return false;
    }
  }

  // ─── Members ─────────────────────────────────────────

  async saveMembers(quotationId: string, members: Member[]): Promise<void> {
    await firstValueFrom(
      this.http.put(`${this.api}/${quotationId}/members`, { members })
    );
  }

  // ─── Health Declaration ──────────────────────────────

  async saveHealthDeclaration(quotationId: string, members: Member[]): Promise<void> {
    await firstValueFrom(
      this.http.put(`${this.api}/${quotationId}/health-declaration`, { members })
    );
  }

  // ─── KYC ─────────────────────────────────────────────

  async saveKYC(quotationId: string, kycData: KYCData): Promise<void> {
    await firstValueFrom(
      this.http.put(`${this.api}/${quotationId}/kyc`, kycData)
    );
  }

  // ─── Payment ─────────────────────────────────────────

  async processPayment(quotationId: string, paymentData: {
    paymentType: string;
    cardNumber: string;
    cardName: string;
    expiryDate: string;
    cvv: string;
    amount: number;
  }): Promise<ApiResponse<{ policyNumber: string; totalPremium: number }>> {
    return firstValueFrom(
      this.http.post<ApiResponse<{ policyNumber: string; totalPremium: number }>>(
        `${this.api}/${quotationId}/payment`, paymentData
      )
    );
  }

  // ─── Dashboard ───────────────────────────────────────

  async getDashboardSummary(userId: string): Promise<DashboardSummary | null> {
    try {
      const res = await firstValueFrom(
        this.http.get<ApiResponse<DashboardSummary>>(`${this.api}/dashboard/${userId}`)
      );
      return res.data ?? null;
    } catch {
      return null;
    }
  }

  // ─── Policy ──────────────────────────────────────────

  async getPolicies(userId: string): Promise<QuotationRecord[]> {
    try {
      const res = await firstValueFrom(
        this.http.get<ApiResponse<QuotationRecord[]>>(`${this.api}/policies/${userId}`)
      );
      return res.data ?? [];
    } catch {
      return [];
    }
  }

  // ─── Document Download ───────────────────────────────

  downloadDocument(quotationId: string, type: 'quotation' | 'policy'): void {
    const url = `${this.api}/${quotationId}/download/${type}`;
    window.open(url, '_blank');
  }
}
