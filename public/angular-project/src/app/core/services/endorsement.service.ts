import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Member } from '../models/quotation.model';
import { EndorsementHistoryItem } from '../models/endorsement.model';
import { ApiResponse, PaginatedResponse } from '../models/api-response.model';

@Injectable({ providedIn: 'root' })
export class EndorsementService {
  private readonly api = `${environment.apiUrl}/api/Endorsement`;

  constructor(private http: HttpClient) {}

  // ─── Add Members ─────────────────────────────────────

  async addMembers(
    policyId: string,
    newMembers: Member[],
    paymentData: { cardNumber: string; cardName: string; expiryDate: string; cvv: string },
  ): Promise<ApiResponse<{ updatedMembers: Member[]; totalPremium: number }>> {
    return firstValueFrom(
      this.http.post<ApiResponse<{ updatedMembers: Member[]; totalPremium: number }>>(
        `${this.api}/${policyId}/add-members`,
        { newMembers, ...paymentData }
      )
    );
  }

  // ─── Update Members ──────────────────────────────────

  async updateMembers(
    policyId: string,
    updatedMembers: Member[],
  ): Promise<ApiResponse<{ updatedMembers: Member[]; totalPremium: number }>> {
    return firstValueFrom(
      this.http.put<ApiResponse<{ updatedMembers: Member[]; totalPremium: number }>>(
        `${this.api}/${policyId}/update-members`,
        { members: updatedMembers }
      )
    );
  }

  // ─── Delete Members ──────────────────────────────────

  async deleteMembers(
    policyId: string,
    memberIds: string[],
    reason: string,
  ): Promise<ApiResponse<{ remainingMembers: Member[]; totalPremium: number; refundAmount: number }>> {
    return firstValueFrom(
      this.http.post<ApiResponse<{ remainingMembers: Member[]; totalPremium: number; refundAmount: number }>>(
        `${this.api}/${policyId}/delete-members`,
        { memberIds, reason }
      )
    );
  }

  // ─── Endorsement History ─────────────────────────────

  async getHistory(
    policyId: string,
    page: number = 1,
    pageSize: number = 20,
  ): Promise<PaginatedResponse<EndorsementHistoryItem>> {
    try {
      const res = await firstValueFrom(
        this.http.get<ApiResponse<PaginatedResponse<EndorsementHistoryItem>>>(
          `${this.api}/${policyId}/history`,
          { params: { page: page.toString(), pageSize: pageSize.toString() } }
        )
      );
      return res.data ?? { items: [], totalCount: 0, pageNumber: 1, pageSize: 20, totalPages: 0 };
    } catch {
      return { items: [], totalCount: 0, pageNumber: 1, pageSize: 20, totalPages: 0 };
    }
  }

  // ─── Download Endorsement Document ───────────────────

  downloadEndorsementDoc(endorsementId: string): void {
    const url = `${this.api}/${endorsementId}/download`;
    window.open(url, '_blank');
  }
}
