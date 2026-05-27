
import { Injectable } from '@angular/core';
import { Adapter, asRecord } from './adapter';

export class Practice {
    _id?: string;
    date: Date;
    observations?: string;
    patient: {
        dni: string;
        sex: string;
        lastName: string;
        firstName: string;
        nombreAutopercibido?: string;
        otraOS?: boolean;
        obraSocial?: {
            nombre: string;
            codigoPuco: string;
            numeroAfiliado: string;
        };
    };
    professional: {
        userId: string;
        enrollment?: string;
        cuil: string;
        businessName: string;
        profesionGrado?: [{
            profesion: string;
            codigoProfesion: string;
            numeroMatricula: string;
        }];
    };
    practice: string;
    diagnostic: string;
    indications: string;
    createdAt?: Date;
    updatedAt?: Date;
    status?: 'active' | 'completed' | 'cancelled';

    constructor(
        date: Date,
        patient: {
            dni: string;
            sex: string;
            lastName: string;
            firstName: string;
            otraOS?: boolean;
            obraSocial?: {
                nombre: string;
                codigoPuco: string;
                numeroAfiliado: string;
            };
        },
        professional: {
            userId: string;
            enrollment: string;
            cuil: string;
            businessName: string;
        },
        practice: string,
        diagnostic: string,
        indications: string,
        _id?: string,
        createdAt?: Date,
        updatedAt?: Date,
        status?: 'active' | 'completed' | 'cancelled'
    ) {
        this.date = date;
        this.patient = patient;
        this.professional = professional;
        this.practice = practice;
        this.diagnostic = diagnostic;
        this.indications = indications;
        this._id = _id;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.status = status || 'active';
    }
}

@Injectable({
    providedIn: 'root'
})
export class PracticeAdapter implements Adapter<Practice> {
    adapt(item: unknown): Practice {
        const data = asRecord(item);

        return {
            _id: data['_id'] as string,
            date: new Date(data['date'] as string | number | Date),
            observations: data['observations'] as string,
            patient: data['patient'] as Practice['patient'],
            professional: data['professional'] as Practice['professional'],
            practice: data['practice'] as string,
            diagnostic: data['diagnostic'] as string,
            indications: data['indications'] as string,
            createdAt: data['createdAt'] ? new Date(data['createdAt'] as string | number | Date) : undefined,
            updatedAt: data['updatedAt'] ? new Date(data['updatedAt'] as string | number | Date) : undefined,
            status: data['status'] as Practice['status']
        } as Practice;
    }
}
