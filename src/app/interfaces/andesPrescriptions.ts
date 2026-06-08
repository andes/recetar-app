import { Injectable } from '@angular/core';
import { Adapter, asRecord } from './adapter';
import SnomedConcept from './snomedConcept';

export class Medicamento {
    cantidad: number;
    descripcion: string;
    medicamento: unknown;
    presentacion: string;
    unidades: string;
    cantidadEnvases: number;
    observacion?: {
        type: string;
    };
}

export class Dispensa {
    descripcion: string;
    cantidad: number;
    medicamento: Medicamento[];
    presentacion: string;
    unidades: string;
    cantidadEnvases: number;
    organizacion: {
        id: string;
        nombre: string;
    };
}
export default class AndesPrescriptions {
    _id: string;
    idAndes: string;
    idReceta?: string;
    organizacion: {
        id: string;
        nombre: string;
        direccion: string;// ver si es necesario
    };
    profesional: {
        id: string;
        nombre: string;
        apellido: string;
        documento: string;
        profesion: string;
        especialidad: string;
        matricula: number;
    };
    diagnostico: {
        descripcion?: string;
        term?: string;
        fsn?: string;
        conceptId?: string;
        semanticTag?: string;
    };
    fechaRegistro: Date;
    fechaPrestacion: Date;
    idPrestacion: string;
    idRegistro: string;
    medicamento: {
        concepto: {
            conceptId: string;
            term: string;
            fsn: string;
            semanticTag: string;
        };
        dosisDiaria: {
            dosis: string;
            intervalo: {
                id: string;
                key: string;
                nombre: string;
                source: string;
                type: string;
            };
            dias: number;
            notaMedica: string;
        };
        presentacion: string;
        unidades: string;
        cantidad: number;
        cantEnvases: number;
        tratamientoProlongado: Boolean;
        tiempoTratamiento: unknown;
        tipoReceta: 'simple' | 'duplicado' | 'triplicado';
    };
    dispensa: Dispensa[];
    estados: [
        {
            id: string;
            tipo: 'vigente' | 'finalizada' | 'vencida' | 'suspendida' | 'rechazada';
            createdAt: Date;
            createdBy: {
                nombre: string;
                apellido: string;
                organizacion: {
                    nombre: string;
                };
            };
        }
    ];
    estadosDispensa: [
        {
            id: string;
            tipo: 'sin dispensa' | 'dispensada' | 'dispensa-parcial';
            fecha: Date;
            sistema?: 'sifaho' | 'recetar';
        }
    ];
    appNotificada: [
        {
            id: string;
            fecha: Date;
        }
    ];
    estadoActual: {
        id: string;
        tipo: string;
        createdAt: Date;
        createdBy: {
            nombre: string;
            apellido: string;
            organizacion: {
                nombre: string;
            };
        };

    };
    estadoDispensaActual: {
        tipo: string;
        fecha: Date;
        id: string;
    };
    paciente: {
        carpetaOrganizaciones: [];
        id: string;
        nombre: string;
        apellido: string;
        documento: string;
        sexo: string;
        fechaNacimiento: Date;
        obraSocial: {
            codigoPuco: number;
            nombre: string;
            financiador?: string;
            origen?: string;
            fechaActualizacion?: Date;
            prepaga?: Boolean;
            numeroAfiliado?: string;
        };
        genero: string;
        nombreCompleto: string;
        edad: number;
        edadReal: {
            valor: number;
            unidad: string;
        };
        cuil: string;
    };
    createdAt: Date;
    createdBy: {
        nombre: string;
        apellido: string;
        organizacion: {
            nombre: string;
        };
    };
    updatedAt: Date;
    updatedBy: {
        nombre: string;
        apellido: string;
        organizacion: {
            nombre: string;
        };
    };
}

@Injectable({
    providedIn: 'root'
})
export class AndesPrescriptionsAdapter implements Adapter<AndesPrescriptions> {
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

    adapt(item: unknown): AndesPrescriptions {
        const data = asRecord(item);
        const estadoActual = asRecord(data['estadoActual']);
        const estadoDispensaActual = asRecord(data['estadoDispensaActual']);
        const paciente = asRecord(data['paciente']);
        const obraSocial = asRecord(paciente['obraSocial']);
        const estados = Array.isArray(data['estados']) ? data['estados'] : undefined;
        const estadosDispensa = Array.isArray(data['estadosDispensa']) ? data['estadosDispensa'] : undefined;
        const appNotificada = Array.isArray(data['appNotificada']) ? data['appNotificada'] : undefined;

        return {
            ...data,
            fechaRegistro: this.parseDate(data['fechaRegistro']),
            fechaPrestacion: this.parseDate(data['fechaPrestacion']),
            createdAt: this.parseDate(data['createdAt']),
            updatedAt: this.parseDate(data['updatedAt']),
            estadoActual: data['estadoActual'] ? {
                ...estadoActual,
                createdAt: this.parseDate(estadoActual['createdAt'])
            } : data['estadoActual'],
            estadoDispensaActual: data['estadoDispensaActual'] ? {
                ...estadoDispensaActual,
                fecha: this.parseDate(estadoDispensaActual['fecha'])
            } : data['estadoDispensaActual'],
            estados: estados
                ? estados.map((estado: unknown) => {
                    const estadoData = asRecord(estado);

                    return {
                        ...estadoData,
                        createdAt: this.parseDate(estadoData['createdAt'])
                    };
                })
                : data['estados'],
            estadosDispensa: estadosDispensa
                ? estadosDispensa.map((estadoDispensa: unknown) => {
                    const estadoDispensaData = asRecord(estadoDispensa);

                    return {
                        ...estadoDispensaData,
                        fecha: this.parseDate(estadoDispensaData['fecha'])
                    };
                })
                : data['estadosDispensa'],
            appNotificada: appNotificada
                ? appNotificada.map((notificacion: unknown) => {
                    const notificacionData = asRecord(notificacion);

                    return {
                        ...notificacionData,
                        fecha: this.parseDate(notificacionData['fecha'])
                    };
                })
                : data['appNotificada'],
            paciente: data['paciente'] ? {
                ...paciente,
                fechaNacimiento: this.parseDate(paciente['fechaNacimiento']),
                obraSocial: paciente['obraSocial'] ? {
                    ...obraSocial,
                    fechaActualizacion: this.parseDate(obraSocial['fechaActualizacion'])
                } : paciente['obraSocial']
            } : data['paciente']
        } as AndesPrescriptions;
    }
}
