import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Certificate } from '@interfaces/certificate';
import * as CryptoJS from 'crypto-js';
import { BehaviorSubject, Observable } from 'rxjs';
import { mapTo, tap } from 'rxjs/operators';
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

    getByUserId(userId: string): Observable<Boolean> {
        return this.http.get<Certificate[]>(`${environment.API_END_POINT}/certificates/get-by-user-id/${userId}`).pipe(
            tap((certificates: Certificate[]) => this.setCertificates(certificates)),
            mapTo(true)
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
