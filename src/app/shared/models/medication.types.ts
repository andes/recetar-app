import { VademecumEntry } from '@interfaces/vademecum';
import SnomedConcept from '@interfaces/snomedConcept';

export interface MedicationItem {
    supply?: VademecumEntry;
    snomedConcept?: SnomedConcept;
    quantity: number;
    packageQuantity: number;
    diagnostic: string;
    indication: string;
    duplicate: boolean;
    triplicate: boolean;
    serie: string;
    numero: string;
    obraSocial?: {
        nombre?: string;
        codigoPuco?: string;
        numeroAfiliado?: string;
    };
}

export type PrescriptionItemResult =
    | { kind: 'commercial'; entry: VademecumEntry }
    | { kind: 'generic'; concept: SnomedConcept };

export interface FrequentMedication {
    id: string;
    kind: 'commercial' | 'generic';
    name: string;
    presentation: string;
    price: number;
    actionDesc: string;
    supplyId?: number;
    code?: string;
    snomedConcept?: SnomedConcept;
}

export function toFrequentMedication(result: PrescriptionItemResult): FrequentMedication {
    if (result.kind === 'commercial') {
        const e = result.entry;
        return {
            id: `vad:${e.id}`,
            kind: 'commercial',
            name: e.nombre,
            presentation: e.presentacion,
            price: e.precio,
            actionDesc: e.accion_descrip,
            supplyId: e.id,
            code: e.troquel,
        };
    }
    const c = result.concept;
    return {
        id: `sno:${c.conceptId}`,
        kind: 'generic',
        name: c.term,
        presentation: c.fsn,
        price: 0,
        actionDesc: c.semanticTag,
        snomedConcept: c,
    };
}

export function fromFrequentMedication(med: FrequentMedication): PrescriptionItemResult {
    if (med.kind === 'generic') {
        return {
            kind: 'generic',
            concept: med.snomedConcept!,
        };
    }
    return {
        kind: 'commercial',
        entry: {
            id: med.supplyId!,
            nombre: med.name,
            presentacion: med.presentation,
            precio: med.price,
            troquel: med.code || '',
            accion_descrip: med.actionDesc,
            snomed: '',
            droga_descrip: '',
        } as VademecumEntry,
    };
}
