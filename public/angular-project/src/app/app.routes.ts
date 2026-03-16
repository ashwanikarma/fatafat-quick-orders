import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // ─── Landing Pages (Public) ──────────────────────────
  {
    path: '',
    loadComponent: () => import('./features/home/pages/home/home.component').then(m => m.HomeComponent),
  },

  // ─── Auth (Guest Only) ──────────────────────────────
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/pages/login/login.component').then(m => m.LoginComponent),
  },

  // ─── Protected Routes ───────────────────────────────
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./features/dashboard/pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
  },
  {
    path: 'profile',
    canActivate: [authGuard],
    loadComponent: () => import('./features/profile/pages/profile/profile.component').then(m => m.ProfileComponent),
  },
  {
    path: 'quotation',
    canActivate: [authGuard],
    loadComponent: () => import('./features/quotation/pages/quotation/quotation.component').then(m => m.QuotationComponent),
  },
  {
    path: 'quotations',
    canActivate: [authGuard],
    loadComponent: () => import('./features/quotation-list/pages/quotation-list/quotation-list.component').then(m => m.QuotationListComponent),
  },
  {
    path: 'policies',
    canActivate: [authGuard],
    loadComponent: () => import('./features/policy-list/pages/policy-list/policy-list.component').then(m => m.PolicyListComponent),
  },
  {
    path: 'policy',
    canActivate: [authGuard],
    loadComponent: () => import('./features/policy/pages/policy-detail/policy-detail.component').then(m => m.PolicyDetailComponent),
  },

  // ─── Fallback ───────────────────────────────────────
  {
    path: '**',
    loadComponent: () => import('./features/not-found/pages/not-found/not-found.component').then(m => m.NotFoundComponent),
  },
];
