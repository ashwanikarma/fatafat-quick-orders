using InsuranceApi.BAL;
using InsuranceApi.Models.EndorsementModels;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace InsuranceApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class EndorsementController : ControllerBase
    {
        private readonly EndorsementService _service;

        public EndorsementController(EndorsementService service)
        {
            _service = service;
        }

        private int GetUserId() => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        // ══════════════════════════════════════════════════
        //  ADD MEMBER ENDORSEMENT
        // ══════════════════════════════════════════════════

        /// <summary>
        /// Step 1: Submit new members with health declarations.
        /// Returns premium difference and endorsement ID.
        /// </summary>
        [HttpPost("add-member")]
        public async Task<IActionResult> AddMember([FromBody] mdlAddMemberReq request)
        {
            try
            {
                if (request.Members == null || request.Members.Count == 0)
                    return BadRequest(new { message = "At least one member is required." });

                foreach (var m in request.Members)
                {
                    if (string.IsNullOrWhiteSpace(m.MemberName))
                        return BadRequest(new { message = "Member name is required for all members." });
                    if (string.IsNullOrWhiteSpace(m.IdentityNumber))
                        return BadRequest(new { message = "Identity number is required for all members." });
                }

                var result = await _service.CreateAddMemberEndorsement(request, GetUserId());
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to create endorsement.", error = ex.Message });
            }
        }

        /// <summary>
        /// Step 2: Process payment for add-member endorsement.
        /// On success, members are added to the policy.
        /// </summary>
        [HttpPost("add-member/pay")]
        public async Task<IActionResult> PayAddMember([FromBody] mdlEndorsementPaymentReq request)
        {
            try
            {
                var result = await _service.ProcessAddMemberPayment(request);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Payment processing failed.", error = ex.Message });
            }
        }

        // ══════════════════════════════════════════════════
        //  UPDATE MEMBER ENDORSEMENT
        // ══════════════════════════════════════════════════

        /// <summary>
        /// Update basic member details (name, gender, marital status, DOB).
        /// No approval required — automatically applied.
        /// </summary>
        [HttpPut("update-member")]
        public async Task<IActionResult> UpdateMember([FromBody] mdlUpdateMemberReq request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.MemberName))
                    return BadRequest(new { message = "Member name is required." });

                var result = await _service.UpdateMember(request, GetUserId());
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to update member.", error = ex.Message });
            }
        }

        // ══════════════════════════════════════════════════
        //  DELETE MEMBER ENDORSEMENT
        // ══════════════════════════════════════════════════

        /// <summary>
        /// Delete members with reason. Returns refund calculation.
        /// Supports single selection or bulk (by IDs).
        /// </summary>
        [HttpPost("delete-member")]
        public async Task<IActionResult> DeleteMember([FromBody] mdlDeleteMemberReq request)
        {
            try
            {
                if (request.MemberIds == null || request.MemberIds.Count == 0)
                    return BadRequest(new { message = "At least one member must be selected." });

                if (string.IsNullOrWhiteSpace(request.DeletionReason))
                    return BadRequest(new { message = "Deletion reason is required." });

                var result = await _service.CreateDeleteMemberEndorsement(request, GetUserId());
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to process deletion.", error = ex.Message });
            }
        }

        /// <summary>
        /// Resolve identity numbers from bulk Excel upload to member IDs.
        /// Frontend uploads Excel, parses it, sends identity numbers here.
        /// </summary>
        [HttpPost("delete-member/resolve-bulk")]
        public async Task<IActionResult> ResolveBulkDelete([FromBody] BulkResolveReq request)
        {
            try
            {
                var memberIds = await _service.ResolveBulkDeleteMembers(request.PolicyId, request.IdentityNumbers);
                return Ok(new { memberIds, found = memberIds.Count, total = request.IdentityNumbers.Count });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to resolve members.", error = ex.Message });
            }
        }

        // ══════════════════════════════════════════════════
        //  ENDORSEMENT HISTORY
        // ══════════════════════════════════════════════════

        [HttpGet("history/{policyId}")]
        public async Task<IActionResult> GetHistory(int policyId)
        {
            try
            {
                var history = await _service.GetEndorsementHistory(policyId);
                return Ok(history);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to load history.", error = ex.Message });
            }
        }

        [HttpGet("{endorsementId}")]
        public async Task<IActionResult> GetById(int endorsementId)
        {
            try
            {
                var endorsement = await _service.GetEndorsementById(endorsementId);
                if (endorsement == null) return NotFound(new { message = "Endorsement not found." });
                return Ok(endorsement);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to load endorsement.", error = ex.Message });
            }
        }
    }

    public class BulkResolveReq
    {
        public int PolicyId { get; set; }
        public List<string> IdentityNumbers { get; set; } = new();
    }
}
