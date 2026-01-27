import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { SubOrganizacion } from '@interfaces/organizaciones';
import { User } from '@interfaces/users';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class UserService {

    constructor(
        private http: HttpClient
    ) { }

    getUserById(userId: string): Observable<User> {
        return this.http.get<User>(`${environment.API_END_POINT}/users/${userId}`);
    }

    getUsers(params?: { offset?: number; limit?: number }): Observable<{ users: User[]; total: number; offset: number; limit: number }> {
        const queryParams = params || {};
        return this.http.get<{ users: User[]; total: number; offset: number; limit: number }>(`${environment.API_END_POINT}/users/index`, { params: queryParams });
    }

    searchUsers(searchTerm: string, params?: { offset?: number; limit?: number }): Observable<{ users: User[]; total: number; offset: number; limit: number }> {
        const queryParams = {
            searchTerm,
            ...(params || {})
        };
        return this.http.get<{ users: User[]; total: number; offset: number; limit: number }>(`${environment.API_END_POINT}/users/search`, { params: queryParams });
    }

    createUser(userData: {
        businessName: string;
        email: string;
        username?: string;
        cuil?: string;
        enrollment?: string;
        roles: Array<{ role: string }>;
    }): Observable<User> {
        return this.http.post<User>(`${environment.API_END_POINT}/users/create`, userData);
    }

    // Unified update method that can handle multiple fields in a single request
    updateUser(_id: string, updateData: {
        email?: string;
        username?: string;
        businessName?: string;
        roles?: Array<{ _id: string; role: string }>;
        isActive?: boolean;
    }): Observable<User> {
        const payload = { _id, ...updateData };
        return this.http.post<User>(`${environment.API_END_POINT}/users/update`, payload);
    }

    // Legacy methods for backward compatibility (now using the unified method)
    updateIsActive(_id: string, isActive: boolean): Observable<User> {
        return this.updateUser(_id, { isActive });
    }

    updateUserOrganizaciones(_id: string, organizaciones: SubOrganizacion[]): Observable<User> {
        return this.http.post<User>(`${environment.API_END_POINT}/users/update-own`, { _id, organizaciones });
    }

    requestUpdateUser(userId: string, updateData: { email: string, username?: string }): Observable<any> {
        return this.http.post<any>(`${environment.API_END_POINT}/users/request-update`, { userId, ...updateData });
    }

    confirmUserUpdate(token: string): Observable<any> {
        return this.http.post<any>(`${environment.API_END_POINT}/users/confirm-update`, { token });
    }
}
