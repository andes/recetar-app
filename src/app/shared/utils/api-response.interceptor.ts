import { Injectable } from '@angular/core';
import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '@root/environments/environment';

@Injectable()
export class ApiResponseInterceptor implements HttpInterceptor {
    private apiUrl = environment.API_END_POINT;

    intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
        return next.handle(req).pipe(
            map(event => {
                if (event instanceof HttpResponse && this.isApiRequest(req.url)) {
                    const body = event.body as any;
                    if (body && body.status === 'success' && body.data !== undefined) {
                        return event.clone({ body: body.data });
                    }
                }
                return event;
            })
        );
    }

    private isApiRequest(url: string): boolean {
        return url.startsWith(this.apiUrl);
    }
}
