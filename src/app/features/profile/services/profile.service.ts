import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { User } from '@interfaces/users';
import { ProfessionalProfile } from '@interfaces/professionals';
import { UserService } from '@services/users.service';
import { AuthService } from '@auth/services/auth.service';
import { environment } from '../../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class ProfileService {

    constructor(
        private userService: UserService,
        private authService: AuthService,
        private http: HttpClient
    ) { }

    getCurrentUser(): Observable<User> {
        const userId = this.authService.getLoggedUserId();
        return this.userService.getUserById(userId);
    }

    getProfessionalProfile(): Observable<ProfessionalProfile> {
        return this.http.get<ProfessionalProfile>(`${environment.API_END_POINT}/professionals/me`);
    }

    updateProfile(updateData: { email?: string; username?: string; businessName?: string; cuil?: string }): Observable<User> {
        return this.userService.updateCurrentUser(updateData);
    }

    requestProfileUpdate(updateData: { email: string; username?: string }): Observable<{ status?: string; message?: string }> {
        const userId = this.authService.getLoggedUserId();
        return this.userService.requestUpdateUser(userId, updateData);
    }

    isPharmacist(): boolean {
        return this.authService.isPharmacistsRole();
    }
}
