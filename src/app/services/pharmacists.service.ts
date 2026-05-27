import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface PharmacistLookupParams {
    cuil: string;
    disposicionHabilitacion: string;
}

type QueryParams = Record<string, string | number | boolean>;

export interface PharmacistLookupResult {
    cuil?: string;
    disposicionHabilitacion?: string;
    matriculaDTResponsable?: string;
    vencimientoHabilitacion?: string;
}

@Injectable({
    providedIn: 'root'
})
export class PharmacistsService {

    constructor(private http: HttpClient) { }

    getPharmacistByCuit(params: PharmacistLookupParams): Observable<PharmacistLookupResult[]> {
        const url = `${environment.API_END_POINT}/auth/pharmacies-andes`;
        const queryParams: QueryParams = {
            cuil: params.cuil,
            disposicionHabilitacion: params.disposicionHabilitacion
        };

        return this.http.get<PharmacistLookupResult[]>(url, { params: queryParams });
    };
}
