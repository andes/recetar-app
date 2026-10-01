import { convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { Patient } from '@interfaces/patients';
import { PatientEditPageComponent } from './patient-edit-page.component';

describe('PatientEditPageComponent', () => {
    let component: PatientEditPageComponent;
    let patientsService: jasmine.SpyObj<{ getPatientById: jasmine.Spy }>;
    let router: jasmine.SpyObj<{ navigate: jasmine.Spy }>;
    let notification: jasmine.SpyObj<{
        success: jasmine.Spy;
        error: jasmine.Spy;
        warning: jasmine.Spy;
        info: jasmine.Spy;
        httpError: jasmine.Spy;
    }>;
    let route: {
        snapshot: {
            paramMap: ReturnType<typeof convertToParamMap>;
            queryParams: Record<string, string>;
        };
    };

    const patient = Object.assign(new Patient('Perez', 'Juan', 'Masculino'), {
        _id: 'id-1',
        idMPI: 'mpi-1',
        dni: '30123456',
    });

    beforeEach(() => {
        patientsService = jasmine.createSpyObj('PatientsService', ['getPatientById']);
        patientsService.getPatientById.and.returnValue(of(patient));
        router = jasmine.createSpyObj('Router', ['navigate']);
        router.navigate.and.returnValue(Promise.resolve(true));
        notification = jasmine.createSpyObj('NotificationService', [
            'success',
            'error',
            'warning',
            'info',
            'httpError',
        ]);

        route = {
            snapshot: {
                paramMap: convertToParamMap({ id: 'mpi-1' }),
                queryParams: { q: 'juan' },
            },
        };

        component = new PatientEditPageComponent(
            route as never,
            router as never,
            { getItems: () => [] } as never,
            patientsService as never,
            notification as never,
        );
    });

    it('carga el paciente en modo edición', () => {
        patientsService.getPatientById.and.returnValue(of(patient));

        component.ngOnInit();

        expect(component.isCreate).toBe(false);
        expect(patientsService.getPatientById).toHaveBeenCalledWith('mpi-1');
        expect(component.patient).toBe(patient);
        expect(component.loading).toBe(false);
        expect(component.loadError).toBe(false);
    });

    it('trata un paciente inexistente como error de carga', () => {
        patientsService.getPatientById.and.returnValue(of(undefined as never));

        component.ngOnInit();

        expect(component.patient).toBeNull();
        expect(component.loadError).toBe(true);
    });

    it('entra en modo alta sin id y sin consultar el paciente', () => {
        route.snapshot.paramMap = convertToParamMap({});

        component.ngOnInit();

        expect(component.isCreate).toBe(true);
        expect(patientsService.getPatientById).not.toHaveBeenCalled();
    });

    it('vuelve al listado con los query params de retorno al cancelar', () => {
        component.ngOnInit();

        component.onCancel();

        expect(router.navigate).toHaveBeenCalledWith(
            ['/pacientes'],
            { queryParams: { q: 'juan' } },
        );
    });

    it('al guardar vuelve al listado y agrega q si no había búsqueda', () => {
        route.snapshot.queryParams = {};
        component.ngOnInit();

        component.onSaved(patient);

        expect(router.navigate).toHaveBeenCalledWith(
            ['/pacientes'],
            { queryParams: { q: patient.dni } },
        );
    });
});
