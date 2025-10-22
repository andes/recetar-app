import { Injectable } from '@angular/core';
import { Adapter } from './adapter';

export class Patient {
    constructor(
        public lastName: string,
        public firstName: string,
        public sex: string,
        public status?: string,
        public dni?: string,
        public createdAt?: Date,
        public _id?: string,
        public fechaNac?: Date,
        public nombreAutopercibido?: string,
        public obraSocial?: {
            _id?: string;
            nombre?: string;
            codigoPuco?: string;
            numeroAfiliado?: string;
        },
        public idMPI?: string,
        public cuil?: string,
    ) { }
}

@Injectable({
    providedIn: 'root'
})
export class PatientAdapter implements Adapter<Patient> {
    adapt(item: any): Patient {
        return new Patient(
            item.apellido,
            item.nombre,
            item.sexo[0].toUpperCase() + item.sexo.substr(1).toLowerCase(),
            item.estado,
            item.documento,
            new Date()
        );
    }
}
