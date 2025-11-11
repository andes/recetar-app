
export class Practice {
    _id?: string;
    date: Date;
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
    };
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
