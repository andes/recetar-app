import { VademecumEntry } from '@interfaces/vademecum';
import SnomedConcept from '@interfaces/snomedConcept';
import {
    FrequentMedication,
    MedicationItem,
    PrescriptionDraft,
    PrescriptionItemResult,
} from './prescription-draft';

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

export function toPrescriptionPayload(draft: PrescriptionDraft, date: Date): Record<string, unknown> {
    return {
        patient: draft.patient,
        date,
        supplies: draft.medications.map((m: MedicationItem) => ({
            supply: {
                name: m.supply?.nombre || m.snomedConcept?.term || '',
                snomedConcept: m.snomedConcept || null,
                ...(m.supply ? {
                    _id: m.supply.id,
                    code: m.supply.troquel,
                } : {}),
            },
            quantity: m.quantity,
            quantityPresentation: String(m.packageQuantity),
            diagnostic: m.diagnostic,
            indication: m.indication,
            duplicate: m.duplicate,
            triplicate: m.triplicate,
            triplicateData: m.triplicate ? {
                serie: m.serie,
                numero: Number(m.numero) || 0,
            } : undefined,
        })),
    };
}
