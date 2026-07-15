import { Patient } from '@interfaces/patients';
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
}

export interface PrescriptionDraft {
    patient: Patient | null;
    medications: MedicationItem[];
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

export interface FrequentPatient {
    id: string;
    firstName: string;
    lastName: string;
    initials: string;
    insurance: string;
    dni: string;
    sex: string;
    fechaNac: string;
    nombreAutopercibido: string;
}
