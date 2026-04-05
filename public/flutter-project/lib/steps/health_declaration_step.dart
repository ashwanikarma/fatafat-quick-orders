import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/quotation_models.dart';
import '../providers/quotation_provider.dart';
import '../widgets/bottom_nav_bar.dart';

const _healthQuestions = [
  'Do you suffer from chronic diseases (e.g., diabetes, hypertension, asthma)?',
  'Have you had any surgery in the past 2 years?',
  'Are you currently on long-term medication?',
  'Have you been hospitalized in the last 12 months?',
  'Do you have any diagnosed medical conditions not listed above?',
];

class HealthDeclarationStep extends ConsumerStatefulWidget {
  const HealthDeclarationStep({super.key});

  @override
  ConsumerState<HealthDeclarationStep> createState() => _HealthDeclarationStepState();
}

class _HealthDeclarationStepState extends ConsumerState<HealthDeclarationStep> {
  String? _selectedMemberId;
  final Map<String, String> _errors = {};

  void _updateMember(String id, Member Function(Member) updater) {
    ref.read(membersProvider.notifier).update(
        (list) => list.map((m) => m.id == id ? updater(m) : m).toList());
  }

  bool _validate() {
    _errors.clear();
    final members = ref.read(membersProvider);
    for (final m in members) {
      if (m.heightCm == null || m.heightCm!.trim().isEmpty) {
        _errors['height_${m.id}'] = 'Required';
      } else {
        final h = double.tryParse(m.heightCm!);
        if (h == null || h < 30 || h > 250) _errors['height_${m.id}'] = '30-250 cm';
      }
      if (m.weightKg == null || m.weightKg!.trim().isEmpty) {
        _errors['weight_${m.id}'] = 'Required';
      } else {
        final w = double.tryParse(m.weightKg!);
        if (w == null || w < 2 || w > 300) _errors['weight_${m.id}'] = '2-300 kg';
      }
      if (m.gender == Gender.female && m.isPregnant) {
        if (m.expectedDeliveryDate == null || m.expectedDeliveryDate!.isEmpty) {
          _errors['edd_${m.id}'] = 'Required';
        }
      }
    }
    setState(() {});
    return _errors.isEmpty;
  }

  @override
  Widget build(BuildContext context) {
    final members = ref.watch(membersProvider);
    final theme = Theme.of(context);
    final allDeclared = members.every((m) => m.healthDeclaration != null);
    final selectedMember = _selectedMemberId != null
        ? members.cast<Member?>().firstWhere((m) => m?.id == _selectedMemberId, orElse: () => null)
        : null;

    return Column(
      children: [
        Expanded(
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              // ─── Physical Details ────────────────
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Member Physical Details',
                          style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600)),
                      const SizedBox(height: 4),
                      Text('Height, weight & maternity details.',
                          style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant)),
                      const SizedBox(height: 12),
                      ...members.map((m) => _buildPhysicalCard(m, theme)),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),

              // ─── Health Declaration ──────────────
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(
                            child: Text('Health Declaration',
                                style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600)),
                          ),
                          TextButton(
                            onPressed: () {
                              ref.read(membersProvider.notifier).update((list) => list
                                  .map((m) => m.copyWith(healthDeclaration: 'No', healthAnswers: null))
                                  .toList());
                            },
                            child: const Text('Declare All "No"', style: TextStyle(fontSize: 12)),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      ...members.map((m) => _buildDeclarationRow(m, theme)),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),

              // ─── Health Questions for selected member ──
              if (selectedMember != null && selectedMember.healthDeclaration == 'Yes')
                Card(
                  color: theme.colorScheme.primaryContainer.withOpacity(0.15),
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Health Questions — ${selectedMember.memberName}',
                            style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600)),
                        const SizedBox(height: 12),
                        ...List.generate(_healthQuestions.length, (i) {
                          final answer = selectedMember.healthAnswers?[i] ?? false;
                          return Padding(
                            padding: const EdgeInsets.only(bottom: 12),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('${i + 1}. ${_healthQuestions[i]}',
                                    style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500)),
                                const SizedBox(height: 6),
                                Row(
                                  children: [
                                    ChoiceChip(
                                      label: const Text('Yes'),
                                      selected: answer,
                                      onSelected: (_) => _updateMember(selectedMember.id, (m) {
                                        final answers = List<bool>.from(m.healthAnswers ?? List.filled(5, false));
                                        answers[i] = true;
                                        return m.copyWith(healthAnswers: answers);
                                      }),
                                    ),
                                    const SizedBox(width: 8),
                                    ChoiceChip(
                                      label: const Text('No'),
                                      selected: !answer,
                                      onSelected: (_) => _updateMember(selectedMember.id, (m) {
                                        final answers = List<bool>.from(m.healthAnswers ?? List.filled(5, false));
                                        answers[i] = false;
                                        return m.copyWith(healthAnswers: answers);
                                      }),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          );
                        }),
                      ],
                    ),
                  ),
                ),

              // Chips for other "Yes" members
              if (members.any((m) => m.healthDeclaration == 'Yes' && m.id != _selectedMemberId)) ...[
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  children: [
                    Text('View:', style: TextStyle(fontSize: 12, color: theme.colorScheme.onSurfaceVariant)),
                    ...members
                        .where((m) => m.healthDeclaration == 'Yes' && m.id != _selectedMemberId)
                        .map((m) => ActionChip(
                              label: Text(m.memberName, style: const TextStyle(fontSize: 12)),
                              onPressed: () => setState(() => _selectedMemberId = m.id),
                            )),
                  ],
                ),
              ],

              const SizedBox(height: 80), // Space for bottom bar
            ],
          ),
        ),
        BottomNavBar(
          onBack: () => ref.read(currentStepProvider.notifier).state = 1,
          onNext: allDeclared
              ? () {
                  if (_validate()) ref.read(currentStepProvider.notifier).state = 3;
                }
              : null,
          nextLabel: allDeclared ? 'Generate Quotation' : 'Complete declarations',
          nextEnabled: allDeclared,
        ),
      ],
    );
  }

  Widget _buildPhysicalCard(Member m, ThemeData theme) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: theme.colorScheme.outlineVariant),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(m.memberName, style: const TextStyle(fontWeight: FontWeight.w500, fontSize: 14)),
          Text('${m.memberType == MemberType.employee ? "Employee" : "Dependent"} · ${m.gender.name} · ${m.classSelection.label}',
              style: TextStyle(fontSize: 11, color: theme.colorScheme.onSurfaceVariant)),
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Height (cm) *', style: TextStyle(fontSize: 11)),
                    const SizedBox(height: 4),
                    TextFormField(
                      initialValue: m.heightCm ?? '',
                      keyboardType: TextInputType.number,
                      decoration: InputDecoration(
                        hintText: '170',
                        errorText: _errors['height_${m.id}'],
                        isDense: true,
                      ),
                      onChanged: (v) => _updateMember(m.id, (m) => m.copyWith(heightCm: v)),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Weight (kg) *', style: TextStyle(fontSize: 11)),
                    const SizedBox(height: 4),
                    TextFormField(
                      initialValue: m.weightKg ?? '',
                      keyboardType: TextInputType.number,
                      decoration: InputDecoration(
                        hintText: '70',
                        errorText: _errors['weight_${m.id}'],
                        isDense: true,
                      ),
                      onChanged: (v) => _updateMember(m.id, (m) => m.copyWith(weightKg: v)),
                    ),
                  ],
                ),
              ),
              if ((m.heightCm ?? '').isNotEmpty && (m.weightKg ?? '').isNotEmpty) ...[
                const SizedBox(width: 12),
                _bmiBadge(m, theme),
              ],
            ],
          ),

          // Maternity for females
          if (m.gender == Gender.female) ...[
            const SizedBox(height: 12),
            Divider(color: theme.colorScheme.outlineVariant),
            const SizedBox(height: 8),
            Row(
              children: [
                const Text('Pregnant?', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w500)),
                const SizedBox(width: 12),
                ChoiceChip(
                  label: const Text('Yes'),
                  selected: m.isPregnant,
                  onSelected: (_) => _updateMember(m.id, (m) => m.copyWith(isPregnant: true)),
                ),
                const SizedBox(width: 6),
                ChoiceChip(
                  label: const Text('No'),
                  selected: !m.isPregnant,
                  onSelected: (_) => _updateMember(
                      m.id,
                      (m) => m.copyWith(
                          isPregnant: false, expectedDeliveryDate: '', maternityDays: '')),
                ),
              ],
            ),
            if (m.isPregnant) ...[
              const SizedBox(height: 8),
              Row(
                children: [
                  Expanded(
                    child: TextFormField(
                      initialValue: m.expectedDeliveryDate ?? '',
                      decoration: InputDecoration(
                        labelText: 'Expected Delivery Date *',
                        hintText: 'YYYY-MM-DD',
                        errorText: _errors['edd_${m.id}'],
                        isDense: true,
                      ),
                      onChanged: (v) =>
                          _updateMember(m.id, (m) => m.copyWith(expectedDeliveryDate: v)),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: TextFormField(
                      initialValue: m.maternityDays ?? '',
                      decoration: const InputDecoration(
                        labelText: 'Maternity Days',
                        hintText: '90',
                        isDense: true,
                      ),
                      keyboardType: TextInputType.number,
                      onChanged: (v) => _updateMember(m.id, (m) => m.copyWith(maternityDays: v)),
                    ),
                  ),
                ],
              ),
            ],
          ],
        ],
      ),
    );
  }

  Widget _bmiBadge(Member m, ThemeData theme) {
    final h = double.tryParse(m.heightCm ?? '') ?? 0;
    final w = double.tryParse(m.weightKg ?? '') ?? 0;
    if (h <= 0 || w <= 0) return const SizedBox.shrink();
    final bmi = w / ((h / 100) * (h / 100));
    return Chip(
      label: Text('BMI: ${bmi.toStringAsFixed(1)}', style: const TextStyle(fontSize: 11)),
      materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
      visualDensity: VisualDensity.compact,
    );
  }

  Widget _buildDeclarationRow(Member m, ThemeData theme) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: theme.colorScheme.outlineVariant),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(m.memberName, style: const TextStyle(fontWeight: FontWeight.w500, fontSize: 13)),
                Text('${m.memberType == MemberType.employee ? "Employee" : "Dependent"} · ${m.classSelection.label}',
                    style: TextStyle(fontSize: 11, color: theme.colorScheme.onSurfaceVariant)),
              ],
            ),
          ),
          if (m.healthDeclaration != null)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
              margin: const EdgeInsets.only(right: 8),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(8),
                color: m.healthDeclaration == 'No'
                    ? theme.colorScheme.secondaryContainer
                    : theme.colorScheme.primaryContainer.withOpacity(0.3),
              ),
              child: Text(
                m.healthDeclaration == 'No' ? 'Healthy' : 'Declared',
                style: TextStyle(fontSize: 10, color: theme.colorScheme.onSecondaryContainer),
              ),
            ),
          SegmentedButton<String>(
            segments: const [
              ButtonSegment(value: 'No', label: Text('No', style: TextStyle(fontSize: 11))),
              ButtonSegment(value: 'Yes', label: Text('Yes', style: TextStyle(fontSize: 11))),
            ],
            selected: {m.healthDeclaration ?? ''},
            onSelectionChanged: (s) {
              final val = s.first;
              _updateMember(m.id, (m) => m.copyWith(
                healthDeclaration: val,
                healthAnswers: val == 'Yes' ? List.filled(5, false) : null,
              ));
              if (val == 'Yes') setState(() => _selectedMemberId = m.id);
              else if (_selectedMemberId == m.id) setState(() => _selectedMemberId = null);
            },
            showSelectedIcon: false,
            style: const ButtonStyle(visualDensity: VisualDensity.compact),
          ),
        ],
      ),
    );
  }
}
