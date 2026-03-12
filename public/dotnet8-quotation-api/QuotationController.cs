using InsuranceApi.BAL;
using InsuranceApi.Models.QuotationModels;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace InsuranceApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class QuotationController : ControllerBase
    {
        private readonly QuotationService _service;

        public QuotationController(QuotationService service)
        {
            _service = service;
        }

        private int GetUserId() =>
            int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        // ═══════════════════════════════════════════════════════
        //  DASHBOARD
        // ═══════════════════════════════════════════════════════

        /// <summary>
        /// Get dashboard summary: quotation counts, policy counts, recent items.
        /// </summary>
        [HttpGet("dashboard")]
        public async Task<IActionResult> GetDashboardSummary()
        {
            var result = await _service.GetDashboardSummary(GetUserId());
            return Ok(result);
        }

        // ═══════════════════════════════════════════════════════
        //  SPONSOR VALIDATION
        // ═══════════════════════════════════════════════════════

        /// <summary>
        /// Validate sponsor number against registry (Wathaq integration stub).
        /// </summary>
        [HttpPost("sponsor/validate")]
        public async Task<IActionResult> ValidateSponsor([FromBody] mdlSponsorValidateReq request)
        {
            if (string.IsNullOrWhiteSpace(request.SponsorNumber))
                return BadRequest(new { message = "Sponsor number is required." });

            var result = await _service.ValidateSponsor(request);
            if (!result.Success)
                return BadRequest(result);
            return Ok(result);
        }

        // ═══════════════════════════════════════════════════════
        //  QUOTATION CRUD
        // ═══════════════════════════════════════════════════════

        /// <summary>
        /// Create a new draft quotation with sponsor data.
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] mdlQuotationCreateReq request)
        {
            request.UserId = GetUserId();

            if (string.IsNullOrWhiteSpace(request.SponsorNumber))
                return BadRequest(new { message = "Sponsor number is required." });

            var id = await _service.CreateQuotation(request);
            return Ok(new { QuotationId = id });
        }

        /// <summary>
        /// Get full quotation detail including sponsor, members, KYC, payment, and endorsement history.
        /// </summary>
        [HttpGet("{id}")]
        public async Task<IActionResult> Get(int id)
        {
            var result = await _service.GetQuotation(id, GetUserId());
            if (result == null) return NotFound(new { message = "Quotation not found." });
            return Ok(result);
        }

        /// <summary>
        /// List all user quotations (draft, completed, paid).
        /// </summary>
        [HttpGet("list")]
        public async Task<IActionResult> GetAll()
        {
            var result = await _service.GetUserQuotations(GetUserId());
            return Ok(result);
        }

        /// <summary>
        /// List user's issued policies (paid quotations with policy number).
        /// </summary>
        [HttpGet("policies")]
        public async Task<IActionResult> GetPolicies()
        {
            var result = await _service.GetUserPolicies(GetUserId());
            return Ok(result);
        }

        /// <summary>
        /// Get single policy detail with members, endorsement history, and documents.
        /// </summary>
        [HttpGet("policies/{policyId}")]
        public async Task<IActionResult> GetPolicyDetail(int policyId)
        {
            var result = await _service.GetPolicyDetail(policyId, GetUserId());
            if (result == null) return NotFound(new { message = "Policy not found." });
            return Ok(result);
        }

        /// <summary>
        /// Update quotation wizard step (0-5).
        /// </summary>
        [HttpPut("{id}/step/{step}")]
        public async Task<IActionResult> UpdateStep(int id, int step)
        {
            if (step < 0 || step > 5)
                return BadRequest(new { message = "Step must be between 0 and 5." });

            var success = await _service.UpdateStep(id, GetUserId(), step);
            if (!success) return NotFound(new { message = "Quotation not found." });
            return Ok(new { Message = "Step updated" });
        }

        /// <summary>
        /// Update quotation status (draft → completed).
        /// </summary>
        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] mdlQuotationUpdateStatusReq request)
        {
            request.QuotationId = id;
            var success = await _service.UpdateStatus(id, GetUserId(), request.Status);
            if (!success) return NotFound(new { message = "Quotation not found." });
            return Ok(new { Message = "Status updated" });
        }

        // ═══════════════════════════════════════════════════════
        //  MEMBERS
        // ═══════════════════════════════════════════════════════

        /// <summary>
        /// Add a single member to a quotation.
        /// </summary>
        [HttpPost("{quotationId}/members")]
        public async Task<IActionResult> AddMember(int quotationId, [FromBody] mdlMemberReq request)
        {
            if (string.IsNullOrWhiteSpace(request.MemberName))
                return BadRequest(new { message = "Member name is required." });
            if (string.IsNullOrWhiteSpace(request.IdentityNumber))
                return BadRequest(new { message = "Identity number is required." });

            var id = await _service.AddMember(quotationId, request);
            return Ok(new { MemberId = id });
        }

        /// <summary>
        /// Update an existing member.
        /// </summary>
        [HttpPut("members/{memberId}")]
        public async Task<IActionResult> UpdateMember(int memberId, [FromBody] mdlMemberReq request)
        {
            var success = await _service.UpdateMember(memberId, request);
            if (!success) return NotFound(new { message = "Member not found." });
            return Ok(new { Message = "Member updated" });
        }

        /// <summary>
        /// Delete a member from a quotation.
        /// </summary>
        [HttpDelete("{quotationId}/members/{memberId}")]
        public async Task<IActionResult> DeleteMember(int quotationId, int memberId)
        {
            var success = await _service.DeleteMember(memberId, quotationId);
            if (!success) return NotFound(new { message = "Member not found." });
            return Ok(new { Message = "Member deleted" });
        }

        /// <summary>
        /// Bulk add members (from Excel upload or batch entry).
        /// </summary>
        [HttpPost("{quotationId}/members/bulk")]
        public async Task<IActionResult> BulkAddMembers(int quotationId, [FromBody] List<mdlMemberReq> members)
        {
            if (members == null || members.Count == 0)
                return BadRequest(new { message = "At least one member is required." });

            var count = await _service.BulkAddMembers(quotationId, members);
            return Ok(new { Count = count, Message = $"{count} members added" });
        }

        /// <summary>
        /// Get all members for a quotation.
        /// </summary>
        [HttpGet("{quotationId}/members")]
        public async Task<IActionResult> GetMembers(int quotationId)
        {
            var result = await _service.GetMembers(quotationId);
            return Ok(result);
        }

        // ═══════════════════════════════════════════════════════
        //  HEALTH DECLARATION
        // ═══════════════════════════════════════════════════════

        /// <summary>
        /// Save health declaration for a single member (height, weight, BMI, pregnancy, CCHI answers).
        /// </summary>
        [HttpPost("health-declaration")]
        public async Task<IActionResult> SaveHealthDeclaration([FromBody] mdlHealthDeclarationReq request)
        {
            var success = await _service.SaveHealthDeclaration(request);
            if (!success) return BadRequest(new { message = "Failed to save health declaration." });
            return Ok(new { Message = "Health declaration saved" });
        }

        /// <summary>
        /// Bulk save health declarations for all members in a quotation.
        /// </summary>
        [HttpPost("health-declaration/bulk")]
        public async Task<IActionResult> BulkSaveHealthDeclarations([FromBody] List<mdlHealthDeclarationReq> declarations)
        {
            if (declarations == null || declarations.Count == 0)
                return BadRequest(new { message = "At least one declaration is required." });

            var success = await _service.BulkSaveHealthDeclarations(declarations);
            return Ok(new { Message = "All declarations saved" });
        }

        // ═══════════════════════════════════════════════════════
        //  PREMIUM CALCULATION
        // ═══════════════════════════════════════════════════════

        /// <summary>
        /// Calculate premium for all members in a quotation.
        /// Returns total + per-member breakdown with class-based rates and health loading.
        /// </summary>
        [HttpGet("{quotationId}/premium")]
        public async Task<IActionResult> CalculatePremium(int quotationId)
        {
            var result = await _service.CalculatePremium(quotationId);
            return Ok(result);
        }

        // ═══════════════════════════════════════════════════════
        //  KYC
        // ═══════════════════════════════════════════════════════

        /// <summary>
        /// Save KYC data: national address, business details, compliance (PEP, board members, shareholders).
        /// </summary>
        [HttpPost("kyc")]
        public async Task<IActionResult> SaveKyc([FromBody] mdlKycReq request)
        {
            if (!request.TermsAccepted)
                return BadRequest(new { message = "Terms must be accepted." });

            var success = await _service.SaveKyc(request);
            if (!success) return BadRequest(new { message = "Failed to save KYC" });
            return Ok(new { Message = "KYC saved" });
        }

        /// <summary>
        /// Get KYC data for a quotation.
        /// </summary>
        [HttpGet("{quotationId}/kyc")]
        public async Task<IActionResult> GetKyc(int quotationId)
        {
            var result = await _service.GetKyc(quotationId);
            if (result == null) return NotFound(new { message = "KYC data not found." });
            return Ok(result);
        }

        // ═══════════════════════════════════════════════════════
        //  PAYMENT
        // ═══════════════════════════════════════════════════════

        /// <summary>
        /// Process payment for a quotation. Issues policy number on success.
        /// </summary>
        [HttpPost("payment")]
        public async Task<IActionResult> ProcessPayment([FromBody] mdlPaymentReq request)
        {
            if (request.Amount <= 0)
                return BadRequest(new { message = "Payment amount must be greater than zero." });

            var result = await _service.ProcessPayment(request);
            if (result == null) return BadRequest(new { message = "Payment failed" });
            return Ok(result);
        }

        // ═══════════════════════════════════════════════════════
        //  ENDORSEMENT HISTORY (WITHIN POLICY)
        // ═══════════════════════════════════════════════════════

        /// <summary>
        /// Get endorsement history for a policy (includes original policy issuance + all endorsements).
        /// Supports filtering by type, status, date range, and pagination.
        /// </summary>
        [HttpGet("policies/{policyId}/endorsements")]
        public async Task<IActionResult> GetEndorsementHistory(int policyId,
            [FromQuery] string? type = null,
            [FromQuery] string? status = null,
            [FromQuery] DateTime? fromDate = null,
            [FromQuery] DateTime? toDate = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20)
        {
            var filter = new mdlEndorsementHistoryFilterReq
            {
                PolicyId = policyId,
                Type = type,
                Status = status,
                FromDate = fromDate,
                ToDate = toDate,
                Page = page,
                PageSize = pageSize
            };
            var result = await _service.GetEndorsementHistory(filter);
            return Ok(result);
        }

        // ═══════════════════════════════════════════════════════
        //  DOCUMENT DOWNLOAD
        // ═══════════════════════════════════════════════════════

        /// <summary>
        /// Download quotation document (PDF).
        /// </summary>
        [HttpGet("{quotationId}/document/quotation")]
        public async Task<IActionResult> DownloadQuotation(int quotationId)
        {
            var doc = await _service.DownloadQuotationDocument(quotationId, GetUserId());
            if (doc == null) return NotFound(new { message = "Document not found." });
            return File(doc.FileContent, doc.ContentType, doc.FileName);
        }

        /// <summary>
        /// Download policy document (PDF).
        /// </summary>
        [HttpGet("{quotationId}/document/policy")]
        public async Task<IActionResult> DownloadPolicy(int quotationId)
        {
            var doc = await _service.DownloadPolicyDocument(quotationId, GetUserId());
            if (doc == null) return NotFound(new { message = "Document not found." });
            return File(doc.FileContent, doc.ContentType, doc.FileName);
        }

        /// <summary>
        /// Download endorsement receipt document (PDF).
        /// </summary>
        [HttpGet("endorsements/{endorsementId}/document")]
        public async Task<IActionResult> DownloadEndorsementReceipt(int endorsementId)
        {
            var doc = await _service.DownloadEndorsementDocument(endorsementId, GetUserId());
            if (doc == null) return NotFound(new { message = "Document not found." });
            return File(doc.FileContent, doc.ContentType, doc.FileName);
        }
    }
}
