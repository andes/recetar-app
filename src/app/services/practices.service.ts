import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Practice, PracticeAdapter } from '@interfaces/practices';
import * as CryptoJS from 'crypto-js';
import { BehaviorSubject, Observable, Subject, of, timer } from 'rxjs';
import { map, mapTo, switchMap, takeUntil, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class PracticesService {

    private secretKey = environment.CERTIFICATE_SECRET_KEY;
    private myPractices: BehaviorSubject<Practice[]>;
    private practicesArray: Practice[] = [];
    private cancelSearch$ = new Subject<void>();

    constructor(private http: HttpClient, private practiceAdapter: PracticeAdapter) {
        this.myPractices = new BehaviorSubject<Practice[]>(this.practicesArray);
    }

    getPractices(params): Observable<boolean> {
        return this.http.get(`${environment.API_END_POINT}/practices`, { params }).pipe(
            map((practices: Practice[]) => practices.map((practice) => this.practiceAdapter.adapt(practice))),
            tap((practices: Practice[]) => this.setPractices(practices)),
            map((practices: Practice[]) => practices.length > 0)
        );
    }

    getById(id: string, publicURL = false): Observable<Practice> {
        return this.http.get<Practice>(`${environment.API_END_POINT}/practices/${id}`, {
            headers: {
                'public': publicURL ? 'true' : 'false'
            },
            responseType: 'json'
        }).pipe(
            map((practice) => this.practiceAdapter.adapt(practice))
        );
    }

    getFromDniAndDate(params: { patient_dni: string; dateFilter: string }): Observable<boolean> {
        return this.http.get<Practice[]>(`${environment.API_END_POINT}/practices/find/${params.patient_dni}&${params.dateFilter}`).pipe(
            map((practices) => practices.map((practice) => this.practiceAdapter.adapt(practice))),
            tap((practices: Practice[]) => this.setPractices(practices)),
            map((practices: Practice[]) => practices.length > 0)
        );
    }

    getByUserId(userId: string, params?: { offset?: number; limit?: number }): Observable<{ practices: Practice[]; total: number; offset: number; limit: number }> {
        const httpParams: any = { userId };
        if (params?.offset !== undefined) { httpParams.skip = params.offset; }
        if (params?.limit !== undefined) { httpParams.limit = params.limit; }
        return this.http.get<{ practices: Practice[]; total: number; offset: number; limit: number }>(`${environment.API_END_POINT}/practices`, { params: httpParams }).pipe(
            map((response) => ({
                ...response,
                practices: response.practices.map((practice) => this.practiceAdapter.adapt(practice))
            })),
            tap((response) => this.setPractices(response.practices))
        );
    }

    searchByTerm(userId: string, params?: { searchTerm?: string; offset?: number; limit?: number }): Observable<{ practices: Practice[]; total: number; offset: number; limit: number }> {
        const queryParams = params || {};
        const searchTerm = queryParams.searchTerm || '';

        // Verificar que haya al menos 3 caracteres para buscar
        if (searchTerm && searchTerm.length < 3) {
            return of({ practices: [], total: 0, offset: queryParams.offset || 0, limit: queryParams.limit || 10 });
        }

        this.cancelSearch$.next();

        const httpParams: any = { userId, searchTerm };
        if (params?.offset !== undefined) { httpParams.skip = params.offset; }
        if (params?.limit !== undefined) { httpParams.limit = params.limit; }

        return timer(500).pipe(
            takeUntil(this.cancelSearch$),
            switchMap(() => this.http.get<{ practices: Practice[]; total: number; offset: number; limit: number }>(
                `${environment.API_END_POINT}/practices`,
                { params: httpParams }
            )),
            map((response) => ({
                ...response,
                practices: response.practices.map((practice) => this.practiceAdapter.adapt(practice))
            })),
            tap((response) => this.setPractices(response.practices))
        );
    }

    newPractice(practice: Practice): Observable<Boolean> {
        return this.http.post<Practice>(`${environment.API_END_POINT}/practices`, practice).pipe(
            map((newPracticeItem: Practice) => this.practiceAdapter.adapt(newPracticeItem)),
            tap((newPracticeItem: Practice) => this.addPractice([newPracticeItem])),
            mapTo(true)
        );
    }

    editPractice(practice: Practice): Observable<Boolean> {
        return this.http.patch<Practice>(`${environment.API_END_POINT}/practices/${practice._id}`, practice).pipe(
            map((updatedPractice: Practice) => this.practiceAdapter.adapt(updatedPractice)),
            tap((updatedPractice: Practice) => this.updatePractice(updatedPractice)),
            mapTo(true)
        );
    }

    deletePractice(practiceId: string): Observable<Boolean> {
        return this.http.delete<Practice>(`${environment.API_END_POINT}/practices/${practiceId}`).pipe(
            tap(() => this.removePractice(practiceId)),
            mapTo(true)
        );
    }

    completePractice(practiceId: string): Observable<boolean> {
        return this.http.patch<Practice>(`${environment.API_END_POINT}/practices/${practiceId}/complete`, {}).pipe(
            map((updatedPractice: Practice) => this.practiceAdapter.adapt(updatedPractice)),
            tap((updatedPractice: Practice) => this.updatePractice(updatedPractice)),
            mapTo(true)
        );
    }

    cancelPractice(practiceId: string): Observable<boolean> {
        return this.http.patch<Practice>(`${environment.API_END_POINT}/practices/${practiceId}/cancel`, {}).pipe(
            map((updatedPractice: Practice) => this.practiceAdapter.adapt(updatedPractice)),
            tap((updatedPractice: Practice) => this.updatePractice(updatedPractice)),
            mapTo(true)
        );
    }

    cleanPractices(): void {
        this.practicesArray = [];
        this.myPractices.next(this.practicesArray);
    }

    private setPractices(practices: Practice[]) {
        this.practicesArray = practices;
        this.myPractices.next(practices);
    }

    private addPractice(practices: Practice[]) {
        this.practicesArray.unshift(...practices);
        this.myPractices.next(this.practicesArray);
    }

    private removePractice(removedPractice: string) {
        const removeIndex = this.practicesArray.findIndex((practice: Practice) => practice._id === removedPractice);
        this.practicesArray.splice(removeIndex, 1);
        this.myPractices.next(this.practicesArray);
    }

    private updatePractice(updatedPractice: Practice) {
        const updateIndex = this.practicesArray.findIndex((practice: Practice) => practice._id === updatedPractice._id);
        this.practicesArray.splice(updateIndex, 1, updatedPractice);
        this.myPractices.next(this.practicesArray);
    }

    get practices(): Observable<Practice[]> {
        return this.myPractices.asObservable();
    }

    // Método para desencriptar el ID
    decryptId(encryptedId: string): string {
        try {
            // Decodificar de base64
            const encryptedData = atob(encryptedId);

            // Separar IV y datos encriptados
            const iv = CryptoJS.enc.Hex.parse(encryptedData.substring(0, 32));
            const encrypted = encryptedData.substring(32);

            // Desencriptar
            const decrypted = CryptoJS.AES.decrypt(encrypted, this.secretKey, {
                iv: iv,
                mode: CryptoJS.mode.CBC,
                padding: CryptoJS.pad.Pkcs7
            });

            return decrypted.toString(CryptoJS.enc.Utf8);
        } catch (error) {
            throw new Error('Invalid encrypted ID');
        }
    }

    // Método para encriptar el ID
    encryptId(id: string): string {
        try {
            // Generar IV aleatorio
            const iv = CryptoJS.lib.WordArray.random(16);

            // Encriptar
            const encrypted = CryptoJS.AES.encrypt(id, this.secretKey, {
                iv: iv,
                mode: CryptoJS.mode.CBC,
                padding: CryptoJS.pad.Pkcs7
            });

            // Combinar IV y datos encriptados
            const combined = iv.toString() + encrypted.toString();

            // Codificar en base64
            return btoa(combined);
        } catch (error) {
            throw new Error('Encryption failed');
        }
    }
}
