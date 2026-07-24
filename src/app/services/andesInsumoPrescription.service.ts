import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class AndesInsumoPrescriptionService {

    constructor(private http: HttpClient) { }

    dispense(prescription: any, pharmacistId: string): Observable<any> {
        const body = { prescription, pharmacistId };
        return this.http.patch(`${environment.API_END_POINT}/andes-insumo-prescriptions/dispense`, body);
    }

    cancelDispense(prescriptionId: string, pharmacistId: string): Observable<any> {
        const body = { prescriptionId, pharmacistId };
        return this.http.patch(`${environment.API_END_POINT}/andes-insumo-prescriptions/cancel-dispense`, body);
    }
}
