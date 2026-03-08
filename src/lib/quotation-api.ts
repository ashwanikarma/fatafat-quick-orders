// Simulated API responses for the Quotation Module

export async function validateSponsor(sponsorNumber: string): Promise<{
  success: boolean;
  data?: { sponsorName: string; sponsorStatus: string };
  error?: string;
}> {
  await new Promise((r) => setTimeout(r, 1200));

  // Simulate: any sponsor number with 5+ chars is valid
  if (sponsorNumber.length < 5) {
    return { success: false, error: "Invalid Sponsor Number. Must be at least 5 characters." };
  }

  // Simulate specific failures
  if (sponsorNumber.toUpperCase() === "ERROR") {
    return { success: false, error: "Wathaq Service: Sponsor not found in the registry." };
  }

  return {
    success: true,
    data: {
      sponsorName: `Sponsor ${sponsorNumber.toUpperCase()}`,
      sponsorStatus: "Active",
    },
  };
}

const CLASS_PREMIUMS: Record<string, number> = {
  VIP: 12000,
  A: 8500,
  B: 6000,
  C: 4500,
  LM: 3000,
};

export function calculatePremium(members: { classSelection: string; healthDeclaration?: string }[]) {
  return members.map((m) => {
    let base = CLASS_PREMIUMS[m.classSelection] || 4500;
    if (m.healthDeclaration === "Yes") base *= 1.15; // 15% loading
    return Math.round(base);
  });
}
