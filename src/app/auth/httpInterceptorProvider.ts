import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { TokenInterceptorService } from '@auth/token-interceptor.service';

export const httpInterceptorProvider = [
    { provide: HTTP_INTERCEPTORS, useClass: TokenInterceptorService, multi: true }
];
