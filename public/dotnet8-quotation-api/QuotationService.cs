using Dapper;
using InsuranceApi.Models.QuotationModels;
using Microsoft.Data.SqlClient;
using System.Data;

namespace InsuranceApi.BAL
{
    public class QuotationService
    {
        // ═══════════════════════════════════════════════════════
        //  DASHBOARD SUMMARY
        // ═══════════════════════════════════════════════════════

        public async Task<mdlDashboardSummaryRes> GetDashboardSummary(int userId)
        {
            using var connection = new SqlConnection(clsMain.ConString());
            var summary = await connection.QueryFirstOrDefaultAsync<mdlDashboardSummaryRes>(
                "SPME_GetDashboardSummary",
                new { UserId = userId },
                commandType: CommandType.StoredProcedure);

            if (summary == null) return new mdlDashboardSummaryRes();

            // Recent quotations (top 5)
            summary.RecentQuotations = (await connection.QueryAsync<mdlQuotationListRes>(
                "SPME_GetUserQuotations",
                new { UserId = userId, Top = 5 },
                commandType: CommandType.StoredProcedure)).ToList();

            // Recent policies (top 5)
            summary.RecentPolicies = (await connection.QueryAsync<mdlPolicyListRes>(
                "SPME_GetUserPolicies",
                new { UserId = userId, Top = 5 },
                commandType: CommandType.StoredProcedure)).ToList();

            return summary;
        }

        // ═══════════════════════════════════════════════════════
        //  SPONSOR VALIDATION
        // ═══════════════════════════════════════════════════════

        public async Task<mdlSponsorValidateRes> ValidateSponsor(mdlSponsorValidateReq request)
        {
            using var connection = new SqlConnection(clsMain.ConString());
            var result = await connection.QueryFirstOrDefaultAsync<mdlSponsorValidateRes>(
                "SPME_ValidateSponsor",
                new { request.SponsorNumber },
                commandType: CommandType.StoredProcedure);

            return result ?? new mdlSponsorValidateRes
            {
                Success = false,
                Error = "Sponsor not found in registry."
            };
        }

        // ═══════════════════════════════════════════════════════
        //  QUOTATION CRUD
        // ═══════════════════════════════════════════════════════

        public async Task<int> CreateQuotation(mdlQuotationCreateReq request)
        {
            using var connection = new SqlConnection(clsMain.ConString());
            var id = await connection.ExecuteScalarAsync<int>(
                "SPME_CreateQuotation",
                new
                {
                    request.UserId,
                    request.SponsorNumber,
                    request.PolicyEffectiveDate,
                    request.SponsorName,
                    request.SponsorStatus
                },
                commandType: CommandType.StoredProcedure);
            return id;
        }

        public async Task<mdlQuotationRes?> GetQuotation(int quotationId, int userId)
        {
            using var connection = new SqlConnection(clsMain.ConString());

            // Get quotation header
            var quotation = await connection.QueryFirstOrDefaultAsync<mdlQuotationRes>(
                "SPME_GetQuotation",
                new { QuotationId = quotationId, UserId = userId },
                commandType: CommandType.StoredProcedure);

            if (quotation == null) return null;

            // Get sponsor data
            quotation.SponsorData = await connection.QueryFirstOrDefaultAsync<mdlSponsorDataRes>(
                "SPME_GetQuotationSponsor",
                new { QuotationId = quotationId },
                commandType: CommandType.StoredProcedure);

            // Get members
            quotation.Members = (await connection.QueryAsync<mdlMemberRes>(
                "SPME_GetQuotationMembers",
                new { QuotationId = quotationId },
                commandType: CommandType.StoredProcedure)).ToList();

            // Get KYC data
            quotation.KycData = await connection.QueryFirstOrDefaultAsync<mdlKycDataRes>(
                "SPME_GetQuotationKyc",
                new { QuotationId = quotationId },
                commandType: CommandType.StoredProcedure);

            // Get payment info (if paid)
            if (quotation.Status == "paid")
            {
                quotation.Payment = await connection.QueryFirstOrDefaultAsync<mdlPaymentRes>(
                    "SPME_GetQuotationPayment",
                    new { QuotationId = quotationId },
                    commandType: CommandType.StoredProcedure);
            }

            // Get endorsement history (if policy exists)
            if (!string.IsNullOrEmpty(quotation.PolicyNumber))
            {
                quotation.EndorsementHistory = (await connection.QueryAsync<mdlEndorsementHistoryRes>(
                    "SPME_GetPolicyEndorsementHistory",
                    new { PolicyId = quotationId },
                    commandType: CommandType.StoredProcedure)).ToList();
            }

            return quotation;
        }

        public async Task<List<mdlQuotationListRes>> GetUserQuotations(int userId)
        {
            using var connection = new SqlConnection(clsMain.ConString());
            var result = await connection.QueryAsync<mdlQuotationListRes>(
                "SPME_GetUserQuotations",
                new { UserId = userId },
                commandType: CommandType.StoredProcedure);
            return result.ToList();
        }

        public async Task<List<mdlPolicyListRes>> GetUserPolicies(int userId)
        {
            using var connection = new SqlConnection(clsMain.ConString());
            var policies = (await connection.QueryAsync<mdlPolicyListRes>(
                "SPME_GetUserPolicies",
                new { UserId = userId },
                commandType: CommandType.StoredProcedure)).ToList();

            // Load top 5 members for each policy (for preview)
            foreach (var policy in policies)
            {
                policy.TopMembers = (await connection.QueryAsync<mdlMemberSummaryRes>(
                    "SPME_GetPolicyTopMembers",
                    new { QuotationId = policy.QuotationId, Top = 5 },
                    commandType: CommandType.StoredProcedure)).ToList();
            }

            return policies;
        }

        public async Task<mdlQuotationRes?> GetPolicyDetail(int policyId, int userId)
        {
            // Reuses GetQuotation but validates it's a paid policy
            var quotation = await GetQuotation(policyId, userId);
            if (quotation == null || quotation.Status != "paid") return null;
            return quotation;
        }

        public async Task<bool> UpdateStep(int quotationId, int userId, int step)
        {
            using var connection = new SqlConnection(clsMain.ConString());
            var rows = await connection.ExecuteAsync(
                "SPME_UpdateQuotationStep",
                new { QuotationId = quotationId, UserId = userId, Step = step },
                commandType: CommandType.StoredProcedure);
            return rows > 0;
        }

        public async Task<bool> UpdateStatus(int quotationId, int userId, string status)
        {
            using var connection = new SqlConnection(clsMain.ConString());
            var rows = await connection.ExecuteAsync(
                "SPME_UpdateQuotationStatus",
                new { QuotationId = quotationId, UserId = userId, Status = status },
                commandType: CommandType.StoredProcedure);
            return rows > 0;
        }

        // ═══════════════════════════════════════════════════════
        //  MEMBERS
        // ═══════════════════════════════════════════════════════

        public async Task<int> AddMember(int quotationId, mdlMemberReq request)
        {
            using var connection = new SqlConnection(clsMain.ConString());
            var id = await connection.ExecuteScalarAsync<int>(
                "SPME_AddQuotationMember",
                new
                {
                    QuotationId = quotationId,
                    request.MemberType,
                    request.MemberName,
                    request.IdentityNumber,
                    request.DateOfBirth,
                    request.Gender,
                    request.MaritalStatus,
                    request.ClassSelection,
                    request.SponsorNumber,
                    request.EmployeeId
                },
                commandType: CommandType.StoredProcedure);
            return id;
        }

        public async Task<bool> UpdateMember(int memberId, mdlMemberReq request)
        {
            using var connection = new SqlConnection(clsMain.ConString());
            var rows = await connection.ExecuteAsync(
                "SPME_UpdateQuotationMember",
                new
                {
                    MemberId = memberId,
                    request.MemberType,
                    request.MemberName,
                    request.IdentityNumber,
                    request.DateOfBirth,
                    request.Gender,
                    request.MaritalStatus,
                    request.ClassSelection,
                    request.SponsorNumber,
                    request.EmployeeId
                },
                commandType: CommandType.StoredProcedure);
            return rows > 0;
        }

        public async Task<bool> DeleteMember(int memberId, int quotationId)
        {
            using var connection = new SqlConnection(clsMain.ConString());
            var rows = await connection.ExecuteAsync(
                "SPME_DeleteQuotationMember",
                new { MemberId = memberId, QuotationId = quotationId },
                commandType: CommandType.StoredProcedure);
            return rows > 0;
        }

        public async Task<int> BulkAddMembers(int quotationId, List<mdlMemberReq> members)
        {
            using var connection = new SqlConnection(clsMain.ConString());
            await connection.OpenAsync();
            using var transaction = connection.BeginTransaction();

            try
            {
                int count = 0;
                foreach (var member in members)
                {
                    await connection.ExecuteScalarAsync<int>(
                        "SPME_AddQuotationMember",
                        new
                        {
                            QuotationId = quotationId,
                            member.MemberType,
                            member.MemberName,
                            member.IdentityNumber,
                            member.DateOfBirth,
                            member.Gender,
                            member.MaritalStatus,
                            member.ClassSelection,
                            member.SponsorNumber,
                            member.EmployeeId
                        },
                        transaction: transaction,
                        commandType: CommandType.StoredProcedure);
                    count++;
                }

                transaction.Commit();
                return count;
            }
            catch
            {
                transaction.Rollback();
                throw;
            }
        }

        public async Task<List<mdlMemberRes>> GetMembers(int quotationId)
        {
            using var connection = new SqlConnection(clsMain.ConString());
            var result = await connection.QueryAsync<mdlMemberRes>(
                "SPME_GetQuotationMembers",
                new { QuotationId = quotationId },
                commandType: CommandType.StoredProcedure);
            return result.ToList();
        }

        // ═══════════════════════════════════════════════════════
        //  HEALTH DECLARATION
        // ═══════════════════════════════════════════════════════

        public async Task<bool> SaveHealthDeclaration(mdlHealthDeclarationReq request)
        {
            using var connection = new SqlConnection(clsMain.ConString());
            var rows = await connection.ExecuteAsync(
                "SPME_SaveHealthDeclaration",
                new
                {
                    request.MemberId,
                    request.QuotationId,
                    request.HealthDeclaration,
                    request.HealthAnswersJson,
                    request.HeightCm,
                    request.WeightKg,
                    request.IsPregnant,
                    request.ExpectedDeliveryDate,
                    request.MaternityDays
                },
                commandType: CommandType.StoredProcedure);
            return rows > 0;
        }

        public async Task<bool> BulkSaveHealthDeclarations(List<mdlHealthDeclarationReq> declarations)
        {
            using var connection = new SqlConnection(clsMain.ConString());
            await connection.OpenAsync();
            using var transaction = connection.BeginTransaction();

            try
            {
                foreach (var decl in declarations)
                {
                    await connection.ExecuteAsync(
                        "SPME_SaveHealthDeclaration",
                        new
                        {
                            decl.MemberId,
                            decl.QuotationId,
                            decl.HealthDeclaration,
                            decl.HealthAnswersJson,
                            decl.HeightCm,
                            decl.WeightKg,
                            decl.IsPregnant,
                            decl.ExpectedDeliveryDate,
                            decl.MaternityDays
                        },
                        transaction: transaction,
                        commandType: CommandType.StoredProcedure);
                }

                transaction.Commit();
                return true;
            }
            catch
            {
                transaction.Rollback();
                throw;
            }
        }

        // ═══════════════════════════════════════════════════════
        //  PREMIUM CALCULATION
        // ═══════════════════════════════════════════════════════

        public async Task<mdlPremiumCalcRes> CalculatePremium(int quotationId)
        {
            using var connection = new SqlConnection(clsMain.ConString());

            var members = await connection.QueryAsync<mdlMemberPremium>(
                "SPME_CalculateQuotationPremium",
                new { QuotationId = quotationId },
                commandType: CommandType.StoredProcedure);

            var memberList = members.ToList();

            return new mdlPremiumCalcRes
            {
                TotalPremium = memberList.Sum(m => m.Premium),
                MemberPremiums = memberList
            };
        }

        // ═══════════════════════════════════════════════════════
        //  KYC
        // ═══════════════════════════════════════════════════════

        public async Task<bool> SaveKyc(mdlKycReq request)
        {
            using var connection = new SqlConnection(clsMain.ConString());
            var rows = await connection.ExecuteAsync(
                "SPME_SaveQuotationKyc",
                new
                {
                    request.QuotationId,
                    request.BuildingNumber,
                    request.AdditionalNumber,
                    request.UnitNumber,
                    request.PostalCode,
                    request.Street,
                    request.District,
                    request.City,
                    request.BusinessType,
                    request.CompanyRevenue,
                    request.NumberOfEmployees,
                    request.TaxRegistrationNumber,
                    request.IbanNumber,
                    request.BankName,
                    request.IsPEP,
                    request.IsBoardMember,
                    request.BoardMembersJson,
                    request.HasMajorShareholder,
                    request.ShareholdersJson,
                    request.TermsAccepted
                },
                commandType: CommandType.StoredProcedure);
            return rows > 0;
        }

        public async Task<mdlKycDataRes?> GetKyc(int quotationId)
        {
            using var connection = new SqlConnection(clsMain.ConString());
            return await connection.QueryFirstOrDefaultAsync<mdlKycDataRes>(
                "SPME_GetQuotationKyc",
                new { QuotationId = quotationId },
                commandType: CommandType.StoredProcedure);
        }

        // ═══════════════════════════════════════════════════════
        //  PAYMENT
        // ═══════════════════════════════════════════════════════

        public async Task<mdlPaymentRes?> ProcessPayment(mdlPaymentReq request)
        {
            using var connection = new SqlConnection(clsMain.ConString());
            var result = await connection.QueryFirstOrDefaultAsync<mdlPaymentRes>(
                "SPME_ProcessQuotationPayment",
                new
                {
                    request.QuotationId,
                    request.PaymentMethod,
                    request.CardholderName,
                    request.TransactionRef,
                    request.Amount
                },
                commandType: CommandType.StoredProcedure);
            return result;
        }

        // ═══════════════════════════════════════════════════════
        //  ENDORSEMENT HISTORY
        // ═══════════════════════════════════════════════════════

        public async Task<mdlEndorsementHistoryPageRes> GetEndorsementHistory(mdlEndorsementHistoryFilterReq filter)
        {
            using var connection = new SqlConnection(clsMain.ConString());

            // Get total count
            var totalCount = await connection.ExecuteScalarAsync<int>(
                "SPME_GetPolicyEndorsementHistoryCount",
                new
                {
                    filter.PolicyId,
                    filter.Type,
                    filter.Status,
                    filter.FromDate,
                    filter.ToDate
                },
                commandType: CommandType.StoredProcedure);

            // Get paginated results
            var items = await connection.QueryAsync<mdlEndorsementHistoryRes>(
                "SPME_GetPolicyEndorsementHistoryPaged",
                new
                {
                    filter.PolicyId,
                    filter.Type,
                    filter.Status,
                    filter.FromDate,
                    filter.ToDate,
                    filter.Page,
                    filter.PageSize
                },
                commandType: CommandType.StoredProcedure);

            return new mdlEndorsementHistoryPageRes
            {
                Items = items.ToList(),
                TotalCount = totalCount,
                Page = filter.Page,
                PageSize = filter.PageSize,
                TotalPages = (int)Math.Ceiling((double)totalCount / filter.PageSize)
            };
        }

        // ═══════════════════════════════════════════════════════
        //  DOCUMENT DOWNLOAD
        // ═══════════════════════════════════════════════════════

        public async Task<mdlDocumentRes?> DownloadQuotationDocument(int quotationId, int userId)
        {
            using var connection = new SqlConnection(clsMain.ConString());
            var result = await connection.QueryFirstOrDefaultAsync<mdlDocumentRes>(
                "SPME_GetQuotationDocument",
                new { QuotationId = quotationId, UserId = userId },
                commandType: CommandType.StoredProcedure);
            return result;
        }

        public async Task<mdlDocumentRes?> DownloadPolicyDocument(int quotationId, int userId)
        {
            using var connection = new SqlConnection(clsMain.ConString());
            var result = await connection.QueryFirstOrDefaultAsync<mdlDocumentRes>(
                "SPME_GetPolicyDocument",
                new { QuotationId = quotationId, UserId = userId },
                commandType: CommandType.StoredProcedure);
            return result;
        }

        public async Task<mdlDocumentRes?> DownloadEndorsementDocument(int endorsementId, int userId)
        {
            using var connection = new SqlConnection(clsMain.ConString());
            var result = await connection.QueryFirstOrDefaultAsync<mdlDocumentRes>(
                "SPME_GetEndorsementDocument",
                new { EndorsementId = endorsementId, UserId = userId },
                commandType: CommandType.StoredProcedure);
            return result;
        }
    }
}
