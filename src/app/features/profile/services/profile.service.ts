import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { User } from '@interfaces/users';
import { UserService } from '@services/users.service';
import { AuthService } from '@auth/services/auth.service';

@Injectable({
    providedIn: 'root'
})
export class ProfileService {

    constructor(
        private userService: UserService,
        private authService: AuthService
    ) { }

    getCurrentUser(): Observable<User> {
        const userId = this.authService.getLoggedUserId();
        return this.userService.getUserById(userId);
    }

    updateProfile(updateData: { email?: string; username?: string; businessName?: string }): Observable<User> {
        const userId = this.authService.getLoggedUserId();
        return this.userService.updateUser(userId, updateData);
    }

    requestProfileUpdate(updateData: { email: string; username?: string }): Observable<{ status?: string; message?: string }> {
        const userId = this.authService.getLoggedUserId();
        return this.userService.requestUpdateUser(userId, updateData);
    }

    isPharmacist(): boolean {
        return this.authService.isPharmacistsRole();
    }
}
