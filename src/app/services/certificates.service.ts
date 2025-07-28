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

    constructor(private http: HttpClient) {
        this.myCertificates = new BehaviorSubject<Certificates[]>(this.certificatesArray);
    }

    newCertificate(certificate: Certificates): Observable<Boolean> {
        return this.http.post<Certificates>(`${environment.API_END_POINT}/certificates`, certificate).pipe(
            mapTo(true)
        );
    }

    getByUserId(userId: string): Observable<Boolean> {
        return this.http.get<Certificates[]>(`${environment.API_END_POINT}/certificates/get-by-user-id/${userId}`).pipe(
            tap((certificates: Certificates[]) => this.setPrescriptions(certificates)),
            mapTo(true)
        );
    }

    get certificates(): Observable<Certificates[]> {
        return this.myCertificates.asObservable();
    }

    deleteCertificate(certificateId: string): Observable<Boolean> {
        return this.http.delete<Certificates>(`${environment.API_END_POINT}/certificates/${certificateId}`).pipe(
            tap(() => this.removeCertificate(certificateId)),
            mapTo(true)
        );
    }

    private setPrescriptions(certificates: Certificates[]) {
        this.certificatesArray = certificates;
        this.myCertificates.next(certificates);
    }

    private removeCertificate(removedCertificate: string) {
        // const removeIndex = this.certificatesArray.findIndex((certificate: Certificates) => certificate._id === removedCertificate);

        // this.certificatesArray.splice(removeIndex, 1);
        // this.myCertificates.next(this.certificatesArray);
    }

}
