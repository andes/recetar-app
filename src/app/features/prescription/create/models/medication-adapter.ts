import { MedicationItem, DocumentDraft } from './prescription-draft';

// Re-export shared adapter functions
export { toFrequentMedication, fromFrequentMedication } from '@shared/models/medication.types';

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
            const supply = m.supply!;
            const base = {
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

            return {
                supply: {
                    name: supply.nombre,
                    code: { source: 'ALFABETA' as const, value: String(supply.id) },
                    barCode: supply.codigoDeBarras?.[0] || '',
                    activePrinciple: supply.droga_descrip || '',
                    power: supply.potencia || '',
                    firstPresentation: supply.presentacion || '',
                    price: supply.precio,
                    actionDesc: supply.accion_descrip || '',
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
