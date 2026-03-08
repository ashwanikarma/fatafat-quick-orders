import type { QuotationRecord } from "@/hooks/useQuotationPersistence";

function formatDate(d?: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function buildContent(record: QuotationRecord, type: "quotation" | "policy"): string {
  const sponsor = record.sponsor_data as any;
  const members = (record.members as any[]) || [];
  const kyc = record.kyc_data as any;
  const title = type === "policy" ? "POLICY DOCUMENT" : "QUOTATION DOCUMENT";
  const ref = type === "policy"
    ? `Policy Number: ${record.policy_number || "—"}`
    : `Quotation ID: ${record.quotation_id || "—"}`;

  let text = `
════════════════════════════════════════════════════════
  ${title}
════════════════════════════════════════════════════════

${ref}
Status: ${record.status.toUpperCase()}
Created: ${formatDate(record.created_at)}
Last Updated: ${formatDate(record.updated_at)}

────────────────────────────────────────────────────────
  SPONSOR DETAILS
────────────────────────────────────────────────────────
Sponsor Name:           ${sponsor?.sponsorName || "—"}
Sponsor Number:         ${sponsor?.sponsorNumber || "—"}
Policy Effective Date:  ${sponsor?.policyEffectiveDate ? formatDate(sponsor.policyEffectiveDate) : "—"}
Unified Number:         ${sponsor?.unifiedNumber || "—"}

────────────────────────────────────────────────────────
  PREMIUM SUMMARY
────────────────────────────────────────────────────────
Total Premium:          SAR ${(record.total_premium || 0).toLocaleString()}
Members Count:          ${members.length}

────────────────────────────────────────────────────────
  MEMBERS
────────────────────────────────────────────────────────
`;

  if (members.length === 0) {
    text += "No members added.\n";
  } else {
    members.forEach((m: any, i: number) => {
      text += `
  ${i + 1}. ${m.memberName || m.identityNumber || "Member"}
     ID Number:      ${m.identityNumber || "—"}
     Date of Birth:  ${m.dateOfBirth || "—"}
     Class:          ${m.classSelection || "—"}
     Gender:         ${m.gender || "—"}
     Nationality:    ${m.nationality || "—"}
     Premium:        SAR ${(m.premium || 0).toLocaleString()}
`;
    });
  }

  if (kyc && (kyc.nationalAddress || kyc.businessDetails)) {
    const addr = kyc.nationalAddress || {};
    const biz = kyc.businessDetails || {};
    text += `
────────────────────────────────────────────────────────
  KYC / ADDRESS
────────────────────────────────────────────────────────
Address:  ${[addr.buildingNumber, addr.street, addr.district, addr.city].filter(Boolean).join(", ") || "—"}
Postal Code: ${addr.postalCode || "—"}
Business Type: ${biz.businessType || "—"}
IBAN: ${biz.ibanNumber || "—"}
Bank: ${biz.bankName || "—"}
`;
  }

  text += `
════════════════════════════════════════════════════════
  Generated on ${new Date().toLocaleString("en-GB")}
════════════════════════════════════════════════════════
`;
  return text;
}

export function downloadDocument(record: QuotationRecord, type: "quotation" | "policy") {
  const content = buildContent(record, type);
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const name = type === "policy"
    ? `Policy_${record.policy_number || record.id.slice(0, 8)}.txt`
    : `Quotation_${record.quotation_id || record.id.slice(0, 8)}.txt`;
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
