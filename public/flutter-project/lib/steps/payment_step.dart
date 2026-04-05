import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../models/quotation_models.dart';
import '../providers/quotation_provider.dart';
import '../widgets/bottom_nav_bar.dart';

enum PaymentState { idle, processing, success, failed }

class PaymentStep extends ConsumerStatefulWidget {
  const PaymentStep({super.key});

  @override
  ConsumerState<PaymentStep> createState() => _PaymentStepState();
}

class _PaymentStepState extends ConsumerState<PaymentStep> {
  String _paymentType = 'credit';
  String _cardNumber = '';
  String _expiry = '';
  String _cvv = '';
  String _cardName = '';
  PaymentState _state = PaymentState.idle;
  final Map<String, String> _errors = {};

  String _formatCard(String val) {
    final digits = val.replaceAll(RegExp(r'\D'), '');
    final trimmed = digits.length > 16 ? digits.substring(0, 16) : digits;
    final buffer = StringBuffer();
    for (int i = 0; i < trimmed.length; i++) {
      if (i > 0 && i % 4 == 0) buffer.write(' ');
      buffer.write(trimmed[i]);
    }
    return buffer.toString();
  }

  String _formatExpiry(String val) {
    final digits = val.replaceAll(RegExp(r'\D'), '');
    final trimmed = digits.length > 4 ? digits.substring(0, 4) : digits;
    if (trimmed.length > 2) return '${trimmed.substring(0, 2)}/${trimmed.substring(2)}';
    return trimmed;
  }

  bool _validate() {
    _errors.clear();
    if (_cardNumber.replaceAll(' ', '').length != 16) _errors['card'] = '16 digits required';
    if (_cardName.trim().isEmpty) _errors['name'] = 'Required';
    if (_expiry.length != 5) _errors['expiry'] = 'MM/YY';
    if (_cvv.length < 3) _errors['cvv'] = '3-4 digits';
    setState(() {});
    return _errors.isEmpty;
  }

  Future<void> _pay() async {
    if (!_validate()) return;
    setState(() => _state = PaymentState.processing);
    await Future.delayed(const Duration(milliseconds: 2500));
    final success = Random().nextDouble() > 0.1;
    setState(() => _state = success ? PaymentState.success : PaymentState.failed);
  }

  @override
  Widget build(BuildContext context) {
    final members = ref.watch(membersProvider);
    final premiums = ref.watch(memberPremiumsProvider);
    final total = ref.watch(totalPremiumProvider);
    final sponsor = ref.watch(sponsorDataProvider);
    final theme = Theme.of(context);
    final policyNumber = 'POL-${DateTime.now().millisecondsSinceEpoch.toRadixString(36).toUpperCase()}';
    final fmt = NumberFormat('#,###');

    if (_state == PaymentState.success) {
      return _buildSuccess(theme, policyNumber, members, premiums, total, sponsor);
    }

    return Column(
      children: [
        Expanded(
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              // Total
              Card(
                color: theme.colorScheme.primaryContainer.withOpacity(0.12),
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Text('Total Premium', style: TextStyle(fontSize: 12, color: theme.colorScheme.onSurfaceVariant)),
                        Text('SAR ${fmt.format(total)}',
                            style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: theme.colorScheme.primary)),
                      ]),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: theme.colorScheme.primary.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text('${members.length} Members', style: TextStyle(fontSize: 12, color: theme.colorScheme.primary)),
                      ),
                    ],
                  ),
                ),
              ),

              if (_state == PaymentState.failed) ...[
                const SizedBox(height: 12),
                Card(
                  color: theme.colorScheme.errorContainer.withOpacity(0.2),
                  child: Padding(
                    padding: const EdgeInsets.all(12),
                    child: Row(children: [
                      Icon(Icons.error_outline, color: theme.colorScheme.error, size: 20),
                      const SizedBox(width: 10),
                      const Expanded(child: Text('Payment failed. Try again or use a different card.', style: TextStyle(fontSize: 13))),
                    ]),
                  ),
                ),
              ],
              const SizedBox(height: 16),

              // Payment Method
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(children: [
                        Icon(Icons.credit_card, size: 20, color: theme.colorScheme.primary),
                        const SizedBox(width: 8),
                        Text('Payment Method', style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600)),
                      ]),
                      const SizedBox(height: 12),
                      SegmentedButton<String>(
                        segments: const [
                          ButtonSegment(value: 'credit', label: Text('Credit Card')),
                          ButtonSegment(value: 'debit', label: Text('Debit Card')),
                        ],
                        selected: {_paymentType},
                        onSelectionChanged: (s) => setState(() => _paymentType = s.first),
                      ),
                      const SizedBox(height: 16),

                      const Text('Cardholder Name *', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w500)),
                      const SizedBox(height: 4),
                      TextFormField(
                        onChanged: (v) => _cardName = v,
                        decoration: InputDecoration(hintText: 'Name on card', errorText: _errors['name'], isDense: true),
                      ),
                      const SizedBox(height: 12),

                      const Text('Card Number *', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w500)),
                      const SizedBox(height: 4),
                      TextFormField(
                        onChanged: (v) => setState(() => _cardNumber = _formatCard(v)),
                        controller: TextEditingController.fromValue(TextEditingValue(
                          text: _cardNumber,
                          selection: TextSelection.collapsed(offset: _cardNumber.length),
                        )),
                        keyboardType: TextInputType.number,
                        decoration: InputDecoration(hintText: '0000 0000 0000 0000', errorText: _errors['card'], isDense: true),
                      ),
                      const SizedBox(height: 12),

                      Row(children: [
                        Expanded(
                          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                            const Text('Expiry *', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w500)),
                            const SizedBox(height: 4),
                            TextFormField(
                              onChanged: (v) => setState(() => _expiry = _formatExpiry(v)),
                              controller: TextEditingController.fromValue(TextEditingValue(
                                text: _expiry,
                                selection: TextSelection.collapsed(offset: _expiry.length),
                              )),
                              keyboardType: TextInputType.number,
                              decoration: InputDecoration(hintText: 'MM/YY', errorText: _errors['expiry'], isDense: true),
                            ),
                          ]),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                            const Text('CVV *', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w500)),
                            const SizedBox(height: 4),
                            TextFormField(
                              onChanged: (v) => _cvv = v.replaceAll(RegExp(r'\D'), ''),
                              obscureText: true,
                              keyboardType: TextInputType.number,
                              maxLength: 4,
                              decoration: InputDecoration(hintText: '•••', errorText: _errors['cvv'], isDense: true, counterText: ''),
                            ),
                          ]),
                        ),
                      ]),
                      const SizedBox(height: 16),

                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: theme.colorScheme.surfaceContainerHighest.withOpacity(0.3),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Row(children: [
                          Icon(Icons.security, size: 16, color: theme.colorScheme.primary),
                          const SizedBox(width: 8),
                          const Expanded(
                            child: Text('Your payment is encrypted and secure. Simulated gateway.',
                                style: TextStyle(fontSize: 11)),
                          ),
                        ]),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 80),
            ],
          ),
        ),
        BottomNavBar(
          onBack: () => ref.read(currentStepProvider.notifier).state = 4,
          onNext: _pay,
          nextLabel: _state == PaymentState.processing
              ? 'Processing...'
              : 'Pay SAR ${fmt.format(total)}',
          isLoading: _state == PaymentState.processing,
        ),
      ],
    );
  }

  Widget _buildSuccess(ThemeData theme, String policyNumber, List<Member> members,
      List<int> premiums, int total, SponsorData sponsor) {
    final fmt = NumberFormat('#,###');
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Card(
          color: theme.colorScheme.primaryContainer.withOpacity(0.15),
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 32, horizontal: 16),
            child: Column(children: [
              Container(
                width: 56, height: 56,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: theme.colorScheme.primary.withOpacity(0.15),
                ),
                child: Icon(Icons.check_circle, size: 32, color: theme.colorScheme.primary),
              ),
              const SizedBox(height: 16),
              Text('Policy Issued Successfully!',
                  style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold)),
              const SizedBox(height: 4),
              Text('Your health insurance policy has been activated.',
                  style: TextStyle(color: theme.colorScheme.onSurfaceVariant)),
            ]),
          ),
        ),
        const SizedBox(height: 16),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Policy Confirmation', style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600)),
                const SizedBox(height: 12),
                _confirmRow('Policy Number', policyNumber),
                _confirmRow('Members', '${members.length}'),
                _confirmRow('Premium Paid', 'SAR ${fmt.format(total)}'),
                _confirmRow(
                  'Effective Date',
                  sponsor.policyEffectiveDate != null
                      ? DateFormat('dd MMM yyyy').format(sponsor.policyEffectiveDate!)
                      : '—',
                ),
                const Divider(height: 24),
                ...List.generate(members.length, (i) {
                  final m = members[i];
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: Row(
                      children: [
                        Text('${i + 1}. ', style: TextStyle(fontSize: 12, color: theme.colorScheme.onSurfaceVariant)),
                        Expanded(child: Text(m.memberName, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500))),
                        Text(m.classSelection.label, style: TextStyle(fontSize: 11, color: theme.colorScheme.onSurfaceVariant)),
                        const SizedBox(width: 12),
                        Text('SAR ${fmt.format(premiums[i])}', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
                      ],
                    ),
                  );
                }),
              ],
            ),
          ),
        ),
        const SizedBox(height: 16),
        Row(children: [
          Expanded(
            child: OutlinedButton.icon(
              onPressed: () {},
              icon: const Icon(Icons.download, size: 18),
              label: const Text('Policy'),
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: OutlinedButton.icon(
              onPressed: () {},
              icon: const Icon(Icons.receipt_long, size: 18),
              label: const Text('Invoice'),
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: OutlinedButton.icon(
              onPressed: () {},
              icon: const Icon(Icons.print, size: 18),
              label: const Text('Print'),
            ),
          ),
        ]),
      ],
    );
  }

  Widget _confirmRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: TextStyle(fontSize: 12, color: Theme.of(context).colorScheme.onSurfaceVariant)),
          Text(value, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }
}
