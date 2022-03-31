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

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly JWT_TOKEN = 'JWT_TOKEN';
  private readonly REFRESH_TOKEN = 'REFRESH_TOKEN';
  private readonly apiEndPoint = environment.API_END_POINT;
  private loggedIn: BehaviorSubject<boolean>;
  private businessName: BehaviorSubject<string>;


  constructor(
    private http: HttpClient,
    private router: Router,
    private prescriptionsService: PrescriptionsService) {

    this.loggedIn = new BehaviorSubject<boolean>(this.tokensExists());
    this.businessName = new BehaviorSubject<string>(this.getLoggedBusinessName());
  }



  async load(): Promise<void> {
    if (this.tokensExists()) {
      const resp = await this.http.get<any>(`${this.apiEndPoint}/auth/jwt-login`).pipe(
        tap(tokens => this.doLoginUser(tokens)),
        mapTo(true),
        catchError(async (error) => {
          const success = await this.logout().toPromise();
          if (success) this.router.navigate(['/auth/login']);
          return of(false);
        })
      ).toPromise();
    }
  }

  login(user: { username: string, password: string }): Observable<boolean | HttpErrorResponse> {
    return this.http.post<any>(`${this.apiEndPoint}/auth/login`, user).pipe(
      tap(tokens => this.doLoginUser(tokens)),
      mapTo(true)
    );
  }

  logout() {
    return this.http.post<any>(`${this.apiEndPoint}/auth/logout`, {
      'refreshToken': this.getRefreshToken()
    }).pipe(
      tap(() => this.doLogoutUser()),
      mapTo(true),
      catchError(error => {
        console.log(error.error);
        return of(false);
      })
    );
  }

  resetPassword(passwords: { oldPassword: string, newPassword: string }) {
    return this.http.post<any>(`${this.apiEndPoint}/auth/reset-password`, passwords);
  }

  recoverPassword(data) {
    return this.http.post<any>(`${this.apiEndPoint}/auth/recovery-password`, data);
  }

  register(data) {
    return this.http.post<any>(`${this.apiEndPoint}/auth/register`, data);
  }

  get isLoggedIn() {
    return this.loggedIn.asObservable();
  }

  get getBusinessName() {
    return this.businessName.asObservable();
  }

  refreshToken() {
    return this.http.post<any>(`${this.apiEndPoint}/auth/refresh`, {
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
    const payLoadJwt: any = this.getDecodeJwt();
    return payLoadJwt.usrn;
  }

  getLoggedUserId(): string {
    const payLoadJwt: any = this.getDecodeJwt();
    return payLoadJwt.sub;
  }

  getLoggedBusinessName(): string {
    const payLoadJwt: any = this.getDecodeJwt();
    return payLoadJwt.bsname;
  }

  isPharmacistsRole(): boolean {
    const roles: string[] = this.getLoggedRole();
    return roles.some((role: string) => role === 'pharmacist');
    // return this.getLoggedRole() === 'pharmacist';
  }

  isProfessionalRole(): boolean {
    const roles: string[] = this.getLoggedRole();
    return roles.some((role: string) => role === 'professional');
  }

  isAdminRole(): boolean {
    const roles: string[] = this.getLoggedRole();
    return roles.some((role: string) => role === 'admin');
  }
  getLoggedRole(): string[] {
    const payLoadJwt: any = this.getDecodeJwt();
    return payLoadJwt.rl;
  }

  // Metodo que invoca a la api para realizar el recovering de la password
  setValidationTokenAndNotify(usuario: Number): Observable<any> {
    return this.http.post<any>(`${this.apiEndPoint}/auth/setValidationTokenAndNotify`, usuario);
  }

  private getDecodeJwt() {
    if (!!this.getJwtToken()) {
      const token = this.getJwtToken();
      const tokenPayload = decode(token);
      return tokenPayload;
    }
    return false;
  }

  private doLoginUser(tokens: Tokens) {
    this.storeTokens(tokens);
    this.businessName.next(this.getLoggedBusinessName());
    this.loggedIn.next(this.tokensExists());
  }

  private doLogoutUser() {
    this.prescriptionsService.cleanPrescriptions();
    this.removeTokens();
    this.loggedIn.next(this.tokensExists());
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




