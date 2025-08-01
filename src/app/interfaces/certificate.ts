import { Patient } from '@interfaces/patients';

export class Certificate {
    _id?: string;
    patient: Patient;
    certificate: string;
    startDate: Date;
    endDate: Date;
    createdAt: Date;
    updatedAt: Date;
    status?: string;
}
