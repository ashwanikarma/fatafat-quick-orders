import { inject } from '@angular/core';
import {
  HttpInterceptorFn, HttpRequest, HttpHandlerFn,
  HttpErrorResponse, HttpEvent,
} from '@angular/common/http';
import { Observable, throwError, from, switchMap, catchError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // Skip auth header for public endpoints
  const publicUrls = ['/login', '/register', '/send-otp', '/verify-otp', '/refresh-token'];
  const isPublic = publicUrls.some(url => req.url.includes(url));

  let authReq = req;
  if (!isPublic) {
    const token = auth.getAccessToken();
    if (token) {
      authReq = req.clone({
        setHeaders: { Authorization: `Bearer ${token}` },
      });
    }
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !isPublic) {
        // Try refresh token
        return from(auth.refreshToken()).pipe(
          switchMap((success) => {
            if (success) {
              const newToken = auth.getAccessToken();
              const retryReq = req.clone({
                setHeaders: { Authorization: `Bearer ${newToken}` },
              });
              return next(retryReq);
            }
            router.navigate(['/login']);
            return throwError(() => error);
          }),
        );
      }
      return throwError(() => error);
    }),
  );
};
