import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="flex min-h-screen items-center justify-center bg-muted">
      <div class="text-center">
        <h1 class="mb-4 text-6xl font-bold text-foreground">404</h1>
        <p class="mb-4 text-xl text-muted-foreground">Oops! Page not found</p>
        <a routerLink="/" class="text-primary underline hover:text-primary/90 text-lg">
          Return to Home
        </a>
      </div>
    </div>
  `,
})
export class NotFoundComponent implements OnInit {
  constructor(private router: Router) {}

  ngOnInit(): void {
    console.error('404 Error: User attempted to access non-existent route:', this.router.url);
  }
}
