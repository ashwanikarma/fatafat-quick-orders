import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/quotation_models.dart';
import '../providers/quotation_provider.dart';
import '../widgets/bottom_nav_bar.dart';

const _bankMap = <String, String>{
  '10': 'National Commercial Bank (NCB)',
  '15': 'Al Rajhi Bank',
  '20': 'Riyad Bank',
  '45': 'Saudi British Bank (SABB)',
  '55': 'Banque Saudi Fransi',
  '60': 'Bank AlJazira',
  '65': 'Saudi Investment Bank',
  '80': 'Arab National Bank',
  '05': 'Alinma Bank',
  '30': 'Arab Banking Corporation (ABC)',
  '40': 'Saudi Awwal Bank (SAB)',
  '50': 'Gulf International Bank',
  '76': 'Bank AlBilad',
};

class KYCStep extends ConsumerStatefulWidget {
  const KYCStep({super.key});

  @override
  ConsumerState<KYCStep> createState() => _KYCStepState();
}

class _KYCStepState extends ConsumerState<KYCStep> {
  final Map<String, String> _errors = {};

  KYCData get _kyc => ref.read(kycDataProvider);
  void _setKyc(KYCData data) => ref.read(kycDataProvider.notifier).state = data;

  NationalAddress get _addr => _kyc.nationalAddress;
  BusinessDetails get _biz => _kyc.businessDetails;
  ComplianceData get _comp => _kyc.compliance;

  void _setAddr(void Function(NationalAddress) fn) {
    fn(_addr);
    _setKyc(_kyc); // trigger rebuild
    setState(() {});
  }

  void _setBiz(void Function(BusinessDetails) fn) {
    fn(_biz);
    _setKyc(_kyc);
    setState(() {});
  }

  void _setComp(void Function(ComplianceData) fn) {
    fn(_comp);
    _setKyc(_kyc);
    setState(() {});
  }

  void _handleIbanChange(String val) {
    final upper = val.toUpperCase().replaceAll(RegExp(r'[^A-Z0-9]'), '');
    final trimmed = upper.length > 24 ? upper.substring(0, 24) : upper;
    String bankName = '';
    if (trimmed.length >= 6) {
      bankName = _bankMap[trimmed.substring(4, 6)] ?? '';
    }
    _biz.ibanNumber = trimmed;
    _biz.bankName = bankName;
    _setKyc(_kyc);
    setState(() {});
  }

  bool _validate() {
    _errors.clear();
    if (_addr.buildingNumber.isEmpty) _errors['buildingNumber'] = 'Required';
    if (_addr.additionalNumber.isEmpty) _errors['additionalNumber'] = 'Required';
    if (_addr.unitNumber.isEmpty) _errors['unitNumber'] = 'Required';
    if (_addr.postalCode.isEmpty) _errors['postalCode'] = 'Required';
    if (_addr.street.isEmpty) _errors['street'] = 'Required';
    if (_addr.district.isEmpty) _errors['district'] = 'Required';
    if (_addr.city.isEmpty) _errors['city'] = 'Required';
    if (_biz.businessType == null) _errors['businessType'] = 'Required';
    if (_biz.companyRevenue == null) _errors['companyRevenue'] = 'Required';
    if (_biz.numberOfEmployees == null) _errors['numberOfEmployees'] = 'Required';
    final trn = _biz.taxRegistrationNumber;
    if (trn.isEmpty) {
      _errors['trn'] = 'Required';
    } else if (trn.length != 15) {
      _errors['trn'] = 'Must be 15 digits';
    } else if (!trn.startsWith('3') || !trn.endsWith('3')) {
      _errors['trn'] = 'Must start and end with 3';
    }
    final iban = _biz.ibanNumber;
    if (iban.isEmpty) {
      _errors['iban'] = 'Required';
    } else if (iban.length != 24) {
      _errors['iban'] = 'Must be 24 characters';
    } else if (!iban.startsWith('SA')) {
      _errors['iban'] = 'Must start with SA';
    }
    if (_biz.bankName.isEmpty) _errors['bank'] = 'Cannot detect bank';
    if (_comp.isPEP == null) _errors['pep'] = 'Required';
    if (_comp.isBoardMember == null) _errors['board'] = 'Required';
    if (_comp.isBoardMember == true && _comp.boardMembers.isEmpty) _errors['boardList'] = 'Add at least one';
    if (_comp.hasMajorShareholder == null) _errors['shareholder'] = 'Required';
    if (_comp.hasMajorShareholder == true && _comp.shareholders.isEmpty) _errors['shareholderList'] = 'Add at least one';
    if (!_comp.termsAccepted) _errors['terms'] = 'You must accept';
    setState(() {});
    return _errors.isEmpty;
  }

  Widget _field(String label, String value, String errorKey, void Function(String) onChanged,
      {String? hint, TextInputType? keyboard, int? maxLength}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500)),
        const SizedBox(height: 4),
        TextFormField(
          initialValue: value,
          onChanged: onChanged,
          keyboardType: keyboard,
          maxLength: maxLength,
          decoration: InputDecoration(
            hintText: hint,
            errorText: _errors[errorKey],
            isDense: true,
            counterText: '',
          ),
        ),
        const SizedBox(height: 10),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    final kyc = ref.watch(kycDataProvider);
    final theme = Theme.of(context);

    return Column(
      children: [
        Expanded(
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              // ─── National Address ──────────
              _sectionCard(
                icon: Icons.location_on,
                title: 'National Address',
                theme: theme,
                children: [
                  Row(children: [
                    Expanded(child: _field('Building No. *', _addr.buildingNumber, 'buildingNumber',
                        (v) => _setAddr((a) => a.buildingNumber = v), hint: '1234')),
                    const SizedBox(width: 8),
                    Expanded(child: _field('Additional No. *', _addr.additionalNumber, 'additionalNumber',
                        (v) => _setAddr((a) => a.additionalNumber = v), hint: '5678')),
                    const SizedBox(width: 8),
                    Expanded(child: _field('Unit No. *', _addr.unitNumber, 'unitNumber',
                        (v) => _setAddr((a) => a.unitNumber = v), hint: '1')),
                  ]),
                  _field('Street *', _addr.street, 'street', (v) => _setAddr((a) => a.street = v), hint: 'Street name'),
                  Row(children: [
                    Expanded(child: _field('District *', _addr.district, 'district',
                        (v) => _setAddr((a) => a.district = v), hint: 'District')),
                    const SizedBox(width: 8),
                    Expanded(child: _field('City *', _addr.city, 'city',
                        (v) => _setAddr((a) => a.city = v), hint: 'Riyadh')),
                  ]),
                  _field('Postal Code *', _addr.postalCode, 'postalCode',
                      (v) => _setAddr((a) => a.postalCode = v), hint: '12345', keyboard: TextInputType.number),
                ],
              ),
              const SizedBox(height: 16),

              // ─── Business Details ──────────
              _sectionCard(
                icon: Icons.business,
                title: 'Business Details',
                theme: theme,
                children: [
                  _dropdown<BusinessType>(
                    'Business Type *',
                    BusinessType.values,
                    _biz.businessType,
                    (v) => _setBiz((b) => b.businessType = v),
                    (v) => v.label,
                    'businessType',
                  ),
                  _dropdown<RevenueRange>(
                    'Company Revenue *',
                    RevenueRange.values,
                    _biz.companyRevenue,
                    (v) => _setBiz((b) => b.companyRevenue = v),
                    (v) => v.label,
                    'companyRevenue',
                  ),
                  _dropdown<EmployeeRange>(
                    'Number of Employees *',
                    EmployeeRange.values,
                    _biz.numberOfEmployees,
                    (v) => _setBiz((b) => b.numberOfEmployees = v),
                    (v) => v.label,
                    'numberOfEmployees',
                  ),
                  _field('Tax Registration Number (TRN) *', _biz.taxRegistrationNumber, 'trn',
                      (v) {
                        final digits = v.replaceAll(RegExp(r'\D'), '');
                        _setBiz((b) => b.taxRegistrationNumber = digits.length > 15 ? digits.substring(0, 15) : digits);
                      },
                      hint: '3XXXXXXXXXXXXX3', maxLength: 15, keyboard: TextInputType.number),
                  _field('IBAN Number *', _biz.ibanNumber, 'iban', _handleIbanChange,
                      hint: 'SA0000000000000000000000', maxLength: 24),
                  _field('Bank Name', _biz.bankName, 'bank', (_) {}, hint: 'Auto-detected'),
                ],
              ),
              const SizedBox(height: 16),

              // ─── Compliance ────────────────
              _sectionCard(
                icon: Icons.verified_user,
                title: 'Compliance',
                theme: theme,
                children: [
                  _yesNo('Are you a Politically Exposed Person (PEP)?', _comp.isPEP, 'pep',
                      (v) => _setComp((c) => c.isPEP = v)),
                  const Divider(),
                  _yesNo('Board Member / Audit / Executive of listed company?', _comp.isBoardMember, 'board', (v) {
                    _setComp((c) {
                      c.isBoardMember = v;
                      if (!v) c.boardMembers.clear();
                    });
                  }),
                  if (_comp.isBoardMember == true) ...[
                    ...List.generate(_comp.boardMembers.length, (i) {
                      final bm = _comp.boardMembers[i];
                      return _entityRow(
                        fields: [
                          _miniField('Name', bm.name, (v) => setState(() => bm.name = v)),
                          _miniField('ID', bm.identityNumber, (v) => setState(() => bm.identityNumber = v)),
                          _miniField('Address', bm.address, (v) => setState(() => bm.address = v)),
                        ],
                        onDelete: () => _setComp((c) => c.boardMembers.removeAt(i)),
                      );
                    }),
                    if (_errors.containsKey('boardList'))
                      Text(_errors['boardList']!, style: TextStyle(color: theme.colorScheme.error, fontSize: 12)),
                    TextButton.icon(
                      onPressed: () => _setComp((c) => c.boardMembers.add(BoardMember())),
                      icon: const Icon(Icons.add, size: 16),
                      label: const Text('Add Board Member', style: TextStyle(fontSize: 12)),
                    ),
                  ],
                  const Divider(),
                  _yesNo('Shareholder owning ≥25%?', _comp.hasMajorShareholder, 'shareholder', (v) {
                    _setComp((c) {
                      c.hasMajorShareholder = v;
                      if (!v) c.shareholders.clear();
                    });
                  }),
                  if (_comp.hasMajorShareholder == true) ...[
                    ...List.generate(_comp.shareholders.length, (i) {
                      final sh = _comp.shareholders[i];
                      return _entityRow(
                        fields: [
                          _miniField('Name', sh.name, (v) => setState(() => sh.name = v)),
                          _miniField('Address', sh.address, (v) => setState(() => sh.address = v)),
                          _miniField('%', sh.contributionPercent, (v) => setState(() => sh.contributionPercent = v)),
                        ],
                        onDelete: () => _setComp((c) => c.shareholders.removeAt(i)),
                      );
                    }),
                    if (_errors.containsKey('shareholderList'))
                      Text(_errors['shareholderList']!, style: TextStyle(color: theme.colorScheme.error, fontSize: 12)),
                    TextButton.icon(
                      onPressed: () => _setComp((c) => c.shareholders.add(Shareholder())),
                      icon: const Icon(Icons.add, size: 16),
                      label: const Text('Add Shareholder', style: TextStyle(fontSize: 12)),
                    ),
                  ],
                  const Divider(),
                  Row(
                    children: [
                      Checkbox(
                        value: _comp.termsAccepted,
                        onChanged: (v) => _setComp((c) => c.termsAccepted = v ?? false),
                      ),
                      const Expanded(child: Text('I accept the Terms and Conditions', style: TextStyle(fontSize: 13))),
                    ],
                  ),
                  if (_errors.containsKey('terms'))
                    Text(_errors['terms']!, style: TextStyle(color: theme.colorScheme.error, fontSize: 12)),
                ],
              ),
              const SizedBox(height: 80),
            ],
          ),
        ),
        BottomNavBar(
          onBack: () => ref.read(currentStepProvider.notifier).state = 3,
          onNext: () {
            if (_validate()) {
              _kyc.completed = true;
              _setKyc(_kyc);
              ref.read(currentStepProvider.notifier).state = 5;
            }
          },
          nextLabel: 'Save & Continue',
        ),
      ],
    );
  }

  // ─── Helpers ──────────────────────────────────────────
  Widget _sectionCard({required IconData icon, required String title, required ThemeData theme, required List<Widget> children}) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(children: [
              Icon(icon, size: 20, color: theme.colorScheme.primary),
              const SizedBox(width: 8),
              Text(title, style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600)),
            ]),
            const SizedBox(height: 16),
            ...children,
          ],
        ),
      ),
    );
  }

  Widget _dropdown<T>(String label, List<T> items, T? value, void Function(T) onChanged,
      String Function(T) labelFn, String errorKey) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500)),
        const SizedBox(height: 4),
        DropdownButtonFormField<T>(
          value: value,
          items: items.map((e) => DropdownMenuItem(value: e, child: Text(labelFn(e)))).toList(),
          onChanged: (v) { if (v != null) onChanged(v); },
          decoration: InputDecoration(errorText: _errors[errorKey], isDense: true),
        ),
        const SizedBox(height: 10),
      ],
    );
  }

  Widget _yesNo(String question, bool? value, String errorKey, void Function(bool) onChanged) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(question, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500)),
          const SizedBox(height: 6),
          Row(children: [
            ChoiceChip(label: const Text('Yes'), selected: value == true, onSelected: (_) => onChanged(true)),
            const SizedBox(width: 8),
            ChoiceChip(label: const Text('No'), selected: value == false, onSelected: (_) => onChanged(false)),
          ]),
          if (_errors.containsKey(errorKey))
            Padding(
              padding: const EdgeInsets.only(top: 4),
              child: Text(_errors[errorKey]!, style: TextStyle(color: Theme.of(context).colorScheme.error, fontSize: 12)),
            ),
        ],
      ),
    );
  }

  Widget _entityRow({required List<Widget> fields, required VoidCallback onDelete}) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(10),
        color: Theme.of(context).colorScheme.surfaceContainerHighest.withOpacity(0.3),
      ),
      child: Row(
        children: [
          Expanded(child: Wrap(spacing: 8, runSpacing: 6, children: fields)),
          IconButton(
            icon: Icon(Icons.delete_outline, size: 18, color: Theme.of(context).colorScheme.error),
            onPressed: onDelete,
          ),
        ],
      ),
    );
  }

  Widget _miniField(String hint, String value, void Function(String) onChanged) {
    return SizedBox(
      width: 100,
      child: TextFormField(
        initialValue: value,
        onChanged: onChanged,
        decoration: InputDecoration(hintText: hint, isDense: true, contentPadding: const EdgeInsets.all(8)),
        style: const TextStyle(fontSize: 12),
      ),
    );
  }
}
