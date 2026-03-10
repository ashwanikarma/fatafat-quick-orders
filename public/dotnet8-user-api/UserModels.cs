namespace InsuranceApi.Models.UserModels
{
    // ── Request Models ──

    public class mdlRegisterReq
    {
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? Phone { get; set; }
        public string Password { get; set; } = string.Empty;
    }

    public class mdlLoginReq
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    public class mdlSendOtpReq
    {
        public string Email { get; set; } = string.Empty;
        public string Purpose { get; set; } = string.Empty;  // email_confirm, password_reset, profile_update
    }

    public class mdlVerifyOtpReq
    {
        public string Email { get; set; } = string.Empty;
        public string OtpCode { get; set; } = string.Empty;
        public string Purpose { get; set; } = string.Empty;
    }

    public class mdlUpdateProfileReq
    {
        public string FullName { get; set; } = string.Empty;
        public string? Phone { get; set; }
        public string? Address { get; set; }
        public string? PanNumber { get; set; }
    }

    public class mdlChangePasswordReq
    {
        public string CurrentPassword { get; set; } = string.Empty;
        public string NewPassword { get; set; } = string.Empty;
        public string ConfirmPassword { get; set; } = string.Empty;
    }

    public class mdlResetPasswordReq
    {
        public string Email { get; set; } = string.Empty;
        public string NewPassword { get; set; } = string.Empty;
        public string ConfirmPassword { get; set; } = string.Empty;
    }

    public class mdlRefreshTokenReq
    {
        public string RefreshToken { get; set; } = string.Empty;
    }

    // ── Response Models ──

    public class mdlAuthRes
    {
        public bool Success { get; set; }
        public string? AccessToken { get; set; }
        public string? RefreshToken { get; set; }
        public DateTime? ExpiresAt { get; set; }
        public mdlUserProfileRes? Profile { get; set; }
        public string? Error { get; set; }
    }

    public class mdlUserProfileRes
    {
        public Guid Id { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? Phone { get; set; }
        public string? AvatarText { get; set; }
        public string MembershipTier { get; set; } = "Standard Member";
        public string? Address { get; set; }
        public string? PanNumber { get; set; }
        public bool EmailConfirmed { get; set; }
        public DateTime? LastLoginAt { get; set; }
        public int PolicyCount { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public class mdlOtpRes
    {
        public bool Success { get; set; }
        public string? Message { get; set; }
        public string? Error { get; set; }
    }

    public class mdlProfileUpdateRes
    {
        public bool Success { get; set; }
        public mdlUserProfileRes? Profile { get; set; }
        public string? Error { get; set; }
    }

    public class mdlAuditLogEntry
    {
        public Guid Id { get; set; }
        public string Action { get; set; } = string.Empty;
        public string? IpAddress { get; set; }
        public string? DeviceInfo { get; set; }
        public string? Details { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class mdlAuditLogRes
    {
        public List<mdlAuditLogEntry> Items { get; set; } = new();
        public int TotalCount { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
    }
}
