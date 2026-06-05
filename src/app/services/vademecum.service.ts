import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { VademecumEntry, VademecumDrug, VademecumAction, VademecumStats } from '../interfaces/vademecum';

export interface VademecumPaginatedResponse {
    results: VademecumEntry[];
    total: number;
}

@Injectable({
    providedIn: 'root'
})
export class VademecumService {
    private baseUrl = `${environment.API_END_POINT}/vademecum`;

    constructor(private http: HttpClient) {}

    searchMedications(term: string, offset: number = 0, limit: number = 10): Observable<VademecumPaginatedResponse> {
        return this.http.get<VademecumPaginatedResponse>(`${this.baseUrl}/medications`, {
            params: { q: term, offset: String(offset), limit: String(limit) }
        });
    }

    getMedicationById(id: number): Observable<VademecumEntry | null> {
        return this.http.get<VademecumEntry | null>(`${this.baseUrl}/medications/${id}`);
    }

    searchDrugs(term?: string, limit = 20): Observable<VademecumDrug[]> {
        return this.http.get<VademecumDrug[]>(`${this.baseUrl}/drugs`, {
            params: { ...(term ? { q: term } : {}), limit: String(limit) }
        });
    }

    searchActions(term?: string, limit = 20): Observable<VademecumAction[]> {
        return this.http.get<VademecumAction[]>(`${this.baseUrl}/actions`, {
            params: { ...(term ? { q: term } : {}), limit: String(limit) }
        });
    }

    getStats(): Observable<VademecumStats> {
        return this.http.get<VademecumStats>(`${this.baseUrl}/stats`);
    }
}
