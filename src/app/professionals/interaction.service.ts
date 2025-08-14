import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { Prescriptions } from '@interfaces/prescriptions';
import { Certificate } from '@interfaces/certificate';

@Injectable({
    providedIn: 'root'
})
export class InteractionService {
    private _deletePrescriptionSource = new Subject<Prescriptions>();
    private _deleteCertificateSource = new Subject<Certificate>();

    deletePrescription$ = this._deletePrescriptionSource.asObservable();
    deleteCertificate$ = this._deleteCertificateSource.asObservable();
    constructor() { }

    deletePrescription(prescription: Prescriptions) {
        this._deletePrescriptionSource.next(prescription);
    }

    anulateCertificate(certificate: Certificate) {
        this._deleteCertificateSource.next(certificate);
    }
}
