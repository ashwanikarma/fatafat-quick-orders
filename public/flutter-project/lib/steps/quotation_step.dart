import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../models/quotation_models.dart';
import '../providers/quotation_provider.dart';
import '../widgets/bottom_nav_bar.dart';

final _classBenefits = <ClassSelection, Map<String, dynamic>>{
  ClassSelection.vip: {
    'coverage': 'SAR 500,000',
    'hospitals': 'All network hospitals including international affiliates',
    'maternity': 'Full coverage including complications',
    'dental': 'SAR 5,000/yr',
    'optical': 'SAR 3,000/yr',
    'exclusions': ['Cosmetic surgery', 'Experimental treatments'],
  },
  ClassSelection.a: {
    'coverage': 'SAR 250,000',
    'hospitals': 'All network hospitals (200+ facilities)',
    'maternity': 'SAR 30,000 per event',
    'dental': 'SAR 3,500/yr',
    'optical': 'SAR 2,000/yr',
    'exclusions': ['Cosmetic surgery', 'Experimental', 'Non-emergency international'],
  },
  ClassSelection.b: {
    'coverage': 'SAR 150,000',
    'hospitals': 'Network hospitals (150+)',
    'maternity': 'SAR 20,000 per event',
    'dental': 'SAR 2,500/yr',
    'optical': 'SAR 1,500/yr',
    'exclusions': ['Cosmetic', 'Experimental', 'International', 'Alternative medicine'],
  },
  ClassSelection.c: {
    'coverage': 'SAR 100,000',
    'hospitals': 'Network hospitals (100+)',
    'maternity': 'SAR 10,000 per event',
    'dental': 'SAR 1,500/yr',
    'optical': 'SAR 800/yr',
    'exclusions': ['Cosmetic', 'Experimental', 'International', 'Alternative', 'Psychiatric >30d'],
  },
  ClassSelection.lm: {
    'coverage': 'SAR 50,000 (CCHI min)',
    'hospitals': 'Government & select private',
    'maternity': 'Emergency only',
    'dental': 'Emergency extraction only',
    'optical': 'Not covered',
    'exclusions': ['Cosmetic', 'Experimental', 'International', 'Alternative', 'Elective', 'Pre-existing (12mo wait)'],
  },
};

class QuotationStepWidget extends ConsumerStatefulWidget {
  const QuotationStepWidget({super.key});

  @override
  ConsumerState<QuotationStepWidget> createState() => _QuotationStepState();
}

class _QuotationStepState extends ConsumerState<QuotationStepWidget> {
  ClassSelection? _expandedClass;

  @override
  Widget build(BuildContext context) {
    final members = ref.watch(membersProvider);
    final sponsor = ref.watch(sponsorDataProvider);
    final premiums = ref.watch(memberPremiumsProvider);
    final total = ref.watch(totalPremiumProvider);
    final theme = Theme.of(context);
    final quotationId = 'QT-${DateTime.now().millisecondsSinceEpoch.toRadixString(36).toUpperCase()}';
    final usedClasses = members.map((m) => m.classSelection).toSet().toList();

    return Column(
      children: [
        Expanded(
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              // ─── Summary Card ─────────────
              Card(
                color: theme.colorScheme.primaryContainer.withOpacity(0.12),
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('Quotation Summary',
                                  style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600)),
                              const SizedBox(height: 2),
                              Text('ID: $quotationId',
                                  style: TextStyle(fontSize: 11, color: theme.colorScheme.onSurfaceVariant)),
                            ],
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                            decoration: BoxDecoration(
                              color: theme.colorScheme.primary.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Text('SAR ${NumberFormat('#,###').format(total)}',
                                style: TextStyle(
                                    fontWeight: FontWeight.bold, color: theme.colorScheme.primary, fontSize: 16)),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      _infoRow('Sponsor', sponsor.sponsorName ?? sponsor.sponsorNumber),
                      _infoRow(
                        'Effective Date',
                        sponsor.policyEffectiveDate != null
                            ? DateFormat('dd MMM yyyy').format(sponsor.policyEffectiveDate!)
                            : '—',
                      ),
                      _infoRow('Members', '${members.length}'),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),

              // ─── Member Premiums ──────────
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Member Premiums',
                          style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600)),
                      const SizedBox(height: 12),
                      ...List.generate(members.length, (i) {
                        final m = members[i];
                        return Container(
                          padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 12),
                          decoration: BoxDecoration(
                            border: Border(bottom: BorderSide(color: theme.colorScheme.outlineVariant)),
                          ),
                          child: Row(
                            children: [
                              Expanded(
                                flex: 3,
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(m.memberName, style: const TextStyle(fontWeight: FontWeight.w500, fontSize: 13)),
                                    Text(
                                      '${m.memberType == MemberType.employee ? "Employee" : "Dependent"} · ${m.classSelection.label}'
                                      '${m.healthDeclaration == "Yes" ? " · Declared" : ""}',
                                      style: TextStyle(fontSize: 11, color: theme.colorScheme.onSurfaceVariant),
                                    ),
                                  ],
                                ),
                              ),
                              Text('SAR ${NumberFormat('#,###').format(premiums[i])}',
                                  style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                            ],
                          ),
                        );
                      }),
                      Container(
                        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 12),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text('Total', style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
                            Text('SAR ${NumberFormat('#,###').format(total)}',
                                style: TextStyle(
                                    fontWeight: FontWeight.bold, color: theme.colorScheme.primary, fontSize: 16)),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),

              // ─── Benefits by Class ────────
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Benefits by Class',
                          style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600)),
                      const SizedBox(height: 12),
                      ...usedClasses.map((cls) {
                        final b = _classBenefits[cls]!;
                        final isOpen = _expandedClass == cls;
                        final count = members.where((m) => m.classSelection == cls).length;
                        return Container(
                          margin: const EdgeInsets.only(bottom: 8),
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: theme.colorScheme.outlineVariant),
                          ),
                          child: Column(
                            children: [
                              InkWell(
                                borderRadius: BorderRadius.circular(12),
                                onTap: () => setState(() => _expandedClass = isOpen ? null : cls),
                                child: Padding(
                                  padding: const EdgeInsets.all(12),
                                  child: Row(
                                    children: [
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                        decoration: BoxDecoration(
                                          color: theme.colorScheme.secondaryContainer,
                                          borderRadius: BorderRadius.circular(8),
                                        ),
                                        child: Text(cls.label,
                                            style: TextStyle(
                                                fontWeight: FontWeight.bold,
                                                fontSize: 12,
                                                color: theme.colorScheme.onSecondaryContainer)),
                                      ),
                                      const SizedBox(width: 10),
                                      Expanded(child: Text(b['coverage'] as String, style: const TextStyle(fontSize: 13))),
                                      Text('($count)', style: TextStyle(fontSize: 11, color: theme.colorScheme.onSurfaceVariant)),
                                      Icon(isOpen ? Icons.expand_less : Icons.expand_more, size: 20),
                                    ],
                                  ),
                                ),
                              ),
                              if (isOpen) ...[
                                Divider(height: 1, color: theme.colorScheme.outlineVariant),
                                Padding(
                                  padding: const EdgeInsets.all(12),
                                  child: Column(
                                    children: [
                                      _benefitTile(Icons.local_hospital, 'Hospitals', b['hospitals'] as String, theme),
                                      _benefitTile(Icons.pregnant_woman, 'Maternity', b['maternity'] as String, theme),
                                      _benefitTile(Icons.medical_services, 'Dental', b['dental'] as String, theme),
                                      _benefitTile(Icons.visibility, 'Optical', b['optical'] as String, theme),
                                      const SizedBox(height: 8),
                                      Align(
                                        alignment: Alignment.centerLeft,
                                        child: Wrap(
                                          spacing: 6,
                                          runSpacing: 4,
                                          children: (b['exclusions'] as List<String>).map((ex) => Chip(
                                            label: Text(ex, style: TextStyle(fontSize: 10, color: theme.colorScheme.error)),
                                            materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                                            visualDensity: VisualDensity.compact,
                                            side: BorderSide(color: theme.colorScheme.error.withOpacity(0.3)),
                                            backgroundColor: theme.colorScheme.errorContainer.withOpacity(0.2),
                                          )).toList(),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ],
                          ),
                        );
                      }),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 80),
            ],
          ),
        ),
        BottomNavBar(
          onBack: () => ref.read(currentStepProvider.notifier).state = 2,
          onNext: () => ref.read(currentStepProvider.notifier).state = 4,
          nextLabel: 'Confirm & Proceed',
        ),
      ],
    );
  }

  Widget _infoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: TextStyle(fontSize: 12, color: Theme.of(context).colorScheme.onSurfaceVariant)),
          Text(value, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500)),
        ],
      ),
    );
  }

  Widget _benefitTile(IconData icon, String label, String value, ThemeData theme) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          Icon(icon, size: 16, color: theme.colorScheme.primary),
          const SizedBox(width: 8),
          Text('$label: ', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500)),
          Expanded(child: Text(value, style: TextStyle(fontSize: 12, color: theme.colorScheme.onSurfaceVariant))),
        ],
      ),
    );
  }
}
