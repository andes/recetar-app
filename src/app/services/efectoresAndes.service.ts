import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { Organizacion } from '../interfaces/organizaciones';
import { Observable, BehaviorSubject } from 'rxjs';


@Injectable({
    providedIn: 'root'
})
export class EfectoresAndesService {


    constructor(private http: HttpClient) { }

    get(nombre: string): Observable<any[]> {
        return this.http.get<any[]>(`${environment.API_END_POINT}/efectores-andes?nombre=${nombre}`);
    };
}
