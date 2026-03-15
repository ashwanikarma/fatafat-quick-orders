// ─── Endorsement Models ────────────────────────────────

export type EndorsementType = 'add_member' | 'update_member' | 'delete_member' | 'policy_issued';
export type EndorsementStatus = 'approved' | 'pending' | 'rejected';

export interface EndorsementHistoryItem {
  id: string;
  type: EndorsementType;
  description: string;
  date: string;
  status: EndorsementStatus;
  premiumImpact?: number;
  details?: string;
}
