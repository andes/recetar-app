import { Injectable } from '@angular/core';
import { Adapter, asRecord } from './adapter';

export interface PatientContacto {
    tipo: 'fijo' | 'celular' | 'email' | 'extranjero';
    valor: string;
    ranking?: number;
    activo?: boolean;
}

export interface PatientDireccion {
    calle?: string;
    codigoPostal?: string;
    barrio?: string;
    localidad?: string;
    provincia?: string;
    pais?: string;
    ranking?: number;
    activo?: boolean;
    geoReferencia?: number[];
    situacionCalle?: boolean;
}

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
            codigoPuco?: number;
            numeroAfiliado?: string;
        },
        public idMPI?: string,
        public cuil?: string,
        public estado?: string,
    ) { }

    genero?: string;
    contactos?: PatientContacto[];
    direcciones?: PatientDireccion[];
}

@Injectable({
    providedIn: 'root'
})
export class PatientAdapter implements Adapter<Patient> {
    private normalizeSex(sex: unknown): string {
        if (!sex) {
            return sex as string;
        }

        const normalized = sex.toString().toLowerCase();
        return normalized.charAt(0).toUpperCase() + normalized.slice(1);
    }

    private parseDate(value: unknown): Date | undefined {
        if (!value) {
            return undefined;
        }

        if (!(typeof value === 'string' || typeof value === 'number' || value instanceof Date)) {
            return undefined;
        }

        const parsedDate = new Date(value);
        return isNaN(parsedDate.getTime()) ? undefined : parsedDate;
    }

    adapt(item: unknown): Patient {
        const data = asRecord(item);

        const patient = {
            _id: (data['_id'] || data['id']) as string,
            lastName: (data['lastName'] || data['apellido'] || '') as string,
            firstName: (data['firstName'] || data['nombre'] || '') as string,
            sex: this.normalizeSex(data['sex'] || data['sexo']),
            status: (data['status'] || data['estado']) as string,
            estado: (data['estado'] || data['status']) as string,
            dni: (data['dni'] || data['documento']) as string,
            createdAt: this.parseDate(data['createdAt']),
            fechaNac: this.parseDate(data['fechaNac'] || data['fechaNacimiento']),
            nombreAutopercibido: data['nombreAutopercibido'] as string,
            obraSocial: data['obraSocial'] as Patient['obraSocial'],
            idMPI: (data['idMPI'] || data['_id'] || data['id']) as string,
            cuil: data['cuil'] as string,
            genero: data['genero'] as string,
            contactos: Array.isArray(data['contactos']) ? data['contactos'] as PatientContacto[] : [],
            direcciones: Array.isArray(data['direcciones']) ? data['direcciones'] as PatientDireccion[] : [],
        } as Patient;

        return Object.assign(new Patient(
            patient.lastName,
            patient.firstName,
            patient.sex,
            patient.status,
            patient.dni,
            patient.createdAt,
            patient._id,
            patient.fechaNac,
            patient.nombreAutopercibido,
            patient.obraSocial,
            patient.idMPI,
            patient.cuil,
            patient.estado,
        ), patient);
    }
}
