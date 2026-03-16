import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NavbarComponent } from '../../../../shared/components/navbar/navbar.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, NavbarComponent],
  template: `
    <div class="min-h-screen bg-background">
      <app-navbar />

      <!-- Hero -->
      <section class="pt-24 pb-16 md:pt-32 md:pb-24">
        <div class="container mx-auto px-4 lg:px-8 text-center">
          <h1 class="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 animate-fade-up">
            Power your <br class="hidden md:block" />
            business with <span class="text-primary">FataFat</span>
          </h1>
          <div class="flex flex-wrap justify-center gap-3 text-sm text-muted-foreground mb-8">
            @for (tag of tags; track tag) {
              <span class="px-3 py-1 rounded-full bg-secondary">{{ tag }}</span>
            }
          </div>
          <a routerLink="/contact">
            <button mat-flat-button class="rounded-full px-8 py-3 text-base bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-semibold">
              Get Started
            </button>
          </a>

          <!-- Hero images -->
          <div class="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto animate-fade-up" style="animation-delay: 0.3s">
            @for (src of heroImages; track src) {
              <div class="rounded-2xl overflow-hidden aspect-[4/5]">
                <img [src]="src" alt="FataFat business" class="w-full h-full object-cover" loading="lazy" />
              </div>
            }
          </div>
        </div>
      </section>

      <!-- Business Solutions -->
      <section class="py-20 bg-muted/30">
        <div class="container mx-auto px-4 lg:px-8">
          <h2 class="text-3xl md:text-4xl lg:text-5xl font-bold text-center mb-16">
            Flexible business solutions for <br class="hidden md:block" />
            omni-channel selling
          </h2>
          <div class="grid md:grid-cols-3 gap-8">
            @for (sol of solutions; track sol.title; let i = $index) {
              <a [routerLink]="sol.href" class="group block">
                <div class="rounded-2xl overflow-hidden mb-5 aspect-[4/3]">
                  <img [src]="sol.img" [alt]="sol.title"
                    class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                </div>
                <h3 class="text-xl font-bold mb-2">{{ sol.title }}</h3>
                <p class="text-sm text-muted-foreground mb-3">{{ sol.desc }}</p>
                <span class="inline-flex items-center gap-1 text-sm font-semibold text-primary group-hover:gap-2 transition-all">
                  Know More →
                </span>
              </a>
            }
          </div>
        </div>
      </section>

      <!-- Ecosystem -->
      <section class="py-20 bg-background">
        <div class="container mx-auto px-4 lg:px-8">
          <h2 class="text-3xl md:text-4xl font-bold text-center mb-4">
            Ecosystem to sell everything through FataFat
          </h2>
          <p class="text-muted-foreground text-center mb-14 max-w-xl mx-auto">
            Choose the solution that fits your business type
          </p>
          <div class="grid md:grid-cols-3 gap-6">
            @for (eco of ecosystems; track eco.title) {
              <a [routerLink]="eco.href"
                class="block bg-card border border-border rounded-2xl p-8 hover:shadow-lg hover:border-primary/30 transition-all group h-full">
                <h3 class="text-xl font-bold mb-3 group-hover:text-primary transition-colors">{{ eco.title }}</h3>
                <p class="text-sm text-muted-foreground mb-4">{{ eco.desc }}</p>
                <span class="inline-flex items-center gap-1 text-sm font-semibold text-primary">
                  Know More →
                </span>
              </a>
            }
          </div>
        </div>
      </section>

      <!-- Stats -->
      <section class="py-20 bg-slate-900">
        <div class="container mx-auto px-4 lg:px-8">
          <h2 class="text-3xl md:text-4xl font-bold text-center text-white mb-4">
            Empowering lacs of businesses
          </h2>
          <p class="text-white/60 text-center mb-14">Enabling millions of transactions</p>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-8">
            @for (stat of stats; track stat.label) {
              <div class="text-center">
                <div class="text-4xl md:text-5xl font-bold text-primary mb-2">{{ stat.number }}</div>
                <div class="text-white/60 text-sm">{{ stat.label }}</div>
              </div>
            }
          </div>
        </div>
      </section>

      <!-- Testimonials -->
      <section class="py-20 bg-background">
        <div class="container mx-auto px-4 lg:px-8">
          <h2 class="text-3xl md:text-4xl font-bold text-center mb-14">
            Moments with our Merchants
          </h2>
          <div class="grid md:grid-cols-3 gap-8">
            @for (t of testimonials; track t.name) {
              <div class="bg-card border border-border rounded-2xl p-8">
                <p class="text-muted-foreground mb-6 italic">"{{ t.quote }}"</p>
                <div>
                  <p class="font-semibold">{{ t.name }}</p>
                  <p class="text-sm text-muted-foreground">{{ t.role }}</p>
                </div>
              </div>
            }
          </div>
        </div>
      </section>

      <!-- Footer -->
      <footer class="border-t border-border bg-card py-12">
        <div class="container mx-auto px-4 lg:px-8 text-center text-sm text-muted-foreground">
          <p>© {{ currentYear }} FataFat. All rights reserved.</p>
        </div>
      </footer>
    </div>
  `,
  styles: [`
    @keyframes fade-up {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-fade-up {
      animation: fade-up 0.6s ease-out forwards;
    }
  `],
})
export class HomeComponent {
  currentYear = new Date().getFullYear();

  tags = ['Point of Sale', 'Online Store', 'QR Solution', 'Inventory Management', 'Payment Integration', 'Delivery Integration'];

  heroImages = ['/images/hero-home.jpg', '/images/hero-fb.jpg', '/images/hero-retail.jpg', '/images/hero-services.jpg'];

  solutions = [
    { title: 'POS', desc: 'Sync your in-store and online business with the industry\'s leading Point of Sale.', img: '/images/pos-dashboard.jpg', href: '/food-beverage' },
    { title: 'Online Store', desc: 'Go digital in minutes with your own e-commerce website.', img: '/images/online-store.jpg', href: '/retail' },
    { title: 'QR Solutions', desc: 'Provide a contactless ordering experience, accept payments & more with your store\'s QR code.', img: '/images/qr-solution.jpg', href: '/food-beverage' },
  ];

  ecosystems = [
    { title: 'Food & Beverage', desc: 'Tools that connect the front of house with the back of house and integrate everything you need to run your restaurant into one dashboard.', href: '/food-beverage' },
    { title: 'Retail', desc: 'Everything you need to build and run your e-commerce website with tools like inventory management, marketing and more.', href: '/retail' },
    { title: 'Services & Others', desc: 'All the tools you need to deliver the best customer service with features like ePOS and CRM. Flexible for any use case.', href: '/services' },
  ];

  stats = [
    { number: '30mn+', label: 'Transactions' },
    { number: '8mn+', label: 'Merchants' },
    { number: '100+', label: 'Integrations' },
    { number: '80mn+', label: 'Catalog Items' },
  ];

  testimonials = [
    { name: 'Karthik R.', role: 'Assistant VP, eCommerce', quote: 'Clarity of thought behind building the modules and having an answer to the problems we brought up earned the brownie points in choosing FataFat POS.' },
    { name: 'Rajat J.', role: 'Co-founder, Fast Food Chain', quote: 'With FataFat\'s QR solutions, we\'ve been able to reduce our 3rd party commission by a whopping 98%.' },
    { name: 'Aparna A.', role: 'Co-Founder, Restaurant Chain', quote: 'By far the best inventory management system in the entire market. We love the flow and thought put into developing the product.' },
  ];
}
