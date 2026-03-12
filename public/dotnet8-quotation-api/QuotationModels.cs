using System.Text.Json;

namespace InsuranceApi.Models.QuotationModels
{
    // ═══════════════════════════════════════════════════════════
    //  REQUEST MODELS
    // ═══════════════════════════════════════════════════════════

    // ── Sponsor ──

    public class mdlSponsorValidateReq
    {
        public string SponsorNumber { get; set; } = string.Empty;
    }

    // ── Quotation CRUD ──

    public class mdlQuotationCreateReq
    {
        public int UserId { get; set; }
        public string SponsorNumber { get; set; } = string.Empty;
        public DateTime? PolicyEffectiveDate { get; set; }
        public string? SponsorName { get; set; }
        public string? SponsorStatus { get; set; }
    }

    public class mdlQuotationUpdateStatusReq
    {
        public int QuotationId { get; set; }
        public string Status { get; set; } = string.Empty;       // draft | completed | paid
    }

    // ── Members ──

    public class mdlMemberReq
    {
        public string MemberType { get; set; } = "Employee";      // Employee | Dependent
        public string MemberName { get; set; } = string.Empty;
        public string IdentityNumber { get; set; } = string.Empty;
        public string DateOfBirth { get; set; } = string.Empty;    // YYYY-MM-DD
        public string Gender { get; set; } = "Male";               // Male | Female
        public string MaritalStatus { get; set; } = "Single";      // Single | Married
        public string ClassSelection { get; set; } = "C";          // VIP | A | B | C | LM
        public string SponsorNumber { get; set; } = string.Empty;
        public string? EmployeeId { get; set; }
    }

    // ── Health Declaration ──

    public class mdlHealthDeclarationReq
    {
        public int MemberId { get; set; }
        public int QuotationId { get; set; }
        public string HealthDeclaration { get; set; } = "No";      // Yes | No
        public string? HealthAnswersJson { get; set; }              // JSON array of booleans
        public string? HeightCm { get; set; }
        public string? WeightKg { get; set; }
        public bool IsPregnant { get; set; } = false;
        public string? ExpectedDeliveryDate { get; set; }
        public string? MaternityDays { get; set; }
    }

    // ── KYC ──

    public class mdlKycReq
    {
        public int QuotationId { get; set; }

        // National Address
        public string BuildingNumber { get; set; } = string.Empty;
        public string AdditionalNumber { get; set; } = string.Empty;
        public string UnitNumber { get; set; } = string.Empty;
        public string PostalCode { get; set; } = string.Empty;
        public string Street { get; set; } = string.Empty;
        public string District { get; set; } = string.Empty;
        public string City { get; set; } = string.Empty;

        // Business Details
        public string BusinessType { get; set; } = string.Empty;       // LLC | Sole Proprietorship | Partnership | Corporation
        public string CompanyRevenue { get; set; } = string.Empty;      // < 1 Million | 1M–10M | 10M–50M | 50M+
        public string NumberOfEmployees { get; set; } = string.Empty;   // 1–10 | 11–50 | 51–100 | 100+
        public string TaxRegistrationNumber { get; set; } = string.Empty;
        public string IbanNumber { get; set; } = string.Empty;
        public string BankName { get; set; } = string.Empty;

        // Compliance
        public bool? IsPEP { get; set; }
        public bool? IsBoardMember { get; set; }
        public string? BoardMembersJson { get; set; }        // JSON array of { name, identityNumber, address }
        public bool? HasMajorShareholder { get; set; }
        public string? ShareholdersJson { get; set; }         // JSON array of { name, address, contributionPercent }
        public bool TermsAccepted { get; set; } = false;
    }

    // ── Payment ──

    public class mdlPaymentReq
    {
        public int QuotationId { get; set; }
        public string PaymentMethod { get; set; } = string.Empty;   // credit | debit | mada
        public string? CardholderName { get; set; }
        public string? CardNumber { get; set; }
        public string? ExpiryDate { get; set; }
        public string? CVV { get; set; }
        public string? TransactionRef { get; set; }
        public decimal Amount { get; set; }
    }

    // ── Dashboard ──

    public class mdlDashboardReq
    {
        public int UserId { get; set; }
    }

    // ── Endorsement History (inside quotation context) ──

    public class mdlEndorsementHistoryFilterReq
    {
        public int PolicyId { get; set; }
        public string? Type { get; set; }                   // add_member | update_member | delete_member | policy_issued
        public string? Status { get; set; }                 // approved | pending | rejected
        public DateTime? FromDate { get; set; }
        public DateTime? ToDate { get; set; }
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 20;
    }

    // ═══════════════════════════════════════════════════════════
    //  RESPONSE MODELS
    // ═══════════════════════════════════════════════════════════

    // ── Sponsor ──

    public class mdlSponsorValidateRes
    {
        public bool Success { get; set; }
        public string? SponsorName { get; set; }
        public string? SponsorStatus { get; set; }
        public string? Error { get; set; }
    }

    // ── Quotation Detail ──

    public class mdlQuotationRes
    {
        public int QuotationId { get; set; }
        public int UserId { get; set; }
        public string Status { get; set; } = "draft";
        public int CurrentStep { get; set; }
        public string? QuotationNumber { get; set; }
        public string? PolicyNumber { get; set; }
        public decimal TotalPremium { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        // Nested data
        public mdlSponsorDataRes? SponsorData { get; set; }
        public List<mdlMemberRes>? Members { get; set; }
        public mdlKycDataRes? KycData { get; set; }
        public mdlPaymentRes? Payment { get; set; }
        public List<mdlEndorsementHistoryRes>? EndorsementHistory { get; set; }
    }

    public class mdlSponsorDataRes
    {
        public string SponsorNumber { get; set; } = string.Empty;
        public DateTime? PolicyEffectiveDate { get; set; }
        public string? SponsorName { get; set; }
        public string? SponsorStatus { get; set; }
    }

    // ── Member ──

    public class mdlMemberRes
    {
        public int MemberId { get; set; }
        public int QuotationId { get; set; }
        public string MemberType { get; set; } = string.Empty;
        public string MemberName { get; set; } = string.Empty;
        public string IdentityNumber { get; set; } = string.Empty;
        public string DateOfBirth { get; set; } = string.Empty;
        public string Gender { get; set; } = string.Empty;
        public string MaritalStatus { get; set; } = string.Empty;
        public string ClassSelection { get; set; } = string.Empty;
        public string SponsorNumber { get; set; } = string.Empty;
        public string? EmployeeId { get; set; }
        // Health Declaration
        public string HealthDeclaration { get; set; } = "No";
        public string? HealthAnswersJson { get; set; }
        public string? HeightCm { get; set; }
        public string? WeightKg { get; set; }
        public bool IsPregnant { get; set; }
        public string? ExpectedDeliveryDate { get; set; }
        public string? MaternityDays { get; set; }
        // Premium
        public decimal Premium { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    // ── KYC ──

    public class mdlKycDataRes
    {
        // National Address
        public string BuildingNumber { get; set; } = string.Empty;
        public string AdditionalNumber { get; set; } = string.Empty;
        public string UnitNumber { get; set; } = string.Empty;
        public string PostalCode { get; set; } = string.Empty;
        public string Street { get; set; } = string.Empty;
        public string District { get; set; } = string.Empty;
        public string City { get; set; } = string.Empty;
        // Business Details
        public string BusinessType { get; set; } = string.Empty;
        public string CompanyRevenue { get; set; } = string.Empty;
        public string NumberOfEmployees { get; set; } = string.Empty;
        public string TaxRegistrationNumber { get; set; } = string.Empty;
        public string IbanNumber { get; set; } = string.Empty;
        public string BankName { get; set; } = string.Empty;
        // Compliance
        public bool? IsPEP { get; set; }
        public bool? IsBoardMember { get; set; }
        public string? BoardMembersJson { get; set; }
        public bool? HasMajorShareholder { get; set; }
        public string? ShareholdersJson { get; set; }
        public bool TermsAccepted { get; set; }
        public bool Completed { get; set; }
    }

    // ── Payment ──

    public class mdlPaymentRes
    {
        public int PaymentId { get; set; }
        public string PaymentMethod { get; set; } = string.Empty;
        public string? TransactionRef { get; set; }
        public decimal Amount { get; set; }
        public DateTime PaidAt { get; set; }
    }

    // ── Quotation List ──

    public class mdlQuotationListRes
    {
        public int QuotationId { get; set; }
        public string Status { get; set; } = string.Empty;
        public int CurrentStep { get; set; }
        public string? QuotationNumber { get; set; }
        public string? PolicyNumber { get; set; }
        public decimal TotalPremium { get; set; }
        public int MemberCount { get; set; }
        public string? SponsorName { get; set; }
        public string? SponsorNumber { get; set; }
        public DateTime? PolicyEffectiveDate { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    // ── Policy List (paid quotations) ──

    public class mdlPolicyListRes
    {
        public int QuotationId { get; set; }
        public string PolicyNumber { get; set; } = string.Empty;
        public string? QuotationNumber { get; set; }
        public string Status { get; set; } = "paid";
        public decimal TotalPremium { get; set; }
        public int MemberCount { get; set; }
        public int EndorsementCount { get; set; }
        public string? SponsorName { get; set; }
        public string? SponsorNumber { get; set; }
        public DateTime? PolicyEffectiveDate { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public List<mdlMemberSummaryRes>? TopMembers { get; set; }   // first 5 members for preview
    }

    public class mdlMemberSummaryRes
    {
        public int MemberId { get; set; }
        public string MemberName { get; set; } = string.Empty;
        public string IdentityNumber { get; set; } = string.Empty;
        public string ClassSelection { get; set; } = string.Empty;
    }

    // ── Premium Calculation ──

    public class mdlPremiumCalcRes
    {
        public decimal TotalPremium { get; set; }
        public List<mdlMemberPremium> MemberPremiums { get; set; } = new();
    }

    public class mdlMemberPremium
    {
        public int MemberId { get; set; }
        public string MemberName { get; set; } = string.Empty;
        public string ClassSelection { get; set; } = string.Empty;
        public string HealthDeclaration { get; set; } = "No";
        public decimal BasePremium { get; set; }
        public decimal LoadingPercent { get; set; }
        public decimal Premium { get; set; }
    }

    // ── Document Download ──

    public class mdlDocumentRes
    {
        public byte[] FileContent { get; set; } = Array.Empty<byte>();
        public string FileName { get; set; } = string.Empty;
        public string ContentType { get; set; } = "application/pdf";
    }

    // ── Endorsement History (within policy context) ──

    public class mdlEndorsementHistoryRes
    {
        public int EndorsementId { get; set; }
        public int PolicyId { get; set; }
        public string EndorsementType { get; set; } = string.Empty;   // add_member | update_member | delete_member | policy_issued
        public string Status { get; set; } = string.Empty;            // approved | pending | rejected
        public string Description { get; set; } = string.Empty;
        public string? Details { get; set; }
        public decimal PremiumImpact { get; set; }
        public int? AffectedMemberCount { get; set; }
        public string? DeletionReason { get; set; }
        public DateTime CreatedAt { get; set; }
        public string? CreatedByName { get; set; }
    }

    public class mdlEndorsementHistoryPageRes
    {
        public List<mdlEndorsementHistoryRes> Items { get; set; } = new();
        public int TotalCount { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalPages { get; set; }
    }

    // ── Dashboard Summary ──

    public class mdlDashboardSummaryRes
    {
        public int TotalQuotations { get; set; }
        public int DraftQuotations { get; set; }
        public int CompletedQuotations { get; set; }
        public int ActivePolicies { get; set; }
        public decimal TotalPremium { get; set; }
        public int TotalMembers { get; set; }
        public int TotalEndorsements { get; set; }
        public List<mdlQuotationListRes>? RecentQuotations { get; set; }
        public List<mdlPolicyListRes>? RecentPolicies { get; set; }
    }
}
