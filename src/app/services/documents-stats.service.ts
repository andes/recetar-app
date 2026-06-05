import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface DocumentsStats {
    totals: {
        receta: number;
        certificados: number;
        practicas: number;
        insumos: number;
    };
    prescriptions: {
        pendiente: number;
        dispensada: number;
        vencida: number;
    };
    certificates: {
        total: number;
        anulados: number;
    };
    practices: {
        active: number;
        completed: number;
        cancelled: number;
    };
}

@Injectable({
    providedIn: 'root'
})
export class DocumentsStatsService {

    private apiUrl = `${environment.API_END_POINT}/documents`;

    constructor(private http: HttpClient) { }

    getStats(): Observable<DocumentsStats> {
        return this.http.get<DocumentsStats>(`${this.apiUrl}/stats`);
    }
}
