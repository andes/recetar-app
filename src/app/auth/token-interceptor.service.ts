import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '@auth/services/auth.service';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, filter, take, switchMap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { normalizeHttpError } from '@shared/utils/http-error.util';

interface RefreshTokenResponse {
    jwt: string;
}

function hasStatus422(err: unknown): boolean {
    return typeof err === 'object'
        && err !== null
        && 'status' in err
        && (err as { status?: number }).status === 422;
}

@Injectable()
export class TokenInterceptorService implements HttpInterceptor {

    private isRefreshing = false;
    private refreshTokenSubject: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);

    constructor(private authService: AuthService, private router: Router) { }

    intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
        const urlPublica = request.headers.get('public') === 'true';
        if (!urlPublica && this.authService.getJwtToken()) {
            request = this.addToken(request, this.authService.getJwtToken());
        }

        return next.handle(request).pipe(catchError(error => {
            if (error instanceof HttpErrorResponse && error.status === 406) {
                return this.handle406Error(request, next);
            } else if (error instanceof HttpErrorResponse && error.status === 417) {
                this.handle417Error();
                return throwError(normalizeHttpError(error));
            } else {
                return this.errorHandler(error);
            }
        }));
    }

    errorHandler(err: HttpErrorResponse | unknown): Observable<never> {
        if (hasStatus422(err)) {
            return throwError(err);
        }

        return throwError(normalizeHttpError(err));
    }

    private addToken(request: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
        return request.clone({
            setHeaders: {
                'Authorization': `Bearer ${token}`
            }
        });
    }

    // expired token handler
    private handle406Error(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
        if (!this.isRefreshing) {
            this.isRefreshing = true;
            this.refreshTokenSubject.next(null);

            return this.authService.refreshToken().pipe(
                switchMap((token: RefreshTokenResponse) => {
                    this.isRefreshing = false;
                    this.refreshTokenSubject.next(token.jwt);
                    return next.handle(this.addToken(request, token.jwt));
                }));

        } else {
            return this.refreshTokenSubject.pipe(
                filter((token): token is string => token !== null),
                take(1),
                switchMap((jwt: string) => {
                    return next.handle(this.addToken(request, jwt));
                }));
        }
    }

    // user credentials handler
    private handle417Error() {
        return this.authService.logout().subscribe(success => {
            if (success) { this.router.navigate(['/auth/login']); }
        });
    }

}
