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

function buildSnomedConcept(m: MedicationItem): SnomedConcept | null {
    if (m.snomedConcept) { return m.snomedConcept; }
    if (m.supply?.snomed) {
        return {
            conceptId: m.supply.snomed,
            term: m.supply.droga_descrip || m.supply.nombre || '',
            fsn: m.supply.droga_descrip || m.supply.nombre || '',
            semanticTag: 'producto',
        };
    }
    return null;
}

export function toPrescriptionPayload(
    draft: PrescriptionDraft,
    date: Date,
    professional: { userId: string; businessName: string }
): Record<string, unknown> {

    const patient = { ...draft.patient };
    if (patient.obraSocial == null) {
        delete patient.obraSocial;
    }

    return {
        patient,
        professional,
        date,
        supplies: draft.medications.map((m: MedicationItem) => {
            const snomedConcept = buildSnomedConcept(m);

            if (m.supply) {
                return {
                    supply: {
                        name: m.supply.nombre,
                        ...(snomedConcept ? { snomedConcept } : {}),
                        code: { source: 'ALFABETA' as const, value: String(m.supply.id) },
                        barCode: m.supply.codigoDeBarras?.[0] || '',
                        activePrinciple: m.supply.droga_descrip || '',
                        power: m.supply.potencia || '',
                        firstPresentation: m.supply.presentacion || '',
                    },
                    quantity: m.quantity,
                    quantityPresentation: m.packageQuantity,
                    diagnostic: m.diagnostic,
                    indication: m.indication,
                    duplicate: m.duplicate,
                    triplicate: m.triplicate,
                    ...(m.triplicate
                        ? {
                              triplicateData: {
                                  serie: m.serie,
                                  numero: Number(m.numero) || 0,
                              },
                          }
                        : {}),
                };
            }

            return {
                supply: {
                    name: m.snomedConcept!.term,
                    snomedConcept: {
                        conceptId: m.snomedConcept!.conceptId,
                        term: m.snomedConcept!.term,
                        fsn: m.snomedConcept!.fsn,
                        semanticTag: m.snomedConcept!.semanticTag,
                    },
                },
                quantity: m.quantity,
                quantityPresentation: m.packageQuantity,
                diagnostic: m.diagnostic,
                indication: m.indication,
                duplicate: m.duplicate,
                triplicate: m.triplicate,
                ...(m.triplicate
                    ? {
                          triplicateData: {
                              serie: m.serie,
                              numero: Number(m.numero) || 0,
                          },
                      }
                    : {}),
            };
        }),
    };
}
