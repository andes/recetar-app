import { Injectable } from '@angular/core';
import { Adapter, asRecord } from './adapter';
import SnomedConcept from './snomedConcept';

export default interface Supplies {
    _id: string;
    name: string;
    quantity?: string;
    code?: string;
    status?: 'activo' | 'inactivo';
    type?: 'device' | 'nutrition' | string;
    requiresSpecification?: boolean;
    specification?: string;
    snomedConcept?: SnomedConcept;
    supply?: unknown;
}

@Injectable({
    providedIn: 'root'
})
export class SupplyAdapter implements Adapter<Supplies> {
    adapt(item: unknown): Supplies {
        const data = asRecord(item);
        const normalizedType = (data['type'] || data['tipo'] || '').toString().toLowerCase();

        return {
            _id: (data['_id'] || data['id']) as string,
            name: (data['name'] || data['term'] || data['supply'] || data['insumo'] || '') as string,
            quantity: data['quantity'] as string,
            code: data['code'] as string,
            status: data['status'] as Supplies['status'],
            type: normalizedType === 'nutricion' ? 'nutrition' : (normalizedType === 'dispositivo' ? 'device' : (data['type'] || data['tipo']) as string),
            requiresSpecification: (data['requiresSpecification'] ?? data['requiereEspecificacion']) as boolean,
            specification: data['specification'] as string,
            snomedConcept: data['snomedConcept'] as SnomedConcept,
            supply: data['supply']
        };
    }
}
