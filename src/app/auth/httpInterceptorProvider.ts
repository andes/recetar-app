import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { TokenInterceptorService } from '@auth/token-interceptor.service';
import { ApiResponseInterceptor } from '@shared/utils/api-response.interceptor';

export const httpInterceptorProvider = [
    { provide: HTTP_INTERCEPTORS, useClass: TokenInterceptorService, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: ApiResponseInterceptor, multi: true }
];
