import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Certificate } from '@interfaces/certificate';
import * as CryptoJS from 'crypto-js';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, mapTo, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class CertificatesService {

    private myCertificates: BehaviorSubject<Certificate[]>;
    private certificatesArray: Certificate[] = [];
    private editCertificateSubject = new BehaviorSubject<boolean>(false);
    editCertificate$ = this.editCertificateSubject.asObservable();
    private showCertificateSubject = new BehaviorSubject<boolean>(false);
    showCertificate$ = this.showCertificateSubject.asObservable();
    private certificateSubject = new BehaviorSubject<Certificate>(null);
    certificate$ = this.certificateSubject.asObservable();
    private secretKey = environment.CERTIFICATE_SECRET_KEY;
    private searchTimeout: any = null;
    private searchSubscription: any = null;

    constructor(private http: HttpClient) {
        this.myCertificates = new BehaviorSubject<Certificate[]>(this.certificatesArray);
    }



    setCertificate(value: Certificate) {
        this.certificateSubject.next(value);
    }

    getCertificate(): Certificate {
        return this.certificateSubject.getValue();
    }

    newCertificate(certificate: Certificate): Observable<Boolean> {
        return this.http.post<Certificate>(`${environment.API_END_POINT}/certificates`, certificate).pipe(
            mapTo(true)
        );
    }

    getByUserId(userId: string, params?: { offset?: number; limit?: number }): Observable<{ certificates: Certificate[]; total: number; offset: number; limit: number }> {
        const queryParams = params || {};
        return this.http.get<{ certificates: Certificate[]; total: number; offset: number; limit: number }>(`${environment.API_END_POINT}/certificates/user/${userId}`, { params: queryParams }).pipe(
            tap((response) => this.setCertificates(response.certificates)),
        );
    }

    get certificates(): Observable<Certificate[]> {
        return this.myCertificates.asObservable();
    }

    anulateCertificate(certificate: Certificate): Observable<Boolean> {
        return this.http.patch<Certificate>(`${environment.API_END_POINT}/certificates/${certificate._id}`, certificate).pipe(
            mapTo(true)
        );
    }

    searchByTerm(userId: string, params?: { searchTerm?: string; offset?: number; limit?: number }): Observable<{ certificates: Certificate[]; total: number; offset: number; limit: number }> {
        const queryParams = params || {};
        const searchTerm = queryParams.searchTerm || '';

        // Si hay menos de 3 caracteres, retornar los certificados actuales sin hacer búsqueda
        if (searchTerm && searchTerm.length < 3) {
            return of({
                certificates: this.certificatesArray,
                total: this.certificatesArray.length,
                offset: queryParams.offset || 0,
                limit: queryParams.limit || 10
            });
        }

        // Cancelar timeout anterior si existe
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }

        // Cancelar suscripción HTTP anterior si existe
        if (this.searchSubscription) {
            this.searchSubscription.unsubscribe();
            this.searchSubscription = null;
        }

        // Crear un nuevo Observable que espere 500ms antes de hacer la llamada
        return new Observable(observer => {
            this.searchTimeout = setTimeout(() => {
                this.searchSubscription = this.http.get<{ certificates: Certificate[]; total: number; offset: number; limit: number }>(
                    `${environment.API_END_POINT}/certificates/user/${userId}/search`,
                    { params: queryParams }
                ).pipe(
                    tap((response) => this.setPrescriptions(response.certificates))
                ).subscribe({
                    next: (response) => {
                        observer.next(response);
                        this.searchSubscription = null;
                    },
                    error: (error) => {
                        observer.error(error);
                        this.searchSubscription = null;
                    },
                    complete: () => {
                        observer.complete();
                        this.searchSubscription = null;
                    }
                });
            }, 500);
        });
    }


    private setCertificates(certificates: Certificate[]) {
        this.certificatesArray = certificates;
        this.myCertificates.next(certificates);
    }


    /**
     * Obtiene un certificado por su ID
     * @param id ID del certificado
     * @returns Observable con el certificado
     */
    getById(id: string): Observable<Certificate> {
        return this.http.get<Certificate>(`${environment.API_END_POINT}/certificates/${id}`);
    }

    /**
     * Descifra un ID de certificado desde formato URL-safe
     * @param encryptedId ID cifrado en formato URL-safe
     * @returns ID descifrado
     */
    decryptId(encryptedId: string): string {
        try {
            // Validar entrada
            if (!encryptedId || encryptedId.trim() === '') {
                throw new Error('ID cifrado no puede estar vacío');
            }

            // Decodificar URL si es necesario
            const cleanEncryptedId = decodeURIComponent(encryptedId.trim());

            // Restaurar caracteres especiales desde formato URL-safe
            const base64Encrypted = cleanEncryptedId
                .replace(/-/g, '+')
                .replace(/_/g, '/')
                + '==='.slice(0, (4 - cleanEncryptedId.length % 4) % 4);

            const bytes = CryptoJS.AES.decrypt(base64Encrypted, this.secretKey);
            const decryptedText = bytes.toString(CryptoJS.enc.Utf8);

            // Validar que el descifrado no esté vacío
            if (!decryptedText || decryptedText.trim() === '') {
                throw new Error('Error al descifrar: resultado vacío');
            }

            return decryptedText;
        } catch (error) {
            throw new Error('ID de certificado inválido');
        }
    }

    /**
     * Cifra un ID de certificado para uso en URLs
     * @param id ID a cifrar
     * @returns ID cifrado compatible con URLs
     */
    encryptId(id: string): string {
        if (!id || id.trim() === '') {
            throw new Error('ID no puede estar vacío');
        }

        const cleanId = id.trim();
        const encrypted = CryptoJS.AES.encrypt(cleanId, this.secretKey).toString();

        // Hacer el cifrado compatible con URLs reemplazando caracteres especiales
        const urlSafeEncrypted = encrypted
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=/g, '');

        return urlSafeEncrypted;
    }


}
