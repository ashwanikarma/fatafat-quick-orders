using Dapper;
using InsuranceApi.Models.EndorsementModels;
using Microsoft.Data.SqlClient;
using System.Data;

namespace InsuranceApi.BAL
{
    public class EndorsementService
    {
        // ═══════════════════════════════════════════════════
        //  ADD MEMBER ENDORSEMENT
        // ═══════════════════════════════════════════════════

        /// <summary>Create add-member endorsement, insert members, calculate premium diff</summary>
        public async Task<mdlEndorsementRes> CreateAddMemberEndorsement(mdlAddMemberReq request, int userId)
        {
            using var connection = new SqlConnection(clsMain.ConString());
            await connection.OpenAsync();
            using var tx = connection.BeginTransaction();

            try
            {
                // 1. Create endorsement header
                var endorsementId = await connection.ExecuteScalarAsync<int>(
                    "SPME_CreateEndorsement",
                    new { request.PolicyId, UserId = userId, Type = "AddMember" },
                    tx, commandType: CommandType.StoredProcedure);

                // 2. Insert each new member
                foreach (var member in request.Members)
                {
                    await connection.ExecuteAsync(
                        "SPME_InsertEndorsementMember",
                        new
                        {
                            EndorsementId = endorsementId,
                            member.MemberType,
                            member.MemberName,
                            member.IdentityNumber,
                            member.DateOfBirth,
                            member.Gender,
                            member.MaritalStatus,
                            member.ClassSelection,
                            member.EmployeeId,
                            member.HealthDeclaration,
                            member.HealthAnswers,
                            member.HeightCm,
                            member.WeightKg
                        },
                        tx, commandType: CommandType.StoredProcedure);
                }

                // 3. Calculate premium difference
                var premiumDiff = await connection.QueryFirstAsync<mdlPremiumDiffRes>(
                    "SPME_CalculateAddMemberPremium",
                    new { EndorsementId = endorsementId },
                    tx, commandType: CommandType.StoredProcedure);

                // 4. Update endorsement with premium
                await connection.ExecuteAsync(
                    "SPME_UpdateEndorsementPremium",
                    new { EndorsementId = endorsementId, premiumDiff.AdditionalPremium, premiumDiff.NewTotalPremium, Status = "PaymentRequired" },
                    tx, commandType: CommandType.StoredProcedure);

                tx.Commit();

                return new mdlEndorsementRes
                {
                    EndorsementId = endorsementId,
                    EndorsementType = "AddMember",
                    Status = "PaymentRequired",
                    PremiumDifference = premiumDiff.AdditionalPremium,
                    NewTotalPremium = premiumDiff.NewTotalPremium,
                    Message = $"Additional premium of SAR {premiumDiff.AdditionalPremium:N0} required for {request.Members.Count} new member(s)."
                };
            }
            catch
            {
                tx.Rollback();
                throw;
            }
        }

        /// <summary>Process payment for add-member endorsement, then approve</summary>
        public async Task<mdlEndorsementRes> ProcessAddMemberPayment(mdlEndorsementPaymentReq request)
        {
            using var connection = new SqlConnection(clsMain.ConString());

            // 1. Simulate payment gateway call
            await Task.Delay(2000); // Simulate latency

            // 2. Record payment
            await connection.ExecuteAsync(
                "SPME_RecordEndorsementPayment",
                new
                {
                    request.EndorsementId,
                    request.CardholderName,
                    CardLast4 = request.CardNumber.Length >= 4 ? request.CardNumber[^4..] : "",
                    request.PaymentType,
                    PaymentStatus = "Success",
                    TransactionRef = $"TXN-{DateTime.UtcNow.Ticks}"
                },
                commandType: CommandType.StoredProcedure);

            // 3. Approve endorsement → copy members to policy
            var result = await connection.QueryFirstAsync<mdlEndorsementRes>(
                "SPME_ApproveAddMemberEndorsement",
                new { request.EndorsementId },
                commandType: CommandType.StoredProcedure);

            return result;
        }

        // ═══════════════════════════════════════════════════
        //  UPDATE MEMBER ENDORSEMENT
        // ═══════════════════════════════════════════════════

        /// <summary>Update basic member details. No approval required.</summary>
        public async Task<mdlEndorsementRes> UpdateMember(mdlUpdateMemberReq request, int userId)
        {
            using var connection = new SqlConnection(clsMain.ConString());

            // 1. Create endorsement record for audit
            var endorsementId = await connection.ExecuteScalarAsync<int>(
                "SPME_CreateEndorsement",
                new { request.PolicyId, UserId = userId, Type = "UpdateMember" },
                commandType: CommandType.StoredProcedure);

            // 2. Update member directly
            await connection.ExecuteAsync(
                "SPME_UpdatePolicyMember",
                new
                {
                    request.MemberId,
                    request.MemberName,
                    request.Gender,
                    request.MaritalStatus,
                    request.DateOfBirth,
                    EndorsementId = endorsementId
                },
                commandType: CommandType.StoredProcedure);

            // 3. Auto-approve
            await connection.ExecuteAsync(
                "SPME_AutoApproveEndorsement",
                new { EndorsementId = endorsementId },
                commandType: CommandType.StoredProcedure);

            return new mdlEndorsementRes
            {
                EndorsementId = endorsementId,
                EndorsementType = "UpdateMember",
                Status = "Approved",
                Message = "Member details updated successfully. No approval required."
            };
        }

        // ═══════════════════════════════════════════════════
        //  DELETE MEMBER ENDORSEMENT
        // ═══════════════════════════════════════════════════

        /// <summary>Create delete-member endorsement with refund calculation</summary>
        public async Task<mdlRefundRes> CreateDeleteMemberEndorsement(mdlDeleteMemberReq request, int userId)
        {
            using var connection = new SqlConnection(clsMain.ConString());
            await connection.OpenAsync();
            using var tx = connection.BeginTransaction();

            try
            {
                // 1. Create endorsement header
                var endorsementId = await connection.ExecuteScalarAsync<int>(
                    "SPME_CreateEndorsement",
                    new { request.PolicyId, UserId = userId, Type = "DeleteMember" },
                    tx, commandType: CommandType.StoredProcedure);

                // 2. Mark members for deletion
                foreach (var memberId in request.MemberIds)
                {
                    await connection.ExecuteAsync(
                        "SPME_MarkMemberForDeletion",
                        new { EndorsementId = endorsementId, MemberId = memberId, request.DeletionReason },
                        tx, commandType: CommandType.StoredProcedure);
                }

                // 3. Calculate refund
                var refund = await connection.QueryFirstAsync<mdlRefundRes>(
                    "SPME_CalculateDeleteRefund",
                    new { EndorsementId = endorsementId },
                    tx, commandType: CommandType.StoredProcedure);

                // 4. Approve and process deletion
                await connection.ExecuteAsync(
                    "SPME_ApproveDeleteEndorsement",
                    new { EndorsementId = endorsementId },
                    tx, commandType: CommandType.StoredProcedure);

                tx.Commit();

                refund.DeletionReason = request.DeletionReason;
                return refund;
            }
            catch
            {
                tx.Rollback();
                throw;
            }
        }

        /// <summary>Resolve identity numbers from bulk Excel to member IDs</summary>
        public async Task<List<int>> ResolveBulkDeleteMembers(int policyId, List<string> identityNumbers)
        {
            using var connection = new SqlConnection(clsMain.ConString());

            var memberIds = new List<int>();
            foreach (var identity in identityNumbers)
            {
                var id = await connection.QueryFirstOrDefaultAsync<int?>(
                    "SPME_GetMemberIdByIdentity",
                    new { PolicyId = policyId, IdentityNumber = identity },
                    commandType: CommandType.StoredProcedure);

                if (id.HasValue) memberIds.Add(id.Value);
            }
            return memberIds;
        }

        // ═══════════════════════════════════════════════════
        //  COMMON
        // ═══════════════════════════════════════════════════

        public async Task<List<mdlEndorsementRes>> GetEndorsementHistory(int policyId)
        {
            using var connection = new SqlConnection(clsMain.ConString());
            var result = await connection.QueryAsync<mdlEndorsementRes>(
                "SPME_GetEndorsementHistory",
                new { PolicyId = policyId },
                commandType: CommandType.StoredProcedure);
            return result.ToList();
        }

        public async Task<mdlEndorsementRes> GetEndorsementById(int endorsementId)
        {
            using var connection = new SqlConnection(clsMain.ConString());
            return await connection.QueryFirstOrDefaultAsync<mdlEndorsementRes>(
                "SPME_GetEndorsementById",
                new { EndorsementId = endorsementId },
                commandType: CommandType.StoredProcedure);
        }
    }
}
