import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  User, LoginRequest, LoginResponse, AuthResponse,
  SignUpInput, ProfileInput, ProfileResponse,
} from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = `${environment.apiUrl}/api/User`;

  // ─── Reactive State (Angular Signals) ────────────────
  private readonly _user = signal<User | null>(null);
  private readonly _isLoading = signal(true);

  readonly user = this._user.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly isAuthenticated = computed(() => !!this._user());

  constructor(
    private http: HttpClient,
    private router: Router,
    private snackBar: MatSnackBar,
  ) {
    this.loadFromStorage();
  }

  // ─── Auth Methods ────────────────────────────────────

  async login(email: string, password: string): Promise<{ error: string | null }> {
    this._isLoading.set(true);
    try {
      const res = await firstValueFrom(
        this.http.post<AuthResponse>(`${this.api}/login`, { email, password })
      );
      if (res.success && res.data) {
        this.setSession(res.data);
        await this.loadProfile();
        return { error: null };
      }
      return { error: res.message || 'Login failed' };
    } catch (err: any) {
      return { error: err?.error?.message || 'Login failed. Please try again.' };
    } finally {
      this._isLoading.set(false);
    }
  }

  async signUp(input: SignUpInput): Promise<{ error: string | null; needsEmailConfirmation: boolean }> {
    this._isLoading.set(true);
    try {
      const res = await firstValueFrom(
        this.http.post<AuthResponse>(`${this.api}/register`, {
          fullName: input.fullName,
          email: input.email,
          phone: input.phone || null,
          password: input.password,
        })
      );
      if (res.success) {
        // If server returns tokens, user is auto-logged in
        if (res.data?.accessToken) {
          this.setSession(res.data);
          await this.loadProfile();
          return { error: null, needsEmailConfirmation: false };
        }
        return { error: null, needsEmailConfirmation: true };
      }
      return { error: res.message || 'Signup failed', needsEmailConfirmation: false };
    } catch (err: any) {
      return { error: err?.error?.message || 'Signup failed', needsEmailConfirmation: false };
    } finally {
      this._isLoading.set(false);
    }
  }

  async sendEmailOtp(email: string): Promise<{ error: string | null }> {
    try {
      const res = await firstValueFrom(
        this.http.post<AuthResponse>(`${this.api}/send-otp`, { email })
      );
      return { error: res.success ? null : (res.message || 'Failed to send OTP') };
    } catch (err: any) {
      return { error: err?.error?.message || 'Could not send code' };
    }
  }

  async verifyEmailOtp(email: string, code: string): Promise<{ error: string | null }> {
    try {
      const res = await firstValueFrom(
        this.http.post<AuthResponse>(`${this.api}/verify-otp`, { email, code })
      );
      if (res.success && res.data?.accessToken) {
        this.setSession(res.data);
      }
      return { error: res.success ? null : (res.message || 'Verification failed') };
    } catch (err: any) {
      return { error: err?.error?.message || 'Verification failed' };
    }
  }

  async updatePassword(password: string): Promise<{ error: string | null }> {
    try {
      const res = await firstValueFrom(
        this.http.post<AuthResponse>(`${this.api}/update-password`, { password })
      );
      return { error: res.success ? null : (res.message || 'Failed') };
    } catch (err: any) {
      return { error: err?.error?.message || 'Failed to update password' };
    }
  }

  async updateProfile(input: ProfileInput): Promise<{ error: string | null }> {
    try {
      const res = await firstValueFrom(
        this.http.put<AuthResponse>(`${this.api}/profile`, {
          fullName: input.name,
          phone: input.phone || null,
          address: input.address || null,
          panNumber: input.panNumber || null,
        })
      );
      if (res.success) {
        await this.loadProfile();
      }
      return { error: res.success ? null : (res.message || 'Update failed') };
    } catch (err: any) {
      return { error: err?.error?.message || 'Update failed' };
    }
  }

  async logout(): Promise<void> {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        await firstValueFrom(
          this.http.post(`${this.api}/revoke-session`, { refreshToken })
        ).catch(() => {});
      }
    } finally {
      this.clearSession();
      this.router.navigate(['/']);
    }
  }

  async refreshToken(): Promise<boolean> {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) return false;
    try {
      const res = await firstValueFrom(
        this.http.post<AuthResponse>(`${this.api}/refresh-token`, { refreshToken })
      );
      if (res.success && res.data) {
        this.setSession(res.data);
        return true;
      }
      return false;
    } catch {
      this.clearSession();
      return false;
    }
  }

  getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  // ─── Profile Loading ────────────────────────────────

  async loadProfile(): Promise<void> {
    try {
      const profile = await firstValueFrom(
        this.http.get<ProfileResponse>(`${this.api}/profile`)
      );
      this._user.set(this.mapToUser(profile));
    } catch {
      this._user.set(null);
    }
  }

  async refreshProfile(): Promise<void> {
    await this.loadProfile();
  }

  // ─── Private Helpers ─────────────────────────────────

  private setSession(data: LoginResponse): void {
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
  }

  private clearSession(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    this._user.set(null);
    this._isLoading.set(false);
  }

  private async loadFromStorage(): Promise<void> {
    const token = localStorage.getItem('accessToken');
    if (token) {
      await this.loadProfile();
    }
    this._isLoading.set(false);
  }

  private mapToUser(profile: ProfileResponse): User {
    const name = profile.fullName?.trim() || profile.email.split('@')[0];
    const initials = name
      .split(' ')
      .map(p => p[0])
      .filter(Boolean)
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'FF';

    return {
      id: profile.id,
      name,
      email: profile.email,
      phone: profile.phone || 'Not added yet',
      avatar: profile.avatarText || initials,
      membershipTier: profile.membershipTier,
      policyCount: 3,
      memberSince: new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric' })
        .format(new Date(profile.createdAt)),
      address: profile.address || 'Add your address',
      panNumber: profile.panNumber || 'Add your PAN',
    };
  }
}
