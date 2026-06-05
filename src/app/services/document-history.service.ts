import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Prescriptions, PrescriptionsAdapter } from '@interfaces/prescriptions';
import { Certificate, CertificateAdapter } from '@interfaces/certificate';
import { Practice, PracticeAdapter } from '@interfaces/practices';

export interface RecentDocumentsResponse {
    prescriptions: Prescriptions[];
    certificates: Certificate[];
    practices: Practice[];
}

function safeMap<T>(items: unknown[], adapter: { adapt: (item: unknown) => T }): T[] {
    const result: T[] = [];
    for (const item of items) {
        try {
            result.push(adapter.adapt(item));
        } catch {
            // skip items that fail to adapt
        }
    }
    return result;
}

@Injectable({
    providedIn: 'root'
})
export class DocumentHistoryService {
    constructor(
        private http: HttpClient,
        private prescriptionsAdapter: PrescriptionsAdapter,
        private certificateAdapter: CertificateAdapter,
        private practiceAdapter: PracticeAdapter,
    ) {}

    getRecentDocuments(professionalId: string, patientDni: string, limit = 10): Observable<RecentDocumentsResponse> {
        return this.http.get<{ prescriptions: unknown[]; certificates: unknown[]; practices: unknown[] }>(
            `${environment.API_END_POINT}/professionals/${professionalId}/patients/${patientDni}/recent-documents?limit=${limit}`
        ).pipe(
            map((response) => ({
                prescriptions: safeMap(response?.prescriptions || [], this.prescriptionsAdapter),
                certificates: safeMap(response?.certificates || [], this.certificateAdapter),
                practices: safeMap(response?.practices || [], this.practiceAdapter),
            })),
            catchError(() => of({ prescriptions: [], certificates: [], practices: [] }))
        );
    }
}
