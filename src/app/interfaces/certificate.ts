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
    anulateReason?:string;
    professional: {
        userId: string;
        enrollment?: string;
        cuil: string;
        businessName: string;
        profesionGrado?: [{
            profesion:string ,
            codigoProfesion: string ,
            numeroMatricula: string 
        }]
    };

    get endDate(): Date {
        if (!this.startDate || !this.cantDias) {
            return null;
        }
        const endDate = new Date(this.startDate);
        endDate.setDate(endDate.getDate() + this.cantDias - 1); 
        endDate.setHours(23, 59, 59, 999); 
        return endDate;
    }
}
