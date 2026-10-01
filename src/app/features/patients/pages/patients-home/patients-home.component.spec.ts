import { convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { Patient } from '@interfaces/patients';
import { PatientsHomeComponent } from './patients-home.component';

describe('PatientsHomeComponent', () => {
    let component: PatientsHomeComponent;
    let patientsService: jasmine.SpyObj<{
        searchPatientsPage: jasmine.Spy;
        validatePatientById: jasmine.Spy;
        deletePatient: jasmine.Spy;
    }>;
    let router: jasmine.SpyObj<{ navigate: jasmine.Spy }>;
    let notification: jasmine.SpyObj<{
        success: jasmine.Spy;
        error: jasmine.Spy;
        warning: jasmine.Spy;
        info: jasmine.Spy;
        httpError: jasmine.Spy;
    }>;
    let route: { snapshot: { queryParams: Record<string, string>; queryParamMap: ReturnType<typeof convertToParamMap> } };

    const patient = Object.assign(new Patient('Perez', 'Juan', 'Masculino'), {
        _id: 'id-1',
        idMPI: 'mpi-1',
        dni: '30123456',
        status: 'validado',
        estado: 'validado',
        fechaNac: new Date(1990, 1, 1),
    });

    beforeEach(() => {
        patientsService = jasmine.createSpyObj('PatientsService', [
            'searchPatientsPage',
            'validatePatientById',
            'deletePatient',
        ]);
        patientsService.searchPatientsPage.and.returnValue(
            of({ items: [patient], hasMore: false, offset: 0, limit: 20 })
        );

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
                queryParams: { q: 'juan', estado: 'validado' },
                queryParamMap: convertToParamMap({ q: 'juan', estado: 'validado' }),
            },
        };

        component = new PatientsHomeComponent(
            { getItems: () => [] } as never,
            patientsService as never,
            { open: jasmine.createSpy('open') } as never,
            notification as never,
            router as never,
            route as never,
        );
    });

    afterEach(() => component.ngOnDestroy());

    it('restaura la búsqueda desde query params y sincroniza la URL', () => {
        component.ngOnInit();

        expect(component.searchControl.value).toBe('juan');
        expect(component.estadoControl.value).toBe('validado');

        const searchArgs = patientsService.searchPatientsPage.calls.mostRecent().args[0] as Record<string, unknown>;
        expect(searchArgs['q']).toBe('juan');
        expect(searchArgs['estado']).toBe('validado');
        expect(searchArgs['offset']).toBe(0);
        expect(searchArgs['limit']).toBe(20);
        expect(router.navigate).toHaveBeenCalled();
    });

    it('navega a la edición usando idMPI y conserva los query params', () => {
        component.editPatient(patient);

        expect(router.navigate).toHaveBeenCalledWith(
            ['/pacientes', 'mpi-1', 'editar'],
            { queryParams: route.snapshot.queryParams },
        );
    });

    it('bloquea la edición cuando el paciente no tiene identificador', () => {
        const withoutId = new Patient('Perez', 'Juan', 'Masculino', 'validado', '30123456');

        component.editPatient(withoutId);

        expect(router.navigate).not.toHaveBeenCalled();
        expect(notification.warning).toHaveBeenCalled();
    });

    it('navega al alta conservando los query params', () => {
        component.createPatient();

        expect(router.navigate).toHaveBeenCalledWith(
            ['/pacientes/nuevo'],
            { queryParams: route.snapshot.queryParams },
        );
    });
});
