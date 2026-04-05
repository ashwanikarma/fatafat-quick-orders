import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/quotation_models.dart';
import '../providers/quotation_provider.dart';
import '../widgets/bottom_nav_bar.dart';

class MembersStep extends ConsumerStatefulWidget {
  const MembersStep({super.key});

  @override
  ConsumerState<MembersStep> createState() => _MembersStepState();
}

class _MembersStepState extends ConsumerState<MembersStep> {
  void _openMemberDialog({Member? existing}) {
    final isEdit = existing != null;
    final sponsor = ref.read(sponsorDataProvider).sponsorNumber;
    final members = ref.read(membersProvider);

    // Form state
    var memberType = existing?.memberType ?? MemberType.employee;
    var name = existing?.memberName ?? '';
    var identity = existing?.identityNumber ?? '';
    var dob = existing?.dateOfBirth ?? '';
    var gender = existing?.gender ?? Gender.male;
    var marital = existing?.maritalStatus ?? MaritalStatus.single;
    var cls = existing?.classSelection ?? ClassSelection.b;
    String? employeeId = existing?.employeeId;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) {
        return StatefulBuilder(
          builder: (ctx, setSheetState) {
            final employees = members.where((m) => m.memberType == MemberType.employee).toList();
            String? formError;

            return Padding(
              padding: EdgeInsets.only(
                left: 20,
                right: 20,
                top: 20,
                bottom: MediaQuery.of(ctx).viewInsets.bottom + 20,
              ),
              child: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Center(
                      child: Container(
                        width: 40, height: 4,
                        decoration: BoxDecoration(
                          color: Colors.grey.shade300,
                          borderRadius: BorderRadius.circular(2),
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                    Text(isEdit ? 'Edit Member' : 'Add Member',
                        style: Theme.of(ctx).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w600)),
                    const SizedBox(height: 20),

                    // Member Type
                    _label('Member Type'),
                    SegmentedButton<MemberType>(
                      segments: const [
                        ButtonSegment(value: MemberType.employee, label: Text('Employee')),
                        ButtonSegment(value: MemberType.dependent, label: Text('Dependent')),
                      ],
                      selected: {memberType},
                      onSelectionChanged: (s) => setSheetState(() {
                        memberType = s.first;
                        employeeId = null;
                      }),
                    ),
                    const SizedBox(height: 12),

                    // Employee dropdown for dependents
                    if (memberType == MemberType.dependent) ...[
                      _label('Select Employee *'),
                      DropdownButtonFormField<String>(
                        value: employeeId,
                        items: employees
                            .map((e) => DropdownMenuItem(
                                  value: e.id,
                                  child: Text('${e.memberName} (${e.identityNumber})'),
                                ))
                            .toList(),
                        onChanged: (v) => setSheetState(() => employeeId = v),
                        decoration: const InputDecoration(hintText: 'Choose employee'),
                      ),
                      if (employees.isEmpty)
                        Padding(
                          padding: const EdgeInsets.only(top: 4),
                          child: Text('Add an employee first.',
                              style: TextStyle(fontSize: 12, color: Theme.of(ctx).colorScheme.error)),
                        ),
                      const SizedBox(height: 12),
                    ],

                    _label('Member Name *'),
                    TextFormField(
                      initialValue: name,
                      onChanged: (v) => name = v,
                      decoration: const InputDecoration(hintText: 'Full name'),
                    ),
                    const SizedBox(height: 12),

                    _label('Identity Number *'),
                    TextFormField(
                      initialValue: identity,
                      onChanged: (v) => identity = v,
                      decoration: const InputDecoration(hintText: 'e.g. 1234567890'),
                      keyboardType: TextInputType.number,
                    ),
                    const SizedBox(height: 12),

                    Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              _label('Date of Birth *'),
                              TextFormField(
                                initialValue: dob,
                                onChanged: (v) => dob = v,
                                decoration: const InputDecoration(hintText: 'YYYY-MM-DD'),
                                keyboardType: TextInputType.datetime,
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              _label('Gender'),
                              DropdownButtonFormField<Gender>(
                                value: gender,
                                items: Gender.values
                                    .map((g) => DropdownMenuItem(value: g, child: Text(g.name.capitalize())))
                                    .toList(),
                                onChanged: (v) => setSheetState(() => gender = v!),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),

                    Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              _label('Marital Status'),
                              DropdownButtonFormField<MaritalStatus>(
                                value: marital,
                                items: MaritalStatus.values
                                    .map((s) => DropdownMenuItem(value: s, child: Text(s.name.capitalize())))
                                    .toList(),
                                onChanged: (v) => setSheetState(() => marital = v!),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              _label('Class *'),
                              DropdownButtonFormField<ClassSelection>(
                                value: cls,
                                items: ClassSelection.values
                                    .map((c) => DropdownMenuItem(value: c, child: Text(c.label)))
                                    .toList(),
                                onChanged: (v) => setSheetState(() => cls = v!),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 24),

                    SizedBox(
                      width: double.infinity,
                      child: FilledButton(
                        onPressed: () {
                          // Validate
                          if (name.trim().isEmpty || identity.trim().isEmpty || dob.trim().isEmpty) {
                            ScaffoldMessenger.of(ctx).showSnackBar(
                              const SnackBar(content: Text('Fill all required fields')),
                            );
                            return;
                          }
                          if (memberType == MemberType.dependent && employeeId == null) {
                            ScaffoldMessenger.of(ctx).showSnackBar(
                              const SnackBar(content: Text('Select an employee for this dependent')),
                            );
                            return;
                          }

                          final finalSponsor = memberType == MemberType.employee
                              ? sponsor
                              : members.firstWhere((m) => m.id == employeeId).identityNumber;

                          final member = Member(
                            id: existing?.id,
                            memberType: memberType,
                            memberName: name,
                            identityNumber: identity,
                            dateOfBirth: dob,
                            gender: gender,
                            maritalStatus: marital,
                            classSelection: cls,
                            sponsorNumber: finalSponsor,
                            employeeId: employeeId,
                          );

                          if (isEdit) {
                            ref.read(membersProvider.notifier).update(
                                (list) => list.map((m) => m.id == existing.id ? member : m).toList());
                          } else {
                            ref.read(membersProvider.notifier).update((list) => [...list, member]);
                          }
                          Navigator.pop(ctx);
                        },
                        child: Text(isEdit ? 'Update' : 'Add Member'),
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }

  void _deleteMember(String id) {
    final members = ref.read(membersProvider);
    final member = members.firstWhere((m) => m.id == id);
    if (member.memberType == MemberType.employee) {
      // Remove employee + their dependents
      ref.read(membersProvider.notifier).update(
          (list) => list.where((m) => m.id != id && m.employeeId != id).toList());
    } else {
      ref.read(membersProvider.notifier).update((list) => list.where((m) => m.id != id).toList());
    }
  }

  Widget _label(String text) => Padding(
        padding: const EdgeInsets.only(bottom: 6),
        child: Text(text, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500)),
      );

  @override
  Widget build(BuildContext context) {
    final members = ref.watch(membersProvider);
    final theme = Theme.of(context);

    return Column(
      children: [
        // Header with Add button
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Members (${members.length})',
                  style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600)),
              FilledButton.icon(
                onPressed: () => _openMemberDialog(),
                icon: const Icon(Icons.add, size: 18),
                label: const Text('Add'),
              ),
            ],
          ),
        ),

        // Member list
        Expanded(
          child: members.isEmpty
              ? Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.people_outline, size: 48, color: theme.colorScheme.onSurfaceVariant),
                      const SizedBox(height: 12),
                      Text('No members added yet.',
                          style: TextStyle(color: theme.colorScheme.onSurfaceVariant)),
                    ],
                  ),
                )
              : ListView.builder(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  itemCount: members.length,
                  itemBuilder: (ctx, i) {
                    final m = members[i];
                    return Card(
                      margin: const EdgeInsets.only(bottom: 8),
                      child: ListTile(
                        title: Text(m.memberName, style: const TextStyle(fontWeight: FontWeight.w500)),
                        subtitle: Text(
                          '${m.memberType == MemberType.employee ? "Employee" : "Dependent"} · ${m.classSelection.label} · ${m.gender.name.capitalize()}',
                          style: TextStyle(fontSize: 12, color: theme.colorScheme.onSurfaceVariant),
                        ),
                        trailing: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            IconButton(
                              icon: const Icon(Icons.edit_outlined, size: 20),
                              onPressed: () => _openMemberDialog(existing: m),
                            ),
                            IconButton(
                              icon: Icon(Icons.delete_outline, size: 20, color: theme.colorScheme.error),
                              onPressed: () => _deleteMember(m.id),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
        ),

        BottomNavBar(
          onBack: () => ref.read(currentStepProvider.notifier).state = 0,
          onNext: members.isNotEmpty
              ? () => ref.read(currentStepProvider.notifier).state = 2
              : null,
          nextLabel: 'Continue',
          nextEnabled: members.isNotEmpty,
        ),
      ],
    );
  }
}

// Simple capitalize extension
extension StringCap on String {
  String capitalize() => isEmpty ? this : '${this[0].toUpperCase()}${substring(1)}';
}
