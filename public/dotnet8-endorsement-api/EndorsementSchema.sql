-- ═══════════════════════════════════════════════════════════════
-- ENDORSEMENT MODULE - SQL Server Schema
-- ═══════════════════════════════════════════════════════════════

-- ── Endorsement Header ─────────────────────────────────────
CREATE TABLE tblEndorsements (
    EndorsementId       INT IDENTITY(1,1) PRIMARY KEY,
    PolicyId            INT NOT NULL REFERENCES tblQuotations(QuotationId),
    UserId              INT NOT NULL REFERENCES tblOnlineUsers(UserId),
    EndorsementType     VARCHAR(20) NOT NULL CHECK (EndorsementType IN ('AddMember','UpdateMember','DeleteMember')),
    Status              VARCHAR(20) NOT NULL DEFAULT 'Pending' CHECK (Status IN ('Pending','PaymentRequired','Approved','Rejected','Cancelled')),
    PremiumDifference   DECIMAL(12,2) DEFAULT 0,
    RefundAmount        DECIMAL(12,2) DEFAULT 0,
    NewTotalPremium     DECIMAL(12,2) DEFAULT 0,
    DeletionReason      NVARCHAR(200) NULL,
    CreatedAt           DATETIME2 DEFAULT GETUTCDATE(),
    UpdatedAt           DATETIME2 DEFAULT GETUTCDATE(),
    ApprovedAt          DATETIME2 NULL
);

-- ── Endorsement Members (new members for Add endorsement) ──
CREATE TABLE tblEndorsementMembers (
    Id                  INT IDENTITY(1,1) PRIMARY KEY,
    EndorsementId       INT NOT NULL REFERENCES tblEndorsements(EndorsementId),
    MemberType          VARCHAR(20) NOT NULL DEFAULT 'Employee',
    MemberName          NVARCHAR(200) NOT NULL,
    IdentityNumber      VARCHAR(20) NOT NULL,
    DateOfBirth         VARCHAR(10) NULL,
    Gender              VARCHAR(10) DEFAULT 'Male',
    MaritalStatus       VARCHAR(10) DEFAULT 'Single',
    ClassSelection      VARCHAR(5) DEFAULT 'B',
    EmployeeId          INT NULL,
    HealthDeclaration   VARCHAR(3) DEFAULT 'No',
    HealthAnswers       NVARCHAR(MAX) NULL, -- JSON
    HeightCm            DECIMAL(5,1) NULL,
    WeightKg            DECIMAL(5,1) NULL,
    CalculatedPremium   DECIMAL(12,2) DEFAULT 0,
    CreatedAt           DATETIME2 DEFAULT GETUTCDATE()
);

-- ── Endorsement Deletions ──────────────────────────────────
CREATE TABLE tblEndorsementDeletions (
    Id                  INT IDENTITY(1,1) PRIMARY KEY,
    EndorsementId       INT NOT NULL REFERENCES tblEndorsements(EndorsementId),
    MemberId            INT NOT NULL REFERENCES tblQuotationMembers(MemberId),
    DeletionReason      NVARCHAR(200) NOT NULL,
    RefundAmount        DECIMAL(12,2) DEFAULT 0,
    CreatedAt           DATETIME2 DEFAULT GETUTCDATE()
);

-- ── Endorsement Payments ───────────────────────────────────
CREATE TABLE tblEndorsementPayments (
    PaymentId           INT IDENTITY(1,1) PRIMARY KEY,
    EndorsementId       INT NOT NULL REFERENCES tblEndorsements(EndorsementId),
    Amount              DECIMAL(12,2) NOT NULL,
    CardholderName      NVARCHAR(200) NULL,
    CardLast4           VARCHAR(4) NULL,
    PaymentType         VARCHAR(10) DEFAULT 'credit',
    PaymentStatus       VARCHAR(20) DEFAULT 'Pending',
    TransactionRef      VARCHAR(50) NULL,
    CreatedAt           DATETIME2 DEFAULT GETUTCDATE()
);

-- ── Endorsement Audit Log ──────────────────────────────────
CREATE TABLE tblEndorsementAudit (
    AuditId             INT IDENTITY(1,1) PRIMARY KEY,
    EndorsementId       INT NOT NULL REFERENCES tblEndorsements(EndorsementId),
    Action              VARCHAR(50) NOT NULL,
    OldValue            NVARCHAR(MAX) NULL,
    NewValue            NVARCHAR(MAX) NULL,
    PerformedBy         INT NOT NULL,
    CreatedAt           DATETIME2 DEFAULT GETUTCDATE()
);

GO

-- ═══════════════════════════════════════════════════════════
-- STORED PROCEDURES
-- ═══════════════════════════════════════════════════════════

-- ── Create Endorsement Header ──────────────────────────────
CREATE OR ALTER PROCEDURE SPME_CreateEndorsement
    @PolicyId   INT,
    @UserId     INT,
    @Type       VARCHAR(20)
AS
BEGIN
    INSERT INTO tblEndorsements (PolicyId, UserId, EndorsementType, Status)
    VALUES (@PolicyId, @UserId, @Type, 'Pending');
    SELECT CAST(SCOPE_IDENTITY() AS INT);
END
GO

-- ── Insert Endorsement Member ──────────────────────────────
CREATE OR ALTER PROCEDURE SPME_InsertEndorsementMember
    @EndorsementId      INT,
    @MemberType         VARCHAR(20),
    @MemberName         NVARCHAR(200),
    @IdentityNumber     VARCHAR(20),
    @DateOfBirth        VARCHAR(10),
    @Gender             VARCHAR(10),
    @MaritalStatus      VARCHAR(10),
    @ClassSelection     VARCHAR(5),
    @EmployeeId         INT = NULL,
    @HealthDeclaration  VARCHAR(3),
    @HealthAnswers      NVARCHAR(MAX) = NULL,
    @HeightCm           DECIMAL(5,1) = NULL,
    @WeightKg           DECIMAL(5,1) = NULL
AS
BEGIN
    DECLARE @Premium DECIMAL(12,2);

    -- Calculate premium based on class
    SELECT @Premium = ISNULL(PremiumAmount, 4500)
    FROM tblClassPremiums
    WHERE ClassName = @ClassSelection;

    -- Apply health loading (15%)
    IF @HealthDeclaration = 'Yes'
        SET @Premium = @Premium * 1.15;

    INSERT INTO tblEndorsementMembers (
        EndorsementId, MemberType, MemberName, IdentityNumber, DateOfBirth,
        Gender, MaritalStatus, ClassSelection, EmployeeId,
        HealthDeclaration, HealthAnswers, HeightCm, WeightKg, CalculatedPremium
    )
    VALUES (
        @EndorsementId, @MemberType, @MemberName, @IdentityNumber, @DateOfBirth,
        @Gender, @MaritalStatus, @ClassSelection, @EmployeeId,
        @HealthDeclaration, @HealthAnswers, @HeightCm, @WeightKg, @Premium
    );
END
GO

-- ── Calculate Add Member Premium Difference ────────────────
CREATE OR ALTER PROCEDURE SPME_CalculateAddMemberPremium
    @EndorsementId INT
AS
BEGIN
    DECLARE @PolicyId INT, @CurrentPremium DECIMAL(12,2), @AdditionalPremium DECIMAL(12,2);

    SELECT @PolicyId = PolicyId FROM tblEndorsements WHERE EndorsementId = @EndorsementId;
    SELECT @CurrentPremium = ISNULL(TotalPremium, 0) FROM tblQuotations WHERE QuotationId = @PolicyId;
    SELECT @AdditionalPremium = ISNULL(SUM(CalculatedPremium), 0) FROM tblEndorsementMembers WHERE EndorsementId = @EndorsementId;

    SELECT
        @CurrentPremium AS CurrentPremium,
        @AdditionalPremium AS AdditionalPremium,
        @CurrentPremium + @AdditionalPremium AS NewTotalPremium;
END
GO

-- ── Update Endorsement Premium ─────────────────────────────
CREATE OR ALTER PROCEDURE SPME_UpdateEndorsementPremium
    @EndorsementId      INT,
    @AdditionalPremium  DECIMAL(12,2),
    @NewTotalPremium    DECIMAL(12,2),
    @Status             VARCHAR(20)
AS
BEGIN
    UPDATE tblEndorsements
    SET PremiumDifference = @AdditionalPremium,
        NewTotalPremium = @NewTotalPremium,
        Status = @Status,
        UpdatedAt = GETUTCDATE()
    WHERE EndorsementId = @EndorsementId;
END
GO

-- ── Record Endorsement Payment ─────────────────────────────
CREATE OR ALTER PROCEDURE SPME_RecordEndorsementPayment
    @EndorsementId      INT,
    @CardholderName     NVARCHAR(200),
    @CardLast4          VARCHAR(4),
    @PaymentType        VARCHAR(10),
    @PaymentStatus      VARCHAR(20),
    @TransactionRef     VARCHAR(50)
AS
BEGIN
    DECLARE @Amount DECIMAL(12,2);
    SELECT @Amount = PremiumDifference FROM tblEndorsements WHERE EndorsementId = @EndorsementId;

    INSERT INTO tblEndorsementPayments (EndorsementId, Amount, CardholderName, CardLast4, PaymentType, PaymentStatus, TransactionRef)
    VALUES (@EndorsementId, @Amount, @CardholderName, @CardLast4, @PaymentType, @PaymentStatus, @TransactionRef);
END
GO

-- ── Approve Add Member Endorsement ─────────────────────────
CREATE OR ALTER PROCEDURE SPME_ApproveAddMemberEndorsement
    @EndorsementId INT
AS
BEGIN
    DECLARE @PolicyId INT;
    SELECT @PolicyId = PolicyId FROM tblEndorsements WHERE EndorsementId = @EndorsementId;

    -- Copy endorsement members to policy members
    INSERT INTO tblQuotationMembers (QuotationId, MemberType, MemberName, IdentityNumber, DateOfBirth, Gender, MaritalStatus, ClassSelection, EmployeeId, HealthDeclaration, HealthAnswers, HeightCm, WeightKg)
    SELECT @PolicyId, MemberType, MemberName, IdentityNumber, DateOfBirth, Gender, MaritalStatus, ClassSelection, EmployeeId, HealthDeclaration, HealthAnswers, HeightCm, WeightKg
    FROM tblEndorsementMembers
    WHERE EndorsementId = @EndorsementId;

    -- Update policy total premium
    UPDATE tblQuotations
    SET TotalPremium = (SELECT NewTotalPremium FROM tblEndorsements WHERE EndorsementId = @EndorsementId),
        UpdatedAt = GETUTCDATE()
    WHERE QuotationId = @PolicyId;

    -- Mark endorsement as approved
    UPDATE tblEndorsements
    SET Status = 'Approved', ApprovedAt = GETUTCDATE(), UpdatedAt = GETUTCDATE()
    WHERE EndorsementId = @EndorsementId;

    SELECT EndorsementId, EndorsementType, 'Approved' AS Status,
           PremiumDifference, RefundAmount, NewTotalPremium,
           'Members added to policy successfully.' AS Message
    FROM tblEndorsements
    WHERE EndorsementId = @EndorsementId;
END
GO

-- ── Update Policy Member (basic details) ───────────────────
CREATE OR ALTER PROCEDURE SPME_UpdatePolicyMember
    @MemberId       INT,
    @MemberName     NVARCHAR(200),
    @Gender         VARCHAR(10),
    @MaritalStatus  VARCHAR(10),
    @DateOfBirth    VARCHAR(10),
    @EndorsementId  INT
AS
BEGIN
    -- Capture old values for audit
    DECLARE @OldName NVARCHAR(200), @OldGender VARCHAR(10), @OldMarital VARCHAR(10);
    SELECT @OldName = MemberName, @OldGender = Gender, @OldMarital = MaritalStatus
    FROM tblQuotationMembers WHERE MemberId = @MemberId;

    -- Update
    UPDATE tblQuotationMembers
    SET MemberName = @MemberName, Gender = @Gender, MaritalStatus = @MaritalStatus,
        DateOfBirth = @DateOfBirth, UpdatedAt = GETUTCDATE()
    WHERE MemberId = @MemberId;

    -- Audit log
    INSERT INTO tblEndorsementAudit (EndorsementId, Action, OldValue, NewValue, PerformedBy)
    VALUES (@EndorsementId, 'UpdateMember',
        CONCAT('Name:', @OldName, ', Gender:', @OldGender, ', Marital:', @OldMarital),
        CONCAT('Name:', @MemberName, ', Gender:', @Gender, ', Marital:', @MaritalStatus),
        (SELECT UserId FROM tblEndorsements WHERE EndorsementId = @EndorsementId));
END
GO

-- ── Auto-Approve Endorsement ───────────────────────────────
CREATE OR ALTER PROCEDURE SPME_AutoApproveEndorsement
    @EndorsementId INT
AS
BEGIN
    UPDATE tblEndorsements
    SET Status = 'Approved', ApprovedAt = GETUTCDATE(), UpdatedAt = GETUTCDATE()
    WHERE EndorsementId = @EndorsementId;
END
GO

-- ── Mark Member for Deletion ───────────────────────────────
CREATE OR ALTER PROCEDURE SPME_MarkMemberForDeletion
    @EndorsementId      INT,
    @MemberId           INT,
    @DeletionReason     NVARCHAR(200)
AS
BEGIN
    DECLARE @Refund DECIMAL(12,2);

    -- Get member's premium
    SELECT @Refund = ISNULL(cp.PremiumAmount, 4500)
    FROM tblQuotationMembers qm
    LEFT JOIN tblClassPremiums cp ON cp.ClassName = qm.ClassSelection
    WHERE qm.MemberId = @MemberId;

    -- Apply health loading if applicable
    IF EXISTS (SELECT 1 FROM tblQuotationMembers WHERE MemberId = @MemberId AND HealthDeclaration = 'Yes')
        SET @Refund = @Refund * 1.15;

    INSERT INTO tblEndorsementDeletions (EndorsementId, MemberId, DeletionReason, RefundAmount)
    VALUES (@EndorsementId, @MemberId, @DeletionReason, @Refund);
END
GO

-- ── Calculate Delete Refund ────────────────────────────────
CREATE OR ALTER PROCEDURE SPME_CalculateDeleteRefund
    @EndorsementId INT
AS
BEGIN
    DECLARE @PolicyId INT, @CurrentPremium DECIMAL(12,2), @TotalRefund DECIMAL(12,2), @RemainingCount INT;

    SELECT @PolicyId = PolicyId FROM tblEndorsements WHERE EndorsementId = @EndorsementId;
    SELECT @CurrentPremium = ISNULL(TotalPremium, 0) FROM tblQuotations WHERE QuotationId = @PolicyId;
    SELECT @TotalRefund = ISNULL(SUM(RefundAmount), 0) FROM tblEndorsementDeletions WHERE EndorsementId = @EndorsementId;

    SELECT @RemainingCount = COUNT(*)
    FROM tblQuotationMembers
    WHERE QuotationId = @PolicyId
      AND MemberId NOT IN (SELECT MemberId FROM tblEndorsementDeletions WHERE EndorsementId = @EndorsementId);

    -- Update endorsement
    UPDATE tblEndorsements
    SET RefundAmount = @TotalRefund,
        NewTotalPremium = @CurrentPremium - @TotalRefund,
        UpdatedAt = GETUTCDATE()
    WHERE EndorsementId = @EndorsementId;

    SELECT
        @CurrentPremium AS CurrentPremium,
        @TotalRefund AS RefundAmount,
        @CurrentPremium - @TotalRefund AS NewTotalPremium,
        @RemainingCount AS RemainingMembers;
END
GO

-- ── Approve Delete Endorsement ─────────────────────────────
CREATE OR ALTER PROCEDURE SPME_ApproveDeleteEndorsement
    @EndorsementId INT
AS
BEGIN
    DECLARE @PolicyId INT;
    SELECT @PolicyId = PolicyId FROM tblEndorsements WHERE EndorsementId = @EndorsementId;

    -- Remove members from policy
    DELETE FROM tblQuotationMembers
    WHERE MemberId IN (SELECT MemberId FROM tblEndorsementDeletions WHERE EndorsementId = @EndorsementId);

    -- Update policy premium
    UPDATE tblQuotations
    SET TotalPremium = (SELECT NewTotalPremium FROM tblEndorsements WHERE EndorsementId = @EndorsementId),
        UpdatedAt = GETUTCDATE()
    WHERE QuotationId = @PolicyId;

    -- Approve
    UPDATE tblEndorsements
    SET Status = 'Approved', ApprovedAt = GETUTCDATE(), UpdatedAt = GETUTCDATE()
    WHERE EndorsementId = @EndorsementId;
END
GO

-- ── Get Member ID by Identity Number ───────────────────────
CREATE OR ALTER PROCEDURE SPME_GetMemberIdByIdentity
    @PolicyId       INT,
    @IdentityNumber VARCHAR(20)
AS
BEGIN
    SELECT TOP 1 MemberId
    FROM tblQuotationMembers
    WHERE QuotationId = @PolicyId AND IdentityNumber = @IdentityNumber;
END
GO

-- ── Endorsement History ────────────────────────────────────
CREATE OR ALTER PROCEDURE SPME_GetEndorsementHistory
    @PolicyId INT
AS
BEGIN
    SELECT EndorsementId, EndorsementType, Status,
           PremiumDifference, RefundAmount, NewTotalPremium,
           CASE EndorsementType
               WHEN 'AddMember' THEN CONCAT((SELECT COUNT(*) FROM tblEndorsementMembers WHERE EndorsementId = e.EndorsementId), ' member(s) added')
               WHEN 'UpdateMember' THEN 'Member details updated'
               WHEN 'DeleteMember' THEN CONCAT((SELECT COUNT(*) FROM tblEndorsementDeletions WHERE EndorsementId = e.EndorsementId), ' member(s) removed')
           END AS Message
    FROM tblEndorsements e
    WHERE PolicyId = @PolicyId
    ORDER BY CreatedAt DESC;
END
GO

-- ── Get Endorsement by ID ──────────────────────────────────
CREATE OR ALTER PROCEDURE SPME_GetEndorsementById
    @EndorsementId INT
AS
BEGIN
    SELECT EndorsementId, EndorsementType, Status,
           PremiumDifference, RefundAmount, NewTotalPremium,
           '' AS Message
    FROM tblEndorsements
    WHERE EndorsementId = @EndorsementId;
END
GO
