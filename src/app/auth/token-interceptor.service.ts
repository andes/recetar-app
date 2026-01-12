import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '@auth/services/auth.service';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, filter, take, switchMap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from '@root/environments/environment';

@Injectable()
export class TokenInterceptorService implements HttpInterceptor {

    private isRefreshing = false;
    private refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

    constructor(private authService: AuthService, private router: Router) { }

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        const urlPublica = request.headers.get('public') === 'true';
        if (!urlPublica && this.authService.getJwtToken()) {
            request = this.addToken(request, this.authService.getJwtToken());
        }

        return next.handle(request).pipe(catchError(error => {
            if (error instanceof HttpErrorResponse && error.status === 406) {
                return this.handle406Error(request, next);
            } else if (error instanceof HttpErrorResponse && error.status === 417) {
                this.handle417Error(request, next);
                return throwError(error.error.message);
            } else {
                return this.errorHandler(error);
            }
        }));
    }

    errorHandler(err: HttpErrorResponse) {
        if (err.status == 422) {
            return throwError(err);
        }
        return throwError(err.error.message || err.error || 'Server Error');
    }

    private addToken(request: HttpRequest<any>, token: string) {
        return request.clone({
            setHeaders: {
                'Authorization': `Bearer ${token}`
            }
        });
    }

    // expired token handler
    private handle406Error(request: HttpRequest<any>, next: HttpHandler) {
        if (!this.isRefreshing) {
            this.isRefreshing = true;
            this.refreshTokenSubject.next(null);

            return this.authService.refreshToken().pipe(
                switchMap((token: any) => {
                    this.isRefreshing = false;
                    this.refreshTokenSubject.next(token.jwt);
                    return next.handle(this.addToken(request, token.jwt));
                }));

        } else {
            return this.refreshTokenSubject.pipe(
                filter(token => token != null),
                take(1),
                switchMap(jwt => {
                    return next.handle(this.addToken(request, jwt));
                }));
        }
    }

    // user credentials handler
    private handle417Error(request: HttpRequest<any>, next: HttpHandler) {
        return this.authService.logout().subscribe(success => {
            if (success) { this.router.navigate(['/auth/login']); }
        });
    }

}
