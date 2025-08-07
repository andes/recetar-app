import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { Certificates } from '../interfaces/certificate';
import { tap, mapTo } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })

export class CertificatesService {

    private myCertificates: BehaviorSubject<Certificates[]>;
    private certificatesArray: Certificates[] = [];
    private editCertificateSubject = new BehaviorSubject<boolean>(false);
    editCertificate$ = this.editCertificateSubject.asObservable();
    private showCertificateSubject = new BehaviorSubject<boolean>(false);
    showCertificate$ = this.showCertificateSubject.asObservable();
    private certificateSubject = new BehaviorSubject<Certificates>(null);
    certificate$ = this.certificateSubject.asObservable();

    constructor(private http: HttpClient) {
        this.myCertificates = new BehaviorSubject<Certificates[]>(this.certificatesArray);
    }



    setCertificate(value: Certificates) {
        this.certificateSubject.next(value);
    }

    getCertificate(): Certificates {
        return this.certificateSubject.getValue();
    }

    newCertificate(certificate: Certificates): Observable<Boolean> {
        return this.http.post<Certificates>(`${environment.API_END_POINT}/certificates`, certificate).pipe(
            mapTo(true)
        );
    }

    getByUserId(userId: string): Observable<Boolean> {
        return this.http.get<Certificates[]>(`${environment.API_END_POINT}/certificates/get-by-user-id/${userId}`).pipe(
            tap((certificates: Certificates[]) => this.setCertificates(certificates)),
            mapTo(true)
        );
    }

    get certificates(): Observable<Certificates[]> {
        return this.myCertificates.asObservable();
    }

    anulateCertificate(certificate: Certificates): Observable<Boolean> {
        return this.http.patch<Certificates>(`${environment.API_END_POINT}/certificates/${certificate._id}`, certificate).pipe(
            mapTo(true)
        );
    }

    private setCertificates(certificates: Certificates[]) {
        this.certificatesArray = certificates;
        this.myCertificates.next(certificates);
    }
}
