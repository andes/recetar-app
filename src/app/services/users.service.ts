import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { SubOrganizacion } from '@interfaces/organizaciones';
import { User, UserAdapter } from '@interfaces/users';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

interface UserUpdateRequestResponse {
    status?: string;
    message?: string;
    msg?: string;
}

@Injectable({
    providedIn: 'root'
})
export class UserService {

    constructor(
        private http: HttpClient,
        private userAdapter: UserAdapter
    ) { }

    getUserById(userId: string): Observable<User> {
        return this.http.get<User>(`${environment.API_END_POINT}/users/${userId}`).pipe(
            map((user) => this.userAdapter.adapt(user))
        );
    }

    getUsers(params?: { offset?: number; limit?: number }): Observable<{ items: User[]; total: number; offset: number; limit: number }> {
        const queryParams = params || {};
        return this.http.get<{ items: User[]; total: number; offset: number; limit: number }>(`${environment.API_END_POINT}/users`, { params: queryParams }).pipe(
            map((response) => ({
                ...response,
                items: response.items.map((user) => this.userAdapter.adapt(user))
            }))
        );
    }

    searchUsers(searchTerm: string, params?: { offset?: number; limit?: number }): Observable<{ items: User[]; total: number; offset: number; limit: number }> {
        const queryParams = {
            searchTerm,
            ...(params || {})
        };
        return this.http.get<{ items: User[]; total: number; offset: number; limit: number }>(`${environment.API_END_POINT}/users`, { params: queryParams }).pipe(
            map((response) => ({
                ...response,
                items: response.items.map((user) => this.userAdapter.adapt(user))
            }))
        );
    }

    createUser(userData: {
        businessName: string;
        email: string;
        username?: string;
        cuil?: string;
        enrollment?: string;
        roles: Array<{ role: string }>;
    }): Observable<User> {
        return this.http.post<User>(`${environment.API_END_POINT}/users`, userData).pipe(
            map((user) => this.userAdapter.adapt(user))
        );
    }

    updateUser(id: string, updateData: {
        email?: string;
        username?: string;
        businessName?: string;
        roles?: Array<{ _id: string; role: string }>;
        isActive?: boolean;
    }): Observable<User> {
        return this.http.patch<User>(`${environment.API_END_POINT}/users/${id}`, updateData).pipe(
            map((user) => this.userAdapter.adapt(user))
        );
    }

    updateIsActive(id: string, isActive: boolean): Observable<User> {
        return this.updateUser(id, { isActive });
    }

    updateUserOrganizaciones(_id: string, organizaciones: SubOrganizacion[]): Observable<User> {
        return this.http.patch<User>(`${environment.API_END_POINT}/users/me/organizaciones`, { organizaciones }).pipe(
            map((user) => this.userAdapter.adapt(user))
        );
    }

    requestUpdateUser(userId: string, updateData: { email: string, username?: string }): Observable<UserUpdateRequestResponse> {
        return this.http.post<UserUpdateRequestResponse>(`${environment.API_END_POINT}/users/request-email-update`, { userId, ...updateData });
    }

    confirmUserUpdate(token: string): Observable<UserUpdateRequestResponse> {
        return this.http.post<UserUpdateRequestResponse>(`${environment.API_END_POINT}/users/confirm-email-update`, { token });
    }
}
