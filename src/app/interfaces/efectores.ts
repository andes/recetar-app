import { Direccion } from './organizaciones';

export interface Efector {
    _id?: string;
    nombre: string;
    direccion: Direccion;
}
