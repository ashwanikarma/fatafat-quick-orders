import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { LucideAngularModule, Menu, X, ChevronDown } from 'lucide-angular';

interface NavItem {
  label: string;
  children: { label: string; href: string }[];
}

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule, RouterLink, RouterLinkActive,
    MatToolbarModule, MatButtonModule, MatMenuModule, MatIconModule,
    LucideAngularModule,
  ],
  template: `
    <nav
      class="fixed top-0 left-0 right-0 z-50 transition-colors"
      [class.bg-hero-dark/90]="isDarkPage()"
      [class.bg-background/90]="!isDarkPage()"
      [class.backdrop-blur-md]="true"
      [class.border-b]="!isDarkPage()"
      [class.border-border]="!isDarkPage()"
    >
      <div class="container mx-auto flex items-center justify-between h-16 px-4 lg:px-8">
        <!-- Logo -->
        <a routerLink="/" class="flex items-center gap-2">
          <div class="flex items-center gap-1">
            <div class="w-3 h-3 rounded-full bg-primary"></div>
            <div class="w-3 h-3 rounded-full bg-primary"></div>
          </div>
          <span class="text-xl font-heading font-bold tracking-tight"
                [class.text-hero-dark-foreground]="isDarkPage()"
                [class.text-foreground]="!isDarkPage()">
            FataFat
          </span>
        </a>

        <!-- Desktop Nav -->
        <div class="hidden lg:flex items-center gap-8">
          @for (item of navItems; track item.label) {
            <div class="relative" [matMenuTriggerFor]="menu">
              <button mat-button class="text-sm font-medium">
                {{ item.label }}
                <lucide-icon name="chevron-down" [size]="14"></lucide-icon>
              </button>
              <mat-menu #menu="matMenu">
                @for (child of item.children; track child.label) {
                  <a mat-menu-item [routerLink]="child.href">{{ child.label }}</a>
                }
              </mat-menu>
            </div>
          }
        </div>

        <!-- Desktop Actions -->
        <div class="hidden lg:flex items-center gap-3">
          <a routerLink="/login">
            <button mat-button>Login</button>
          </a>
          <a routerLink="/contact">
            <button mat-flat-button color="primary">Get Started</button>
          </a>
        </div>

        <!-- Mobile Toggle -->
        <button class="lg:hidden" (click)="mobileOpen.set(!mobileOpen())">
          @if (mobileOpen()) {
            <lucide-icon name="x" [size]="24"></lucide-icon>
          } @else {
            <lucide-icon name="menu" [size]="24"></lucide-icon>
          }
        </button>
      </div>

      <!-- Mobile Menu -->
      @if (mobileOpen()) {
        <div class="lg:hidden bg-card border-t border-border px-4 py-4 space-y-4"
             @slideDown>
          @for (item of navItems; track item.label) {
            <div>
              <p class="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                {{ item.label }}
              </p>
              @for (child of item.children; track child.label) {
                <a [routerLink]="child.href"
                   (click)="mobileOpen.set(false)"
                   class="block py-2 text-sm text-card-foreground hover:text-primary">
                  {{ child.label }}
                </a>
              }
            </div>
          }
          <div class="pt-4 border-t border-border flex gap-3">
            <a routerLink="/login" (click)="mobileOpen.set(false)">
              <button mat-stroked-button>Login</button>
            </a>
            <a routerLink="/contact" (click)="mobileOpen.set(false)">
              <button mat-flat-button color="primary">Get Started</button>
            </a>
          </div>
        </div>
      }
    </nav>
  `,
})
export class NavbarComponent {
  mobileOpen = signal(false);

  navItems: NavItem[] = [
    {
      label: 'Products',
      children: [
        { label: 'Point of Sale', href: '/food-beverage' },
        { label: 'Online Store', href: '/retail' },
        { label: 'QR Solutions', href: '/food-beverage' },
        { label: 'Services', href: '/services' },
      ],
    },
    {
      label: 'Business Types',
      children: [
        { label: 'Food & Beverage', href: '/food-beverage' },
        { label: 'Retail', href: '/retail' },
        { label: 'Services & Others', href: '/services' },
      ],
    },
    {
      label: 'Company',
      children: [
        { label: 'About Us', href: '/about' },
        { label: 'Contact Us', href: '/contact' },
      ],
    },
  ];

  constructor(private router: Router) {}

  isDarkPage(): boolean {
    const path = this.router.url;
    return path === '/food-beverage' || path === '/about';
  }
}
