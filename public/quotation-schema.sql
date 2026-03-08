-- ============================================================
-- Quotation Flow Schema — SQL Server Compatible
-- Generated from Lovable Cloud (Supabase) schema
-- ============================================================

-- Profiles table
CREATE TABLE profiles (
    id UNIQUEIDENTIFIER PRIMARY KEY,
    created_at DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
    updated_at DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
    full_name NVARCHAR(255) NULL,
    phone NVARCHAR(50) NULL,
    avatar_text NVARCHAR(10) NULL,
    membership_tier NVARCHAR(50) NOT NULL DEFAULT 'Standard Member',
    address NVARCHAR(500) NULL,
    pan_number NVARCHAR(50) NULL
);

-- Quotations table
CREATE TABLE quotations (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    user_id UNIQUEIDENTIFIER NOT NULL,
    status NVARCHAR(50) NOT NULL DEFAULT 'draft',
    current_step INT NOT NULL DEFAULT 0,
    sponsor_data NVARCHAR(MAX) NOT NULL DEFAULT '{}',       -- JSON
    members NVARCHAR(MAX) NOT NULL DEFAULT '[]',             -- JSON
    kyc_data NVARCHAR(MAX) NOT NULL DEFAULT '{}',            -- JSON
    total_premium DECIMAL(18, 2) NULL DEFAULT 0,
    quotation_id NVARCHAR(100) NULL,
    policy_number NVARCHAR(100) NULL,
    created_at DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
    updated_at DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),

    CONSTRAINT FK_quotations_profiles FOREIGN KEY (user_id) REFERENCES profiles(id)
);

-- Auto-update updated_at trigger (SQL Server)
CREATE TRIGGER trg_quotations_updated_at
ON quotations
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE q SET q.updated_at = SYSDATETIMEOFFSET()
    FROM quotations q INNER JOIN inserted i ON q.id = i.id;
END;
GO

-- ============================================================
-- JSON Column Structures (for reference)
-- ============================================================

/*
sponsor_data JSON structure:
{
  "sponsorNumber": "string",
  "policyEffectiveDate": "ISO date string or null",
  "sponsorName": "string (optional)",
  "sponsorStatus": "string (optional)"
}

members JSON structure (array):
[
  {
    "id": "uuid",
    "memberType": "Employee" | "Dependent",
    "memberName": "string",
    "identityNumber": "string",
    "dateOfBirth": "YYYY-MM-DD",
    "gender": "Male" | "Female",
    "maritalStatus": "Single" | "Married",
    "classSelection": "VIP" | "A" | "B" | "C" | "LM",
    "sponsorNumber": "string",
    "employeeId": "string (optional)",
    "healthDeclaration": "Yes" | "No" (optional),
    "healthAnswers": [true/false, ...] (optional)
  }
]

kyc_data JSON structure:
{
  "nationalAddress": {
    "buildingNumber": "string",
    "additionalNumber": "string",
    "unitNumber": "string",
    "postalCode": "string",
    "street": "string",
    "district": "string",
    "city": "string"
  },
  "businessDetails": {
    "businessType": "" | "LLC" | "Sole Proprietorship" | "Partnership" | "Corporation",
    "companyRevenue": "" | "< 1 Million" | "1M – 10M" | "10M – 50M" | "50M+",
    "numberOfEmployees": "" | "1–10" | "11–50" | "51–100" | "100+",
    "taxRegistrationNumber": "string (15 digits, starts/ends with 3)",
    "ibanNumber": "string (24 chars)",
    "bankName": "string"
  },
  "compliance": {
    "isPEP": true | false | null,
    "isBoardMember": true | false | null,
    "boardMembers": [
      { "id": "uuid", "name": "string", "identityNumber": "string", "address": "string" }
    ],
    "hasMajorShareholder": true | false | null,
    "shareholders": [
      { "id": "uuid", "name": "string", "address": "string", "contributionPercent": "string" }
    ],
    "termsAccepted": true | false
  },
  "completed": true | false
}

Status values: "draft", "completed", "paid"
Steps: 0=Sponsor, 1=Members, 2=HealthDeclaration, 3=Quotation, 4=KYC, 5=Payment
*/
