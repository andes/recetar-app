import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@root/environments/environment';
import {
    SetupSecurityPinRequest,
    ChangeSecurityPinRequest,
    DisableSecurityPinRequest,
    SecurityPinStatusResponse
} from '../models/security-pin.model';

@Injectable({
    providedIn: 'root'
})
export class SecurityPinService {
    private readonly apiEndPoint = environment.API_END_POINT;

    constructor(private http: HttpClient) { }

    getStatus(): Observable<SecurityPinStatusResponse> {
        return this.http.get<SecurityPinStatusResponse>(
            `${this.apiEndPoint}/users/me/security-pin/status`
        );
    }

    setupPin(data: SetupSecurityPinRequest): Observable<{ message: string }> {
        return this.http.post<{ message: string }>(
            `${this.apiEndPoint}/users/me/security-pin/setup`,
            data
        );
    }

    changePin(data: ChangeSecurityPinRequest): Observable<{ message: string }> {
        return this.http.patch<{ message: string }>(
            `${this.apiEndPoint}/users/me/security-pin`,
            data
        );
    }

    disablePin(data: DisableSecurityPinRequest): Observable<{ message: string }> {
        return this.http.delete<{ message: string }>(
            `${this.apiEndPoint}/users/me/security-pin`,
            { body: data }
        );
    }
}
