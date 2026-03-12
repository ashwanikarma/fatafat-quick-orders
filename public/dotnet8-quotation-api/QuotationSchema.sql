-- ============================================================
-- Quotation Module Schema — SQL Server (Complete)
-- For use with .NET 8 Dapper API
-- Aligned with frontend: Quotation wizard, Policy management,
-- Endorsement history, Dashboard
-- ============================================================


-- ═══════════════════════════════════════════════════════════
--  TABLES
-- ═══════════════════════════════════════════════════════════

CREATE TABLE tblQuotations (
    QuotationId      INT IDENTITY(1,1) PRIMARY KEY,
    UserId           INT NOT NULL,
    Status           NVARCHAR(20) NOT NULL DEFAULT 'draft',       -- draft | completed | paid
    CurrentStep      INT NOT NULL DEFAULT 0,                      -- 0-5 (Sponsor, Members, Health, Quotation, KYC, Payment)
    QuotationNumber  NVARCHAR(50) NULL,
    PolicyNumber     NVARCHAR(50) NULL,
    TotalPremium     DECIMAL(18,2) NOT NULL DEFAULT 0,
    CreatedAt        DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
    UpdatedAt        DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),

    CONSTRAINT FK_Quotations_Users FOREIGN KEY (UserId) REFERENCES tblOnlineUsers(UserId)
);
GO

CREATE TABLE tblQuotationSponsors (
    SponsorId           INT IDENTITY(1,1) PRIMARY KEY,
    QuotationId         INT NOT NULL,
    SponsorNumber       NVARCHAR(50) NOT NULL,
    PolicyEffectiveDate DATE NULL,
    SponsorName         NVARCHAR(200) NULL,
    SponsorStatus       NVARCHAR(50) NULL,

    CONSTRAINT FK_Sponsors_Quotation FOREIGN KEY (QuotationId) REFERENCES tblQuotations(QuotationId) ON DELETE CASCADE
);
GO

CREATE TABLE tblQuotationMembers (
    MemberId         INT IDENTITY(1,1) PRIMARY KEY,
    QuotationId      INT NOT NULL,
    MemberType       NVARCHAR(20) NOT NULL DEFAULT 'Employee',   -- Employee | Dependent
    MemberName       NVARCHAR(200) NOT NULL,
    IdentityNumber   NVARCHAR(50) NOT NULL,
    DateOfBirth      DATE NOT NULL,
    Gender           NVARCHAR(10) NOT NULL,                      -- Male | Female
    MaritalStatus    NVARCHAR(20) NOT NULL DEFAULT 'Single',     -- Single | Married
    ClassSelection   NVARCHAR(10) NOT NULL DEFAULT 'C',          -- VIP | A | B | C | LM
    SponsorNumber    NVARCHAR(50) NOT NULL,
    EmployeeId       NVARCHAR(50) NULL,
    -- Health Declaration
    HealthDeclaration NVARCHAR(5) NOT NULL DEFAULT 'No',         -- Yes | No
    HealthAnswersJson NVARCHAR(MAX) NULL,                        -- JSON array of booleans
    HeightCm         NVARCHAR(10) NULL,
    WeightKg         NVARCHAR(10) NULL,
    IsPregnant       BIT NOT NULL DEFAULT 0,
    ExpectedDeliveryDate NVARCHAR(20) NULL,
    MaternityDays    NVARCHAR(10) NULL,
    -- Premium
    Premium          DECIMAL(18,2) NOT NULL DEFAULT 0,
    CreatedAt        DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),

    CONSTRAINT FK_Members_Quotation FOREIGN KEY (QuotationId) REFERENCES tblQuotations(QuotationId) ON DELETE CASCADE
);
GO

CREATE TABLE tblQuotationKyc (
    KycId                  INT IDENTITY(1,1) PRIMARY KEY,
    QuotationId            INT NOT NULL,
    -- National Address
    BuildingNumber         NVARCHAR(50) NOT NULL DEFAULT '',
    AdditionalNumber       NVARCHAR(50) NOT NULL DEFAULT '',
    UnitNumber             NVARCHAR(50) NOT NULL DEFAULT '',
    PostalCode             NVARCHAR(20) NOT NULL DEFAULT '',
    Street                 NVARCHAR(200) NOT NULL DEFAULT '',
    District               NVARCHAR(200) NOT NULL DEFAULT '',
    City                   NVARCHAR(100) NOT NULL DEFAULT '',
    -- Business Details
    BusinessType           NVARCHAR(50) NOT NULL DEFAULT '',       -- LLC | Sole Proprietorship | Partnership | Corporation
    CompanyRevenue         NVARCHAR(50) NOT NULL DEFAULT '',       -- < 1 Million | 1M–10M | 10M–50M | 50M+
    NumberOfEmployees      NVARCHAR(20) NOT NULL DEFAULT '',       -- 1–10 | 11–50 | 51–100 | 100+
    TaxRegistrationNumber  NVARCHAR(20) NOT NULL DEFAULT '',
    IbanNumber             NVARCHAR(30) NOT NULL DEFAULT '',
    BankName               NVARCHAR(100) NOT NULL DEFAULT '',
    -- Compliance
    IsPEP                  BIT NULL,
    IsBoardMember          BIT NULL,
    BoardMembersJson       NVARCHAR(MAX) NULL,                    -- JSON: [{ name, identityNumber, address }]
    HasMajorShareholder    BIT NULL,
    ShareholdersJson       NVARCHAR(MAX) NULL,                    -- JSON: [{ name, address, contributionPercent }]
    TermsAccepted          BIT NOT NULL DEFAULT 0,
    Completed              BIT NOT NULL DEFAULT 0,

    CONSTRAINT FK_Kyc_Quotation FOREIGN KEY (QuotationId) REFERENCES tblQuotations(QuotationId) ON DELETE CASCADE
);
GO

CREATE TABLE tblQuotationPayments (
    PaymentId       INT IDENTITY(1,1) PRIMARY KEY,
    QuotationId     INT NOT NULL,
    PaymentMethod   NVARCHAR(50) NOT NULL,                       -- credit | debit | mada
    CardholderName  NVARCHAR(200) NULL,
    TransactionRef  NVARCHAR(100) NULL,
    Amount          DECIMAL(18,2) NOT NULL,
    PaidAt          DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),

    CONSTRAINT FK_Payments_Quotation FOREIGN KEY (QuotationId) REFERENCES tblQuotations(QuotationId) ON DELETE CASCADE
);
GO

-- ── Premium Lookup ──

CREATE TABLE tblClassPremiums (
    ClassSelection NVARCHAR(10) PRIMARY KEY,
    BasePremium    DECIMAL(18,2) NOT NULL
);
GO

INSERT INTO tblClassPremiums VALUES ('VIP', 12000), ('A', 8500), ('B', 6000), ('C', 4500), ('LM', 3000);
GO

-- ── Endorsement History (tracks all policy transactions) ──

CREATE TABLE tblEndorsementHistory (
    EndorsementId       INT IDENTITY(1,1) PRIMARY KEY,
    PolicyId            INT NOT NULL,                             -- References tblQuotations.QuotationId (paid ones)
    EndorsementType     NVARCHAR(30) NOT NULL,                    -- policy_issued | add_member | update_member | delete_member
    Status              NVARCHAR(20) NOT NULL DEFAULT 'approved', -- approved | pending | rejected
    Description         NVARCHAR(500) NOT NULL DEFAULT '',
    Details             NVARCHAR(MAX) NULL,
    PremiumImpact       DECIMAL(18,2) NOT NULL DEFAULT 0,
    AffectedMemberCount INT NULL,
    DeletionReason      NVARCHAR(200) NULL,
    CreatedBy           INT NULL,
    CreatedAt           DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),

    CONSTRAINT FK_EndorsementHistory_Policy FOREIGN KEY (PolicyId) REFERENCES tblQuotations(QuotationId)
);
GO

CREATE INDEX IX_EndorsementHistory_PolicyId ON tblEndorsementHistory(PolicyId, CreatedAt DESC);
GO


-- ═══════════════════════════════════════════════════════════
--  TRIGGERS
-- ═══════════════════════════════════════════════════════════

CREATE TRIGGER trg_Quotations_UpdatedAt
ON tblQuotations AFTER UPDATE AS
BEGIN
    SET NOCOUNT ON;
    UPDATE q SET q.UpdatedAt = SYSDATETIMEOFFSET()
    FROM tblQuotations q INNER JOIN inserted i ON q.QuotationId = i.QuotationId;
END;
GO


-- ═══════════════════════════════════════════════════════════
--  STORED PROCEDURES — SPONSOR
-- ═══════════════════════════════════════════════════════════

CREATE PROCEDURE SPME_ValidateSponsor
    @SponsorNumber NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;

    IF LEN(@SponsorNumber) < 5
    BEGIN
        SELECT CAST(0 AS BIT) AS Success, NULL AS SponsorName, NULL AS SponsorStatus,
               'Invalid Sponsor Number. Must be at least 5 characters.' AS Error;
        RETURN;
    END

    -- Simulate lookup (replace with Wathaq integration)
    SELECT CAST(1 AS BIT) AS Success,
           'Sponsor ' + UPPER(@SponsorNumber) AS SponsorName,
           'Active' AS SponsorStatus,
           NULL AS Error;
END;
GO


-- ═══════════════════════════════════════════════════════════
--  STORED PROCEDURES — QUOTATION CRUD
-- ═══════════════════════════════════════════════════════════

CREATE PROCEDURE SPME_CreateQuotation
    @UserId             INT,
    @SponsorNumber      NVARCHAR(50),
    @PolicyEffectiveDate DATE = NULL,
    @SponsorName        NVARCHAR(200) = NULL,
    @SponsorStatus      NVARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @QuotationId INT;

    INSERT INTO tblQuotations (UserId) VALUES (@UserId);
    SET @QuotationId = SCOPE_IDENTITY();

    -- Generate quotation number
    UPDATE tblQuotations
    SET QuotationNumber = 'QT-' + FORMAT(GETDATE(), 'yyyyMMdd') + '-' + CAST(@QuotationId AS NVARCHAR(10))
    WHERE QuotationId = @QuotationId;

    INSERT INTO tblQuotationSponsors (QuotationId, SponsorNumber, PolicyEffectiveDate, SponsorName, SponsorStatus)
    VALUES (@QuotationId, @SponsorNumber, @PolicyEffectiveDate, @SponsorName, @SponsorStatus);

    SELECT @QuotationId;
END;
GO

CREATE PROCEDURE SPME_GetQuotation
    @QuotationId INT,
    @UserId      INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT QuotationId, UserId, Status, CurrentStep, QuotationNumber, PolicyNumber,
           TotalPremium, CreatedAt, UpdatedAt
    FROM tblQuotations
    WHERE QuotationId = @QuotationId AND UserId = @UserId;
END;
GO

CREATE PROCEDURE SPME_GetQuotationSponsor
    @QuotationId INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT SponsorNumber, PolicyEffectiveDate, SponsorName, SponsorStatus
    FROM tblQuotationSponsors
    WHERE QuotationId = @QuotationId;
END;
GO

CREATE PROCEDURE SPME_GetUserQuotations
    @UserId INT,
    @Top    INT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    IF @Top IS NOT NULL
    BEGIN
        SELECT TOP(@Top)
            q.QuotationId, q.Status, q.CurrentStep, q.QuotationNumber, q.PolicyNumber,
            q.TotalPremium, q.CreatedAt, q.UpdatedAt,
            s.SponsorName, s.SponsorNumber, s.PolicyEffectiveDate,
            (SELECT COUNT(*) FROM tblQuotationMembers m WHERE m.QuotationId = q.QuotationId) AS MemberCount
        FROM tblQuotations q
        LEFT JOIN tblQuotationSponsors s ON s.QuotationId = q.QuotationId
        WHERE q.UserId = @UserId
        ORDER BY q.UpdatedAt DESC;
    END
    ELSE
    BEGIN
        SELECT
            q.QuotationId, q.Status, q.CurrentStep, q.QuotationNumber, q.PolicyNumber,
            q.TotalPremium, q.CreatedAt, q.UpdatedAt,
            s.SponsorName, s.SponsorNumber, s.PolicyEffectiveDate,
            (SELECT COUNT(*) FROM tblQuotationMembers m WHERE m.QuotationId = q.QuotationId) AS MemberCount
        FROM tblQuotations q
        LEFT JOIN tblQuotationSponsors s ON s.QuotationId = q.QuotationId
        WHERE q.UserId = @UserId
        ORDER BY q.UpdatedAt DESC;
    END
END;
GO

CREATE PROCEDURE SPME_GetUserPolicies
    @UserId INT,
    @Top    INT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    IF @Top IS NOT NULL
    BEGIN
        SELECT TOP(@Top)
            q.QuotationId, q.Status, q.QuotationNumber, q.PolicyNumber,
            q.TotalPremium, q.CreatedAt, q.UpdatedAt,
            s.SponsorName, s.SponsorNumber, s.PolicyEffectiveDate,
            (SELECT COUNT(*) FROM tblQuotationMembers m WHERE m.QuotationId = q.QuotationId) AS MemberCount,
            (SELECT COUNT(*) FROM tblEndorsementHistory eh WHERE eh.PolicyId = q.QuotationId) AS EndorsementCount
        FROM tblQuotations q
        LEFT JOIN tblQuotationSponsors s ON s.QuotationId = q.QuotationId
        WHERE q.UserId = @UserId AND q.Status = 'paid' AND q.PolicyNumber IS NOT NULL
        ORDER BY q.UpdatedAt DESC;
    END
    ELSE
    BEGIN
        SELECT
            q.QuotationId, q.Status, q.QuotationNumber, q.PolicyNumber,
            q.TotalPremium, q.CreatedAt, q.UpdatedAt,
            s.SponsorName, s.SponsorNumber, s.PolicyEffectiveDate,
            (SELECT COUNT(*) FROM tblQuotationMembers m WHERE m.QuotationId = q.QuotationId) AS MemberCount,
            (SELECT COUNT(*) FROM tblEndorsementHistory eh WHERE eh.PolicyId = q.QuotationId) AS EndorsementCount
        FROM tblQuotations q
        LEFT JOIN tblQuotationSponsors s ON s.QuotationId = q.QuotationId
        WHERE q.UserId = @UserId AND q.Status = 'paid' AND q.PolicyNumber IS NOT NULL
        ORDER BY q.UpdatedAt DESC;
    END
END;
GO

CREATE PROCEDURE SPME_GetPolicyTopMembers
    @QuotationId INT,
    @Top         INT = 5
AS
BEGIN
    SET NOCOUNT ON;
    SELECT TOP(@Top) MemberId, MemberName, IdentityNumber, ClassSelection
    FROM tblQuotationMembers
    WHERE QuotationId = @QuotationId
    ORDER BY MemberId;
END;
GO

CREATE PROCEDURE SPME_UpdateQuotationStep
    @QuotationId INT,
    @UserId      INT,
    @Step        INT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @NewStatus NVARCHAR(20) = 'draft';
    IF @Step >= 5 SET @NewStatus = 'completed';

    UPDATE tblQuotations
    SET CurrentStep = @Step, Status = @NewStatus
    WHERE QuotationId = @QuotationId AND UserId = @UserId;
END;
GO

CREATE PROCEDURE SPME_UpdateQuotationStatus
    @QuotationId INT,
    @UserId      INT,
    @Status      NVARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE tblQuotations
    SET Status = @Status
    WHERE QuotationId = @QuotationId AND UserId = @UserId;
END;
GO


-- ═══════════════════════════════════════════════════════════
--  STORED PROCEDURES — MEMBERS
-- ═══════════════════════════════════════════════════════════

CREATE PROCEDURE SPME_GetQuotationMembers
    @QuotationId INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT MemberId, QuotationId, MemberType, MemberName, IdentityNumber,
           CONVERT(NVARCHAR(10), DateOfBirth, 120) AS DateOfBirth,
           Gender, MaritalStatus, ClassSelection, SponsorNumber, EmployeeId,
           HealthDeclaration, HealthAnswersJson, HeightCm, WeightKg,
           IsPregnant, ExpectedDeliveryDate, MaternityDays, Premium, CreatedAt
    FROM tblQuotationMembers
    WHERE QuotationId = @QuotationId
    ORDER BY MemberId;
END;
GO

CREATE PROCEDURE SPME_AddQuotationMember
    @QuotationId    INT,
    @MemberType     NVARCHAR(20),
    @MemberName     NVARCHAR(200),
    @IdentityNumber NVARCHAR(50),
    @DateOfBirth    DATE,
    @Gender         NVARCHAR(10),
    @MaritalStatus  NVARCHAR(20),
    @ClassSelection NVARCHAR(10),
    @SponsorNumber  NVARCHAR(50),
    @EmployeeId     NVARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @BasePremium DECIMAL(18,2);
    SELECT @BasePremium = ISNULL(BasePremium, 4500) FROM tblClassPremiums WHERE ClassSelection = @ClassSelection;

    INSERT INTO tblQuotationMembers
        (QuotationId, MemberType, MemberName, IdentityNumber, DateOfBirth, Gender,
         MaritalStatus, ClassSelection, SponsorNumber, EmployeeId, Premium)
    VALUES
        (@QuotationId, @MemberType, @MemberName, @IdentityNumber, @DateOfBirth, @Gender,
         @MaritalStatus, @ClassSelection, @SponsorNumber, @EmployeeId, @BasePremium);

    -- Update total
    UPDATE tblQuotations
    SET TotalPremium = (SELECT ISNULL(SUM(Premium), 0) FROM tblQuotationMembers WHERE QuotationId = @QuotationId)
    WHERE QuotationId = @QuotationId;

    SELECT CAST(SCOPE_IDENTITY() AS INT);
END;
GO

CREATE PROCEDURE SPME_UpdateQuotationMember
    @MemberId       INT,
    @MemberType     NVARCHAR(20),
    @MemberName     NVARCHAR(200),
    @IdentityNumber NVARCHAR(50),
    @DateOfBirth    DATE,
    @Gender         NVARCHAR(10),
    @MaritalStatus  NVARCHAR(20),
    @ClassSelection NVARCHAR(10),
    @SponsorNumber  NVARCHAR(50),
    @EmployeeId     NVARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @QuotationId INT, @BasePremium DECIMAL(18,2);
    SELECT @QuotationId = QuotationId FROM tblQuotationMembers WHERE MemberId = @MemberId;
    SELECT @BasePremium = ISNULL(BasePremium, 4500) FROM tblClassPremiums WHERE ClassSelection = @ClassSelection;

    -- Preserve health loading if already declared
    DECLARE @Loading DECIMAL(5,2) = 1.0;
    IF EXISTS (SELECT 1 FROM tblQuotationMembers WHERE MemberId = @MemberId AND HealthDeclaration = 'Yes')
        SET @Loading = 1.15;

    UPDATE tblQuotationMembers SET
        MemberType = @MemberType, MemberName = @MemberName, IdentityNumber = @IdentityNumber,
        DateOfBirth = @DateOfBirth, Gender = @Gender, MaritalStatus = @MaritalStatus,
        ClassSelection = @ClassSelection, SponsorNumber = @SponsorNumber, EmployeeId = @EmployeeId,
        Premium = ROUND(@BasePremium * @Loading, 2)
    WHERE MemberId = @MemberId;

    UPDATE tblQuotations
    SET TotalPremium = (SELECT ISNULL(SUM(Premium), 0) FROM tblQuotationMembers WHERE QuotationId = @QuotationId)
    WHERE QuotationId = @QuotationId;
END;
GO

CREATE PROCEDURE SPME_DeleteQuotationMember
    @MemberId    INT,
    @QuotationId INT
AS
BEGIN
    SET NOCOUNT ON;
    DELETE FROM tblQuotationMembers WHERE MemberId = @MemberId AND QuotationId = @QuotationId;

    UPDATE tblQuotations
    SET TotalPremium = (SELECT ISNULL(SUM(Premium), 0) FROM tblQuotationMembers WHERE QuotationId = @QuotationId)
    WHERE QuotationId = @QuotationId;
END;
GO


-- ═══════════════════════════════════════════════════════════
--  STORED PROCEDURES — HEALTH DECLARATION
-- ═══════════════════════════════════════════════════════════

CREATE PROCEDURE SPME_SaveHealthDeclaration
    @MemberId             INT,
    @QuotationId          INT = NULL,
    @HealthDeclaration    NVARCHAR(5),
    @HealthAnswersJson    NVARCHAR(MAX) = NULL,
    @HeightCm             NVARCHAR(10) = NULL,
    @WeightKg             NVARCHAR(10) = NULL,
    @IsPregnant           BIT = 0,
    @ExpectedDeliveryDate NVARCHAR(20) = NULL,
    @MaternityDays        NVARCHAR(10) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @QId INT, @Loading DECIMAL(5,2) = 1.0;
    SELECT @QId = ISNULL(@QuotationId, QuotationId) FROM tblQuotationMembers WHERE MemberId = @MemberId;

    IF @HealthDeclaration = 'Yes' SET @Loading = 1.15;  -- 15% health loading

    DECLARE @BasePremium DECIMAL(18,2);
    SELECT @BasePremium = ISNULL(cp.BasePremium, 4500)
    FROM tblQuotationMembers m
    JOIN tblClassPremiums cp ON cp.ClassSelection = m.ClassSelection
    WHERE m.MemberId = @MemberId;

    UPDATE tblQuotationMembers SET
        HealthDeclaration = @HealthDeclaration, HealthAnswersJson = @HealthAnswersJson,
        HeightCm = @HeightCm, WeightKg = @WeightKg,
        IsPregnant = @IsPregnant, ExpectedDeliveryDate = @ExpectedDeliveryDate,
        MaternityDays = @MaternityDays,
        Premium = ROUND(@BasePremium * @Loading, 2)
    WHERE MemberId = @MemberId;

    UPDATE tblQuotations
    SET TotalPremium = (SELECT ISNULL(SUM(Premium), 0) FROM tblQuotationMembers WHERE QuotationId = @QId)
    WHERE QuotationId = @QId;
END;
GO


-- ═══════════════════════════════════════════════════════════
--  STORED PROCEDURES — PREMIUM CALCULATION
-- ═══════════════════════════════════════════════════════════

CREATE PROCEDURE SPME_CalculateQuotationPremium
    @QuotationId INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT m.MemberId, m.MemberName, m.ClassSelection, m.HealthDeclaration,
           cp.BasePremium,
           CASE WHEN m.HealthDeclaration = 'Yes' THEN 15.0 ELSE 0.0 END AS LoadingPercent,
           m.Premium
    FROM tblQuotationMembers m
    LEFT JOIN tblClassPremiums cp ON cp.ClassSelection = m.ClassSelection
    WHERE m.QuotationId = @QuotationId
    ORDER BY m.MemberId;
END;
GO


-- ═══════════════════════════════════════════════════════════
--  STORED PROCEDURES — KYC
-- ═══════════════════════════════════════════════════════════

CREATE PROCEDURE SPME_SaveQuotationKyc
    @QuotationId            INT,
    @BuildingNumber         NVARCHAR(50),
    @AdditionalNumber       NVARCHAR(50),
    @UnitNumber             NVARCHAR(50),
    @PostalCode             NVARCHAR(20),
    @Street                 NVARCHAR(200),
    @District               NVARCHAR(200),
    @City                   NVARCHAR(100),
    @BusinessType           NVARCHAR(50),
    @CompanyRevenue         NVARCHAR(50),
    @NumberOfEmployees      NVARCHAR(20),
    @TaxRegistrationNumber  NVARCHAR(20),
    @IbanNumber             NVARCHAR(30),
    @BankName               NVARCHAR(100),
    @IsPEP                  BIT = NULL,
    @IsBoardMember          BIT = NULL,
    @BoardMembersJson       NVARCHAR(MAX) = NULL,
    @HasMajorShareholder    BIT = NULL,
    @ShareholdersJson       NVARCHAR(MAX) = NULL,
    @TermsAccepted          BIT = 0
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (SELECT 1 FROM tblQuotationKyc WHERE QuotationId = @QuotationId)
    BEGIN
        UPDATE tblQuotationKyc SET
            BuildingNumber = @BuildingNumber, AdditionalNumber = @AdditionalNumber,
            UnitNumber = @UnitNumber, PostalCode = @PostalCode,
            Street = @Street, District = @District, City = @City,
            BusinessType = @BusinessType, CompanyRevenue = @CompanyRevenue,
            NumberOfEmployees = @NumberOfEmployees, TaxRegistrationNumber = @TaxRegistrationNumber,
            IbanNumber = @IbanNumber, BankName = @BankName,
            IsPEP = @IsPEP, IsBoardMember = @IsBoardMember, BoardMembersJson = @BoardMembersJson,
            HasMajorShareholder = @HasMajorShareholder, ShareholdersJson = @ShareholdersJson,
            TermsAccepted = @TermsAccepted, Completed = 1
        WHERE QuotationId = @QuotationId;
    END
    ELSE
    BEGIN
        INSERT INTO tblQuotationKyc
            (QuotationId, BuildingNumber, AdditionalNumber, UnitNumber, PostalCode,
             Street, District, City, BusinessType, CompanyRevenue, NumberOfEmployees,
             TaxRegistrationNumber, IbanNumber, BankName, IsPEP, IsBoardMember,
             BoardMembersJson, HasMajorShareholder, ShareholdersJson, TermsAccepted, Completed)
        VALUES
            (@QuotationId, @BuildingNumber, @AdditionalNumber, @UnitNumber, @PostalCode,
             @Street, @District, @City, @BusinessType, @CompanyRevenue, @NumberOfEmployees,
             @TaxRegistrationNumber, @IbanNumber, @BankName, @IsPEP, @IsBoardMember,
             @BoardMembersJson, @HasMajorShareholder, @ShareholdersJson, @TermsAccepted, 1);
    END
END;
GO

CREATE PROCEDURE SPME_GetQuotationKyc
    @QuotationId INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT BuildingNumber, AdditionalNumber, UnitNumber, PostalCode,
           Street, District, City, BusinessType, CompanyRevenue, NumberOfEmployees,
           TaxRegistrationNumber, IbanNumber, BankName,
           IsPEP, IsBoardMember, BoardMembersJson,
           HasMajorShareholder, ShareholdersJson, TermsAccepted, Completed
    FROM tblQuotationKyc
    WHERE QuotationId = @QuotationId;
END;
GO


-- ═══════════════════════════════════════════════════════════
--  STORED PROCEDURES — PAYMENT
-- ═══════════════════════════════════════════════════════════

CREATE PROCEDURE SPME_ProcessQuotationPayment
    @QuotationId    INT,
    @PaymentMethod  NVARCHAR(50),
    @CardholderName NVARCHAR(200) = NULL,
    @TransactionRef NVARCHAR(100) = NULL,
    @Amount         DECIMAL(18,2)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;

    -- Generate transaction ref if not provided
    IF @TransactionRef IS NULL
        SET @TransactionRef = 'TXN-' + FORMAT(GETDATE(), 'yyyyMMddHHmmss') + '-' + CAST(@QuotationId AS NVARCHAR(10));

    INSERT INTO tblQuotationPayments (QuotationId, PaymentMethod, CardholderName, TransactionRef, Amount)
    VALUES (@QuotationId, @PaymentMethod, @CardholderName, @TransactionRef, @Amount);

    DECLARE @PaymentId INT = SCOPE_IDENTITY();

    -- Issue policy
    DECLARE @PolicyNumber NVARCHAR(50) = 'POL-' + FORMAT(GETDATE(), 'yyyyMMdd') + '-' + CAST(@QuotationId AS NVARCHAR(10));

    UPDATE tblQuotations
    SET Status = 'paid',
        PolicyNumber = @PolicyNumber,
        CurrentStep = 5
    WHERE QuotationId = @QuotationId;

    -- Create initial endorsement history entry for policy issuance
    DECLARE @MemberCount INT;
    SELECT @MemberCount = COUNT(*) FROM tblQuotationMembers WHERE QuotationId = @QuotationId;

    INSERT INTO tblEndorsementHistory
        (PolicyId, EndorsementType, Status, Description, Details, PremiumImpact, AffectedMemberCount)
    VALUES
        (@QuotationId, 'policy_issued', 'approved',
         'Policy issued with ' + CAST(@MemberCount AS NVARCHAR(10)) + ' member(s)',
         'Policy ' + @PolicyNumber + ' created. Total premium: SAR ' + CAST(@Amount AS NVARCHAR(20)),
         @Amount, @MemberCount);

    COMMIT;

    -- Return payment details
    SELECT @PaymentId AS PaymentId, @PaymentMethod AS PaymentMethod,
           @TransactionRef AS TransactionRef, @Amount AS Amount,
           SYSDATETIMEOFFSET() AS PaidAt;
END;
GO

CREATE PROCEDURE SPME_GetQuotationPayment
    @QuotationId INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT TOP 1 PaymentId, PaymentMethod, TransactionRef, Amount, PaidAt
    FROM tblQuotationPayments
    WHERE QuotationId = @QuotationId
    ORDER BY PaidAt DESC;
END;
GO


-- ═══════════════════════════════════════════════════════════
--  STORED PROCEDURES — ENDORSEMENT HISTORY
-- ═══════════════════════════════════════════════════════════

CREATE PROCEDURE SPME_GetPolicyEndorsementHistory
    @PolicyId INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT eh.EndorsementId, eh.PolicyId, eh.EndorsementType, eh.Status,
           eh.Description, eh.Details, eh.PremiumImpact, eh.AffectedMemberCount,
           eh.DeletionReason, eh.CreatedAt,
           u.FullName AS CreatedByName
    FROM tblEndorsementHistory eh
    LEFT JOIN tblOnlineUsers u ON u.UserId = eh.CreatedBy
    WHERE eh.PolicyId = @PolicyId
    ORDER BY eh.CreatedAt DESC;
END;
GO

CREATE PROCEDURE SPME_GetPolicyEndorsementHistoryCount
    @PolicyId  INT,
    @Type      NVARCHAR(30) = NULL,
    @Status    NVARCHAR(20) = NULL,
    @FromDate  DATETIMEOFFSET = NULL,
    @ToDate    DATETIMEOFFSET = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT COUNT(*)
    FROM tblEndorsementHistory
    WHERE PolicyId = @PolicyId
      AND (@Type IS NULL OR EndorsementType = @Type)
      AND (@Status IS NULL OR Status = @Status)
      AND (@FromDate IS NULL OR CreatedAt >= @FromDate)
      AND (@ToDate IS NULL OR CreatedAt <= @ToDate);
END;
GO

CREATE PROCEDURE SPME_GetPolicyEndorsementHistoryPaged
    @PolicyId  INT,
    @Type      NVARCHAR(30) = NULL,
    @Status    NVARCHAR(20) = NULL,
    @FromDate  DATETIMEOFFSET = NULL,
    @ToDate    DATETIMEOFFSET = NULL,
    @Page      INT = 1,
    @PageSize  INT = 20
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @Offset INT = (@Page - 1) * @PageSize;

    SELECT eh.EndorsementId, eh.PolicyId, eh.EndorsementType, eh.Status,
           eh.Description, eh.Details, eh.PremiumImpact, eh.AffectedMemberCount,
           eh.DeletionReason, eh.CreatedAt,
           u.FullName AS CreatedByName
    FROM tblEndorsementHistory eh
    LEFT JOIN tblOnlineUsers u ON u.UserId = eh.CreatedBy
    WHERE eh.PolicyId = @PolicyId
      AND (@Type IS NULL OR eh.EndorsementType = @Type)
      AND (@Status IS NULL OR eh.Status = @Status)
      AND (@FromDate IS NULL OR eh.CreatedAt >= @FromDate)
      AND (@ToDate IS NULL OR eh.CreatedAt <= @ToDate)
    ORDER BY eh.CreatedAt DESC
    OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY;
END;
GO


-- ═══════════════════════════════════════════════════════════
--  STORED PROCEDURES — DASHBOARD
-- ═══════════════════════════════════════════════════════════

CREATE PROCEDURE SPME_GetDashboardSummary
    @UserId INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        (SELECT COUNT(*) FROM tblQuotations WHERE UserId = @UserId) AS TotalQuotations,
        (SELECT COUNT(*) FROM tblQuotations WHERE UserId = @UserId AND Status = 'draft') AS DraftQuotations,
        (SELECT COUNT(*) FROM tblQuotations WHERE UserId = @UserId AND Status = 'completed') AS CompletedQuotations,
        (SELECT COUNT(*) FROM tblQuotations WHERE UserId = @UserId AND Status = 'paid' AND PolicyNumber IS NOT NULL) AS ActivePolicies,
        (SELECT ISNULL(SUM(TotalPremium), 0) FROM tblQuotations WHERE UserId = @UserId AND Status = 'paid') AS TotalPremium,
        (SELECT COUNT(*) FROM tblQuotationMembers m JOIN tblQuotations q ON q.QuotationId = m.QuotationId WHERE q.UserId = @UserId AND q.Status = 'paid') AS TotalMembers,
        (SELECT COUNT(*) FROM tblEndorsementHistory eh JOIN tblQuotations q ON q.QuotationId = eh.PolicyId WHERE q.UserId = @UserId) AS TotalEndorsements;
END;
GO


-- ═══════════════════════════════════════════════════════════
--  STORED PROCEDURES — DOCUMENT DOWNLOAD (STUBS)
-- ═══════════════════════════════════════════════════════════

CREATE PROCEDURE SPME_GetQuotationDocument
    @QuotationId INT,
    @UserId      INT
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM tblQuotations WHERE QuotationId = @QuotationId AND UserId = @UserId)
    BEGIN
        SELECT NULL AS FileContent, NULL AS FileName, NULL AS ContentType;
        RETURN;
    END
    -- In production, retrieve from document storage
    SELECT NULL AS FileContent,
           'Quotation-' + CAST(@QuotationId AS NVARCHAR(10)) + '.pdf' AS FileName,
           'application/pdf' AS ContentType;
END;
GO

CREATE PROCEDURE SPME_GetPolicyDocument
    @QuotationId INT,
    @UserId      INT
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM tblQuotations WHERE QuotationId = @QuotationId AND UserId = @UserId AND Status = 'paid')
    BEGIN
        SELECT NULL AS FileContent, NULL AS FileName, NULL AS ContentType;
        RETURN;
    END
    SELECT NULL AS FileContent,
           'Policy-' + CAST(@QuotationId AS NVARCHAR(10)) + '.pdf' AS FileName,
           'application/pdf' AS ContentType;
END;
GO

CREATE PROCEDURE SPME_GetEndorsementDocument
    @EndorsementId INT,
    @UserId        INT
AS
BEGIN
    SET NOCOUNT ON;
    -- Validate user owns the policy
    IF NOT EXISTS (
        SELECT 1 FROM tblEndorsementHistory eh
        JOIN tblQuotations q ON q.QuotationId = eh.PolicyId
        WHERE eh.EndorsementId = @EndorsementId AND q.UserId = @UserId
    )
    BEGIN
        SELECT NULL AS FileContent, NULL AS FileName, NULL AS ContentType;
        RETURN;
    END
    SELECT NULL AS FileContent,
           'Endorsement-' + CAST(@EndorsementId AS NVARCHAR(10)) + '.pdf' AS FileName,
           'application/pdf' AS ContentType;
END;
GO
