import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // ─── Landing Pages (Public) ──────────────────────────
  {
    path: '',
    loadComponent: () => import('./features/landing/pages/home/home.component').then(m => m.HomeComponent),
  },
  {
    path: 'food-beverage',
    loadComponent: () => import('./features/landing/pages/food-beverage/food-beverage.component').then(m => m.FoodBeverageComponent),
  },
  {
    path: 'retail',
    loadComponent: () => import('./features/landing/pages/retail/retail.component').then(m => m.RetailComponent),
  },
  {
    path: 'services',
    loadComponent: () => import('./features/landing/pages/services/services.component').then(m => m.ServicesComponent),
  },
  {
    path: 'about',
    loadComponent: () => import('./features/landing/pages/about/about.component').then(m => m.AboutComponent),
  },
  {
    path: 'contact',
    loadComponent: () => import('./features/landing/pages/contact/contact.component').then(m => m.ContactComponent),
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
    loadComponent: () => import('./features/quotation/pages/quotation-list/quotation-list.component').then(m => m.QuotationListComponent),
  },
  {
    path: 'policies',
    canActivate: [authGuard],
    loadComponent: () => import('./features/policy/pages/policies/policies.component').then(m => m.PoliciesComponent),
  },
  {
    path: 'policy',
    canActivate: [authGuard],
    loadComponent: () => import('./features/policy/pages/policy-detail/policy-detail.component').then(m => m.PolicyDetailComponent),
  },

  // ─── Fallback ───────────────────────────────────────
  {
    path: '**',
    loadComponent: () => import('./features/landing/pages/not-found/not-found.component').then(m => m.NotFoundComponent),
  },
];
