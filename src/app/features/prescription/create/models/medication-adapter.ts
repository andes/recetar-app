import SnomedConcept from '@interfaces/snomedConcept';
import { MedicationItem, DocumentDraft } from './prescription-draft';

// Re-export shared adapter functions
export { toFrequentMedication, fromFrequentMedication } from '@shared/models/medication.types';

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
    draft: DocumentDraft,
    date: Date,
    professional: { userId: string; businessName: string; profesionGrado?: Array<{ profesion: string; codigoProfesion: string; numeroMatricula: string }> }
): Record<string, unknown> {

    const patient = { ...draft.patient };
    if ((patient as any).obraSocial != null) {
        delete (patient as any).obraSocial;
    }

    return {
        patient,
        professional,
        date,
        supplies: draft.medications.map((m: MedicationItem) => {
            const snomedConcept = buildSnomedConcept(m);
            const base = {
                snomedConcept: snomedConcept || undefined,
                quantity: Number(m.quantity) || 1,
                quantityPresentation: Number(m.packageQuantity) || undefined,
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
                ...(m.obraSocial?.nombre ? { obraSocial: m.obraSocial } : {}),
            };

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
                        price: m.supply.precio,
                        actionDesc: m.supply.accion_descrip || '',
                    },
                    ...base,
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
                ...base,
            };
        }),
    };
}

export function toCertificatePayload(
    draft: DocumentDraft,
    professional: { userId: string; businessName: string }
): Record<string, unknown> {
    const patient = { ...draft.patient };
    if (patient.obraSocial == null) { delete patient.obraSocial; }

    return {
        patient,
        professional,
        certificate: draft.certificateData?.certificate || '',
        startDate: draft.certificateData?.startDate || new Date(),
        cantDias: draft.certificateData?.cantDias || 1,
    };
}

export function toPracticePayload(
    draft: DocumentDraft,
    professional: { userId: string; businessName: string }
): Record<string, unknown> {
    const patient = { ...draft.patient };
    if (patient.obraSocial == null) { delete patient.obraSocial; }

    return {
        patient,
        professional,
        date: new Date(),
        practice: draft.practiceData?.practice || '',
        diagnostic: draft.practiceData?.diagnostic || '',
        indications: draft.practiceData?.indications || '',
    };
}
