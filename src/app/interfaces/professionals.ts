import { Injectable } from '@angular/core';
import { Adapter, asRecord } from './adapter';

export class Professionals {
    constructor(
        public andes_id: string,
        public first_name: string,
        public sex: string,
        public last_name: string,
        public dni: string,
        public nationality: string,
        public enrollment: string,
        public createdAt: Date
    ) {}
    public _id: number;

    public getEnrollmentAndFullname(): String {
        return `${this.enrollment} ${this.last_name} ${this.first_name}`;
    };
}

@Injectable({
    providedIn: 'root'
})
export class ProfessionalsAdapter implements Adapter<Professionals> {
    adapt(item: unknown): Professionals {
        const data = asRecord(item);
        const professions = data['profesiones'] as Array<{ matriculacion?: Array<{ matriculaNumero?: string }> }>;
        const enrollment = professions?.[0]?.matriculacion?.[0]?.matriculaNumero || '';

        return new Professionals(
            data['id'] as string,
            data['nombre'] as string,
            data['sexo'] as string,
            data['apellido'] as string,
            data['documento'] as string,
            data['nacionalidad'] as string,
            enrollment,
            new Date(data['created'] as string | number | Date)
        );
    }
}
