# Insurance Quotation - Flutter

A complete 6-step health insurance quotation wizard built with **Flutter 3.x**, **Riverpod**, and **GoRouter**.

## Architecture

```
lib/
├── main.dart                    # App entry, theme, ProviderScope
├── router/
│   └── app_router.dart          # GoRouter setup
├── models/
│   └── quotation_models.dart    # All data models (SponsorData, Member, KYC, etc.)
├── providers/
│   └── quotation_provider.dart  # Riverpod providers for state management
├── services/
│   └── sponsor_service.dart     # Simulated API calls
├── screens/
│   └── quotation_screen.dart    # Main screen with stepper + step switcher
├── steps/
│   ├── sponsor_step.dart        # Step 1: Sponsor validation
│   ├── members_step.dart        # Step 2: Member CRUD
│   ├── health_declaration_step.dart  # Step 3: HDF + BMI + maternity
│   ├── quotation_step.dart      # Step 4: Summary + benefits
│   ├── kyc_step.dart            # Step 5: Address, Business, Compliance
│   └── payment_step.dart        # Step 6: Card payment + policy issuance
└── widgets/
    ├── step_indicator.dart      # Visual stepper with circles + connectors
    └── bottom_nav_bar.dart      # Sticky bottom navigation bar
```

## Tech Stack

| Tool            | Purpose                        |
|-----------------|--------------------------------|
| flutter_riverpod| State management (simple StateProvider) |
| go_router       | Declarative routing            |
| google_fonts    | Inter font for clean typography|
| intl            | Number/date formatting         |
| uuid            | Unique IDs for members         |

## Getting Started

```bash
flutter create --org com.insurance . 
# Copy lib/ folder contents
flutter pub get
flutter run
```

## Steps

1. **Sponsor** - Enter sponsor number, pick effective date (tomorrow → +3 weeks), validates via simulated Wathaq API
2. **Members** - Add/edit/delete employees & dependents via bottom sheet, class selection (VIP/A/B/C/LM)
3. **Health Declaration** - Height/weight/BMI, maternity for females, CCHI health questionnaire (5 questions)
4. **Quotation** - Premium summary per member, class-based benefit breakdown with expandable details
5. **KYC** - National address, business details, IBAN auto-bank-detection, PEP/board/shareholder compliance
6. **Payment** - Credit/debit card form, simulated payment, policy issuance success screen

## Key Features

- **Mobile-first** design with sticky bottom navigation
- **Material 3** with teal color scheme
- **Form validation** throughout all steps
- **Animated transitions** between steps
- **IBAN bank auto-detection** for Saudi banks
- **BMI calculation** in health declaration
- **Expandable benefit cards** per insurance class
