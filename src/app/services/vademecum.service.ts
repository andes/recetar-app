import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { VademecumEntry } from '../interfaces/vademecum';

interface VademecumSearchResponse {
    results: VademecumEntry[];
    total: number;
}

@Injectable({
    providedIn: 'root'
})
export class VademecumService {

    constructor(private http: HttpClient) { }

    searchMedications(term: string, limit = 10): Observable<VademecumEntry[]> {
        const params = new HttpParams()
            .set('q', term)
            .set('limit', String(limit));
        return this.http.get<VademecumSearchResponse>(`${environment.API_END_POINT}/vademecum/medications`, { params })
            .pipe(map((res) => res.results || []));
    }
}
