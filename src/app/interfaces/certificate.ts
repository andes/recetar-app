import { Patient } from '@interfaces/patients';

export class Certificates {
    _id: string;
    patient: Patient;
    certificate: string;
    createdAt: Date;
    updatedAt: Date;
    status?: string;
}
