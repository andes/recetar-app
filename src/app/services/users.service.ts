import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { catchError, map, tap } from 'rxjs/operators';
import { Observable, of } from 'rxjs';
import { User } from '@interfaces/users';

@Injectable({
    providedIn: 'root'
})
export class UserService {

    constructor(
        private http: HttpClient
    ) { }

    getUsers(): Observable<User[]> {
        return this.http.get<User[]>(`${environment.API_END_POINT}/users/index`);
    }

    getUserById(userId: string): Observable<User> {
        return this.http.get<User>(`${environment.API_END_POINT}/users/${userId}`);
    }

    updateIsActive(_id: string, isActive: boolean): Observable<User> {
        return this.http.post<User>(`${environment.API_END_POINT}/users/update`, { _id: _id, isActive: isActive });
    }

    // Unified update method that can handle multiple fields in a single request
    updateUser(_id: string, updateData: {
        email?: string;
        // username?: string;
        // businessName?: string;
        // roles?: Array<{ _id: string; role: string }>;
        // isActive?: boolean;
    }): Observable<User> {
        const payload = { _id, ...updateData };
        return this.http.post<User>(`${environment.API_END_POINT}/users/update`, payload);
    }
}
