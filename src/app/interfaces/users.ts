import { Direccion } from './organizaciones';
export class User {
    _id: string;
    enrollment: string;
    businessName: string;
    email: string;
    cuil: string;
    username?: string;
    roles?: Array<{ _id: string; role: string }>;
    isActive?: boolean;
    lastLogin?: Date;
    createdAt?: Date;
    updatedAt?: Date;
    profesionGrado?: Array<{
        profesion: string;
        codigoProfesion: string;
        numeroMatricula: string;
    }>;
    efectores?: Array<{ _id: string; nombre: string; direccion: Direccion }>;
}
