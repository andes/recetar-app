import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
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

    getUserById(_id: string): Observable<User> {
        return this.http.get<User>(`${environment.API_END_POINT}/users/${_id}`);
    }

    updateIsActive(_id: string, isActive: boolean): Observable<User> {
        return this.http.post<User>(`${environment.API_END_POINT}/users/update`, { _id: _id, isActive: isActive });
    }

    updateUserEfectores(_id: string, efectores: Array<{ _id?: string; nombre: string; direccion: string }>): Observable<User> {
        return this.http.patch<User>(`${environment.API_END_POINT}/users/update`, { _id: _id, efectores: efectores });
    }

    getUserEfectores(_id: string): Observable<Array<{ _id: string; nombre: string; direccion: string }>> {
        return this.http.get<Array<{ _id: string; nombre: string; direccion: string }>>(`${environment.API_END_POINT}/users/${_id}/efectores`);
    }
}
