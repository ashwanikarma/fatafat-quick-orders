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

        // ── Sponsor ──

        [HttpPost("sponsor/validate")]
        public async Task<IActionResult> ValidateSponsor([FromBody] mdlSponsorValidateReq request)
        {
            var result = await _service.ValidateSponsor(request);
            if (!result.Success)
                return BadRequest(result);
            return Ok(result);
        }

        // ── Quotation CRUD ──

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] mdlQuotationCreateReq request)
        {
            request.UserId = GetUserId();
            var id = await _service.CreateQuotation(request);
            return Ok(new { QuotationId = id });
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> Get(int id)
        {
            var result = await _service.GetQuotation(id, GetUserId());
            if (result == null) return NotFound();
            return Ok(result);
        }

        [HttpGet("list")]
        public async Task<IActionResult> GetAll()
        {
            var result = await _service.GetUserQuotations(GetUserId());
            return Ok(result);
        }

        [HttpGet("policies")]
        public async Task<IActionResult> GetPolicies()
        {
            var result = await _service.GetUserPolicies(GetUserId());
            return Ok(result);
        }

        [HttpPut("{id}/step/{step}")]
        public async Task<IActionResult> UpdateStep(int id, int step)
        {
            var success = await _service.UpdateStep(id, GetUserId(), step);
            if (!success) return NotFound();
            return Ok(new { Message = "Step updated" });
        }

        // ── Members ──

        [HttpPost("{quotationId}/members")]
        public async Task<IActionResult> AddMember(int quotationId, [FromBody] mdlMemberReq request)
        {
            var id = await _service.AddMember(quotationId, request);
            return Ok(new { MemberId = id });
        }

        [HttpPut("members/{memberId}")]
        public async Task<IActionResult> UpdateMember(int memberId, [FromBody] mdlMemberReq request)
        {
            var success = await _service.UpdateMember(memberId, request);
            if (!success) return NotFound();
            return Ok(new { Message = "Member updated" });
        }

        [HttpDelete("{quotationId}/members/{memberId}")]
        public async Task<IActionResult> DeleteMember(int quotationId, int memberId)
        {
            var success = await _service.DeleteMember(memberId, quotationId);
            if (!success) return NotFound();
            return Ok(new { Message = "Member deleted" });
        }

        [HttpPost("{quotationId}/members/bulk")]
        public async Task<IActionResult> BulkAddMembers(int quotationId, [FromBody] List<mdlMemberReq> members)
        {
            var count = await _service.BulkAddMembers(quotationId, members);
            return Ok(new { Count = count, Message = $"{count} members added" });
        }

        // ── Health Declaration ──

        [HttpPost("health-declaration")]
        public async Task<IActionResult> SaveHealthDeclaration([FromBody] mdlHealthDeclarationReq request)
        {
            var success = await _service.SaveHealthDeclaration(request);
            if (!success) return BadRequest(new { Message = "Failed to save" });
            return Ok(new { Message = "Health declaration saved" });
        }

        [HttpPost("health-declaration/bulk")]
        public async Task<IActionResult> BulkSaveHealthDeclarations([FromBody] List<mdlHealthDeclarationReq> declarations)
        {
            var success = await _service.BulkSaveHealthDeclarations(declarations);
            return Ok(new { Message = "All declarations saved" });
        }

        // ── Premium ──

        [HttpGet("{quotationId}/premium")]
        public async Task<IActionResult> CalculatePremium(int quotationId)
        {
            var result = await _service.CalculatePremium(quotationId);
            return Ok(result);
        }

        // ── KYC ──

        [HttpPost("kyc")]
        public async Task<IActionResult> SaveKyc([FromBody] mdlKycReq request)
        {
            var success = await _service.SaveKyc(request);
            if (!success) return BadRequest(new { Message = "Failed to save KYC" });
            return Ok(new { Message = "KYC saved" });
        }

        // ── Payment ──

        [HttpPost("payment")]
        public async Task<IActionResult> ProcessPayment([FromBody] mdlPaymentReq request)
        {
            var success = await _service.ProcessPayment(request);
            if (!success) return BadRequest(new { Message = "Payment failed" });
            return Ok(new { Message = "Payment processed, policy issued" });
        }

        // ── Document Download ──

        [HttpGet("{quotationId}/document/quotation")]
        public async Task<IActionResult> DownloadQuotation(int quotationId)
        {
            var doc = await _service.DownloadQuotationDocument(quotationId, GetUserId());
            if (doc == null) return NotFound();
            return File(doc.FileContent, doc.ContentType, doc.FileName);
        }

        [HttpGet("{quotationId}/document/policy")]
        public async Task<IActionResult> DownloadPolicy(int quotationId)
        {
            var doc = await _service.DownloadPolicyDocument(quotationId, GetUserId());
            if (doc == null) return NotFound();
            return File(doc.FileContent, doc.ContentType, doc.FileName);
        }
    }
}
