using System.Text.Json;

namespace InsuranceApi.Models.QuotationModels
{
    // ── Request Models ──

    public class mdlSponsorValidateReq
    {
        public string SponsorNumber { get; set; } = string.Empty;
    }

    public class mdlQuotationCreateReq
    {
        public int UserId { get; set; }
        public string SponsorNumber { get; set; } = string.Empty;
        public DateTime? PolicyEffectiveDate { get; set; }
        public string? SponsorName { get; set; }
        public string? SponsorStatus { get; set; }
    }

    public class mdlMemberReq
    {
        public string MemberType { get; set; } = "Employee";   // Employee | Dependent
        public string MemberName { get; set; } = string.Empty;
        public string IdentityNumber { get; set; } = string.Empty;
        public string DateOfBirth { get; set; } = string.Empty; // YYYY-MM-DD
        public string Gender { get; set; } = "Male";            // Male | Female
        public string MaritalStatus { get; set; } = "Single";   // Single | Married
        public string ClassSelection { get; set; } = "C";       // VIP | A | B | C | LM
        public string SponsorNumber { get; set; } = string.Empty;
        public string? EmployeeId { get; set; }
    }

    public class mdlHealthDeclarationReq
    {
        public int MemberId { get; set; }
        public string HealthDeclaration { get; set; } = "No";   // Yes | No
        public string? HealthAnswersJson { get; set; }           // JSON array of booleans
        public string? HeightCm { get; set; }
        public string? WeightKg { get; set; }
        public bool IsPregnant { get; set; } = false;
        public string? ExpectedDeliveryDate { get; set; }
        public string? MaternityDays { get; set; }
    }

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
        public string BusinessType { get; set; } = string.Empty;
        public string CompanyRevenue { get; set; } = string.Empty;
        public string NumberOfEmployees { get; set; } = string.Empty;
        public string TaxRegistrationNumber { get; set; } = string.Empty;
        public string IbanNumber { get; set; } = string.Empty;
        public string BankName { get; set; } = string.Empty;
        // Compliance
        public bool? IsPEP { get; set; }
        public bool? IsBoardMember { get; set; }
        public string? BoardMembersJson { get; set; }       // JSON array
        public bool? HasMajorShareholder { get; set; }
        public string? ShareholdersJson { get; set; }        // JSON array
        public bool TermsAccepted { get; set; } = false;
    }

    public class mdlPaymentReq
    {
        public int QuotationId { get; set; }
        public string PaymentMethod { get; set; } = string.Empty;
        public string? TransactionRef { get; set; }
        public decimal Amount { get; set; }
    }

    // ── Response Models ──

    public class mdlSponsorValidateRes
    {
        public bool Success { get; set; }
        public string? SponsorName { get; set; }
        public string? SponsorStatus { get; set; }
        public string? Error { get; set; }
    }

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
    }

    public class mdlSponsorDataRes
    {
        public string SponsorNumber { get; set; } = string.Empty;
        public DateTime? PolicyEffectiveDate { get; set; }
        public string? SponsorName { get; set; }
        public string? SponsorStatus { get; set; }
    }

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
        public string HealthDeclaration { get; set; } = "No";
        public string? HealthAnswersJson { get; set; }
        public string? HeightCm { get; set; }
        public string? WeightKg { get; set; }
        public bool IsPregnant { get; set; }
        public string? ExpectedDeliveryDate { get; set; }
        public string? MaternityDays { get; set; }
        public decimal Premium { get; set; }
    }

    public class mdlKycDataRes
    {
        public string BuildingNumber { get; set; } = string.Empty;
        public string AdditionalNumber { get; set; } = string.Empty;
        public string UnitNumber { get; set; } = string.Empty;
        public string PostalCode { get; set; } = string.Empty;
        public string Street { get; set; } = string.Empty;
        public string District { get; set; } = string.Empty;
        public string City { get; set; } = string.Empty;
        public string BusinessType { get; set; } = string.Empty;
        public string CompanyRevenue { get; set; } = string.Empty;
        public string NumberOfEmployees { get; set; } = string.Empty;
        public string TaxRegistrationNumber { get; set; } = string.Empty;
        public string IbanNumber { get; set; } = string.Empty;
        public string BankName { get; set; } = string.Empty;
        public bool? IsPEP { get; set; }
        public bool? IsBoardMember { get; set; }
        public string? BoardMembersJson { get; set; }
        public bool? HasMajorShareholder { get; set; }
        public string? ShareholdersJson { get; set; }
        public bool TermsAccepted { get; set; }
    }

    public class mdlQuotationListRes
    {
        public int QuotationId { get; set; }
        public string Status { get; set; } = string.Empty;
        public string? QuotationNumber { get; set; }
        public string? PolicyNumber { get; set; }
        public decimal TotalPremium { get; set; }
        public int MemberCount { get; set; }
        public string? SponsorName { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

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
        public decimal Premium { get; set; }
    }

    public class mdlDocumentRes
    {
        public byte[] FileContent { get; set; } = Array.Empty<byte>();
        public string FileName { get; set; } = string.Empty;
        public string ContentType { get; set; } = "application/pdf";
    }
}
