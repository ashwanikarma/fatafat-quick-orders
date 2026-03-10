-- ============================================================
-- User Management Schema — SQL Server
-- Covers: Registration, Profile, Password, OTP, Sessions
-- ============================================================

-- 1. PROFILES (Core user table — referenced by all modules)
-- ============================================================
-- NOTE: The Profiles table is already created in quotation-schema-sqlserver.sql
-- This script adds user-management-specific tables and stored procedures.

-- 2. USER CREDENTIALS (Separate from Profile for security)
-- ============================================================
CREATE TABLE dbo.UserCredentials (
    Id                UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
    ProfileId         UNIQUEIDENTIFIER NOT NULL,
    Email             NVARCHAR(255)    NOT NULL,
    PasswordHash      NVARCHAR(500)    NOT NULL,
    PasswordSalt      NVARCHAR(255)    NOT NULL,
    EmailConfirmed    BIT              NOT NULL DEFAULT 0,
    FailedLoginCount  INT              NOT NULL DEFAULT 0,
    LockedUntil       DATETIME2        NULL,
    LastLoginAt       DATETIME2        NULL,
    LastPasswordChange DATETIME2       NULL,
    CreatedAt         DATETIME2        NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt         DATETIME2        NOT NULL DEFAULT GETUTCDATE(),

    CONSTRAINT FK_UserCred_Profile FOREIGN KEY (ProfileId) REFERENCES dbo.Profiles(Id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX UX_UserCred_Email ON dbo.UserCredentials(Email);
CREATE UNIQUE INDEX UX_UserCred_ProfileId ON dbo.UserCredentials(ProfileId);

-- 3. OTP VERIFICATIONS
-- ============================================================
CREATE TABLE dbo.OtpVerifications (
    Id              UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
    ProfileId       UNIQUEIDENTIFIER NOT NULL,
    Email           NVARCHAR(255)    NOT NULL,
    OtpCode         NVARCHAR(10)     NOT NULL,
    Purpose         NVARCHAR(50)     NOT NULL,    -- 'email_confirm', 'password_reset', 'profile_update'
    IsUsed          BIT              NOT NULL DEFAULT 0,
    ExpiresAt       DATETIME2        NOT NULL,
    CreatedAt       DATETIME2        NOT NULL DEFAULT GETUTCDATE(),

    CONSTRAINT FK_Otp_Profile FOREIGN KEY (ProfileId) REFERENCES dbo.Profiles(Id) ON DELETE CASCADE
);

CREATE INDEX IX_Otp_Email_Purpose ON dbo.OtpVerifications(Email, Purpose, IsUsed);
CREATE INDEX IX_Otp_ExpiresAt ON dbo.OtpVerifications(ExpiresAt);

-- 4. REFRESH TOKENS (JWT Session Management)
-- ============================================================
CREATE TABLE dbo.RefreshTokens (
    Id              UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
    ProfileId       UNIQUEIDENTIFIER NOT NULL,
    Token           NVARCHAR(500)    NOT NULL,
    DeviceInfo      NVARCHAR(255)    NULL,
    IpAddress       NVARCHAR(50)     NULL,
    IsRevoked       BIT              NOT NULL DEFAULT 0,
    ExpiresAt       DATETIME2        NOT NULL,
    CreatedAt       DATETIME2        NOT NULL DEFAULT GETUTCDATE(),

    CONSTRAINT FK_RefToken_Profile FOREIGN KEY (ProfileId) REFERENCES dbo.Profiles(Id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX UX_RefToken_Token ON dbo.RefreshTokens(Token);
CREATE INDEX IX_RefToken_ProfileId ON dbo.RefreshTokens(ProfileId);

-- 5. AUDIT LOG (User actions)
-- ============================================================
CREATE TABLE dbo.UserAuditLog (
    Id              UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
    ProfileId       UNIQUEIDENTIFIER NOT NULL,
    [Action]        NVARCHAR(100)    NOT NULL,    -- 'login', 'logout', 'password_change', 'profile_update', 'otp_sent', 'otp_verified'
    IpAddress       NVARCHAR(50)     NULL,
    DeviceInfo      NVARCHAR(255)    NULL,
    Details         NVARCHAR(MAX)    NULL,          -- JSON with additional context
    CreatedAt       DATETIME2        NOT NULL DEFAULT GETUTCDATE(),

    CONSTRAINT FK_AuditLog_Profile FOREIGN KEY (ProfileId) REFERENCES dbo.Profiles(Id) ON DELETE CASCADE
);

CREATE INDEX IX_AuditLog_ProfileId ON dbo.UserAuditLog(ProfileId);
CREATE INDEX IX_AuditLog_Action ON dbo.UserAuditLog([Action]);
CREATE INDEX IX_AuditLog_CreatedAt ON dbo.UserAuditLog(CreatedAt DESC);


-- ============================================================
-- TRIGGERS
-- ============================================================

GO
CREATE TRIGGER trg_UserCredentials_UpdatedAt
ON dbo.UserCredentials
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE uc
    SET uc.UpdatedAt = GETUTCDATE()
    FROM dbo.UserCredentials uc
    INNER JOIN inserted i ON uc.Id = i.Id;
END;
GO


-- ============================================================
-- STORED PROCEDURES
-- ============================================================

-- ──────────────────────────────────────────────
-- SP: Register New User
-- ──────────────────────────────────────────────
GO
CREATE PROCEDURE dbo.usp_RegisterUser
    @FullName       NVARCHAR(255),
    @Email          NVARCHAR(255),
    @Phone          NVARCHAR(50)     = NULL,
    @PasswordHash   NVARCHAR(500),
    @PasswordSalt   NVARCHAR(255),
    @ProfileId      UNIQUEIDENTIFIER OUTPUT,
    @ErrorMessage   NVARCHAR(500)    OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET @ErrorMessage = NULL;

    -- Check if email already exists
    IF EXISTS (SELECT 1 FROM dbo.UserCredentials WHERE Email = @Email)
    BEGIN
        SET @ErrorMessage = 'An account with this email already exists.';
        SET @ProfileId = '00000000-0000-0000-0000-000000000000';
        RETURN;
    END

    BEGIN TRY
        BEGIN TRANSACTION;

        SET @ProfileId = NEWID();

        -- Create Profile
        INSERT INTO dbo.Profiles (Id, FullName, Phone, Email, AvatarText, MembershipTier)
        VALUES (
            @ProfileId,
            @FullName,
            @Phone,
            @Email,
            UPPER(LEFT(@FullName, 2)),
            'Standard Member'
        );

        -- Create Credentials
        INSERT INTO dbo.UserCredentials (ProfileId, Email, PasswordHash, PasswordSalt)
        VALUES (@ProfileId, @Email, @PasswordHash, @PasswordSalt);

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        SET @ErrorMessage = ERROR_MESSAGE();
        SET @ProfileId = '00000000-0000-0000-0000-000000000000';
    END CATCH
END;
GO

-- ──────────────────────────────────────────────
-- SP: Authenticate User (Login)
-- ──────────────────────────────────────────────
CREATE PROCEDURE dbo.usp_AuthenticateUser
    @Email          NVARCHAR(255),
    @IpAddress      NVARCHAR(50)     = NULL,
    @DeviceInfo     NVARCHAR(255)    = NULL,
    @ProfileId      UNIQUEIDENTIFIER OUTPUT,
    @PasswordHash   NVARCHAR(500)    OUTPUT,
    @PasswordSalt   NVARCHAR(255)    OUTPUT,
    @IsLocked       BIT              OUTPUT,
    @ErrorMessage   NVARCHAR(500)    OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET @ErrorMessage = NULL;
    SET @IsLocked = 0;

    SELECT
        @ProfileId    = uc.ProfileId,
        @PasswordHash = uc.PasswordHash,
        @PasswordSalt = uc.PasswordSalt,
        @IsLocked     = CASE WHEN uc.LockedUntil IS NOT NULL AND uc.LockedUntil > GETUTCDATE() THEN 1 ELSE 0 END
    FROM dbo.UserCredentials uc
    WHERE uc.Email = @Email AND uc.EmailConfirmed = 1;

    IF @ProfileId IS NULL
    BEGIN
        SET @ErrorMessage = 'Invalid email or account not confirmed.';
        SET @ProfileId = '00000000-0000-0000-0000-000000000000';
        RETURN;
    END

    IF @IsLocked = 1
    BEGIN
        SET @ErrorMessage = 'Account is temporarily locked. Please try again later.';
        RETURN;
    END
END;
GO

-- ──────────────────────────────────────────────
-- SP: Record Login Success
-- ──────────────────────────────────────────────
CREATE PROCEDURE dbo.usp_RecordLoginSuccess
    @ProfileId      UNIQUEIDENTIFIER,
    @IpAddress      NVARCHAR(50)     = NULL,
    @DeviceInfo     NVARCHAR(255)    = NULL
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE dbo.UserCredentials
    SET FailedLoginCount = 0,
        LockedUntil = NULL,
        LastLoginAt = GETUTCDATE()
    WHERE ProfileId = @ProfileId;

    INSERT INTO dbo.UserAuditLog (ProfileId, [Action], IpAddress, DeviceInfo)
    VALUES (@ProfileId, 'login', @IpAddress, @DeviceInfo);
END;
GO

-- ──────────────────────────────────────────────
-- SP: Record Login Failure (with lockout after 5 failures)
-- ──────────────────────────────────────────────
CREATE PROCEDURE dbo.usp_RecordLoginFailure
    @Email          NVARCHAR(255),
    @IpAddress      NVARCHAR(50)     = NULL
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @FailCount INT;
    DECLARE @ProfileId UNIQUEIDENTIFIER;

    SELECT @ProfileId = ProfileId, @FailCount = FailedLoginCount + 1
    FROM dbo.UserCredentials WHERE Email = @Email;

    IF @ProfileId IS NULL RETURN;

    UPDATE dbo.UserCredentials
    SET FailedLoginCount = @FailCount,
        LockedUntil = CASE WHEN @FailCount >= 5 THEN DATEADD(MINUTE, 30, GETUTCDATE()) ELSE LockedUntil END
    WHERE Email = @Email;

    INSERT INTO dbo.UserAuditLog (ProfileId, [Action], IpAddress, Details)
    VALUES (@ProfileId, 'login_failed', @IpAddress,
        '{"failedCount":' + CAST(@FailCount AS NVARCHAR) + '}');
END;
GO

-- ──────────────────────────────────────────────
-- SP: Generate & Store OTP
-- ──────────────────────────────────────────────
CREATE PROCEDURE dbo.usp_GenerateOtp
    @ProfileId      UNIQUEIDENTIFIER,
    @Email          NVARCHAR(255),
    @Purpose        NVARCHAR(50),       -- 'email_confirm', 'password_reset', 'profile_update'
    @OtpCode        NVARCHAR(10)  OUTPUT,
    @ExpiresAt      DATETIME2     OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    -- Invalidate previous unused OTPs for same purpose
    UPDATE dbo.OtpVerifications
    SET IsUsed = 1
    WHERE ProfileId = @ProfileId AND Purpose = @Purpose AND IsUsed = 0;

    -- Generate 6-digit code
    SET @OtpCode = RIGHT('000000' + CAST(ABS(CHECKSUM(NEWID())) % 1000000 AS NVARCHAR), 6);
    SET @ExpiresAt = DATEADD(MINUTE, 10, GETUTCDATE());

    INSERT INTO dbo.OtpVerifications (ProfileId, Email, OtpCode, Purpose, ExpiresAt)
    VALUES (@ProfileId, @Email, @OtpCode, @Purpose, @ExpiresAt);

    INSERT INTO dbo.UserAuditLog (ProfileId, [Action], Details)
    VALUES (@ProfileId, 'otp_sent', '{"purpose":"' + @Purpose + '","email":"' + @Email + '"}');
END;
GO

-- ──────────────────────────────────────────────
-- SP: Verify OTP
-- ──────────────────────────────────────────────
CREATE PROCEDURE dbo.usp_VerifyOtp
    @Email          NVARCHAR(255),
    @OtpCode        NVARCHAR(10),
    @Purpose        NVARCHAR(50),
    @IsValid        BIT              OUTPUT,
    @ProfileId      UNIQUEIDENTIFIER OUTPUT,
    @ErrorMessage   NVARCHAR(500)    OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET @IsValid = 0;
    SET @ErrorMessage = NULL;

    SELECT TOP 1 @ProfileId = ProfileId
    FROM dbo.OtpVerifications
    WHERE Email = @Email
      AND OtpCode = @OtpCode
      AND Purpose = @Purpose
      AND IsUsed = 0
      AND ExpiresAt > GETUTCDATE()
    ORDER BY CreatedAt DESC;

    IF @ProfileId IS NULL
    BEGIN
        SET @ErrorMessage = 'Invalid or expired verification code.';
        SET @ProfileId = '00000000-0000-0000-0000-000000000000';
        RETURN;
    END

    -- Mark as used
    UPDATE dbo.OtpVerifications
    SET IsUsed = 1
    WHERE Email = @Email AND OtpCode = @OtpCode AND Purpose = @Purpose;

    SET @IsValid = 1;

    -- If email confirmation, update credentials
    IF @Purpose = 'email_confirm'
    BEGIN
        UPDATE dbo.UserCredentials SET EmailConfirmed = 1 WHERE ProfileId = @ProfileId;
    END

    INSERT INTO dbo.UserAuditLog (ProfileId, [Action], Details)
    VALUES (@ProfileId, 'otp_verified', '{"purpose":"' + @Purpose + '"}');
END;
GO

-- ──────────────────────────────────────────────
-- SP: Confirm Email (after OTP verified)
-- ──────────────────────────────────────────────
CREATE PROCEDURE dbo.usp_ConfirmEmail
    @ProfileId      UNIQUEIDENTIFIER,
    @ErrorMessage   NVARCHAR(500) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET @ErrorMessage = NULL;

    IF NOT EXISTS (SELECT 1 FROM dbo.UserCredentials WHERE ProfileId = @ProfileId)
    BEGIN
        SET @ErrorMessage = 'Account not found.';
        RETURN;
    END

    UPDATE dbo.UserCredentials
    SET EmailConfirmed = 1
    WHERE ProfileId = @ProfileId;

    INSERT INTO dbo.UserAuditLog (ProfileId, [Action])
    VALUES (@ProfileId, 'email_confirmed');
END;
GO

-- ──────────────────────────────────────────────
-- SP: Get User Profile
-- ──────────────────────────────────────────────
CREATE PROCEDURE dbo.usp_GetUserProfile
    @ProfileId      UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        p.Id,
        p.FullName,
        p.Email,
        p.Phone,
        p.AvatarText,
        p.MembershipTier,
        p.[Address],
        p.PanNumber,
        p.CreatedAt,
        p.UpdatedAt,
        uc.EmailConfirmed,
        uc.LastLoginAt,
        (SELECT COUNT(*) FROM dbo.Quotations q WHERE q.UserId = p.Id AND q.PolicyNumber IS NOT NULL) AS PolicyCount
    FROM dbo.Profiles p
    LEFT JOIN dbo.UserCredentials uc ON uc.ProfileId = p.Id
    WHERE p.Id = @ProfileId;
END;
GO

-- ──────────────────────────────────────────────
-- SP: Update Profile (after OTP verification)
-- ──────────────────────────────────────────────
CREATE PROCEDURE dbo.usp_UpdateProfile
    @ProfileId      UNIQUEIDENTIFIER,
    @FullName       NVARCHAR(255),
    @Phone          NVARCHAR(50)     = NULL,
    @Address        NVARCHAR(500)    = NULL,
    @PanNumber      NVARCHAR(50)     = NULL,
    @IpAddress      NVARCHAR(50)     = NULL,
    @ErrorMessage   NVARCHAR(500)    OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET @ErrorMessage = NULL;

    IF NOT EXISTS (SELECT 1 FROM dbo.Profiles WHERE Id = @ProfileId)
    BEGIN
        SET @ErrorMessage = 'Profile not found.';
        RETURN;
    END

    UPDATE dbo.Profiles
    SET FullName     = @FullName,
        Phone        = @Phone,
        [Address]    = @Address,
        PanNumber    = @PanNumber,
        AvatarText   = UPPER(LEFT(@FullName, 2)),
        UpdatedAt    = GETUTCDATE()
    WHERE Id = @ProfileId;

    INSERT INTO dbo.UserAuditLog (ProfileId, [Action], IpAddress, Details)
    VALUES (@ProfileId, 'profile_update', @IpAddress,
        '{"fields":["FullName","Phone","Address","PanNumber"]}');
END;
GO

-- ──────────────────────────────────────────────
-- SP: Change Password (after OTP verification)
-- ──────────────────────────────────────────────
CREATE PROCEDURE dbo.usp_ChangePassword
    @ProfileId      UNIQUEIDENTIFIER,
    @NewPasswordHash NVARCHAR(500),
    @NewPasswordSalt NVARCHAR(255),
    @IpAddress      NVARCHAR(50)     = NULL,
    @ErrorMessage   NVARCHAR(500)    OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET @ErrorMessage = NULL;

    IF NOT EXISTS (SELECT 1 FROM dbo.UserCredentials WHERE ProfileId = @ProfileId)
    BEGIN
        SET @ErrorMessage = 'Account not found.';
        RETURN;
    END

    UPDATE dbo.UserCredentials
    SET PasswordHash       = @NewPasswordHash,
        PasswordSalt       = @NewPasswordSalt,
        LastPasswordChange = GETUTCDATE(),
        FailedLoginCount   = 0,
        LockedUntil        = NULL
    WHERE ProfileId = @ProfileId;

    -- Revoke all refresh tokens (force re-login on all devices)
    UPDATE dbo.RefreshTokens
    SET IsRevoked = 1
    WHERE ProfileId = @ProfileId AND IsRevoked = 0;

    INSERT INTO dbo.UserAuditLog (ProfileId, [Action], IpAddress)
    VALUES (@ProfileId, 'password_change', @IpAddress);
END;
GO

-- ──────────────────────────────────────────────
-- SP: Reset Password (forgot password flow)
-- ──────────────────────────────────────────────
CREATE PROCEDURE dbo.usp_ResetPassword
    @Email           NVARCHAR(255),
    @NewPasswordHash NVARCHAR(500),
    @NewPasswordSalt NVARCHAR(255),
    @IpAddress       NVARCHAR(50)     = NULL,
    @ErrorMessage    NVARCHAR(500)    OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET @ErrorMessage = NULL;

    DECLARE @ProfileId UNIQUEIDENTIFIER;

    SELECT @ProfileId = ProfileId FROM dbo.UserCredentials WHERE Email = @Email;

    IF @ProfileId IS NULL
    BEGIN
        SET @ErrorMessage = 'Account not found.';
        RETURN;
    END

    UPDATE dbo.UserCredentials
    SET PasswordHash       = @NewPasswordHash,
        PasswordSalt       = @NewPasswordSalt,
        LastPasswordChange = GETUTCDATE(),
        FailedLoginCount   = 0,
        LockedUntil        = NULL
    WHERE ProfileId = @ProfileId;

    -- Revoke all refresh tokens
    UPDATE dbo.RefreshTokens
    SET IsRevoked = 1
    WHERE ProfileId = @ProfileId AND IsRevoked = 0;

    INSERT INTO dbo.UserAuditLog (ProfileId, [Action], IpAddress)
    VALUES (@ProfileId, 'password_reset', @IpAddress);
END;
GO

-- ──────────────────────────────────────────────
-- SP: Save Refresh Token
-- ──────────────────────────────────────────────
CREATE PROCEDURE dbo.usp_SaveRefreshToken
    @ProfileId      UNIQUEIDENTIFIER,
    @Token          NVARCHAR(500),
    @DeviceInfo     NVARCHAR(255)    = NULL,
    @IpAddress      NVARCHAR(50)     = NULL,
    @ExpiresAt      DATETIME2
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO dbo.RefreshTokens (ProfileId, Token, DeviceInfo, IpAddress, ExpiresAt)
    VALUES (@ProfileId, @Token, @DeviceInfo, @IpAddress, @ExpiresAt);
END;
GO

-- ──────────────────────────────────────────────
-- SP: Validate & Rotate Refresh Token
-- ──────────────────────────────────────────────
CREATE PROCEDURE dbo.usp_ValidateRefreshToken
    @Token          NVARCHAR(500),
    @NewToken       NVARCHAR(500),
    @NewExpiresAt   DATETIME2,
    @ProfileId      UNIQUEIDENTIFIER OUTPUT,
    @IsValid        BIT              OUTPUT,
    @ErrorMessage   NVARCHAR(500)    OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET @IsValid = 0;
    SET @ErrorMessage = NULL;

    SELECT @ProfileId = ProfileId
    FROM dbo.RefreshTokens
    WHERE Token = @Token AND IsRevoked = 0 AND ExpiresAt > GETUTCDATE();

    IF @ProfileId IS NULL
    BEGIN
        SET @ErrorMessage = 'Invalid or expired refresh token.';
        SET @ProfileId = '00000000-0000-0000-0000-000000000000';
        RETURN;
    END

    -- Revoke old token
    UPDATE dbo.RefreshTokens SET IsRevoked = 1 WHERE Token = @Token;

    -- Issue new token
    INSERT INTO dbo.RefreshTokens (ProfileId, Token, ExpiresAt)
    VALUES (@ProfileId, @NewToken, @NewExpiresAt);

    SET @IsValid = 1;
END;
GO

-- ──────────────────────────────────────────────
-- SP: Revoke Refresh Token (Logout)
-- ──────────────────────────────────────────────
CREATE PROCEDURE dbo.usp_RevokeRefreshToken
    @Token          NVARCHAR(500),
    @ProfileId      UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE dbo.RefreshTokens
    SET IsRevoked = 1
    WHERE Token = @Token AND ProfileId = @ProfileId;

    INSERT INTO dbo.UserAuditLog (ProfileId, [Action])
    VALUES (@ProfileId, 'logout');
END;
GO

-- ──────────────────────────────────────────────
-- SP: Revoke All Sessions (Logout everywhere)
-- ──────────────────────────────────────────────
CREATE PROCEDURE dbo.usp_RevokeAllSessions
    @ProfileId      UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE dbo.RefreshTokens
    SET IsRevoked = 1
    WHERE ProfileId = @ProfileId AND IsRevoked = 0;

    INSERT INTO dbo.UserAuditLog (ProfileId, [Action])
    VALUES (@ProfileId, 'logout_all_devices');
END;
GO

-- ──────────────────────────────────────────────
-- SP: Get User Audit Log
-- ──────────────────────────────────────────────
CREATE PROCEDURE dbo.usp_GetUserAuditLog
    @ProfileId      UNIQUEIDENTIFIER,
    @Page           INT = 1,
    @PageSize       INT = 20
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        Id,
        [Action],
        IpAddress,
        DeviceInfo,
        Details,
        CreatedAt
    FROM dbo.UserAuditLog
    WHERE ProfileId = @ProfileId
    ORDER BY CreatedAt DESC
    OFFSET (@Page - 1) * @PageSize ROWS
    FETCH NEXT @PageSize ROWS ONLY;

    SELECT COUNT(*) AS TotalCount
    FROM dbo.UserAuditLog
    WHERE ProfileId = @ProfileId;
END;
GO

-- ──────────────────────────────────────────────
-- SP: Cleanup expired OTPs and refresh tokens
-- (Run as scheduled job daily)
-- ──────────────────────────────────────────────
CREATE PROCEDURE dbo.usp_CleanupExpiredTokens
AS
BEGIN
    SET NOCOUNT ON;

    DELETE FROM dbo.OtpVerifications WHERE ExpiresAt < GETUTCDATE();
    DELETE FROM dbo.RefreshTokens WHERE ExpiresAt < GETUTCDATE() OR IsRevoked = 1;
END;
GO
