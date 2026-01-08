import Supply from '@interfaces/supplies';
import { Patient } from '@interfaces/patients';
import AndesPrescriptions from './andesPrescriptions';

// Interfaz para la respuesta mixta de prescripciones
export interface PrescriptionsResponse {
    prescriptions: (Prescriptions | AndesPrescriptions)[];
    total: number;
    offset: number;
    limit: number;
    sources?: {
        local: number;
        andes: number;
    };
}

export class Prescriptions {
    _id: string;
    prescriptionId?: string;
    patient: Patient;
    professional: {
        userId: string;
        enrollment: string;
        cuil: string;
        businessName: string;
        profesionGrado: [{
            profesion:string ,
            codigoProfesion: string ,
            numeroMatricula: string 
        }]
    };
    dispensedBy?: {
        userId: string;
        cuil: string;
        businessName: string;
    };
    dispensedAt?: Date;
    supplies: Array<{
        supply: Supply;
        quantity: number;
        quantityPresentation?: string;
        diagnostic?: string;
        indication?: string;
        duplicate?: boolean;
        triplicate?: boolean;
        triplicateData?: {
            serie: string;
            numero: number;
        };
    }>;
    status: string;
    date: Date;

    diagnostic?: string;
    observation?: string;
    createdAt?: Date;
    updatedAt?: Date;
    triple?: boolean;
    triplicado?: boolean;
}
