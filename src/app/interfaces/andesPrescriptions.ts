import SnomedConcept from './snomedConcept';

export class Medicamento {
    cantidad: number;
    descripcion: string;
    medicamento: any;
    presentacion: string;
    unidades: string;
    cantidadEnvases: number;
    observacion?: {
        type: string,
    }
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
    }
}
export default class AndesPrescriptions {
    idAndes: string;
    organizacion: {
        id: string;
        nombre: string;
    }
    profesional: {
        id: string;
        nombre: string;
        apellido: string;
        documento: string;
        profesion: string;
        especialidad: string;
        matricula: number;
    }
    diagnostico: {
        term: string;
        fsn: string;
        conceptId: string;
        semanticTag: string;
    }
    fechaResgistro: Date;
    fechaPrestacion: Date;
    idPrestacion: string;
    idRegistro: string;
    medicamento: {
        concepto: {
            conceptId: string;
            term: string;
            fsn: string;
            semanticTag: string;
        }
        dosisDiaria: {
            dosis: string;
            instervalo: {
                id: string;
                key: string;
                nombre: string;
                source: string;
                type: string;
            }
            dias: number;
            notaMedica: string;
        }
        presentacion: string;
        unidades: string;
        cantidad: number;
        cantEnvases: number;
        tratamientoProlongado: Boolean;
        tiempoTratamiento: any;
    }
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
                }
            }
        }
    ]
    estadosDispensa: [
        {
            id: string;
            tipo: 'sin dispensa' | 'dispensada' | 'dispensa-parcial';
            fecha: Date;
            sistema?: 'sifaho' | 'recetar';
        }
    ]
    appNotificada: [
        {
            id: string
            fecha: Date
        }
    ]
    estadoActual: {
        id: string;
        tipo: string;
        createdAt: Date;
        createdBy: {
            nombre: string;
            apellido: string;
            organizacion: {
                nombre: string;
            }
        }

    };
    estadoDispensaActual: {
        tipo: string;
        fecha: Date;
        id: string;
    }
    paciente: {
        carpetaEfectores: [];
        id: string;
        nombre: string;
        apellido: string;
        documento: string;
        sexo: string;
        fechaNacimiento: Date;
        obraSocial: {
            codigoPuco: number;
            nombre: string;
            financiador: string;
            origen: string;
            fechaActualizacion: Date;
            prepaga: Boolean;
        }
        genero: string;
        nombreCompleto: string,
        edad: number;
        edadReal: {
            valor: number;
            unidad: string;
        }
    }
    createdAt: Date;
    createdBy: {
        nombre: string;
        apellido: string;
        organizacion: {
            nombre: string;
        }
    }
    updatedAt: Date;
    updatedBy: {
        nombre: string;
        apellido: string;
        organizacion: {
            nombre: string;
        }
    }
}