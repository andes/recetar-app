import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '@root/environments/environment';

export interface Insumo {
    _id?: string;
    id?: string;
    insumo: string;
    supply?: string;
    name?: string;
    term?: string;
    tipo?: string;
    requiereEspecificacion?: boolean;
    quantity?: number;
    specification?: string;
    description?: string;
    createdAt?: Date;
    updatedAt?: Date;
    createdBy?: any;
}

@Injectable({
    providedIn: 'root'
})
export class StockService {
    private readonly API_URL = `${environment.API_END_POINT}/stock`;

    private insumosSubject = new BehaviorSubject<Insumo[]>([]);
    public insumos$ = this.insumosSubject.asObservable();

    constructor(private http: HttpClient) { }

    /**
     * Obtener todos los insumos
     */
    getAll(): Observable<Insumo[]> {
        return this.http.get<Insumo[]>(this.API_URL).pipe(
            tap(insumos => this.insumosSubject.next(insumos))
        );
    }

    /**
     * Crear un nuevo insumo
     * Body ejemplo: { "supply": "Dispositivo de prueba", "type": "dispositivo", "requiresSpecification": false }
     */
    create(insumo: any): Observable<any> {
        return this.http.post<Insumo>(this.API_URL, insumo).pipe(
            tap(newInsumo => {
                const currentInsumos = this.insumosSubject.value;
                this.insumosSubject.next([newInsumo, ...currentInsumos]);
            })
        );
    }

    /**
     * Eliminar un insumo
     */
    delete(id: string): Observable<any> {
        return this.http.delete(`${this.API_URL}/${id}`).pipe(
            tap(() => {
                const currentInsumos = this.insumosSubject.value;
                const filteredInsumos = currentInsumos.filter(i => i._id !== id);
                this.insumosSubject.next(filteredInsumos);
            })
        );
    }

    /**
     * Buscar insumos usando GET con query parameter
     * Ejemplo: GET /api/stock?query=Dispositivo
     */
    search(query: string): Observable<Insumo[]> {
        const url = `${this.API_URL}/andes/search?insumo=${encodeURIComponent(query)}&tipos=dispositivo,nutricion`;
        return this.http.get<Insumo[]>(url);
    }
}
