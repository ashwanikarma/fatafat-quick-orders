-- ============================================================
-- Health Insurance Quotation System — SQL Server Schema
-- Normalized tables (no JSON storage)
-- Generated: 2026-03-08
-- ============================================================

-- 1. PROFILES (Users)
-- ============================================================
CREATE TABLE dbo.Profiles (
    Id              UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
    FullName        NVARCHAR(255)    NULL,
    Phone           NVARCHAR(50)     NULL,
    AvatarText      NVARCHAR(10)     NULL,
    MembershipTier  NVARCHAR(50)     NOT NULL DEFAULT 'Standard Member',
    [Address]       NVARCHAR(500)    NULL,
    PanNumber       NVARCHAR(50)     NULL,
    Email           NVARCHAR(255)    NULL,
    CreatedAt       DATETIME2        NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt       DATETIME2        NOT NULL DEFAULT GETUTCDATE()
);

-- 2. QUOTATIONS (Master)
-- ============================================================
CREATE TABLE dbo.Quotations (
    Id                  UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
    UserId              UNIQUEIDENTIFIER NOT NULL,
    [Status]            NVARCHAR(20)     NOT NULL DEFAULT 'draft',       -- draft, quoted, paid, completed
    CurrentStep         INT              NOT NULL DEFAULT 0,              -- 0-5
    QuotationId         NVARCHAR(50)     NULL,                           -- Generated quotation code
    PolicyNumber        NVARCHAR(50)     NULL,                           -- Generated after payment
    TotalPremium        DECIMAL(18,2)    NULL     DEFAULT 0,
    CreatedAt           DATETIME2        NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt           DATETIME2        NOT NULL DEFAULT GETUTCDATE(),

    CONSTRAINT FK_Quotations_Profiles FOREIGN KEY (UserId) REFERENCES dbo.Profiles(Id)
);

CREATE INDEX IX_Quotations_UserId ON dbo.Quotations(UserId);
CREATE INDEX IX_Quotations_Status ON dbo.Quotations([Status]);

-- 3. SPONSOR DATA (One per Quotation)
-- ============================================================
CREATE TABLE dbo.QuotationSponsors (
    Id                    UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
    QuotationId           UNIQUEIDENTIFIER NOT NULL,
    SponsorNumber         NVARCHAR(50)     NOT NULL,
    SponsorName           NVARCHAR(255)    NULL,
    SponsorStatus         NVARCHAR(50)     NULL,      -- Active, Inactive
    PolicyEffectiveDate   DATE             NULL,

    CONSTRAINT FK_QSponsor_Quotation FOREIGN KEY (QuotationId) REFERENCES dbo.Quotations(Id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX UX_QSponsor_Quotation ON dbo.QuotationSponsors(QuotationId);

-- 4. MEMBERS (Many per Quotation)
-- ============================================================
CREATE TABLE dbo.QuotationMembers (
    Id                UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
    QuotationId       UNIQUEIDENTIFIER NOT NULL,
    MemberType        NVARCHAR(20)     NOT NULL,      -- Employee, Dependent
    MemberName        NVARCHAR(255)    NOT NULL,
    IdentityNumber    NVARCHAR(50)     NOT NULL,
    DateOfBirth       DATE             NOT NULL,
    Gender            NVARCHAR(10)     NOT NULL,       -- Male, Female
    MaritalStatus     NVARCHAR(20)     NOT NULL,       -- Single, Married
    ClassSelection    NVARCHAR(10)     NOT NULL,        -- VIP, A, B, C, LM
    SponsorNumber     NVARCHAR(50)     NOT NULL,
    EmployeeId        UNIQUEIDENTIFIER NULL,           -- For Dependents: references parent Employee member
    Premium           DECIMAL(18,2)    NULL DEFAULT 0,

    CONSTRAINT FK_QMember_Quotation FOREIGN KEY (QuotationId) REFERENCES dbo.Quotations(Id) ON DELETE CASCADE,
    CONSTRAINT FK_QMember_Employee  FOREIGN KEY (EmployeeId)  REFERENCES dbo.QuotationMembers(Id)
);

CREATE INDEX IX_QMember_Quotation ON dbo.QuotationMembers(QuotationId);
CREATE INDEX IX_QMember_Employee  ON dbo.QuotationMembers(EmployeeId);

-- 5. HEALTH DECLARATION FORM (HDF) — One per Member
-- ============================================================
CREATE TABLE dbo.MemberHealthDeclarations (
    Id                    UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
    MemberId              UNIQUEIDENTIFIER NOT NULL,
    DeclarationRequired   BIT              NOT NULL DEFAULT 0,  -- Yes=1, No=0
    CreatedAt             DATETIME2        NOT NULL DEFAULT GETUTCDATE(),

    CONSTRAINT FK_HDF_Member FOREIGN KEY (MemberId) REFERENCES dbo.QuotationMembers(Id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX UX_HDF_Member ON dbo.MemberHealthDeclarations(MemberId);

-- 6. HEALTH DECLARATION ANSWERS (Many per HDF)
--    Each row = one CCHI standard question answer
-- ============================================================
CREATE TABLE dbo.HealthDeclarationAnswers (
    Id                    UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
    DeclarationId         UNIQUEIDENTIFIER NOT NULL,
    QuestionNumber        INT              NOT NULL,   -- 1-based index
    QuestionText          NVARCHAR(500)    NOT NULL,
    Answer                BIT              NOT NULL,   -- Yes=1, No=0

    CONSTRAINT FK_HDA_Declaration FOREIGN KEY (DeclarationId) REFERENCES dbo.MemberHealthDeclarations(Id) ON DELETE CASCADE
);

CREATE INDEX IX_HDA_Declaration ON dbo.HealthDeclarationAnswers(DeclarationId);

-- CCHI Standard Questions Reference:
-- 1. Do you currently suffer from any chronic disease?
-- 2. Have you undergone any surgical operation in the last 5 years?
-- 3. Are you currently taking any medication?
-- 4. Have you been hospitalized in the last 12 months?
-- 5. Do you have any congenital diseases or disabilities?

-- 7. KYC — NATIONAL ADDRESS (One per Quotation)
-- ============================================================
CREATE TABLE dbo.KycNationalAddresses (
    Id                UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
    QuotationId       UNIQUEIDENTIFIER NOT NULL,
    BuildingNumber    NVARCHAR(50)     NOT NULL,
    AdditionalNumber  NVARCHAR(50)     NULL,
    UnitNumber        NVARCHAR(50)     NULL,
    PostalCode        NVARCHAR(20)     NOT NULL,
    Street            NVARCHAR(255)    NOT NULL,
    District          NVARCHAR(255)    NOT NULL,
    City              NVARCHAR(100)    NOT NULL,

    CONSTRAINT FK_KycAddr_Quotation FOREIGN KEY (QuotationId) REFERENCES dbo.Quotations(Id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX UX_KycAddr_Quotation ON dbo.KycNationalAddresses(QuotationId);

-- 8. KYC — BUSINESS DETAILS (One per Quotation)
-- ============================================================
CREATE TABLE dbo.KycBusinessDetails (
    Id                      UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
    QuotationId             UNIQUEIDENTIFIER NOT NULL,
    BusinessType            NVARCHAR(50)     NOT NULL,   -- LLC, Sole Proprietorship, Partnership, Corporation
    CompanyRevenue          NVARCHAR(50)     NOT NULL,   -- < 1 Million, 1M–10M, 10M–50M, 50M+
    NumberOfEmployees       NVARCHAR(20)     NOT NULL,   -- 1–10, 11–50, 51–100, 100+
    TaxRegistrationNumber   NVARCHAR(15)     NOT NULL,   -- 15 digits, starts & ends with 3
    IbanNumber              NVARCHAR(24)     NOT NULL,   -- SA + 22 chars
    BankName                NVARCHAR(100)    NOT NULL,

    CONSTRAINT FK_KycBiz_Quotation FOREIGN KEY (QuotationId) REFERENCES dbo.Quotations(Id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX UX_KycBiz_Quotation ON dbo.KycBusinessDetails(QuotationId);

-- 9. KYC — COMPLIANCE (One per Quotation)
-- ============================================================
CREATE TABLE dbo.KycCompliance (
    Id                      UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
    QuotationId             UNIQUEIDENTIFIER NOT NULL,
    IsPEP                   BIT              NULL,       -- Politically Exposed Person
    IsBoardMember           BIT              NULL,       -- Board/Audit/Executive in listed company
    HasMajorShareholder     BIT              NULL,       -- Shareholder owning 25%+
    TermsAccepted           BIT              NOT NULL DEFAULT 0,
    KycCompleted            BIT              NOT NULL DEFAULT 0,

    CONSTRAINT FK_KycComp_Quotation FOREIGN KEY (QuotationId) REFERENCES dbo.Quotations(Id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX UX_KycComp_Quotation ON dbo.KycCompliance(QuotationId);

-- 10. KYC — BOARD MEMBERS (Many per Compliance, if IsBoardMember = 1)
-- ============================================================
CREATE TABLE dbo.KycBoardMembers (
    Id                UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
    ComplianceId      UNIQUEIDENTIFIER NOT NULL,
    [Name]            NVARCHAR(255)    NOT NULL,
    IdentityNumber    NVARCHAR(50)     NOT NULL,
    [Address]         NVARCHAR(500)    NOT NULL,

    CONSTRAINT FK_BoardMember_Compliance FOREIGN KEY (ComplianceId) REFERENCES dbo.KycCompliance(Id) ON DELETE CASCADE
);

CREATE INDEX IX_BoardMember_Compliance ON dbo.KycBoardMembers(ComplianceId);

-- 11. KYC — SHAREHOLDERS (Many per Compliance, if HasMajorShareholder = 1)
-- ============================================================
CREATE TABLE dbo.KycShareholders (
    Id                    UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
    ComplianceId          UNIQUEIDENTIFIER NOT NULL,
    [Name]                NVARCHAR(255)    NOT NULL,
    [Address]             NVARCHAR(500)    NOT NULL,
    ContributionPercent   DECIMAL(5,2)     NOT NULL,   -- e.g. 25.00, 51.50

    CONSTRAINT FK_Shareholder_Compliance FOREIGN KEY (ComplianceId) REFERENCES dbo.KycCompliance(Id) ON DELETE CASCADE
);

CREATE INDEX IX_Shareholder_Compliance ON dbo.KycShareholders(ComplianceId);

-- 12. PAYMENTS (One per Quotation)
-- ============================================================
CREATE TABLE dbo.Payments (
    Id                UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
    QuotationId       UNIQUEIDENTIFIER NOT NULL,
    PaymentMethod     NVARCHAR(20)     NOT NULL,       -- credit, debit
    CardLastFour      NVARCHAR(4)      NULL,
    Amount            DECIMAL(18,2)    NOT NULL,
    [Status]          NVARCHAR(20)     NOT NULL,        -- success, failed, pending
    TransactionRef    NVARCHAR(100)    NULL,
    PaidAt            DATETIME2        NULL,
    CreatedAt         DATETIME2        NOT NULL DEFAULT GETUTCDATE(),

    CONSTRAINT FK_Payment_Quotation FOREIGN KEY (QuotationId) REFERENCES dbo.Quotations(Id) ON DELETE CASCADE
);

CREATE INDEX IX_Payment_Quotation ON dbo.Payments(QuotationId);


-- ============================================================
-- TRIGGER: Auto-update UpdatedAt on Quotations
-- ============================================================
GO
CREATE TRIGGER trg_Quotations_UpdatedAt
ON dbo.Quotations
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE q
    SET q.UpdatedAt = GETUTCDATE()
    FROM dbo.Quotations q
    INNER JOIN inserted i ON q.Id = i.Id;
END;
GO


-- ============================================================
-- STORED PROCEDURES
-- ============================================================

-- SP: Create a new draft quotation with sponsor
GO
CREATE PROCEDURE dbo.usp_CreateQuotationDraft
    @UserId             UNIQUEIDENTIFIER,
    @SponsorNumber      NVARCHAR(50),
    @SponsorName        NVARCHAR(255)    = NULL,
    @PolicyEffectiveDate DATE            = NULL,
    @QuotationId        UNIQUEIDENTIFIER OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET @QuotationId = NEWID();

    INSERT INTO dbo.Quotations (Id, UserId, [Status], CurrentStep)
    VALUES (@QuotationId, @UserId, 'draft', 0);

    INSERT INTO dbo.QuotationSponsors (QuotationId, SponsorNumber, SponsorName, PolicyEffectiveDate)
    VALUES (@QuotationId, @SponsorNumber, @SponsorName, @PolicyEffectiveDate);
END;
GO

-- SP: Add a member to a quotation
CREATE PROCEDURE dbo.usp_AddQuotationMember
    @QuotationId      UNIQUEIDENTIFIER,
    @MemberType       NVARCHAR(20),
    @MemberName       NVARCHAR(255),
    @IdentityNumber   NVARCHAR(50),
    @DateOfBirth      DATE,
    @Gender           NVARCHAR(10),
    @MaritalStatus    NVARCHAR(20),
    @ClassSelection   NVARCHAR(10),
    @SponsorNumber    NVARCHAR(50),
    @EmployeeId       UNIQUEIDENTIFIER = NULL,
    @MemberId         UNIQUEIDENTIFIER OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET @MemberId = NEWID();

    INSERT INTO dbo.QuotationMembers (
        Id, QuotationId, MemberType, MemberName, IdentityNumber,
        DateOfBirth, Gender, MaritalStatus, ClassSelection,
        SponsorNumber, EmployeeId
    )
    VALUES (
        @MemberId, @QuotationId, @MemberType, @MemberName, @IdentityNumber,
        @DateOfBirth, @Gender, @MaritalStatus, @ClassSelection,
        @SponsorNumber, @EmployeeId
    );
END;
GO

-- SP: Save Health Declaration for a member
CREATE PROCEDURE dbo.usp_SaveHealthDeclaration
    @MemberId             UNIQUEIDENTIFIER,
    @DeclarationRequired  BIT,
    @Answers              NVARCHAR(MAX) = NULL  -- Comma-separated: '0,0,1,1,0' (for 5 questions)
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @DeclId UNIQUEIDENTIFIER = NEWID();

    -- Upsert declaration
    IF EXISTS (SELECT 1 FROM dbo.MemberHealthDeclarations WHERE MemberId = @MemberId)
    BEGIN
        SELECT @DeclId = Id FROM dbo.MemberHealthDeclarations WHERE MemberId = @MemberId;
        UPDATE dbo.MemberHealthDeclarations SET DeclarationRequired = @DeclarationRequired WHERE Id = @DeclId;
        DELETE FROM dbo.HealthDeclarationAnswers WHERE DeclarationId = @DeclId;
    END
    ELSE
    BEGIN
        INSERT INTO dbo.MemberHealthDeclarations (Id, MemberId, DeclarationRequired)
        VALUES (@DeclId, @MemberId, @DeclarationRequired);
    END

    -- Insert answers if declaration is required
    IF @DeclarationRequired = 1 AND @Answers IS NOT NULL
    BEGIN
        DECLARE @Questions TABLE (Num INT, Txt NVARCHAR(500));
        INSERT INTO @Questions VALUES
            (1, 'Do you currently suffer from any chronic disease?'),
            (2, 'Have you undergone any surgical operation in the last 5 years?'),
            (3, 'Are you currently taking any medication?'),
            (4, 'Have you been hospitalized in the last 12 months?'),
            (5, 'Do you have any congenital diseases or disabilities?');

        ;WITH AnswerSplit AS (
            SELECT
                ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) AS RowNum,
                CAST(TRIM(value) AS BIT) AS Answer
            FROM STRING_SPLIT(@Answers, ',')
        )
        INSERT INTO dbo.HealthDeclarationAnswers (DeclarationId, QuestionNumber, QuestionText, Answer)
        SELECT @DeclId, q.Num, q.Txt, a.Answer
        FROM AnswerSplit a
        JOIN @Questions q ON q.Num = a.RowNum;
    END
END;
GO

-- SP: Save KYC data
CREATE PROCEDURE dbo.usp_SaveKycData
    @QuotationId            UNIQUEIDENTIFIER,
    -- National Address
    @BuildingNumber         NVARCHAR(50),
    @AdditionalNumber       NVARCHAR(50)  = NULL,
    @UnitNumber             NVARCHAR(50)  = NULL,
    @PostalCode             NVARCHAR(20),
    @Street                 NVARCHAR(255),
    @District               NVARCHAR(255),
    @City                   NVARCHAR(100),
    -- Business Details
    @BusinessType           NVARCHAR(50),
    @CompanyRevenue         NVARCHAR(50),
    @NumberOfEmployees      NVARCHAR(20),
    @TaxRegistrationNumber  NVARCHAR(15),
    @IbanNumber             NVARCHAR(24),
    @BankName               NVARCHAR(100),
    -- Compliance
    @IsPEP                  BIT = NULL,
    @IsBoardMember          BIT = NULL,
    @HasMajorShareholder    BIT = NULL,
    @TermsAccepted          BIT = 0
AS
BEGIN
    SET NOCOUNT ON;

    -- Upsert National Address
    IF EXISTS (SELECT 1 FROM dbo.KycNationalAddresses WHERE QuotationId = @QuotationId)
        UPDATE dbo.KycNationalAddresses SET
            BuildingNumber = @BuildingNumber, AdditionalNumber = @AdditionalNumber,
            UnitNumber = @UnitNumber, PostalCode = @PostalCode,
            Street = @Street, District = @District, City = @City
        WHERE QuotationId = @QuotationId;
    ELSE
        INSERT INTO dbo.KycNationalAddresses (QuotationId, BuildingNumber, AdditionalNumber, UnitNumber, PostalCode, Street, District, City)
        VALUES (@QuotationId, @BuildingNumber, @AdditionalNumber, @UnitNumber, @PostalCode, @Street, @District, @City);

    -- Upsert Business Details
    IF EXISTS (SELECT 1 FROM dbo.KycBusinessDetails WHERE QuotationId = @QuotationId)
        UPDATE dbo.KycBusinessDetails SET
            BusinessType = @BusinessType, CompanyRevenue = @CompanyRevenue,
            NumberOfEmployees = @NumberOfEmployees, TaxRegistrationNumber = @TaxRegistrationNumber,
            IbanNumber = @IbanNumber, BankName = @BankName
        WHERE QuotationId = @QuotationId;
    ELSE
        INSERT INTO dbo.KycBusinessDetails (QuotationId, BusinessType, CompanyRevenue, NumberOfEmployees, TaxRegistrationNumber, IbanNumber, BankName)
        VALUES (@QuotationId, @BusinessType, @CompanyRevenue, @NumberOfEmployees, @TaxRegistrationNumber, @IbanNumber, @BankName);

    -- Upsert Compliance
    IF EXISTS (SELECT 1 FROM dbo.KycCompliance WHERE QuotationId = @QuotationId)
        UPDATE dbo.KycCompliance SET
            IsPEP = @IsPEP, IsBoardMember = @IsBoardMember,
            HasMajorShareholder = @HasMajorShareholder, TermsAccepted = @TermsAccepted,
            KycCompleted = 1
        WHERE QuotationId = @QuotationId;
    ELSE
        INSERT INTO dbo.KycCompliance (QuotationId, IsPEP, IsBoardMember, HasMajorShareholder, TermsAccepted, KycCompleted)
        VALUES (@QuotationId, @IsPEP, @IsBoardMember, @HasMajorShareholder, @TermsAccepted, 1);
END;
GO

-- SP: Process Payment
CREATE PROCEDURE dbo.usp_ProcessPayment
    @QuotationId      UNIQUEIDENTIFIER,
    @PaymentMethod    NVARCHAR(20),
    @CardLastFour     NVARCHAR(4),
    @Amount           DECIMAL(18,2),
    @PolicyNumber     NVARCHAR(50) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    SET @PolicyNumber = 'POL-' + UPPER(CONVERT(NVARCHAR(20), NEWID()));
    SET @PolicyNumber = LEFT(@PolicyNumber, 14);  -- e.g. POL-A1B2C3D4E5

    INSERT INTO dbo.Payments (QuotationId, PaymentMethod, CardLastFour, Amount, [Status], PaidAt)
    VALUES (@QuotationId, @PaymentMethod, @CardLastFour, @Amount, 'success', GETUTCDATE());

    UPDATE dbo.Quotations
    SET [Status] = 'paid',
        PolicyNumber = @PolicyNumber,
        TotalPremium = @Amount,
        CurrentStep = 5
    WHERE Id = @QuotationId;
END;
GO


-- ============================================================
-- VIEWS for easy querying
-- ============================================================

CREATE VIEW dbo.vw_QuotationSummary AS
SELECT
    q.Id AS QuotationId,
    q.[Status],
    q.PolicyNumber,
    q.TotalPremium,
    q.CreatedAt,
    q.UpdatedAt,
    p.FullName AS UserName,
    p.Email AS UserEmail,
    s.SponsorNumber,
    s.SponsorName,
    s.PolicyEffectiveDate,
    (SELECT COUNT(*) FROM dbo.QuotationMembers m WHERE m.QuotationId = q.Id) AS MemberCount
FROM dbo.Quotations q
JOIN dbo.Profiles p ON p.Id = q.UserId
LEFT JOIN dbo.QuotationSponsors s ON s.QuotationId = q.Id;
GO

CREATE VIEW dbo.vw_MemberDetails AS
SELECT
    m.Id AS MemberId,
    m.QuotationId,
    m.MemberType,
    m.MemberName,
    m.IdentityNumber,
    m.DateOfBirth,
    m.Gender,
    m.MaritalStatus,
    m.ClassSelection,
    m.SponsorNumber,
    m.Premium,
    m.EmployeeId,
    emp.MemberName AS EmployeeName,
    hd.DeclarationRequired AS HealthDeclarationRequired,
    q.PolicyNumber,
    q.[Status] AS QuotationStatus
FROM dbo.QuotationMembers m
JOIN dbo.Quotations q ON q.Id = m.QuotationId
LEFT JOIN dbo.QuotationMembers emp ON emp.Id = m.EmployeeId
LEFT JOIN dbo.MemberHealthDeclarations hd ON hd.MemberId = m.Id;
GO

CREATE VIEW dbo.vw_MemberHealthAnswers AS
SELECT
    m.MemberName,
    m.IdentityNumber,
    m.QuotationId,
    hda.QuestionNumber,
    hda.QuestionText,
    hda.Answer
FROM dbo.HealthDeclarationAnswers hda
JOIN dbo.MemberHealthDeclarations hd ON hd.Id = hda.DeclarationId
JOIN dbo.QuotationMembers m ON m.Id = hd.MemberId;
GO


-- ============================================================
-- TABLE RELATIONSHIP DIAGRAM (text)
-- ============================================================
/*
Profiles (1) ──── (N) Quotations
                        │
                        ├── (1) QuotationSponsors
                        │
                        ├── (N) QuotationMembers
                        │         │
                        │         └── (1) MemberHealthDeclarations
                        │                   │
                        │                   └── (N) HealthDeclarationAnswers
                        │
                        ├── (1) KycNationalAddresses
                        │
                        ├── (1) KycBusinessDetails
                        │
                        ├── (1) KycCompliance
                        │         │
                        │         ├── (N) KycBoardMembers
                        │         │
                        │         └── (N) KycShareholders
                        │
                        └── (1) Payments

Total: 12 tables
*/
