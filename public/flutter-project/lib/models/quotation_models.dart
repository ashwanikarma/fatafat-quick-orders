import 'package:uuid/uuid.dart';

const _uuid = Uuid();

// ─── Enums ──────────────────────────────────────────────
enum MemberType { employee, dependent }

enum ClassSelection { vip, a, b, c, lm }

extension ClassSelectionLabel on ClassSelection {
  String get label => switch (this) {
        ClassSelection.vip => 'VIP',
        ClassSelection.a => 'A',
        ClassSelection.b => 'B',
        ClassSelection.c => 'C',
        ClassSelection.lm => 'LM',
      };
}

enum MaritalStatus { single, married }

enum Gender { male, female }

enum BusinessType { llc, soleProprietorship, partnership, corporation }

extension BusinessTypeLabel on BusinessType {
  String get label => switch (this) {
        BusinessType.llc => 'LLC',
        BusinessType.soleProprietorship => 'Sole Proprietorship',
        BusinessType.partnership => 'Partnership',
        BusinessType.corporation => 'Corporation',
      };
}

enum RevenueRange { under1m, from1mTo10m, from10mTo50m, over50m }

extension RevenueRangeLabel on RevenueRange {
  String get label => switch (this) {
        RevenueRange.under1m => '< 1 Million',
        RevenueRange.from1mTo10m => '1M – 10M',
        RevenueRange.from10mTo50m => '10M – 50M',
        RevenueRange.over50m => '50M+',
      };
}

enum EmployeeRange { from1to10, from11to50, from51to100, over100 }

extension EmployeeRangeLabel on EmployeeRange {
  String get label => switch (this) {
        EmployeeRange.from1to10 => '1–10',
        EmployeeRange.from11to50 => '11–50',
        EmployeeRange.from51to100 => '51–100',
        EmployeeRange.over100 => '100+',
      };
}

// ─── Sponsor ────────────────────────────────────────────
class SponsorData {
  String sponsorNumber;
  DateTime? policyEffectiveDate;
  String? sponsorName;
  String? sponsorStatus;

  SponsorData({
    this.sponsorNumber = '',
    this.policyEffectiveDate,
    this.sponsorName,
    this.sponsorStatus,
  });

  SponsorData copyWith({
    String? sponsorNumber,
    DateTime? policyEffectiveDate,
    String? sponsorName,
    String? sponsorStatus,
  }) =>
      SponsorData(
        sponsorNumber: sponsorNumber ?? this.sponsorNumber,
        policyEffectiveDate: policyEffectiveDate ?? this.policyEffectiveDate,
        sponsorName: sponsorName ?? this.sponsorName,
        sponsorStatus: sponsorStatus ?? this.sponsorStatus,
      );
}

// ─── Member ─────────────────────────────────────────────
class Member {
  final String id;
  MemberType memberType;
  String memberName;
  String identityNumber;
  String dateOfBirth;
  Gender gender;
  MaritalStatus maritalStatus;
  ClassSelection classSelection;
  String sponsorNumber;
  String? employeeId;
  String? healthDeclaration; // "Yes" | "No" | null
  List<bool>? healthAnswers;
  String? heightCm;
  String? weightKg;
  bool isPregnant;
  String? expectedDeliveryDate;
  String? maternityDays;

  Member({
    String? id,
    this.memberType = MemberType.employee,
    this.memberName = '',
    this.identityNumber = '',
    this.dateOfBirth = '',
    this.gender = Gender.male,
    this.maritalStatus = MaritalStatus.single,
    this.classSelection = ClassSelection.b,
    this.sponsorNumber = '',
    this.employeeId,
    this.healthDeclaration,
    this.healthAnswers,
    this.heightCm,
    this.weightKg,
    this.isPregnant = false,
    this.expectedDeliveryDate,
    this.maternityDays,
  }) : id = id ?? _uuid.v4();

  Member copyWith({
    MemberType? memberType,
    String? memberName,
    String? identityNumber,
    String? dateOfBirth,
    Gender? gender,
    MaritalStatus? maritalStatus,
    ClassSelection? classSelection,
    String? sponsorNumber,
    String? employeeId,
    String? healthDeclaration,
    List<bool>? healthAnswers,
    String? heightCm,
    String? weightKg,
    bool? isPregnant,
    String? expectedDeliveryDate,
    String? maternityDays,
  }) =>
      Member(
        id: id,
        memberType: memberType ?? this.memberType,
        memberName: memberName ?? this.memberName,
        identityNumber: identityNumber ?? this.identityNumber,
        dateOfBirth: dateOfBirth ?? this.dateOfBirth,
        gender: gender ?? this.gender,
        maritalStatus: maritalStatus ?? this.maritalStatus,
        classSelection: classSelection ?? this.classSelection,
        sponsorNumber: sponsorNumber ?? this.sponsorNumber,
        employeeId: employeeId ?? this.employeeId,
        healthDeclaration: healthDeclaration ?? this.healthDeclaration,
        healthAnswers: healthAnswers ?? this.healthAnswers,
        heightCm: heightCm ?? this.heightCm,
        weightKg: weightKg ?? this.weightKg,
        isPregnant: isPregnant ?? this.isPregnant,
        expectedDeliveryDate: expectedDeliveryDate ?? this.expectedDeliveryDate,
        maternityDays: maternityDays ?? this.maternityDays,
      );
}

// ─── KYC ────────────────────────────────────────────────
class NationalAddress {
  String buildingNumber;
  String additionalNumber;
  String unitNumber;
  String postalCode;
  String street;
  String district;
  String city;

  NationalAddress({
    this.buildingNumber = '',
    this.additionalNumber = '',
    this.unitNumber = '',
    this.postalCode = '',
    this.street = '',
    this.district = '',
    this.city = '',
  });
}

class BusinessDetails {
  BusinessType? businessType;
  RevenueRange? companyRevenue;
  EmployeeRange? numberOfEmployees;
  String taxRegistrationNumber;
  String ibanNumber;
  String bankName;

  BusinessDetails({
    this.businessType,
    this.companyRevenue,
    this.numberOfEmployees,
    this.taxRegistrationNumber = '',
    this.ibanNumber = '',
    this.bankName = '',
  });
}

class BoardMember {
  final String id;
  String name;
  String identityNumber;
  String address;

  BoardMember({String? id, this.name = '', this.identityNumber = '', this.address = ''})
      : id = id ?? _uuid.v4();
}

class Shareholder {
  final String id;
  String name;
  String address;
  String contributionPercent;

  Shareholder({String? id, this.name = '', this.address = '', this.contributionPercent = ''})
      : id = id ?? _uuid.v4();
}

class ComplianceData {
  bool? isPEP;
  bool? isBoardMember;
  List<BoardMember> boardMembers;
  bool? hasMajorShareholder;
  List<Shareholder> shareholders;
  bool termsAccepted;

  ComplianceData({
    this.isPEP,
    this.isBoardMember,
    List<BoardMember>? boardMembers,
    this.hasMajorShareholder,
    List<Shareholder>? shareholders,
    this.termsAccepted = false,
  })  : boardMembers = boardMembers ?? [],
        shareholders = shareholders ?? [];
}

class KYCData {
  NationalAddress nationalAddress;
  BusinessDetails businessDetails;
  ComplianceData compliance;
  bool completed;

  KYCData({
    NationalAddress? nationalAddress,
    BusinessDetails? businessDetails,
    ComplianceData? compliance,
    this.completed = false,
  })  : nationalAddress = nationalAddress ?? NationalAddress(),
        businessDetails = businessDetails ?? BusinessDetails(),
        compliance = compliance ?? ComplianceData();
}
