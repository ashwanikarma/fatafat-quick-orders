import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/quotation_provider.dart';
import '../widgets/step_indicator.dart';
import '../steps/sponsor_step.dart';
import '../steps/members_step.dart';
import '../steps/health_declaration_step.dart';
import '../steps/quotation_step.dart';
import '../steps/kyc_step.dart';
import '../steps/payment_step.dart';

class QuotationScreen extends ConsumerWidget {
  const QuotationScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final currentStep = ref.watch(currentStepProvider);
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Health Insurance Quotation'),
        centerTitle: true,
        backgroundColor: theme.colorScheme.surface,
        surfaceTintColor: Colors.transparent,
      ),
      body: SafeArea(
        child: Column(
          children: [
            // Step Indicator
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              child: StepIndicatorWidget(
                currentStep: currentStep,
                stepLabels: stepLabels,
              ),
            ),
            const Divider(height: 1),
            // Step Content
            Expanded(
              child: AnimatedSwitcher(
                duration: const Duration(milliseconds: 250),
                child: _buildStep(currentStep),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStep(int step) {
    return switch (step) {
      0 => const SponsorStep(key: ValueKey(0)),
      1 => const MembersStep(key: ValueKey(1)),
      2 => const HealthDeclarationStep(key: ValueKey(2)),
      3 => const QuotationStepWidget(key: ValueKey(3)),
      4 => const KYCStep(key: ValueKey(4)),
      5 => const PaymentStep(key: ValueKey(5)),
      _ => const SizedBox.shrink(),
    };
  }
}
