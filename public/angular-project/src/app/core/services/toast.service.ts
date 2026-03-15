import { Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';

export interface ToastOptions {
  title: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success';
  duration?: number;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  constructor(private snackBar: MatSnackBar) {}

  show(options: ToastOptions): void {
    const message = options.description
      ? `${options.title}: ${options.description}`
      : options.title;

    const config: MatSnackBarConfig = {
      duration: options.duration || 4000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: this.getPanelClass(options.variant),
    };

    this.snackBar.open(message, 'Close', config);
  }

  success(title: string, description?: string): void {
    this.show({ title, description, variant: 'success' });
  }

  error(title: string, description?: string): void {
    this.show({ title, description, variant: 'destructive' });
  }

  info(title: string, description?: string): void {
    this.show({ title, description });
  }

  private getPanelClass(variant?: string): string[] {
    switch (variant) {
      case 'destructive':
        return ['snackbar-error'];
      case 'success':
        return ['snackbar-success'];
      default:
        return ['snackbar-default'];
    }
  }
}
