using Dapper;
using InsuranceApi.Models.UserModels;
using Microsoft.Data.SqlClient;
using Microsoft.IdentityModel.Tokens;
using System.Data;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace InsuranceApi.BAL
{
    public class UserService
    {
        private readonly string _connectionString;
        private readonly IConfiguration _config;

        public UserService(IConfiguration config)
        {
            _connectionString = config.GetConnectionString("Default")!;
            _config = config;
        }

        private SqlConnection GetConnection() => new(_connectionString);

        // ──────────────────────────────────────────────
        // REGISTRATION
        // ──────────────────────────────────────────────

        public async Task<mdlAuthRes> Register(mdlRegisterReq request)
        {
            var (hash, salt) = HashPassword(request.Password);

            using var conn = GetConnection();
            var p = new DynamicParameters();
            p.Add("@FullName", request.FullName);
            p.Add("@Email", request.Email);
            p.Add("@Phone", request.Phone);
            p.Add("@PasswordHash", hash);
            p.Add("@PasswordSalt", salt);
            p.Add("@ProfileId", dbType: DbType.Guid, direction: ParameterDirection.Output);
            p.Add("@ErrorMessage", dbType: DbType.String, size: 500, direction: ParameterDirection.Output);

            await conn.ExecuteAsync("dbo.usp_RegisterUser", p, commandType: CommandType.StoredProcedure);

            var error = p.Get<string?>("@ErrorMessage");
            if (error != null)
                return new mdlAuthRes { Success = false, Error = error };

            var profileId = p.Get<Guid>("@ProfileId");

            // Generate OTP for email confirmation
            await GenerateAndSendOtp(profileId, request.Email, "email_confirm");

            return new mdlAuthRes
            {
                Success = true,
                Error = null,
                Profile = new mdlUserProfileRes
                {
                    Id = profileId,
                    FullName = request.FullName,
                    Email = request.Email,
                    Phone = request.Phone,
                    MembershipTier = "Standard Member",
                    EmailConfirmed = false
                }
            };
        }

        // ──────────────────────────────────────────────
        // LOGIN
        // ──────────────────────────────────────────────

        public async Task<mdlAuthRes> Login(mdlLoginReq request, string? ipAddress = null, string? deviceInfo = null)
        {
            using var conn = GetConnection();
            var p = new DynamicParameters();
            p.Add("@Email", request.Email);
            p.Add("@IpAddress", ipAddress);
            p.Add("@DeviceInfo", deviceInfo);
            p.Add("@ProfileId", dbType: DbType.Guid, direction: ParameterDirection.Output);
            p.Add("@PasswordHash", dbType: DbType.String, size: 500, direction: ParameterDirection.Output);
            p.Add("@PasswordSalt", dbType: DbType.String, size: 255, direction: ParameterDirection.Output);
            p.Add("@IsLocked", dbType: DbType.Boolean, direction: ParameterDirection.Output);
            p.Add("@ErrorMessage", dbType: DbType.String, size: 500, direction: ParameterDirection.Output);

            await conn.ExecuteAsync("dbo.usp_AuthenticateUser", p, commandType: CommandType.StoredProcedure);

            var error = p.Get<string?>("@ErrorMessage");
            if (error != null)
                return new mdlAuthRes { Success = false, Error = error };

            var profileId = p.Get<Guid>("@ProfileId");
            var storedHash = p.Get<string>("@PasswordHash");
            var storedSalt = p.Get<string>("@PasswordSalt");

            // Verify password
            if (!VerifyPassword(request.Password, storedHash, storedSalt))
            {
                await RecordLoginFailure(request.Email, ipAddress);
                return new mdlAuthRes { Success = false, Error = "Invalid email or password." };
            }

            // Record success
            await RecordLoginSuccess(profileId, ipAddress, deviceInfo);

            // Generate tokens
            var accessToken = GenerateAccessToken(profileId, request.Email);
            var refreshToken = GenerateRefreshToken();
            var expiresAt = DateTime.UtcNow.AddDays(7);

            // Save refresh token
            await SaveRefreshToken(profileId, refreshToken, deviceInfo, ipAddress, expiresAt);

            // Load profile
            var profile = await GetProfile(profileId);

            return new mdlAuthRes
            {
                Success = true,
                AccessToken = accessToken,
                RefreshToken = refreshToken,
                ExpiresAt = expiresAt,
                Profile = profile
            };
        }

        // ──────────────────────────────────────────────
        // OTP
        // ──────────────────────────────────────────────

        public async Task<mdlOtpRes> SendOtp(mdlSendOtpReq request)
        {
            using var conn = GetConnection();

            // Find profile by email
            var profileId = await conn.QuerySingleOrDefaultAsync<Guid?>(
                "SELECT ProfileId FROM dbo.UserCredentials WHERE Email = @Email",
                new { request.Email });

            if (profileId == null)
                return new mdlOtpRes { Success = false, Error = "No account found with this email." };

            var otpCode = await GenerateAndSendOtp(profileId.Value, request.Email, request.Purpose);

            return new mdlOtpRes { Success = true, Message = "Verification code sent to your email." };
        }

        public async Task<mdlOtpRes> VerifyOtp(mdlVerifyOtpReq request)
        {
            using var conn = GetConnection();
            var p = new DynamicParameters();
            p.Add("@Email", request.Email);
            p.Add("@OtpCode", request.OtpCode);
            p.Add("@Purpose", request.Purpose);
            p.Add("@IsValid", dbType: DbType.Boolean, direction: ParameterDirection.Output);
            p.Add("@ProfileId", dbType: DbType.Guid, direction: ParameterDirection.Output);
            p.Add("@ErrorMessage", dbType: DbType.String, size: 500, direction: ParameterDirection.Output);

            await conn.ExecuteAsync("dbo.usp_VerifyOtp", p, commandType: CommandType.StoredProcedure);

            var error = p.Get<string?>("@ErrorMessage");
            if (error != null)
                return new mdlOtpRes { Success = false, Error = error };

            return new mdlOtpRes { Success = true, Message = "Verification successful." };
        }

        // ──────────────────────────────────────────────
        // PROFILE
        // ──────────────────────────────────────────────

        public async Task<mdlUserProfileRes?> GetProfile(Guid profileId)
        {
            using var conn = GetConnection();
            return await conn.QuerySingleOrDefaultAsync<mdlUserProfileRes>(
                "dbo.usp_GetUserProfile",
                new { ProfileId = profileId },
                commandType: CommandType.StoredProcedure);
        }

        public async Task<mdlProfileUpdateRes> UpdateProfile(Guid profileId, mdlUpdateProfileReq request, string? ipAddress = null)
        {
            using var conn = GetConnection();
            var p = new DynamicParameters();
            p.Add("@ProfileId", profileId);
            p.Add("@FullName", request.FullName);
            p.Add("@Phone", request.Phone);
            p.Add("@Address", request.Address);
            p.Add("@PanNumber", request.PanNumber);
            p.Add("@IpAddress", ipAddress);
            p.Add("@ErrorMessage", dbType: DbType.String, size: 500, direction: ParameterDirection.Output);

            await conn.ExecuteAsync("dbo.usp_UpdateProfile", p, commandType: CommandType.StoredProcedure);

            var error = p.Get<string?>("@ErrorMessage");
            if (error != null)
                return new mdlProfileUpdateRes { Success = false, Error = error };

            var profile = await GetProfile(profileId);
            return new mdlProfileUpdateRes { Success = true, Profile = profile };
        }

        // ──────────────────────────────────────────────
        // PASSWORD
        // ──────────────────────────────────────────────

        public async Task<mdlOtpRes> ChangePassword(Guid profileId, mdlChangePasswordReq request, string? ipAddress = null)
        {
            if (request.NewPassword != request.ConfirmPassword)
                return new mdlOtpRes { Success = false, Error = "Passwords do not match." };

            // Verify current password
            using var conn = GetConnection();
            var creds = await conn.QuerySingleOrDefaultAsync<dynamic>(
                "SELECT PasswordHash, PasswordSalt FROM dbo.UserCredentials WHERE ProfileId = @ProfileId",
                new { ProfileId = profileId });

            if (creds == null)
                return new mdlOtpRes { Success = false, Error = "Account not found." };

            if (!VerifyPassword(request.CurrentPassword, (string)creds.PasswordHash, (string)creds.PasswordSalt))
                return new mdlOtpRes { Success = false, Error = "Current password is incorrect." };

            var (hash, salt) = HashPassword(request.NewPassword);

            var p = new DynamicParameters();
            p.Add("@ProfileId", profileId);
            p.Add("@NewPasswordHash", hash);
            p.Add("@NewPasswordSalt", salt);
            p.Add("@IpAddress", ipAddress);
            p.Add("@ErrorMessage", dbType: DbType.String, size: 500, direction: ParameterDirection.Output);

            await conn.ExecuteAsync("dbo.usp_ChangePassword", p, commandType: CommandType.StoredProcedure);

            var error = p.Get<string?>("@ErrorMessage");
            if (error != null)
                return new mdlOtpRes { Success = false, Error = error };

            return new mdlOtpRes { Success = true, Message = "Password changed successfully." };
        }

        public async Task<mdlOtpRes> ResetPassword(mdlResetPasswordReq request, string? ipAddress = null)
        {
            if (request.NewPassword != request.ConfirmPassword)
                return new mdlOtpRes { Success = false, Error = "Passwords do not match." };

            var (hash, salt) = HashPassword(request.NewPassword);

            using var conn = GetConnection();
            var p = new DynamicParameters();
            p.Add("@Email", request.Email);
            p.Add("@NewPasswordHash", hash);
            p.Add("@NewPasswordSalt", salt);
            p.Add("@IpAddress", ipAddress);
            p.Add("@ErrorMessage", dbType: DbType.String, size: 500, direction: ParameterDirection.Output);

            await conn.ExecuteAsync("dbo.usp_ResetPassword", p, commandType: CommandType.StoredProcedure);

            var error = p.Get<string?>("@ErrorMessage");
            if (error != null)
                return new mdlOtpRes { Success = false, Error = error };

            return new mdlOtpRes { Success = true, Message = "Password reset successfully." };
        }

        // ──────────────────────────────────────────────
        // TOKEN REFRESH
        // ──────────────────────────────────────────────

        public async Task<mdlAuthRes> RefreshAccessToken(string refreshToken)
        {
            var newRefreshToken = GenerateRefreshToken();
            var newExpiresAt = DateTime.UtcNow.AddDays(7);

            using var conn = GetConnection();
            var p = new DynamicParameters();
            p.Add("@Token", refreshToken);
            p.Add("@NewToken", newRefreshToken);
            p.Add("@NewExpiresAt", newExpiresAt);
            p.Add("@ProfileId", dbType: DbType.Guid, direction: ParameterDirection.Output);
            p.Add("@IsValid", dbType: DbType.Boolean, direction: ParameterDirection.Output);
            p.Add("@ErrorMessage", dbType: DbType.String, size: 500, direction: ParameterDirection.Output);

            await conn.ExecuteAsync("dbo.usp_ValidateRefreshToken", p, commandType: CommandType.StoredProcedure);

            var error = p.Get<string?>("@ErrorMessage");
            if (error != null)
                return new mdlAuthRes { Success = false, Error = error };

            var profileId = p.Get<Guid>("@ProfileId");
            var email = await conn.QuerySingleAsync<string>(
                "SELECT Email FROM dbo.UserCredentials WHERE ProfileId = @ProfileId",
                new { ProfileId = profileId });

            var accessToken = GenerateAccessToken(profileId, email);
            var profile = await GetProfile(profileId);

            return new mdlAuthRes
            {
                Success = true,
                AccessToken = accessToken,
                RefreshToken = newRefreshToken,
                ExpiresAt = newExpiresAt,
                Profile = profile
            };
        }

        // ──────────────────────────────────────────────
        // LOGOUT
        // ──────────────────────────────────────────────

        public async Task Logout(Guid profileId, string refreshToken)
        {
            using var conn = GetConnection();
            await conn.ExecuteAsync("dbo.usp_RevokeRefreshToken",
                new { Token = refreshToken, ProfileId = profileId },
                commandType: CommandType.StoredProcedure);
        }

        public async Task LogoutAll(Guid profileId)
        {
            using var conn = GetConnection();
            await conn.ExecuteAsync("dbo.usp_RevokeAllSessions",
                new { ProfileId = profileId },
                commandType: CommandType.StoredProcedure);
        }

        // ──────────────────────────────────────────────
        // AUDIT LOG
        // ──────────────────────────────────────────────

        public async Task<mdlAuditLogRes> GetAuditLog(Guid profileId, int page = 1, int pageSize = 20)
        {
            using var conn = GetConnection();
            using var multi = await conn.QueryMultipleAsync("dbo.usp_GetUserAuditLog",
                new { ProfileId = profileId, Page = page, PageSize = pageSize },
                commandType: CommandType.StoredProcedure);

            var items = (await multi.ReadAsync<mdlAuditLogEntry>()).ToList();
            var totalCount = await multi.ReadSingleAsync<int>();

            return new mdlAuditLogRes
            {
                Items = items,
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize
            };
        }

        // ──────────────────────────────────────────────
        // PRIVATE HELPERS
        // ──────────────────────────────────────────────

        private async Task<string> GenerateAndSendOtp(Guid profileId, string email, string purpose)
        {
            using var conn = GetConnection();
            var p = new DynamicParameters();
            p.Add("@ProfileId", profileId);
            p.Add("@Email", email);
            p.Add("@Purpose", purpose);
            p.Add("@OtpCode", dbType: DbType.String, size: 10, direction: ParameterDirection.Output);
            p.Add("@ExpiresAt", dbType: DbType.DateTime2, direction: ParameterDirection.Output);

            await conn.ExecuteAsync("dbo.usp_GenerateOtp", p, commandType: CommandType.StoredProcedure);

            var otpCode = p.Get<string>("@OtpCode");

            // TODO: Send OTP via email service (SMTP / SendGrid / etc.)
            // await _emailService.SendOtpEmail(email, otpCode, purpose);

            return otpCode;
        }

        private async Task RecordLoginSuccess(Guid profileId, string? ip, string? device)
        {
            using var conn = GetConnection();
            await conn.ExecuteAsync("dbo.usp_RecordLoginSuccess",
                new { ProfileId = profileId, IpAddress = ip, DeviceInfo = device },
                commandType: CommandType.StoredProcedure);
        }

        private async Task RecordLoginFailure(string email, string? ip)
        {
            using var conn = GetConnection();
            await conn.ExecuteAsync("dbo.usp_RecordLoginFailure",
                new { Email = email, IpAddress = ip },
                commandType: CommandType.StoredProcedure);
        }

        private async Task SaveRefreshToken(Guid profileId, string token, string? device, string? ip, DateTime expiresAt)
        {
            using var conn = GetConnection();
            await conn.ExecuteAsync("dbo.usp_SaveRefreshToken",
                new { ProfileId = profileId, Token = token, DeviceInfo = device, IpAddress = ip, ExpiresAt = expiresAt },
                commandType: CommandType.StoredProcedure);
        }

        private string GenerateAccessToken(Guid profileId, string email)
        {
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Secret"]!));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, profileId.ToString()),
                new Claim(ClaimTypes.Email, email),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
            };

            var token = new JwtSecurityToken(
                issuer: _config["Jwt:Issuer"],
                audience: _config["Jwt:Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(30),
                signingCredentials: creds);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        private static string GenerateRefreshToken()
        {
            var bytes = new byte[64];
            using var rng = RandomNumberGenerator.Create();
            rng.GetBytes(bytes);
            return Convert.ToBase64String(bytes);
        }

        private static (string hash, string salt) HashPassword(string password)
        {
            var saltBytes = new byte[32];
            using var rng = RandomNumberGenerator.Create();
            rng.GetBytes(saltBytes);

            var salt = Convert.ToBase64String(saltBytes);
            var hash = Convert.ToBase64String(
                new Rfc2898DeriveBytes(password, saltBytes, 100000, HashAlgorithmName.SHA256).GetBytes(64));

            return (hash, salt);
        }

        private static bool VerifyPassword(string password, string storedHash, string storedSalt)
        {
            var saltBytes = Convert.FromBase64String(storedSalt);
            var computedHash = Convert.ToBase64String(
                new Rfc2898DeriveBytes(password, saltBytes, 100000, HashAlgorithmName.SHA256).GetBytes(64));

            return computedHash == storedHash;
        }
    }
}
