import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { Organization } from '../interfaces/organizations';
import { Observable } from 'rxjs';


@Injectable({
    providedIn: 'root'
})
export class OrganizationsAndesService {


    constructor(private http: HttpClient) { }

    get(nombre: string): Observable<Organization[]> {
        return this.http.get<Organization[]>(`${environment.API_END_POINT}/users/organizaciones-andes?nombre=${nombre}`);
    };
}
