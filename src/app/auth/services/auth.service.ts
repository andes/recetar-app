import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment } from '@root/environments/environment';
import { of, Observable, BehaviorSubject } from 'rxjs';
import { catchError, mapTo, tap } from 'rxjs/operators';
import decode from 'jwt-decode';
// inteface
import { Tokens } from '@auth/models/tokens';
import { PrescriptionsService } from '@services/prescriptions.service';

interface JwtPayload {
    usrn?: string;
    sub?: string;
    bsname?: string;
    email?: string;
    rl?: string[];
}

interface ForgotPasswordResponse {
    status?: string;
    msg?: string;
}

interface ResetPasswordResponse {
    message?: string;
    mensaje?: string;
}

interface RegisterResponse {
    newUser?: {
        businessName?: string;
    };
}

@Injectable({
    providedIn: 'root'
})
export class AuthService {

    private readonly JWT_TOKEN = 'JWT_TOKEN';
    private readonly REFRESH_TOKEN = 'REFRESH_TOKEN';
    private readonly apiEndPoint = environment.API_END_POINT;
    private loggedIn: BehaviorSubject<boolean>;
    private businessName: BehaviorSubject<string>;
    private isAudit: BehaviorSubject<boolean>;
    private isProfessionalBothRolesO: BehaviorSubject<boolean>;
    private isOnlyAudit: BehaviorSubject<boolean>;


    constructor(
        private http: HttpClient,
        private router: Router,
        private prescriptionsService: PrescriptionsService) {

        this.loggedIn = new BehaviorSubject<boolean>(this.tokensExists());
        this.businessName = new BehaviorSubject<string>(this.getLoggedBusinessName());
        this.isAudit = new BehaviorSubject<boolean>(this.isAuditRole());
        this.isProfessionalBothRolesO = new BehaviorSubject<boolean>(this.isProfessionalBothRoles());
        this.isOnlyAudit = new BehaviorSubject<boolean>(this.isOnlyAuditRole());
    }



    async load(): Promise<void> {
        if (this.tokensExists()) {
            await this.http.get<Tokens>(`${this.apiEndPoint}/auth/jwt-login`).pipe(
                tap(tokens => this.doLoginUser(tokens)),
                mapTo(true),
                catchError(async (error) => {
                    const success = await this.logout().toPromise();
                    if (success) { this.router.navigate(['/auth/login']); }
                    return of(false);
                })
            ).toPromise();
        }
    }

    login(user: { username: string; password: string }): Observable<boolean | HttpErrorResponse> {
        return this.http.post<Tokens>(`${this.apiEndPoint}/auth/login`, user).pipe(
            tap(tokens => this.doLoginUser(tokens)),
            mapTo(true)
        );
    }

    logout(): Observable<boolean> {
        return this.http.post<unknown>(`${this.apiEndPoint}/auth/logout`, {
            'refreshToken': this.getRefreshToken()
        }).pipe(
            tap(() => this.doLogoutUser()),
            mapTo(true),
            catchError(() => {
                return of(false);
            })
        );
    }

    resetPassword(passwords: { oldPassword: string; newPassword: string }): Observable<ResetPasswordResponse> {
        return this.http.post<ResetPasswordResponse>(`${this.apiEndPoint}/auth/reset-password`, passwords);
    }

    recoverPassword(data: { newPassword: string; authenticationToken: string }): Observable<string> {
        return this.http.post<string>(`${this.apiEndPoint}/auth/recovery-password`, data);
    }

    register(data: Record<string, unknown>): Observable<RegisterResponse> {
        return this.http.post<RegisterResponse>(`${this.apiEndPoint}/auth/register`, data);
    }

    get isLoggedIn() {
        return this.loggedIn.asObservable();
    }

    get getBusinessName() {
        return this.businessName.asObservable();
    }

    get getIsAudit() {
        return this.isAudit.asObservable();
    }

    get getIsOnlyAudit() {
        return this.isOnlyAudit.asObservable();
    }

    get getIsProfessionalBothRoles() {
        return this.isProfessionalBothRolesO.asObservable();
    }

    refreshToken(): Observable<Tokens> {
        return this.http.post<Tokens>(`${this.apiEndPoint}/auth/refresh`, {
            'refreshToken': this.getRefreshToken()
        }).pipe(
            tap((tokens: Tokens) => {
                this.storeTokens(tokens);
            })
        );
    }

    getJwtToken() {
        return localStorage.getItem(this.JWT_TOKEN);
    }

    getLoggedUsername(): string {
        const payLoadJwt = this.getDecodeJwt();
        return payLoadJwt?.usrn || '';
    }

    getLoggedUserId(): string {
        const payLoadJwt = this.getDecodeJwt();
        return payLoadJwt?.sub || '';
    }

    getLoggedBusinessName(): string {
        const payLoadJwt = this.getDecodeJwt();
        return payLoadJwt?.bsname || '';
    }

    getLoggedUserEmail(): string | null {
        const payLoadJwt = this.getDecodeJwt();
        return payLoadJwt && payLoadJwt.email ? payLoadJwt.email : null;
    }

    isPharmacistsRole(): boolean {
        const roles: string[] = this.getLoggedRole();
        if (!roles?.length) {
            return false;
        }
        return roles.some((role: string) => role === 'pharmacist');
    }

    isPharmacistsPublicRole(): boolean {
        const roles: string[] = this.getLoggedRole();
        if (!roles?.length) {
            return false;
        }
        return roles.some((role: string) => role === 'pharmacist-public');
    }

    isProfessionalRole(): boolean {
        const roles: string[] = this.getLoggedRole();
        if (!roles?.length) {
            return false;
        }
        return roles.some((role: string) => role === 'professional');
    }

    isProfessionalPublicRole(): boolean {
        const roles: string[] = this.getLoggedRole();
        if (!roles?.length) {
            return false;
        }
        return roles.some((role: string) => role === 'professional-public');
    }

    isProfessionalBothRoles(): boolean {
        return this.isProfessionalRole() && this.isProfessionalPublicRole();
    }

    isAuditRole(): boolean {
        const roles: string[] = this.getLoggedRole();
        if (!roles?.length) {
            return false;
        }
        return roles.some((role: string) => role === 'auditor');
    }

    isOnlyAuditRole(): boolean {
        const roles: string[] = this.getLoggedRole();
        if (!roles?.length) {
            return false;
        }
        return roles.length === 1 && roles[0] === 'auditor';
    }

    isAdminRole(): boolean {
        const roles: string[] = this.getLoggedRole();
        if (!roles?.length) {
            return false;
        }
        return roles.some((role: string) => role === 'admin');
    }
    getLoggedRole(): string[] {
        const payLoadJwt = this.getDecodeJwt();
        return payLoadJwt?.rl || [];
    }

    // Metodo que invoca a la api para realizar el recovering de la password
    setValidationTokenAndNotify(payload: { usuario: string }): Observable<ForgotPasswordResponse> {
        return this.http.post<ForgotPasswordResponse>(`${this.apiEndPoint}/auth/setValidationTokenAndNotify`, payload);
    }

    private getDecodeJwt(): JwtPayload | null {
        if (!!this.getJwtToken()) {
            const token = this.getJwtToken();
            const tokenPayload = decode<JwtPayload>(token as string);
            return tokenPayload;
        }
        return null;
    }

    private doLoginUser(tokens: Tokens) {
        this.storeTokens(tokens);
        this.businessName.next(this.getLoggedBusinessName());
        this.loggedIn.next(this.tokensExists());
        this.isAudit.next(this.isAuditRole());
        this.isOnlyAudit.next(this.isOnlyAuditRole());
    }

    private doLogoutUser() {
        this.prescriptionsService.cleanPrescriptions();
        this.removeTokens();
        this.loggedIn.next(this.tokensExists());
        this.isAudit.next(this.isAuditRole());
        this.isOnlyAudit.next(this.isOnlyAuditRole());
    }

    private getRefreshToken() {
        return localStorage.getItem(this.REFRESH_TOKEN);
    }

    private tokensExists(): boolean {
        return (!!this.getJwtToken() && !!this.getRefreshToken());
    }

    private storeTokens(tokens: Tokens) {
        localStorage.setItem(this.JWT_TOKEN, tokens.jwt);
        localStorage.setItem(this.REFRESH_TOKEN, tokens.refreshToken);
    }

    private removeTokens() {
        localStorage.removeItem(this.JWT_TOKEN);
        localStorage.removeItem(this.REFRESH_TOKEN);
    }
}
