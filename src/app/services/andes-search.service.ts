import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface AndesProfessionalData {
    _id?: string;
    id: string;
    documento: string;
    nombre: string;
    apellido: string;
    sexo: string;
    email?: string;
    cuit: string;
    nacionalidad?: string;
    habilitado: boolean;
    profesiones: Array<{
        renovacion: boolean;
        papelesVerificados: boolean;
        matriculado: boolean;
        profesion: {
            _id: string;
            codigo: number;
            nombre: string;
            tipoDeFormacion: string;
            id: string;
        };
        entidadFormadora: {
            _id: string;
            codigo: number;
            nombre: string;
            id: string;
        };
        titulo: string;
        fechaEgreso: string;
        matriculacion: Array<{
            baja: {
                motivo: string;
                fecha: string | null;
            };
            matriculaNumero: number;
            libro: string;
            folio: string;
            inicio: string;
            fin: string;
            id: string | null;
        }>;
        fechaDeInscripcion: string;
        id: string | null;
    }>;
}

export interface AndesApiResponse<T> {
    ok: boolean;
    message: string;
    data: T[];
    total: number;
}

export interface AndesPharmacyData {
    _id: string;
    id: string;
    denominacion: string;
    razonSocial: string;
    cuit: string;
    DTResponsable: string;
    matriculaDTResponsable: string;
    disposicionAltaDT: string;
    domicilio: {
        geoReferencia: unknown[];
        activo: boolean;
        _id: string;
        valor: string;
        codigoPostal: string;
        ubicacion: {
            _id: string;
            pais: {
                _id: string;
                nombre: string;
                id: string;
            };
            provincia: {
                _id: string;
                nombre: string;
                id: string;
            };
            localidad: {
                _id: string;
                nombre: string;
                id: string;
            };
            id: string;
        };
        id: string;
    };
    asociadoA: string;
    disposicionHabilitacion: string;
    fechaHabilitacion: string;
    fechaRenovacion: string;
    vencimientoHabilitacion: string;
    gabineteInyenctables: boolean;
    laboratoriosMagistrales: boolean;
    expedientePapel: string;
    expedienteGDE: string;
    nroCaja: string;
    activo: boolean;
    farmaceuticosAuxiliares: Array<{
        farmaceutico: string;
        matricula: string;
        disposicionAlta: string;
    }>;
    horarios: string[];
    contactos: Array<{
        tipo: string;
        valor: string;
        activo: boolean;
    }>;
    telefono?: string;
    email?: string;
    disposiciones?: Array<{
        numero: string;
        descripcion: string;
        id: string | null;
    }>;
    sancion?: Array<{
        numero: string;
        descripcion: string;
        id: string | null;
    }>;
}

@Injectable({
    providedIn: 'root'
})
export class AndesSearchService {

    constructor(private http: HttpClient) { }

    /**
   * Busca un profesional en Andes por documento
   * @param documento - Número de documento del profesional
   * @returns Observable con los datos del profesional
   */
    searchProfessional(documento: string): Observable<AndesApiResponse<AndesProfessionalData>> {
        const params = { documento };
        return this.http.get<AndesProfessionalData[]>(`${environment.API_END_POINT}/auth/professionals-andes`, { params }).pipe(
            map((data) => ({
                ok: true,
                message: data.length > 0 ? 'Profesionales encontrados' : 'No se encontraron profesionales',
                data,
                total: data.length,
            }))
        );
    }

    /**
   * Busca una farmacia en Andes por CUIT
   * @param cuit - CUIT de la farmacia
   * @returns Observable con los datos de la farmacia
   */
    searchPharmacy(cuit: string): Observable<AndesApiResponse<AndesPharmacyData>> {
        const params = { cuit };
        return this.http.get<AndesPharmacyData[]>(`${environment.API_END_POINT}/auth/pharmacies-andes`, { params }).pipe(
            map((data) => ({
                ok: true,
                message: data.length > 0 ? 'Farmacias encontradas' : 'No se encontraron farmacias',
                data,
                total: data.length,
            }))
        );
    }



    /**
   * Valida si una farmacia existe y está habilitada
   * @param cuit - CUIT de la farmacia
   * @param matricula - Número de matrícula (opcional)
   * @returns Observable<boolean> indicando si es válida
   */
    validatePharmacy(cuit: string, matricula?: string): Observable<boolean> {
        return this.searchPharmacy(cuit).pipe(
            map((response) => {
                if (!response?.ok || response.data.length === 0) {
                    return false;
                }

                const pharmacy = response.data[0];

                if (matricula && pharmacy.matriculaDTResponsable && pharmacy.matriculaDTResponsable !== matricula) {
                    return false;
                }

                if (pharmacy.vencimientoHabilitacion) {
                    const currentDate = new Date();
                    const expirationDate = new Date(pharmacy.vencimientoHabilitacion);
                    return expirationDate > currentDate && pharmacy.activo;
                }

                return pharmacy.activo;
            }),
            catchError(() => of(false))
        );
    }

    /**
   * Obtiene datos para autocompletar de un profesional
   * @param documento - Número de documento
   * @returns Observable con los datos para autocompletar
   */
    autocompleteProfessional(documento: string): Observable<{
        email?: string;
        matricula?: string;
        nombre?: string;
        apellido?: string;
        cuil?: string;
    }> {
        return this.searchProfessional(documento).pipe(
            map((response) => {
                if (!response?.ok || response.data.length === 0) {
                    return {};
                }

                const professional = response.data[0];
                let latestMatricula = '';
                let latestEndDate = new Date(0);

                professional.profesiones.forEach((profesion) => {
                    profesion.matriculacion.forEach((mat) => {
                        const endDate = new Date(mat.fin);
                        if (endDate > new Date() && endDate > latestEndDate) {
                            latestMatricula = mat.matriculaNumero?.toString() || '';
                            latestEndDate = endDate;
                        }
                    });
                });

                return {
                    email: professional.email,
                    matricula: latestMatricula,
                    nombre: professional.nombre,
                    apellido: professional.apellido,
                    cuil: professional.cuit
                };
            }),
            catchError(() => of({}))
        );
    }

    /**
   * Obtiene datos para autocompletar de una farmacia
   * @param cuit - CUIT de la farmacia
   * @returns Observable con los datos para autocompletar
   */
    autocompletePharmacy(cuit: string): Observable<{
        email?: string;
        matricula?: string;
        nombre?: string;
    }> {
        return this.searchPharmacy(cuit).pipe(
            map((response) => {
                if (!response?.ok || response.data.length === 0) {
                    return {};
                }

                const pharmacy = response.data[0];
                const emailContact = pharmacy.contactos?.find((contact) =>
                    contact.tipo === 'email' && contact.activo && contact.valor
                );

                return {
                    email: emailContact?.valor,
                    matricula: pharmacy.matriculaDTResponsable,
                    nombre: pharmacy.denominacion || pharmacy.razonSocial
                };
            }),
            catchError(() => of({}))
        );
    }
}
