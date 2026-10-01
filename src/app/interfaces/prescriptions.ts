import { Injectable } from '@angular/core';
import { Adapter, asRecord } from './adapter';
import Supply from '@interfaces/supplies';
import { Patient } from '@interfaces/patients';
import AndesPrescriptions from './andesPrescriptions';

// Datos de la farmacia/usuario farmacéutico que dispensó
export interface DispenserInfo {
    _id?: string;
    businessName?: string;
    cuil?: string;
    username?: string;
    email?: string;
}

// Interfaz para la respuesta mixta de prescripciones
export interface PrescriptionsResponse {
    prescriptions: (Prescriptions | AndesPrescriptions)[];
    total: number;
    offset: number;
    limit: number;
    dispenser?: DispenserInfo | null;
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
            profesion: string;
            codigoProfesion: string;
            numeroMatricula: string;
        }];
    };
    organizacion?: {
        _id: string;
        nombre: string;
        direccion: string;
    };
    dispensedBy?: {
        userId: string;
        cuil: string;
        businessName: string;
    };
    dispensedAt?: Date;
    replacedMedication?: {
        name?: string;
        quantity?: number;
        supply?: Supply;
    };
    supplies: Array<{
        supply: Supply;
        quantity: number;
        quantityPresentation?: string;
        diagnostic?: string;
        indication?: string;
        description?: string;
        duplicate?: boolean;
        triplicate?: boolean;
        triplicateData?: {
            serie: string;
            numero: number;
        };
        obraSocial?: {
            nombre?: string;
            codigoPuco?: number;
            numeroAfiliado?: string;
        };
    }>;
    status: string;
    date: Date;
    diagnostic?: string;
    observation?: string;
    ambito?: 'publico' | 'privado';
    tratamientoProlongado?: number;
    treatmentGroupId?: string;
    ordenTratamiento?: number;
    estadoActual?: { tipo?: string; fecha?: Date | string };
    estados?: Array<{ tipo?: string; fecha?: Date | string; motivo?: string; observacion?: string }>;
    estadoPublicacion?: 'ok' | 'pendiente' | 'error' | 'no_aplicable' | 'desconocido';
    trimestral?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
    triple?: boolean;
    triplicado?: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class PrescriptionsAdapter implements Adapter<Prescriptions> {
    adapt(item: unknown): Prescriptions {
        const data = asRecord(item);

        return {
            _id: data['_id'] as string,
            prescriptionId: data['prescriptionId'] as string,
            patient: data['patient'] as Patient,
            professional: data['professional'] as Prescriptions['professional'],
            organizacion: data['organizacion'] as Prescriptions['organizacion'],
            dispensedBy: data['dispensedBy'] as Prescriptions['dispensedBy'],
            dispensedAt: data['dispensedAt'] ? new Date(data['dispensedAt'] as string | number | Date) : undefined,
            replacedMedication: data['replacedMedication'] as Prescriptions['replacedMedication'],
            supplies: (data['supplies'] as Prescriptions['supplies']) || [],
            status: data['status'] as string,
            date: new Date(data['date'] as string | number | Date),
            diagnostic: data['diagnostic'] as string,
            observation: data['observation'] as string,
            ambito: data['ambito'] as Prescriptions['ambito'],
            tratamientoProlongado: (data['tratamientoProlongado'] as number) ?? (data['trimestral'] ? 3 : undefined),
            treatmentGroupId: data['treatmentGroupId'] as string,
            ordenTratamiento: data['ordenTratamiento'] as number,
            estadoActual: data['estadoActual'] as Prescriptions['estadoActual'],
            estados: data['estados'] as Prescriptions['estados'],
            estadoPublicacion: data['estadoPublicacion'] as Prescriptions['estadoPublicacion'],
            trimestral: data['trimestral'] as boolean,
            createdAt: data['createdAt'] ? new Date(data['createdAt'] as string | number | Date) : undefined,
            updatedAt: data['updatedAt'] ? new Date(data['updatedAt'] as string | number | Date) : undefined,
            triple: data['triple'] as boolean,
            triplicado: data['triplicado'] as boolean
        } as Prescriptions;
    }
}
