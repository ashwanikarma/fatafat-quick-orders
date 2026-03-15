import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../core/services/toast.service';
import { OtpVerificationComponent } from '../../../../shared/components/otp-verification/otp-verification.component';

type AuthView = 'signin' | 'signup' | 'forgot' | 'forgot-verify' | 'forgot-reset';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule, RouterLink,
    MatFormFieldModule, MatInputModule, MatButtonModule,
    MatProgressSpinnerModule, MatTabsModule,
    OtpVerificationComponent,
  ],
  template: `
    <div class="min-h-screen bg-section-alt px-4 py-8">
      <div class="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl gap-6 lg:grid-cols-[1.05fr_0.95fr]">

        <!-- Left Panel: Branding -->
        <section class="relative overflow-hidden rounded-[2rem] border border-border bg-hero-dark px-6 py-8 text-hero-dark-foreground shadow-2xl lg:px-10 lg:py-10">
          <div class="absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/0.35),transparent_36%)]"></div>
          <div class="relative flex h-full flex-col justify-between gap-10">
            <div>
              <a routerLink="/" class="inline-flex items-center gap-2">
                <div class="flex items-center gap-1">
                  <div class="h-3 w-3 rounded-full bg-primary"></div>
                  <div class="h-3 w-3 rounded-full bg-primary"></div>
                </div>
                <span class="text-xl font-heading font-bold">FataFat</span>
              </a>
              <div class="mt-10 max-w-xl space-y-5">
                <h1 class="text-4xl font-heading font-bold leading-tight sm:text-5xl">
                  Secure account access for your policy, claims, and billing journey.
                </h1>
                <p class="max-w-lg text-sm leading-6 text-hero-dark-foreground/75 sm:text-base">
                  Sign in, recover your password with email OTP, and verify every sensitive profile change.
                </p>
              </div>
            </div>
            <div class="grid gap-4 sm:grid-cols-3">
              @for (item of brandStats; track item.label) {
                <div class="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                  <p class="text-xs uppercase tracking-[0.24em] text-hero-dark-foreground/50">{{ item.label }}</p>
                  <p class="mt-2 text-lg font-semibold text-hero-dark-foreground">{{ item.value }}</p>
                </div>
              }
            </div>
          </div>
        </section>

        <!-- Right Panel: Auth Forms -->
        <section class="flex items-center">
          <div class="w-full rounded-[2rem] border border-border bg-card p-6 shadow-xl sm:p-8">

            <!-- Tab Switcher -->
            <div class="mb-8 flex flex-wrap gap-2 rounded-full bg-secondary p-1">
              @for (tab of tabs; track tab.key) {
                <button (click)="setView(tab.key)"
                        class="rounded-full px-4 py-2 text-sm font-medium transition-colors"
                        [class.bg-card]="view().startsWith(tab.key)"
                        [class.text-foreground]="view().startsWith(tab.key)"
                        [class.shadow-sm]="view().startsWith(tab.key)"
                        [class.text-muted-foreground]="!view().startsWith(tab.key)">
                  {{ tab.label }}
                </button>
              }
            </div>

            <div class="mb-6">
              <h2 class="text-3xl font-heading font-bold text-foreground">{{ currentTitle }}</h2>
              <p class="mt-2 text-sm text-muted-foreground">{{ currentSubtitle }}</p>
            </div>

            <!-- Sign In Form -->
            @if (view() === 'signin') {
              <form [formGroup]="signInForm" (ngSubmit)="handleSignIn()" class="space-y-4">
                <mat-form-field appearance="outline" class="w-full">
                  <mat-label>Email</mat-label>
                  <input matInput formControlName="email" type="email" placeholder="you&#64;example.com" />
                </mat-form-field>
                <mat-form-field appearance="outline" class="w-full">
                  <mat-label>Password</mat-label>
                  <input matInput formControlName="password"
                         [type]="showPassword() ? 'text' : 'password'"
                         placeholder="Enter your password" />
                  <button matSuffix mat-icon-button type="button" (click)="showPassword.set(!showPassword())">
                    {{ showPassword() ? '🙈' : '👁' }}
                  </button>
                </mat-form-field>
                <button mat-flat-button color="primary" class="w-full rounded-full" type="submit"
                        [disabled]="loading()">
                  @if (loading()) { <mat-spinner diameter="20"></mat-spinner> }
                  Sign in
                </button>
              </form>
            }

            <!-- Sign Up Form -->
            @if (view() === 'signup') {
              <form [formGroup]="signUpForm" (ngSubmit)="handleSignUp()" class="space-y-4">
                <mat-form-field appearance="outline" class="w-full">
                  <mat-label>Full Name</mat-label>
                  <input matInput formControlName="fullName" placeholder="Rajesh Kumar" />
                </mat-form-field>
                <div class="grid gap-4 sm:grid-cols-2">
                  <mat-form-field appearance="outline">
                    <mat-label>Email</mat-label>
                    <input matInput formControlName="email" type="email" />
                  </mat-form-field>
                  <mat-form-field appearance="outline">
                    <mat-label>Phone</mat-label>
                    <input matInput formControlName="phone" type="tel" />
                  </mat-form-field>
                </div>
                <mat-form-field appearance="outline" class="w-full">
                  <mat-label>Password</mat-label>
                  <input matInput formControlName="password"
                         [type]="showPassword() ? 'text' : 'password'" />
                </mat-form-field>
                <button mat-flat-button color="primary" class="w-full rounded-full" type="submit"
                        [disabled]="loading()">
                  @if (loading()) { <mat-spinner diameter="20"></mat-spinner> }
                  Create Account
                </button>
              </form>
            }

            <!-- Forgot Password -->
            @if (view() === 'forgot') {
              <form (ngSubmit)="handleSendForgotOtp()" class="space-y-4">
                <mat-form-field appearance="outline" class="w-full">
                  <mat-label>Registered Email</mat-label>
                  <input matInput [(ngModel)]="forgotEmail" name="email" type="email" />
                </mat-form-field>
                <button mat-flat-button color="primary" class="w-full rounded-full" type="submit"
                        [disabled]="otpLoading()">
                  @if (otpLoading()) { <mat-spinner diameter="20"></mat-spinner> }
                  Send Verification Code
                </button>
              </form>
            }

            <!-- OTP Verify -->
            @if (view() === 'forgot-verify') {
              <app-otp-verification
                title="Verify your recovery request"
                description="Use the code we emailed you to unlock password reset."
                [recipient]="forgotEmail"
                [value]="otpCode"
                (onChange)="otpCode = $event"
                (onSubmit)="handleVerifyForgotOtp()"
                (onResend)="handleSendForgotOtp()"
                [isSubmitting]="otpLoading()"
                [isResending]="resendLoading()"
                submitLabel="Verify and continue">
              </app-otp-verification>
            }

            <!-- Reset Password -->
            @if (view() === 'forgot-reset') {
              <form [formGroup]="resetForm" (ngSubmit)="handleResetPassword()" class="space-y-4">
                <mat-form-field appearance="outline" class="w-full">
                  <mat-label>New Password</mat-label>
                  <input matInput formControlName="password" type="password" />
                </mat-form-field>
                <mat-form-field appearance="outline" class="w-full">
                  <mat-label>Confirm Password</mat-label>
                  <input matInput formControlName="confirmPassword" type="password" />
                </mat-form-field>
                <button mat-flat-button color="primary" class="w-full rounded-full" type="submit"
                        [disabled]="loading()">
                  @if (loading()) { <mat-spinner diameter="20"></mat-spinner> }
                  Set New Password
                </button>
              </form>
            }
          </div>
        </section>
      </div>
    </div>
  `,
})
export class LoginComponent {
  view = signal<AuthView>('signin');
  showPassword = signal(false);
  loading = signal(false);
  otpLoading = signal(false);
  resendLoading = signal(false);
  forgotEmail = '';
  otpCode = '';

  tabs = [
    { key: 'signin' as AuthView, label: 'Sign in' },
    { key: 'signup' as AuthView, label: 'Create account' },
    { key: 'forgot' as AuthView, label: 'Forgot password' },
  ];

  brandStats = [
    { label: 'Password recovery', value: 'OTP verified' },
    { label: 'Sensitive updates', value: 'Email protected' },
    { label: 'SMS support', value: 'Ready later' },
  ];

  signInForm: FormGroup;
  signUpForm: FormGroup;
  resetForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private toast: ToastService,
    private router: Router,
  ) {
    this.signInForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
    });

    this.signUpForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      password: ['', [Validators.required, Validators.minLength(8)]],
    });

    this.resetForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required, Validators.minLength(8)]],
    });
  }

  get currentTitle(): string {
    switch (this.view()) {
      case 'signup': return 'Create your policy portal';
      case 'forgot': case 'forgot-verify': case 'forgot-reset': return 'Recover your account';
      default: return 'Welcome back';
    }
  }

  get currentSubtitle(): string {
    switch (this.view()) {
      case 'signin': return 'Access your dashboard with your registered email and password.';
      case 'signup': return 'Create a secure customer account.';
      case 'forgot': return "We'll send a verification code to your registered email.";
      case 'forgot-verify': return 'Enter the verification code from your email.';
      case 'forgot-reset': return 'Set a strong new password to finish recovery.';
      default: return '';
    }
  }

  setView(view: AuthView): void {
    this.view.set(view);
    this.otpCode = '';
  }

  async handleSignIn(): Promise<void> {
    if (this.signInForm.invalid) return;
    this.loading.set(true);
    const { email, password } = this.signInForm.value;
    const { error } = await this.auth.login(email, password);
    this.loading.set(false);
    if (error) {
      this.toast.error('Login failed', error);
      return;
    }
    this.toast.success('Welcome back!', 'Your insurance dashboard is ready.');
    this.router.navigate(['/dashboard']);
  }

  async handleSignUp(): Promise<void> {
    if (this.signUpForm.invalid) return;
    this.loading.set(true);
    const { fullName, email, phone, password } = this.signUpForm.value;
    const { error, needsEmailConfirmation } = await this.auth.signUp({ fullName, email, phone, password });
    this.loading.set(false);
    if (error) {
      this.toast.error('Signup failed', error);
      return;
    }
    if (needsEmailConfirmation) {
      this.toast.info('Verify your email', 'We sent a confirmation link.');
      this.view.set('signin');
    } else {
      this.router.navigate(['/dashboard']);
    }
  }

  async handleSendForgotOtp(): Promise<void> {
    if (!this.forgotEmail) return;
    this.otpLoading.set(true);
    const { error } = await this.auth.sendEmailOtp(this.forgotEmail);
    this.otpLoading.set(false);
    if (error) {
      this.toast.error('Could not send code', error);
      return;
    }
    this.toast.success('Code sent', 'Check your email.');
    this.view.set('forgot-verify');
  }

  async handleVerifyForgotOtp(): Promise<void> {
    if (this.otpCode.length !== 6) return;
    this.otpLoading.set(true);
    const { error } = await this.auth.verifyEmailOtp(this.forgotEmail, this.otpCode);
    this.otpLoading.set(false);
    if (error) {
      this.toast.error('Verification failed', error);
      return;
    }
    this.toast.success('Verified', 'Set your new password.');
    this.view.set('forgot-reset');
  }

  async handleResetPassword(): Promise<void> {
    if (this.resetForm.invalid) return;
    const { password, confirmPassword } = this.resetForm.value;
    if (password !== confirmPassword) {
      this.toast.error('Passwords do not match');
      return;
    }
    this.loading.set(true);
    const { error } = await this.auth.updatePassword(password);
    this.loading.set(false);
    if (error) {
      this.toast.error('Failed', error);
      return;
    }
    this.toast.success('Password updated');
    this.router.navigate(['/dashboard']);
  }
}
