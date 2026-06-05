import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { environment } from '@root/environments/environment';
import { SupplyAdapter } from '@interfaces/supplies';

export interface Insumo {
    _id?: string;
    id?: string;
    insumo: string;
    supply?: string;
    name?: string;
    term?: string;
    type?: string;
    tipo?: string;
    requiresSpecification?: boolean;
    requiereEspecificacion?: boolean;
    quantity?: number;
    specification?: string;
    description?: string;
    code?: Array<{ source?: string; value?: string; id?: string }>;
    codigo?: Array<{ fuente?: string; valor?: string; id?: string; source?: string; value?: string }>;
    status?: string;
    estado?: string;
    snomedConcept?: { conceptId?: string; term?: string; fsn?: string; semanticTag?: string };
    concepto?: { conceptId?: string; term?: string; fsn?: string; semanticTag?: string };
    createdAt?: Date;
    updatedAt?: Date;
    createdBy?: { nombre?: string; apellido?: string;[key: string]: unknown };
}

export const TIPO_INSUMO_DICT: { [key: string]: string } = {
    nutrition: 'Nutrición',
    nutricion: 'Nutrición',
    device: 'Dispositivo',
    dispositivo: 'Dispositivo',
    magistral: 'Magistral',
};

export function formatTipoInsumo(type: string | undefined): string {
    if (!type) {
        return 'Sin definir';
    }
    const t = TIPO_INSUMO_DICT[type.toLowerCase()];
    if (t) {
        return t;
    }
    return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
}

@Injectable({
    providedIn: 'root'
})
export class StockService {
    private readonly API_URL = `${environment.API_END_POINT}/stock`;

    private insumosSubject = new BehaviorSubject<Insumo[]>([]);
    public insumos$ = this.insumosSubject.asObservable();

    constructor(private http: HttpClient, private supplyAdapter: SupplyAdapter) { }

    private normalizeToInsumo(item: unknown): Insumo {
        const sourceItem = item as Partial<Insumo> & { [key: string]: unknown };
        const adaptedSupply = this.supplyAdapter.adapt(item);
        const normalizedType = adaptedSupply.type === 'nutrition'
            ? 'nutricion'
            : (adaptedSupply.type === 'device' ? 'dispositivo' : ((sourceItem.tipo as string) || adaptedSupply.type));

        return {
            _id: adaptedSupply._id || sourceItem._id || sourceItem.id,
            id: sourceItem.id,
            insumo: sourceItem.insumo || sourceItem.supply || adaptedSupply.name,
            supply: sourceItem.supply || adaptedSupply.name,
            name: adaptedSupply.name,
            term: sourceItem.term || adaptedSupply.name,
            type: adaptedSupply.type,
            tipo: normalizedType,
            requiresSpecification: adaptedSupply.requiresSpecification,
            requiereEspecificacion: sourceItem.requiereEspecificacion ?? adaptedSupply.requiresSpecification,
            quantity: typeof sourceItem.quantity === 'number' ? sourceItem.quantity : Number(sourceItem.quantity || 0),
            specification: sourceItem.specification,
            description: sourceItem.description,
            code: sourceItem.code,
            codigo: sourceItem.codigo,
            status: sourceItem.status,
            estado: sourceItem.estado,
            snomedConcept: adaptedSupply.snomedConcept || sourceItem.snomedConcept,
            concepto: sourceItem.concepto,
            createdAt: sourceItem.createdAt ? new Date(sourceItem.createdAt) : undefined,
            updatedAt: sourceItem.updatedAt ? new Date(sourceItem.updatedAt) : undefined,
            createdBy: sourceItem.createdBy as { nombre?: string; apellido?: string;[key: string]: unknown }
        };
    }

    /**
     * Obtener todos los insumos
     */
    getAll(): Observable<Insumo[]> {
        return this.http.get<Insumo[]>(this.API_URL).pipe(
            map((insumos) => insumos.map((insumo) => this.normalizeToInsumo(insumo))),
            tap(insumos => this.insumosSubject.next(insumos))
        );
    }

    /**
     * Crear un nuevo insumo
     * Body ejemplo: { "supply": "Dispositivo de prueba", "type": "dispositivo", "requiresSpecification": false }
     */
    create(insumo: Partial<Insumo>): Observable<Insumo> {
        return this.http.post<Insumo>(this.API_URL, insumo).pipe(
            map((newInsumo) => this.normalizeToInsumo(newInsumo)),
            tap(newInsumo => {
                const currentInsumos = this.insumosSubject.value;
                this.insumosSubject.next([newInsumo, ...currentInsumos]);
            })
        );
    }

    /**
     * Eliminar un insumo
     */
    delete(id: string): Observable<void> {
        return this.http.delete<void>(`${this.API_URL}/${id}`).pipe(
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
        const url = `${this.API_URL}/andes?insumo=${encodeURIComponent(query)}&tipos=dispositivo,nutricion`;
        return this.http.get<Insumo[]>(url).pipe(
            map((insumos) => insumos.map((insumo) => this.normalizeToInsumo(insumo)))
        );
    }
}
