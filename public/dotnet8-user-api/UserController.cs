using InsuranceApi.BAL;
using InsuranceApi.Models.UserModels;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace InsuranceApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UserController : ControllerBase
    {
        private readonly UserService _service;

        public UserController(UserService service)
        {
            _service = service;
        }

        private Guid GetProfileId() =>
            Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        private string? GetIpAddress() =>
            HttpContext.Connection.RemoteIpAddress?.ToString();

        private string? GetDeviceInfo() =>
            Request.Headers["User-Agent"].FirstOrDefault();

        // ── Registration ──

        [HttpPost("register")]
        [AllowAnonymous]
        public async Task<IActionResult> Register([FromBody] mdlRegisterReq request)
        {
            if (string.IsNullOrWhiteSpace(request.FullName))
                return BadRequest(new { Error = "Full name is required." });
            if (string.IsNullOrWhiteSpace(request.Email))
                return BadRequest(new { Error = "Email is required." });
            if (string.IsNullOrWhiteSpace(request.Password) || request.Password.Length < 6)
                return BadRequest(new { Error = "Password must be at least 6 characters." });

            var result = await _service.Register(request);
            if (!result.Success) return BadRequest(result);
            return Ok(result);
        }

        // ── Login ──

        [HttpPost("login")]
        [AllowAnonymous]
        public async Task<IActionResult> Login([FromBody] mdlLoginReq request)
        {
            if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
                return BadRequest(new { Error = "Email and password are required." });

            var result = await _service.Login(request, GetIpAddress(), GetDeviceInfo());
            if (!result.Success) return Unauthorized(result);
            return Ok(result);
        }

        // ── Email Confirmation ──

        [HttpPost("confirm-email")]
        [AllowAnonymous]
        public async Task<IActionResult> ConfirmEmail([FromBody] mdlVerifyOtpReq request)
        {
            request.Purpose = "email_confirm";
            var result = await _service.VerifyOtp(request);
            if (!result.Success) return BadRequest(result);
            return Ok(result);
        }

        // ── OTP ──

        [HttpPost("otp/send")]
        [AllowAnonymous]
        public async Task<IActionResult> SendOtp([FromBody] mdlSendOtpReq request)
        {
            if (string.IsNullOrWhiteSpace(request.Email))
                return BadRequest(new { Error = "Email is required." });

            var result = await _service.SendOtp(request);
            if (!result.Success) return BadRequest(result);
            return Ok(result);
        }

        [HttpPost("otp/verify")]
        [AllowAnonymous]
        public async Task<IActionResult> VerifyOtp([FromBody] mdlVerifyOtpReq request)
        {
            var result = await _service.VerifyOtp(request);
            if (!result.Success) return BadRequest(result);
            return Ok(result);
        }

        // ── Profile ──

        [HttpGet("profile")]
        [Authorize]
        public async Task<IActionResult> GetProfile()
        {
            var profile = await _service.GetProfile(GetProfileId());
            if (profile == null) return NotFound(new { Error = "Profile not found." });
            return Ok(profile);
        }

        [HttpPut("profile")]
        [Authorize]
        public async Task<IActionResult> UpdateProfile([FromBody] mdlUpdateProfileReq request)
        {
            if (string.IsNullOrWhiteSpace(request.FullName))
                return BadRequest(new { Error = "Full name is required." });

            var result = await _service.UpdateProfile(GetProfileId(), request, GetIpAddress());
            if (!result.Success) return BadRequest(result);
            return Ok(result);
        }

        // ── Password ──

        [HttpPost("password/change")]
        [Authorize]
        public async Task<IActionResult> ChangePassword([FromBody] mdlChangePasswordReq request)
        {
            if (request.NewPassword != request.ConfirmPassword)
                return BadRequest(new { Error = "Passwords do not match." });
            if (string.IsNullOrWhiteSpace(request.NewPassword) || request.NewPassword.Length < 6)
                return BadRequest(new { Error = "New password must be at least 6 characters." });

            var result = await _service.ChangePassword(GetProfileId(), request, GetIpAddress());
            if (!result.Success) return BadRequest(result);
            return Ok(result);
        }

        [HttpPost("password/reset")]
        [AllowAnonymous]
        public async Task<IActionResult> ResetPassword([FromBody] mdlResetPasswordReq request)
        {
            if (request.NewPassword != request.ConfirmPassword)
                return BadRequest(new { Error = "Passwords do not match." });
            if (string.IsNullOrWhiteSpace(request.NewPassword) || request.NewPassword.Length < 6)
                return BadRequest(new { Error = "New password must be at least 6 characters." });

            var result = await _service.ResetPassword(request, GetIpAddress());
            if (!result.Success) return BadRequest(result);
            return Ok(result);
        }

        // ── Token Refresh ──

        [HttpPost("token/refresh")]
        [AllowAnonymous]
        public async Task<IActionResult> RefreshToken([FromBody] mdlRefreshTokenReq request)
        {
            if (string.IsNullOrWhiteSpace(request.RefreshToken))
                return BadRequest(new { Error = "Refresh token is required." });

            var result = await _service.RefreshAccessToken(request.RefreshToken);
            if (!result.Success) return Unauthorized(result);
            return Ok(result);
        }

        // ── Logout ──

        [HttpPost("logout")]
        [Authorize]
        public async Task<IActionResult> Logout([FromBody] mdlRefreshTokenReq request)
        {
            await _service.Logout(GetProfileId(), request.RefreshToken);
            return Ok(new { Message = "Logged out successfully." });
        }

        [HttpPost("logout-all")]
        [Authorize]
        public async Task<IActionResult> LogoutAll()
        {
            await _service.LogoutAll(GetProfileId());
            return Ok(new { Message = "All sessions revoked." });
        }

        // ── Audit Log ──

        [HttpGet("audit-log")]
        [Authorize]
        public async Task<IActionResult> GetAuditLog([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            var result = await _service.GetAuditLog(GetProfileId(), page, pageSize);
            return Ok(result);
        }
    }
}
