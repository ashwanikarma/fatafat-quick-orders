import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="min-h-screen bg-muted/30">
      <!-- Header -->
      <header class="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur-md">
        <div class="container mx-auto flex h-16 items-center justify-between px-4 lg:px-8">
          <a routerLink="/dashboard" class="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <span class="material-icons text-xl">arrow_back</span>
            <span class="text-sm font-medium">Back to Dashboard</span>
          </a>
          <button (click)="handleLogout()" class="p-2 rounded-lg hover:bg-muted transition-colors" title="Logout">
            <span class="material-icons">logout</span>
          </button>
        </div>
      </header>

      <main class="container mx-auto max-w-5xl space-y-6 px-4 py-8 lg:px-8">
        @if (user; as u) {
          <!-- Profile Header Card -->
          <div class="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
            <div class="h-36 bg-gradient-to-br from-primary to-primary/70"></div>
            <div class="relative px-6 pb-6">
              <div class="-mt-12 flex flex-col gap-4 sm:flex-row sm:items-end">
                <div class="flex h-24 w-24 items-center justify-center rounded-[1.75rem] border-4 border-card bg-card shadow-lg">
                  <span class="text-3xl font-bold text-primary">{{ u.avatar }}</span>
                </div>
                <div class="flex-1 pb-1">
                  <h1 class="text-2xl font-bold text-foreground">{{ u.name }}</h1>
                  <div class="mt-1 flex flex-wrap items-center gap-2">
                    <span class="text-xs px-2.5 py-0.5 rounded-full border border-primary/20 bg-primary/10 text-primary">{{ u.membershipTier }}</span>
                    <span class="text-sm text-muted-foreground">· {{ u.policyCount }} Active Policies</span>
                  </div>
                </div>
                <button (click)="editOpen = true"
                  class="flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors text-sm">
                  <span class="material-icons text-sm">edit</span> Edit Profile
                </button>
              </div>
            </div>
          </div>

          <div class="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <!-- Personal Info -->
            <div class="space-y-6">
              <div class="bg-card border border-border rounded-2xl overflow-hidden">
                <div class="p-6 pb-3"><h3 class="text-lg font-bold">Personal Information</h3></div>
                <div class="px-6 pb-6 space-y-0">
                  @for (info of personalInfo; track info.label; let last = $last) {
                    <div class="flex items-center gap-4 py-3">
                      <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <span class="material-icons">{{ info.icon }}</span>
                      </div>
                      <div class="min-w-0 flex-1">
                        <p class="text-xs text-muted-foreground">{{ info.label }}</p>
                        <p class="truncate text-sm font-medium text-foreground">{{ info.value }}</p>
                      </div>
                    </div>
                    @if (!last) { <hr class="border-border" /> }
                  }
                </div>
              </div>

              <!-- Nominees -->
              <div class="bg-card border border-border rounded-2xl overflow-hidden">
                <div class="p-6 pb-3 flex items-center justify-between">
                  <h3 class="text-lg font-bold">Nominees</h3>
                  <button class="text-sm text-primary flex items-center gap-1">Manage <span class="material-icons text-sm">chevron_right</span></button>
                </div>
                <div class="px-6 pb-6 space-y-3">
                  @for (n of nominees; track n.name) {
                    <div class="flex items-center justify-between rounded-2xl bg-muted/50 p-3">
                      <div class="flex items-center gap-3">
                        <div class="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <span class="material-icons">person</span>
                        </div>
                        <div>
                          <p class="text-sm font-medium text-foreground">{{ n.name }}</p>
                          <p class="text-xs text-muted-foreground">{{ n.relation }}</p>
                        </div>
                      </div>
                      <span class="text-xs px-2 py-0.5 rounded-full border border-border">{{ n.share }}</span>
                    </div>
                  }
                </div>
              </div>
            </div>

            <!-- Right Column -->
            <div class="space-y-6">
              <!-- Security -->
              <div class="bg-card border border-border rounded-2xl overflow-hidden">
                <div class="p-6 pb-3"><h3 class="text-lg font-bold">Security & Verification</h3></div>
                <div class="px-6 pb-6 space-y-4">
                  <div class="rounded-2xl border border-border bg-secondary/50 p-4">
                    <div class="flex items-start gap-3">
                      <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <span class="material-icons">verified_user</span>
                      </div>
                      <div class="space-y-1">
                        <p class="text-sm font-semibold text-foreground">Verified changes only</p>
                        <p class="text-sm text-muted-foreground">Any profile or password change requires a fresh email OTP before it is applied.</p>
                      </div>
                    </div>
                  </div>
                  <button (click)="passwordOpen = true"
                    class="w-full py-2.5 rounded-full bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
                    <span class="material-icons text-sm">key</span> Change password securely
                  </button>
                </div>
              </div>

              <!-- Documents -->
              <div class="bg-card border border-border rounded-2xl overflow-hidden">
                <div class="p-6 pb-3"><h3 class="text-lg font-bold">Documents</h3></div>
                <div class="px-6 pb-6 space-y-3">
                  @for (doc of documents; track doc.name) {
                    <div class="group flex cursor-pointer items-center justify-between rounded-2xl bg-muted/50 p-3 transition-colors hover:bg-muted">
                      <div class="flex items-center gap-3">
                        <span class="material-icons text-primary">description</span>
                        <div>
                          <p class="text-sm font-medium text-foreground">{{ doc.name }}</p>
                          <p class="text-xs text-muted-foreground">{{ doc.size }}</p>
                        </div>
                      </div>
                      <button class="opacity-0 group-hover:opacity-100 transition-opacity p-2">
                        <span class="material-icons text-sm">download</span>
                      </button>
                    </div>
                  }
                </div>
              </div>
            </div>
          </div>
        }
      </main>

      <!-- Edit Profile Dialog -->
      @if (editOpen) {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50" (click)="editOpen = false">
          <div class="bg-card rounded-2xl border border-border shadow-xl w-full max-w-xl mx-4 p-6" (click)="$event.stopPropagation()">
            <h3 class="text-lg font-bold mb-1">Edit profile</h3>
            <p class="text-sm text-muted-foreground mb-4">We'll verify the change by email before saving.</p>
            <div class="space-y-4">
              <div>
                <label class="text-sm font-medium">Full name</label>
                <input [(ngModel)]="editForm.name" class="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm mt-1" />
              </div>
              <div class="grid gap-4 sm:grid-cols-2">
                <div>
                  <label class="text-sm font-medium">Phone</label>
                  <input [(ngModel)]="editForm.phone" class="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm mt-1" />
                </div>
                <div>
                  <label class="text-sm font-medium">PAN number</label>
                  <input [(ngModel)]="editForm.panNumber" class="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm mt-1" />
                </div>
              </div>
              <div>
                <label class="text-sm font-medium">Address</label>
                <input [(ngModel)]="editForm.address" class="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm mt-1" />
              </div>
              <button (click)="saveProfile()"
                class="w-full py-2.5 rounded-full bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors">
                Verify & Save Changes
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Change Password Dialog -->
      @if (passwordOpen) {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50" (click)="passwordOpen = false">
          <div class="bg-card rounded-2xl border border-border shadow-xl w-full max-w-md mx-4 p-6" (click)="$event.stopPropagation()">
            <h3 class="text-lg font-bold mb-1">Change password</h3>
            <p class="text-sm text-muted-foreground mb-4">Secure update with email verification.</p>
            <div class="space-y-4">
              <div>
                <label class="text-sm font-medium">New Password</label>
                <input type="password" [(ngModel)]="passwordForm.password" class="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm mt-1" />
              </div>
              <div>
                <label class="text-sm font-medium">Confirm Password</label>
                <input type="password" [(ngModel)]="passwordForm.confirmPassword" class="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm mt-1" />
              </div>
              <button (click)="changePassword()"
                class="w-full py-2.5 rounded-full bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors">
                Verify & Change Password
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class ProfileComponent implements OnInit {
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  user: any = null;
  editOpen = false;
  passwordOpen = false;
  editForm = { name: '', phone: '', address: '', panNumber: '' };
  passwordForm = { password: '', confirmPassword: '' };

  personalInfo: { label: string; value: string; icon: string }[] = [];

  nominees = [
    { name: 'Priya Kumar', relation: 'Spouse', share: '60%' },
    { name: 'Arjun Kumar', relation: 'Son', share: '40%' },
  ];

  documents = [
    { name: 'Health Shield Plus - Policy Document', size: '2.4 MB' },
    { name: 'Motor Protect - Policy Document', size: '1.8 MB' },
    { name: 'Life Secure 360 - Policy Document', size: '3.1 MB' },
    { name: 'KYC Verification Certificate', size: '540 KB' },
  ];

  ngOnInit(): void {
    this.user = this.authService.currentUser();
    if (!this.user) { this.router.navigate(['/login']); return; }
    this.editForm = {
      name: this.user.name || '',
      phone: this.user.phone || '',
      address: this.user.address || '',
      panNumber: this.user.panNumber || '',
    };
    this.personalInfo = [
      { label: 'Full Name', value: this.user.name, icon: 'person' },
      { label: 'Email Address', value: this.user.email, icon: 'email' },
      { label: 'Phone Number', value: this.user.phone || 'Not added yet', icon: 'phone' },
      { label: 'Member Since', value: this.user.memberSince || '—', icon: 'calendar_today' },
      { label: 'Address', value: this.user.address || 'Add your address', icon: 'location_on' },
      { label: 'PAN Number', value: this.user.panNumber || 'Add your PAN', icon: 'description' },
    ];
  }

  handleLogout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }

  saveProfile(): void {
    // In production: send OTP → verify → update
    this.toastService.show('Profile Updated', 'Your details were updated after verification.');
    this.editOpen = false;
  }

  changePassword(): void {
    if (this.passwordForm.password !== this.passwordForm.confirmPassword) {
      this.toastService.show('Mismatch', 'Passwords do not match.', 'error');
      return;
    }
    if (this.passwordForm.password.length < 8) {
      this.toastService.show('Too Short', 'Password must be at least 8 characters.', 'error');
      return;
    }
    // In production: send OTP → verify → update password
    this.toastService.show('Password Changed', 'Your password is now protected by the new credentials.');
    this.passwordOpen = false;
    this.passwordForm = { password: '', confirmPassword: '' };
  }
}
