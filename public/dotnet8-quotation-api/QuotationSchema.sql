-- ============================================================
-- Quotation Module Schema — SQL Server
-- For use with .NET 8 Dapper API
-- ============================================================

-- ── Tables ──

CREATE TABLE tblQuotations (
    QuotationId      INT IDENTITY(1,1) PRIMARY KEY,
    UserId           INT NOT NULL,
    Status           NVARCHAR(20) NOT NULL DEFAULT 'draft',       -- draft | completed | paid
    CurrentStep      INT NOT NULL DEFAULT 0,                      -- 0-5
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
    BusinessType           NVARCHAR(50) NOT NULL DEFAULT '',
    CompanyRevenue         NVARCHAR(50) NOT NULL DEFAULT '',
    NumberOfEmployees      NVARCHAR(20) NOT NULL DEFAULT '',
    TaxRegistrationNumber  NVARCHAR(20) NOT NULL DEFAULT '',
    IbanNumber             NVARCHAR(30) NOT NULL DEFAULT '',
    BankName               NVARCHAR(100) NOT NULL DEFAULT '',
    -- Compliance
    IsPEP                  BIT NULL,
    IsBoardMember          BIT NULL,
    BoardMembersJson       NVARCHAR(MAX) NULL,
    HasMajorShareholder    BIT NULL,
    ShareholdersJson       NVARCHAR(MAX) NULL,
    TermsAccepted          BIT NOT NULL DEFAULT 0,

    CONSTRAINT FK_Kyc_Quotation FOREIGN KEY (QuotationId) REFERENCES tblQuotations(QuotationId) ON DELETE CASCADE
);
GO

CREATE TABLE tblQuotationPayments (
    PaymentId       INT IDENTITY(1,1) PRIMARY KEY,
    QuotationId     INT NOT NULL,
    PaymentMethod   NVARCHAR(50) NOT NULL,
    TransactionRef  NVARCHAR(100) NULL,
    Amount          DECIMAL(18,2) NOT NULL,
    PaidAt          DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),

    CONSTRAINT FK_Payments_Quotation FOREIGN KEY (QuotationId) REFERENCES tblQuotations(QuotationId) ON DELETE CASCADE
);
GO

-- ── Auto-update trigger ──

CREATE TRIGGER trg_Quotations_UpdatedAt
ON tblQuotations AFTER UPDATE AS
BEGIN
    SET NOCOUNT ON;
    UPDATE q SET q.UpdatedAt = SYSDATETIMEOFFSET()
    FROM tblQuotations q INNER JOIN inserted i ON q.QuotationId = i.QuotationId;
END;
GO

-- ── Premium lookup ──

CREATE TABLE tblClassPremiums (
    ClassSelection NVARCHAR(10) PRIMARY KEY,
    BasePremium    DECIMAL(18,2) NOT NULL
);
GO

INSERT INTO tblClassPremiums VALUES ('VIP', 12000), ('A', 8500), ('B', 6000), ('C', 4500), ('LM', 3000);
GO


-- ============================================================
-- Stored Procedures
-- ============================================================

-- Validate Sponsor (stub — replace with Wathaq integration)
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

    -- Simulate lookup
    SELECT CAST(1 AS BIT) AS Success,
           'Sponsor ' + UPPER(@SponsorNumber) AS SponsorName,
           'Active' AS SponsorStatus,
           NULL AS Error;
END;
GO

-- Create Quotation
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

-- Get Quotation
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

-- Get Sponsor Data
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

-- Get Members
CREATE PROCEDURE SPME_GetQuotationMembers
    @QuotationId INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT MemberId, QuotationId, MemberType, MemberName, IdentityNumber, 
           CONVERT(NVARCHAR(10), DateOfBirth, 120) AS DateOfBirth,
           Gender, MaritalStatus, ClassSelection, SponsorNumber, EmployeeId,
           HealthDeclaration, HealthAnswersJson, HeightCm, WeightKg,
           IsPregnant, ExpectedDeliveryDate, MaternityDays, Premium
    FROM tblQuotationMembers
    WHERE QuotationId = @QuotationId
    ORDER BY MemberId;
END;
GO

-- Get KYC
CREATE PROCEDURE SPME_GetQuotationKyc
    @QuotationId INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT * FROM tblQuotationKyc WHERE QuotationId = @QuotationId;
END;
GO

-- User Quotations List
CREATE PROCEDURE SPME_GetUserQuotations
    @UserId INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT q.QuotationId, q.Status, q.QuotationNumber, q.PolicyNumber,
           q.TotalPremium, q.CreatedAt, q.UpdatedAt,
           s.SponsorName,
           (SELECT COUNT(*) FROM tblQuotationMembers m WHERE m.QuotationId = q.QuotationId) AS MemberCount
    FROM tblQuotations q
    LEFT JOIN tblQuotationSponsors s ON s.QuotationId = q.QuotationId
    WHERE q.UserId = @UserId
    ORDER BY q.UpdatedAt DESC;
END;
GO

-- User Policies (paid quotations with policy number)
CREATE PROCEDURE SPME_GetUserPolicies
    @UserId INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT q.QuotationId, q.Status, q.QuotationNumber, q.PolicyNumber,
           q.TotalPremium, q.CreatedAt, q.UpdatedAt,
           s.SponsorName,
           (SELECT COUNT(*) FROM tblQuotationMembers m WHERE m.QuotationId = q.QuotationId) AS MemberCount
    FROM tblQuotations q
    LEFT JOIN tblQuotationSponsors s ON s.QuotationId = q.QuotationId
    WHERE q.UserId = @UserId AND q.Status = 'paid' AND q.PolicyNumber IS NOT NULL
    ORDER BY q.UpdatedAt DESC;
END;
GO

-- Add Member
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

-- Update Member
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

    UPDATE tblQuotationMembers SET
        MemberType = @MemberType, MemberName = @MemberName, IdentityNumber = @IdentityNumber,
        DateOfBirth = @DateOfBirth, Gender = @Gender, MaritalStatus = @MaritalStatus,
        ClassSelection = @ClassSelection, SponsorNumber = @SponsorNumber, EmployeeId = @EmployeeId,
        Premium = @BasePremium
    WHERE MemberId = @MemberId;

    UPDATE tblQuotations
    SET TotalPremium = (SELECT ISNULL(SUM(Premium), 0) FROM tblQuotationMembers WHERE QuotationId = @QuotationId)
    WHERE QuotationId = @QuotationId;
END;
GO

-- Delete Member
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

-- Save Health Declaration
CREATE PROCEDURE SPME_SaveHealthDeclaration
    @MemberId             INT,
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

    DECLARE @QuotationId INT, @Loading DECIMAL(5,2) = 1.0;
    SELECT @QuotationId = QuotationId FROM tblQuotationMembers WHERE MemberId = @MemberId;

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
    SET TotalPremium = (SELECT ISNULL(SUM(Premium), 0) FROM tblQuotationMembers WHERE QuotationId = @QuotationId)
    WHERE QuotationId = @QuotationId;
END;
GO

-- Calculate Premium (returns member-level breakdown)
CREATE PROCEDURE SPME_CalculateQuotationPremium
    @QuotationId INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT MemberId, MemberName, ClassSelection, Premium
    FROM tblQuotationMembers
    WHERE QuotationId = @QuotationId
    ORDER BY MemberId;
END;
GO

-- Save KYC
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
            TermsAccepted = @TermsAccepted
        WHERE QuotationId = @QuotationId;
    END
    ELSE
    BEGIN
        INSERT INTO tblQuotationKyc
            (QuotationId, BuildingNumber, AdditionalNumber, UnitNumber, PostalCode,
             Street, District, City, BusinessType, CompanyRevenue, NumberOfEmployees,
             TaxRegistrationNumber, IbanNumber, BankName, IsPEP, IsBoardMember,
             BoardMembersJson, HasMajorShareholder, ShareholdersJson, TermsAccepted)
        VALUES
            (@QuotationId, @BuildingNumber, @AdditionalNumber, @UnitNumber, @PostalCode,
             @Street, @District, @City, @BusinessType, @CompanyRevenue, @NumberOfEmployees,
             @TaxRegistrationNumber, @IbanNumber, @BankName, @IsPEP, @IsBoardMember,
             @BoardMembersJson, @HasMajorShareholder, @ShareholdersJson, @TermsAccepted);
    END
END;
GO

-- Update Step
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

-- Process Payment
CREATE PROCEDURE SPME_ProcessQuotationPayment
    @QuotationId    INT,
    @PaymentMethod  NVARCHAR(50),
    @TransactionRef NVARCHAR(100) = NULL,
    @Amount         DECIMAL(18,2)
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO tblQuotationPayments (QuotationId, PaymentMethod, TransactionRef, Amount)
    VALUES (@QuotationId, @PaymentMethod, @TransactionRef, @Amount);

    -- Issue policy
    UPDATE tblQuotations
    SET Status = 'paid',
        PolicyNumber = 'POL-' + FORMAT(GETDATE(), 'yyyyMMdd') + '-' + CAST(@QuotationId AS NVARCHAR(10)),
        CurrentStep = 5
    WHERE QuotationId = @QuotationId;
END;
GO

-- Get Quotation Document (stub — replace with actual doc storage)
CREATE PROCEDURE SPME_GetQuotationDocument
    @QuotationId INT,
    @UserId      INT
AS
BEGIN
    SET NOCOUNT ON;
    -- Return NULL if not owner
    IF NOT EXISTS (SELECT 1 FROM tblQuotations WHERE QuotationId = @QuotationId AND UserId = @UserId)
    BEGIN
        SELECT NULL AS FileContent, NULL AS FileName, NULL AS ContentType;
        RETURN;
    END
    -- In production, retrieve from document storage
    -- For now return placeholder
    SELECT NULL AS FileContent,
           'Quotation-' + CAST(@QuotationId AS NVARCHAR(10)) + '.pdf' AS FileName,
           'application/pdf' AS ContentType;
END;
GO

-- Get Policy Document (stub)
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
