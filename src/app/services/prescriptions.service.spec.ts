import { TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { PrescriptionsService } from './prescriptions.service';
import { environment } from '../../environments/environment';

describe('PrescriptionsService · suspensión', () => {
    let service: PrescriptionsService;
    let http: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({ providers: [PrescriptionsService] });
        service = TestBed.inject(PrescriptionsService);
        http = TestBed.inject(HttpTestingController);
    });

    afterEach(() => http.verify());

    it('envía PATCH /prescriptions/:id/suspend y adapta la respuesta', () => {
        let result: { status?: string; tratamientoProlongado?: number; ambito?: string } | undefined;

        service.suspendPrescription('rx-1', { motivo: 'error' })
            .subscribe((prescription) => (result = prescription));

        const req = http.expectOne(`${environment.API_END_POINT}/prescriptions/rx-1/suspend`);
        expect(req.request.method).toBe('PATCH');
        expect(req.request.body).toEqual({ motivo: 'error' });

        req.flush({
            _id: 'rx-1',
            patient: { firstName: 'Ana', lastName: 'Pérez', dni: '12345678', sex: 'F' },
            professional: { userId: 'u1', businessName: 'Dr. Gómez' },
            supplies: [],
            status: 'Suspendida',
            date: new Date().toISOString(),
            ambito: 'privado',
            tratamientoProlongado: 3,
            treatmentGroupId: 'g1',
            ordenTratamiento: 0,
            estadoActual: { tipo: 'suspendida' },
        });

        expect(result?.status).toBe('Suspendida');
        expect(result?.ambito).toBe('privado');
        expect(result?.tratamientoProlongado).toBe(3);
    });
});
