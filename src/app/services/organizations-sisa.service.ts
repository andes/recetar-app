import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { Organization, SubOrganization } from '../interfaces/organizations';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class OrganizationsSisaService {

    constructor(private http: HttpClient) { }

    get(name: string): Observable<Organization[]> {
        return this.http.get<Organization[]>(`${environment.API_END_POINT}/users/organizations-sisa?name=${name}`);
    };

    addSisaOrganizacion(codigo: string): Observable<SubOrganization> {
        return this.http.post<any>(`${environment.API_END_POINT}/users/me/organizaciones/sisa`, { codigo }).pipe(
            map(res => res.data)
        );
    }
}
