import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../providers/quotation_provider.dart';
import '../services/sponsor_service.dart';
import '../widgets/bottom_nav_bar.dart';

class SponsorStep extends ConsumerStatefulWidget {
  const SponsorStep({super.key});

  @override
  ConsumerState<SponsorStep> createState() => _SponsorStepState();
}

class _SponsorStepState extends ConsumerState<SponsorStep> {
  final _sponsorCtrl = TextEditingController();
  bool _loading = false;
  String _error = '';

  final _tomorrow = DateTime.now().add(const Duration(days: 1));
  late final _maxDate = _tomorrow.add(const Duration(days: 21));

  @override
  void initState() {
    super.initState();
    final data = ref.read(sponsorDataProvider);
    _sponsorCtrl.text = data.sponsorNumber;
  }

  @override
  void dispose() {
    _sponsorCtrl.dispose();
    super.dispose();
  }

  Future<void> _handleNext() async {
    setState(() => _error = '');

    final sponsorNumber = _sponsorCtrl.text.trim();
    if (sponsorNumber.isEmpty) {
      setState(() => _error = 'Sponsor Number is required.');
      return;
    }

    final data = ref.read(sponsorDataProvider);
    if (data.policyEffectiveDate == null) {
      setState(() => _error = 'Policy Effective Date is required.');
      return;
    }

    setState(() => _loading = true);
    try {
      final result = await validateSponsor(sponsorNumber);
      if (result.success) {
        ref.read(sponsorDataProvider.notifier).state = data.copyWith(
          sponsorNumber: sponsorNumber,
          sponsorName: result.sponsorName,
          sponsorStatus: result.sponsorStatus,
        );
        ref.read(currentStepProvider.notifier).state = 1;
      } else {
        setState(() => _error = result.error ?? 'Validation failed.');
      }
    } catch (_) {
      setState(() => _error = 'Service unavailable. Please try again.');
    } finally {
      setState(() => _loading = false);
    }
  }

  Future<void> _pickDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: ref.read(sponsorDataProvider).policyEffectiveDate ?? _tomorrow,
      firstDate: _tomorrow,
      lastDate: _maxDate,
    );
    if (picked != null) {
      ref.read(sponsorDataProvider.notifier).update((s) => s.copyWith(policyEffectiveDate: picked));
    }
  }

  @override
  Widget build(BuildContext context) {
    final data = ref.watch(sponsorDataProvider);
    final theme = Theme.of(context);
    final dateFormat = DateFormat('dd MMM yyyy');

    return Column(
      children: [
        Expanded(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Card(
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Sponsor Details',
                        style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w600)),
                    const SizedBox(height: 4),
                    Text('Enter the sponsor number and select the policy effective date.',
                        style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant)),
                    const SizedBox(height: 20),

                    // Sponsor Number
                    Text('Sponsor Number *', style: theme.textTheme.labelLarge),
                    const SizedBox(height: 6),
                    TextField(
                      controller: _sponsorCtrl,
                      decoration: const InputDecoration(hintText: 'e.g. SP12345'),
                      onChanged: (v) =>
                          ref.read(sponsorDataProvider.notifier).update((s) => s.copyWith(sponsorNumber: v)),
                    ),
                    const SizedBox(height: 20),

                    // Policy Effective Date
                    Text('Policy Effective Date *', style: theme.textTheme.labelLarge),
                    const SizedBox(height: 6),
                    InkWell(
                      onTap: _pickDate,
                      borderRadius: BorderRadius.circular(12),
                      child: InputDecorator(
                        decoration: const InputDecoration(),
                        child: Row(
                          children: [
                            Icon(Icons.calendar_today, size: 18, color: theme.colorScheme.onSurfaceVariant),
                            const SizedBox(width: 12),
                            Text(
                              data.policyEffectiveDate != null
                                  ? dateFormat.format(data.policyEffectiveDate!)
                                  : 'Select date',
                              style: TextStyle(
                                color: data.policyEffectiveDate != null
                                    ? theme.colorScheme.onSurface
                                    : theme.colorScheme.onSurfaceVariant,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      'Between ${dateFormat.format(_tomorrow)} and ${dateFormat.format(_maxDate)}',
                      style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant),
                    ),

                    if (_error.isNotEmpty) ...[
                      const SizedBox(height: 16),
                      Text(_error, style: TextStyle(color: theme.colorScheme.error, fontSize: 13)),
                    ],
                  ],
                ),
              ),
            ),
          ),
        ),
        BottomNavBar(
          onNext: _handleNext,
          isLoading: _loading,
          nextLabel: _loading ? 'Validating with Wathaq...' : 'Next',
        ),
      ],
    );
  }
}
