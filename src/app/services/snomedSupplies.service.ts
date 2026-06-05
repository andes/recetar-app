import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import SnomedConcept from '@interfaces/snomedConcept';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

interface RawSnomedConcept {
    conceptId?: string;
    id?: string;
    term?: string;
    nombre?: string;
    fsn?: string;
    semanticTag?: string;
}

interface RawSnomedPaginatedResponse {
    results: RawSnomedConcept[];
    total: number;
}

export interface SnomedPaginatedResponse {
    results: SnomedConcept[];
    total: number;
}

@Injectable({
    providedIn: 'root'
})
export class SnomedSuppliesService {

    constructor(private http: HttpClient) {}

    private normalizeConcept(item: RawSnomedConcept): SnomedConcept {
        return {
            conceptId: item?.conceptId || item?.id || '',
            term: item?.term || item?.nombre || '',
            fsn: item?.fsn || item?.term || item?.nombre || '',
            semanticTag: item?.semanticTag || ''
        };
    }

    get(searchTerm: string, offset: number = 0, limit: number = 10): Observable<SnomedPaginatedResponse> {
        return this.http.get<RawSnomedPaginatedResponse>(
            `${environment.API_END_POINT}/supplies/snomed`,
            { params: { search: searchTerm, offset: String(offset), limit: String(limit) } }
        ).pipe(
            map((res) => ({
                results: (res.results || []).map((c) => this.normalizeConcept(c)),
                total: res.total || 0,
            }))
        );
    }

    getByConceptId(conceptId: string): Observable<SnomedConcept | null> {
        return this.http.get<RawSnomedConcept>(`${environment.API_END_POINT}/supplies/snomed/${conceptId}`).pipe(
            map((item) => this.normalizeConcept(item)),
            catchError(() => of(null))
        );
    }

}
