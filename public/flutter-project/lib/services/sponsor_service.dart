/// Simulated sponsor validation service (mirrors the React quotation-api.ts)
class SponsorValidationResult {
  final bool success;
  final String? sponsorName;
  final String? sponsorStatus;
  final String? error;

  SponsorValidationResult({
    required this.success,
    this.sponsorName,
    this.sponsorStatus,
    this.error,
  });
}

Future<SponsorValidationResult> validateSponsor(String sponsorNumber) async {
  await Future.delayed(const Duration(milliseconds: 1200));

  if (sponsorNumber.length < 5) {
    return SponsorValidationResult(
      success: false,
      error: 'Invalid Sponsor Number. Must be at least 5 characters.',
    );
  }

  if (sponsorNumber.toUpperCase() == 'ERROR') {
    return SponsorValidationResult(
      success: false,
      error: 'Wathaq Service: Sponsor not found in the registry.',
    );
  }

  return SponsorValidationResult(
    success: true,
    sponsorName: 'Sponsor ${sponsorNumber.toUpperCase()}',
    sponsorStatus: 'Active',
  );
}
