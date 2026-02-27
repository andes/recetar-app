import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { Organizacion } from '../interfaces/organizaciones';
import { Observable } from 'rxjs';


@Injectable({
    providedIn: 'root'
})
export class OrganizacionesAndesService {


    constructor(private http: HttpClient) { }

    get(nombre: string): Observable<Organizacion[]> {
        return this.http.get<Organizacion[]>(`${environment.API_END_POINT}/organizaciones-andes?nombre=${nombre}`);
    };
}
