namespace InsuranceApi.Models.EndorsementModels
{
    // ── Enums ──────────────────────────────────────────────
    public enum EndorsementType { AddMember, UpdateMember, DeleteMember }
    public enum EndorsementStatus { Pending, PaymentRequired, Approved, Rejected, Cancelled }

    // ── Add Member ─────────────────────────────────────────
    public class mdlAddMemberReq
    {
        public int PolicyId { get; set; }
        public List<mdlNewMember> Members { get; set; } = new();
    }

    public class mdlNewMember
    {
        public string MemberType { get; set; } = "Employee";
        public string MemberName { get; set; } = "";
        public string IdentityNumber { get; set; } = "";
        public string DateOfBirth { get; set; } = "";
        public string Gender { get; set; } = "Male";
        public string MaritalStatus { get; set; } = "Single";
        public string ClassSelection { get; set; } = "B";
        public int? EmployeeId { get; set; }
        public string HealthDeclaration { get; set; } = "No";
        public string? HealthAnswers { get; set; } // JSON array
        public decimal? HeightCm { get; set; }
        public decimal? WeightKg { get; set; }
    }

    // ── Update Member ──────────────────────────────────────
    public class mdlUpdateMemberReq
    {
        public int PolicyId { get; set; }
        public int MemberId { get; set; }
        public string MemberName { get; set; } = "";
        public string Gender { get; set; } = "";
        public string MaritalStatus { get; set; } = "";
        public string DateOfBirth { get; set; } = "";
    }

    // ── Delete Member ──────────────────────────────────────
    public class mdlDeleteMemberReq
    {
        public int PolicyId { get; set; }
        public List<int> MemberIds { get; set; } = new();
        public string DeletionReason { get; set; } = "";
    }

    public class mdlBulkDeleteUploadRow
    {
        public string IdentityNumber { get; set; } = "";
    }

    // ── Responses ──────────────────────────────────────────
    public class mdlEndorsementRes
    {
        public int EndorsementId { get; set; }
        public string EndorsementType { get; set; } = "";
        public string Status { get; set; } = "";
        public decimal PremiumDifference { get; set; }
        public decimal RefundAmount { get; set; }
        public decimal NewTotalPremium { get; set; }
        public string Message { get; set; } = "";
    }

    public class mdlPremiumDiffRes
    {
        public decimal CurrentPremium { get; set; }
        public decimal AdditionalPremium { get; set; }
        public decimal NewTotalPremium { get; set; }
        public List<mdlMemberPremiumDetail> MemberBreakdown { get; set; } = new();
    }

    public class mdlMemberPremiumDetail
    {
        public string MemberName { get; set; } = "";
        public string ClassSelection { get; set; } = "";
        public decimal Premium { get; set; }
    }

    public class mdlRefundRes
    {
        public decimal CurrentPremium { get; set; }
        public decimal RefundAmount { get; set; }
        public decimal NewTotalPremium { get; set; }
        public int RemainingMembers { get; set; }
        public string DeletionReason { get; set; } = "";
    }

    public class mdlEndorsementPaymentReq
    {
        public int EndorsementId { get; set; }
        public string CardholderName { get; set; } = "";
        public string CardNumber { get; set; } = "";
        public string ExpiryDate { get; set; } = "";
        public string CVV { get; set; } = "";
        public string PaymentType { get; set; } = "credit";
    }
}
