import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { Prescriptions } from '@interfaces/prescriptions';
import { Certificate } from '@interfaces/certificate';
import { PrescriptionsService } from '@services/prescriptions.service';

@Injectable({
    providedIn: 'root'
})
export class InteractionService {
    private _deletePrescriptionSource = new Subject<Prescriptions>();
    private _deleteCertificateSource = new Subject<Certificate>();

    deletePrescription$ = this._deletePrescriptionSource.asObservable();
    deleteCertificate$ = this._deleteCertificateSource.asObservable();
    
    constructor(private prescriptionsService: PrescriptionsService) { }

    deletePrescription(prescription: Prescriptions): Observable<Boolean> {
        // Eliminar la prescripción mediante el servicio
        return this.prescriptionsService.deletePrescription(prescription._id);
    }

    // Método para emitir el evento después de la eliminación exitosa
    emitPrescriptionDeleted(prescription: Prescriptions) {
        this._deletePrescriptionSource.next(prescription);
    }

    anulateCertificate(certificate: Certificate) {
        this._deleteCertificateSource.next(certificate);
    }
}
