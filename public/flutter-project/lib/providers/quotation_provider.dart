import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/quotation_models.dart';

// ─── Current Step ───────────────────────────────────────
final currentStepProvider = StateProvider<int>((ref) => 0);

// ─── Sponsor Data ───────────────────────────────────────
final sponsorDataProvider = StateProvider<SponsorData>((ref) => SponsorData());

// ─── Members ────────────────────────────────────────────
final membersProvider = StateProvider<List<Member>>((ref) => []);

// ─── KYC Data ───────────────────────────────────────────
final kycDataProvider = StateProvider<KYCData>((ref) => KYCData());

// ─── Premium Calculator ─────────────────────────────────
const Map<ClassSelection, int> classPremiums = {
  ClassSelection.vip: 12000,
  ClassSelection.a: 8500,
  ClassSelection.b: 6000,
  ClassSelection.c: 4500,
  ClassSelection.lm: 3000,
};

final memberPremiumsProvider = Provider<List<int>>((ref) {
  final members = ref.watch(membersProvider);
  return members.map((m) {
    int base = classPremiums[m.classSelection] ?? 4500;
    if (m.healthDeclaration == 'Yes') base = (base * 1.15).round();
    return base;
  }).toList();
});

final totalPremiumProvider = Provider<int>((ref) {
  return ref.watch(memberPremiumsProvider).fold(0, (a, b) => a + b);
});

// ─── Step Labels ────────────────────────────────────────
const List<String> stepLabels = [
  'Sponsor',
  'Members',
  'Health',
  'Quotation',
  'KYC',
  'Payment',
];
