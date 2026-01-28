import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface AndesProfessionalData {
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
        geoReferencia: any[];
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
        return this.http.get<AndesApiResponse<AndesProfessionalData>>(`${environment.API_END_POINT}/andes/professionals`, { params });
    }

    /**
   * Busca una farmacia en Andes por CUIT
   * @param cuit - CUIT de la farmacia
   * @returns Observable con los datos de la farmacia
   */
    searchPharmacy(cuit: string): Observable<AndesApiResponse<AndesPharmacyData>> {
        const params = { cuit };
        return this.http.get<AndesApiResponse<AndesPharmacyData>>(`${environment.API_END_POINT}/andes/pharmacies`, { params });
    }



    /**
   * Valida si una farmacia existe y está habilitada
   * @param cuit - CUIT de la farmacia
   * @param matricula - Número de matrícula (opcional)
   * @returns Observable<boolean> indicando si es válida
   */
    validatePharmacy(cuit: string, matricula?: string): Observable<boolean> {
        return new Observable<boolean>(observer => {
            this.searchPharmacy(cuit).subscribe({
                next: (response) => {
                    if (response && response.ok && response.data && response.data.length > 0) {
                        const pharmacy = response.data[0];

                        // Si se proporciona matrícula, validarla contra la matrícula del DT responsable
                        if (matricula && pharmacy.matriculaDTResponsable && pharmacy.matriculaDTResponsable !== matricula) {
                            observer.next(false);
                            observer.complete();
                            return;
                        }

                        // Verificar habilitación vigente
                        if (pharmacy.vencimientoHabilitacion) {
                            const currentDate = new Date();
                            const expirationDate = new Date(pharmacy.vencimientoHabilitacion);
                            observer.next(expirationDate > currentDate && pharmacy.activo);
                        } else {
                            observer.next(pharmacy.activo); // Si no hay fecha de vencimiento, verificar solo si está activa
                        }
                    } else {
                        observer.next(false);
                    }
                    observer.complete();
                },
                error: (error) => {
                    observer.next(false);
                    observer.complete();
                }
            });
        });
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
        return new Observable(observer => {
            this.searchProfessional(documento).subscribe({
                next: (professionals) => {
                    if (professionals && professionals.ok) {
                        const professional = professionals[0];

                        // Obtener la matrícula más reciente y vigente
                        let latestMatricula = '';
                        let latestEndDate = new Date(0);

                        professional.profesiones.forEach(profesion => {
                            profesion.matriculacion.forEach(mat => {
                                const endDate = new Date(mat.fin);
                                if (endDate > new Date() && endDate > latestEndDate) {
                                    latestMatricula = mat.matriculaNumero;
                                    latestEndDate = endDate;
                                }
                            });
                        });

                        observer.next({
                            email: professional.email,
                            matricula: latestMatricula,
                            nombre: professional.nombre,
                            apellido: professional.apellido,
                            cuil: professional.cuit
                        });
                    } else {
                        observer.next({});
                    }
                    observer.complete();
                },
                error: (error) => {
                    observer.next({});
                    observer.complete();
                }
            });
        });
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
        return new Observable(observer => {
            this.searchPharmacy(cuit).subscribe({
                next: (response) => {
                    if (response && response.ok && response.data && response.data.length > 0) {
                        const pharmacy = response.data[0];

                        // Buscar email activo en los contactos
                        const emailContact = pharmacy.contactos?.find(contact =>
                            contact.tipo === 'email' && contact.activo && contact.valor
                        );

                        observer.next({
                            email: emailContact?.valor,
                            matricula: pharmacy.matriculaDTResponsable,
                            nombre: pharmacy.denominacion || pharmacy.razonSocial
                        });
                    } else {
                        observer.next({});
                    }
                    observer.complete();
                },
                error: (error) => {
                    observer.next({});
                    observer.complete();
                }
            });
        });
    }
}
