# FataFat Insurance Portal — Angular 18 Conversion Roadmap

## Recommended Theme & UI Library

### **Angular Material** (Primary UI Framework)
- **Why**: First-party Angular support, tree-shakable, fully accessible, theming via CSS custom properties
- **Package**: `@angular/material@18` + `@angular/cdk@18`

### **Tailwind CSS** (Utility styling)
- **Why**: Already used in React project, keeps design consistency
- **Package**: `tailwindcss@3` + `@tailwindcss/forms`

### **Custom Theme** (Material Design 3)
- Use Angular Material's M3 theming with your existing HSL color tokens
- Fonts: **Space Grotesk** (headings) + **DM Sans** (body) — same as current project

### Additional Libraries
| Purpose | Library | Notes |
|---------|---------|-------|
| Icons | `lucide-angular` | Same icons as React project |
| Animations | `@angular/animations` | Built-in, replaces framer-motion |
| Charts | `ngx-charts` | If needed for dashboard |
| Excel | `xlsx` | Same as current project |
| Forms | `@angular/forms` (Reactive) | Replaces Zod validation |
| HTTP | `@angular/common/http` | Replaces Supabase client |
| State | `@ngrx/signals` or Services | Replaces React Context |
| Date | `date-fns` | Same as current project |
| Toast | Angular Material Snackbar | Replaces sonner/shadcn toast |

---

## Project Structure

```
src/
├── app/
│   ├── core/                          # Singleton services, guards, interceptors
│   │   ├── guards/
│   │   │   └── auth.guard.ts
│   │   ├── interceptors/
│   │   │   └── auth.interceptor.ts
│   │   ├── services/
│   │   │   ├── auth.service.ts
│   │   │   ├── quotation.service.ts
│   │   │   ├── endorsement.service.ts
│   │   │   ├── notification.service.ts
│   │   │   └── toast.service.ts
│   │   └── models/
│   │       ├── user.model.ts
│   │       ├── quotation.model.ts
│   │       ├── endorsement.model.ts
│   │       └── api-response.model.ts
│   ├── shared/                        # Shared components, pipes, directives
│   │   ├── components/
│   │   │   ├── navbar/
│   │   │   ├── footer/
│   │   │   ├── step-indicator/
│   │   │   ├── otp-verification/
│   │   │   └── page-skeletons/
│   │   ├── pipes/
│   │   │   └── format-currency.pipe.ts
│   │   └── directives/
│   │       └── swipe.directive.ts
│   ├── features/                      # Feature modules (lazy-loaded)
│   │   ├── auth/
│   │   │   ├── pages/
│   │   │   │   └── login/
│   │   │   ├── components/
│   │   │   │   └── otp-form/
│   │   │   └── auth.routes.ts
│   │   ├── dashboard/
│   │   │   ├── pages/
│   │   │   │   └── dashboard/
│   │   │   └── dashboard.routes.ts
│   │   ├── profile/
│   │   │   ├── pages/
│   │   │   │   └── profile/
│   │   │   └── profile.routes.ts
│   │   ├── quotation/
│   │   │   ├── pages/
│   │   │   │   ├── quotation/
│   │   │   │   └── quotation-list/
│   │   │   ├── components/
│   │   │   │   ├── sponsor-step/
│   │   │   │   ├── members-step/
│   │   │   │   ├── health-declaration-step/
│   │   │   │   ├── quotation-step/
│   │   │   │   ├── kyc-step/
│   │   │   │   └── payment-step/
│   │   │   └── quotation.routes.ts
│   │   ├── policy/
│   │   │   ├── pages/
│   │   │   │   ├── policies/
│   │   │   │   └── policy-detail/
│   │   │   ├── components/
│   │   │   │   ├── add-member-endorsement/
│   │   │   │   ├── update-member-endorsement/
│   │   │   │   └── delete-member-endorsement/
│   │   │   └── policy.routes.ts
│   │   └── landing/
│   │       ├── pages/
│   │       │   ├── home/
│   │       │   ├── food-beverage/
│   │       │   ├── retail/
│   │       │   ├── services/
│   │       │   ├── about/
│   │       │   └── contact/
│   │       └── landing.routes.ts
│   ├── app.component.ts
│   ├── app.config.ts
│   └── app.routes.ts
├── environments/
│   ├── environment.ts
│   └── environment.prod.ts
├── assets/
│   └── images/
├── styles/
│   ├── _variables.scss
│   ├── _material-theme.scss
│   └── styles.scss
└── index.html
```

---

## Migration Steps (Phase-by-Phase)

### Phase 1: Project Setup (Day 1)
1. `ng new fatafat-portal --standalone --style=scss --routing`
2. Install: `@angular/material`, `tailwindcss`, `lucide-angular`, `xlsx`, `date-fns`
3. Configure Tailwind with same tokens from `index.css`
4. Set up Angular Material M3 theme matching current HSL colors
5. Configure environments with API base URL

### Phase 2: Core Layer (Day 2)
1. Create all models (copy from `quotation.model.ts`, `user.model.ts`)
2. Build `AuthService` with JWT login, signup, OTP, password reset
3. Build `AuthGuard` for protected routes
4. Build `AuthInterceptor` for JWT token injection
5. Build `ToastService` wrapping Material Snackbar

### Phase 3: Shared Components (Day 3)
1. Convert `Navbar` → Angular component with Material toolbar
2. Convert `Footer` → Angular component
3. Convert `StepIndicator` → Angular component
4. Convert `OtpVerificationForm` → Angular component
5. Create `PageSkeletons` with Angular Material progress bars

### Phase 4: Auth Feature (Day 4)
1. Convert `Login.tsx` → `LoginComponent` with reactive forms
2. Implement sign-in, sign-up, forgot password, OTP verify, password reset
3. Add Zod-equivalent validation using Angular Validators + custom validators

### Phase 5: Dashboard Feature (Day 5)
1. Convert `Dashboard.tsx` → `DashboardComponent`
2. Implement notification popover using Material Menu
3. Add quotation listing with delete functionality
4. Connect to .NET 8 API endpoints

### Phase 6: Quotation Feature (Days 6-8)
1. Convert all 6 quotation steps to Angular components
2. Implement auto-save via `QuotationService`
3. Convert Excel upload/download in Members step
4. Convert KYC step with IBAN bank detection
5. Convert Payment step with card formatting

### Phase 7: Policy & Endorsement Feature (Days 9-10)
1. Convert `Policies` list page
2. Convert `PolicyDetail` with tabs (Overview, Members, Endorsements)
3. Convert all 3 endorsement components (Add, Update, Delete)
4. Implement endorsement history tracking

### Phase 8: Landing Pages (Day 11)
1. Convert Index, FoodBeverage, Retail, Services, About, Contact
2. Add Angular animations (replacing framer-motion)
3. Implement FAQ accordion with Material Expansion Panel

### Phase 9: Polish & Deploy (Day 12)
1. Add lazy loading for all feature modules
2. Add PWA support with `@angular/pwa`
3. Add SEO meta tags with `@angular/platform-browser`
4. Performance optimization (OnPush, trackBy, etc.)

---

## React → Angular Mapping Cheat Sheet

| React Concept | Angular Equivalent |
|---|---|
| `useState` | Component property / signals |
| `useEffect` | `ngOnInit`, `ngOnChanges`, `effect()` |
| `useCallback/useMemo` | `computed()` signals or `pipe(shareReplay)` |
| `useContext` | Injectable service |
| `React Router` | `@angular/router` |
| `framer-motion` | `@angular/animations` |
| `shadcn/ui` | Angular Material |
| `Zod` | Angular Validators + custom validators |
| `react-query` | `HttpClient` + services |
| `Sonner/Toast` | Material Snackbar |
| Props/Children | `@Input()` / `@Output()` / `<ng-content>` |
| Conditional render `{x && <Y/>}` | `@if (x) { <Y/> }` |
| List render `{arr.map(...)}` | `@for (item of arr; track item.id) { }` |
