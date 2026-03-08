-- ============================================================
-- NOTIFICATION SYSTEM SCHEMA (SQL Server / .NET 8)
-- ============================================================

-- Notification Types Lookup
CREATE TABLE NotificationTypes (
    Id              INT IDENTITY(1,1) PRIMARY KEY,
    Code            NVARCHAR(50) NOT NULL UNIQUE,       -- e.g. 'claim_approved', 'payment_reminder', 'policy_renewed'
    DisplayName     NVARCHAR(100) NOT NULL,
    Icon            NVARCHAR(50) NULL,                  -- e.g. 'CheckCircle', 'CreditCard', 'Clock'
    DefaultTone     NVARCHAR(50) NULL DEFAULT 'info',   -- 'info', 'success', 'warning', 'error'
    CreatedAt       DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);

-- Notifications Table
CREATE TABLE Notifications (
    Id              UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
    UserId          UNIQUEIDENTIFIER NOT NULL,          -- FK to your Users/AspNetUsers table
    TypeId          INT NOT NULL,
    Title           NVARCHAR(200) NOT NULL,
    [Description]   NVARCHAR(1000) NULL,
    ReferenceId     NVARCHAR(100) NULL,                 -- e.g. ClaimId, PolicyId for deep linking
    ReferenceType   NVARCHAR(50) NULL,                  -- e.g. 'Claim', 'Policy', 'Payment'
    IsRead          BIT NOT NULL DEFAULT 0,
    ReadAt          DATETIME2 NULL,
    CreatedAt       DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    ExpiresAt       DATETIME2 NULL,

    CONSTRAINT FK_Notifications_Type FOREIGN KEY (TypeId) REFERENCES NotificationTypes(Id),
    INDEX IX_Notifications_UserId_IsRead (UserId, IsRead),
    INDEX IX_Notifications_CreatedAt (CreatedAt DESC)
);

-- Seed notification types
INSERT INTO NotificationTypes (Code, DisplayName, Icon, DefaultTone) VALUES
('claim_approved',   'Claim Approved',      'CheckCircle',  'success'),
('claim_rejected',   'Claim Rejected',      'AlertCircle',  'error'),
('claim_in_review',  'Claim Under Review',  'Clock',        'info'),
('payment_reminder', 'Payment Reminder',    'CreditCard',   'warning'),
('payment_received', 'Payment Received',    'CheckCircle',  'success'),
('policy_renewed',   'Policy Renewed',      'CheckCircle',  'success'),
('policy_expiring',  'Policy Expiring',     'AlertCircle',  'warning'),
('document_ready',   'Document Ready',      'FileText',     'info');
