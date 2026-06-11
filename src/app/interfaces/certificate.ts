import { Injectable } from '@angular/core';
import { Adapter, asRecord } from './adapter';
import { Patient } from '@interfaces/patients';

export class Certificate {
    _id?: string;
    patient: Patient;
    certificate: string;
    startDate: Date;
    cantDias: number;
    createdAt: Date;
    updatedAt: Date;
    status?: string;
    anulateDate?: Date;
    anulateReason?: string;
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

    get endDate(): Date {
        if (!this.startDate || !this.cantDias) {
            return null;
        }
        const endDate = new Date(this.startDate);
        endDate.setDate(endDate.getDate() + this.cantDias - 1);
        endDate.setUTCHours(23, 59, 59, 999);
        return endDate;
    }
}

@Injectable({
    providedIn: 'root'
})
export class CertificateAdapter implements Adapter<Certificate> {
    adapt(item: unknown): Certificate {
        const data = asRecord(item);
        const certificate = new Certificate();
        const cantDias = data['cantDias'];

        certificate._id = data['_id'] as string;
        certificate.patient = data['patient'] as Patient;
        certificate.certificate = data['certificate'] as string;
        certificate.startDate = new Date(data['startDate'] as string | number | Date);
        certificate.cantDias = typeof cantDias === 'number' ? cantDias : Number(cantDias || 0);
        certificate.createdAt = new Date(data['createdAt'] as string | number | Date);
        certificate.updatedAt = new Date(data['updatedAt'] as string | number | Date);
        certificate.status = data['status'] as string;
        certificate.anulateDate = data['anulateDate'] ? new Date(data['anulateDate'] as string | number | Date) : undefined;
        certificate.anulateReason = data['anulateReason'] as string;
        certificate.professional = data['professional'] as Certificate['professional'];

        return certificate;
    }
}
