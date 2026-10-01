import { FormBuilder } from '@angular/forms';
import { Observable, of } from 'rxjs';
import { Patient } from '@interfaces/patients';
import { PatientEditFormComponent } from './patient-edit-form.component';

describe('PatientEditFormComponent', () => {
    let component: PatientEditFormComponent;
    let dialog: jasmine.SpyObj<{ open: jasmine.Spy }>;
    let notification: jasmine.SpyObj<{
        success: jasmine.Spy;
        error: jasmine.Spy;
        warning: jasmine.Spy;
        info: jasmine.Spy;
        httpError: jasmine.Spy;
    }>;
    let patientsService: jasmine.SpyObj<{
        createPatient: jasmine.Spy;
        updatePatient: jasmine.Spy;
        validatePatient: jasmine.Spy;
        validatePatientById: jasmine.Spy;
    }>;

    const validatedPatient = Object.assign(new Patient('Perez', 'Juan', 'Masculino'), {
        dni: '30123456',
        cuil: '20301234569',
        fechaNac: new Date(1990, 1, 1),
        status: 'validado',
        estado: 'validado',
    });

    beforeEach(() => {
        dialog = jasmine.createSpyObj('MatDialog', ['open']);
        dialog.open.and.returnValue({ afterClosed: () => of(true) });
        notification = jasmine.createSpyObj('NotificationService', [
            'success',
            'error',
            'warning',
            'info',
            'httpError',
        ]);
        patientsService = jasmine.createSpyObj('PatientsService', [
            'createPatient',
            'updatePatient',
            'validatePatient',
            'validatePatientById',
        ]);
        patientsService.validatePatient.and.returnValue(of(validatedPatient));
        patientsService.validatePatientById.and.returnValue(of(validatedPatient));

        component = new PatientEditFormComponent(
            new FormBuilder(),
            patientsService as never,
            dialog as never,
            notification as never,
        );
    });

    it('no pide confirmación ni abre el diálogo si el formulario está limpio', () => {
        const result = component.canDeactivate() as Observable<boolean>;

        let allowed = false;
        result.subscribe((value) => allowed = value);

        expect(allowed).toBe(true);
        expect(dialog.open).not.toHaveBeenCalled();
        expect(component.hasUnsavedChanges()).toBe(false);
    });

    it('pide confirmación cuando hay cambios sin guardar', () => {
        component.form.markAsDirty();

        const result = component.canDeactivate() as Observable<boolean>;

        let allowed = false;
        result.subscribe((value) => allowed = value);

        expect(allowed).toBe(true);
        expect(dialog.open).toHaveBeenCalled();
        expect(component.hasUnsavedChanges()).toBe(true);
    });

    it('marca el formulario limpio al confirmar la salida para no pedir dos veces', () => {
        component.form.markAsDirty();
        let cancelled = false;
        component.cancelled.subscribe(() => cancelled = true);

        component.onCancel();

        expect(cancelled).toBe(true);
        expect(component.hasUnsavedChanges()).toBe(false);
    });

    it('inicia en Datos básicos y cambia de tab', () => {
        expect(component.activeTab).toBe('basic');

        component.onTabChange('contact');

        expect(component.activeTab).toBe('contact');
    });

    it('no selecciona género por defecto y usa el catálogo sin opción vacía', () => {
        expect(component.form.get('genero')?.value).toBeNull();
        expect(component.generoOptions.map((option) => option.value)).toEqual([
            'mujer',
            'mujer trans',
            'varon',
            'varon trans',
            'no binario',
            'travesti',
            'masculinidad trans',
        ]);
        expect(component.generoOptions[0].label).toBe('Mujer');

        component.form.get('genero')?.setValue('otro');

        expect(component.generoOptions.map((option) => option.value)).toContain('otro');
    });

    it('omite el género al limpiarlo y guardar en edición', () => {
        patientsService.updatePatient.and.returnValue(of(Object.assign(
            new Patient('Perez', 'Juan', 'Masculino'),
            { idMPI: 'mpi-1', dni: '30123456' },
        )));

        component.mode = 'edit';
        component.patient = Object.assign(new Patient('Perez', 'Juan', 'Masculino'), {
            idMPI: 'mpi-1',
            dni: '30123456',
        });
        component.form.get('firstName')?.setValue('Juan');
        component.form.get('lastName')?.setValue('Perez');
        component.form.get('sex')?.setValue('Masculino');
        component.form.get('genero')?.setValue('mujer');

        component.clearGenero();

        expect(component.form.get('genero')?.value).toBeNull();
        expect(component.hasGeneroValue).toBe(false);

        component.onSave();

        expect(patientsService.updatePatient).toHaveBeenCalled();
        const payload = patientsService.updatePatient.calls.mostRecent().args[1] as { genero?: string };
        expect(payload.genero).toBeUndefined();
    });

    it('valida un alta contra RENAPER y precarga los datos', () => {
        component.form.get('dni')?.setValue('30123456');
        component.form.get('sex')?.setValue('Masculino');

        component.onValidate();

        expect(patientsService.validatePatient).toHaveBeenCalledWith('30123456', 'Masculino');
        expect(component.form.get('firstName')?.value).toBe('Juan');
        expect(component.form.get('lastName')?.value).toBe('Perez');
        expect(component.form.get('dni')?.disabled).toBe(true);
        expect(component.hasUnsavedChanges()).toBe(true);
        expect(notification.success).toHaveBeenCalled();
    });

    it('no autocompleta el género y reemplaza la dirección al validar', () => {
        patientsService.validatePatient.and.returnValue(of(Object.assign(
            new Patient('Perez', 'Matias', 'Masculino'),
            {
                dni: '30123456',
                genero: 'masculino',
                direcciones: [{
                    calle: 'RENAPER 123',
                    codigoPostal: '8300',
                    barrio: 'CENTRO',
                    localidad: 'NEUQUEN',
                    provincia: 'NEUQUEN',
                    pais: 'ARGENTINA',
                }],
            },
        )));

        component.form.get('dni')?.setValue('30123456');
        component.form.get('sex')?.setValue('Masculino');
        component.form.get('genero')?.setValue('no binario');
        component.form.get('email')?.setValue('viejo@example.com');
        component.form.get('calle')?.setValue('CALLE VIEJA 1');

        component.onValidate();

        expect(component.form.get('genero')?.value).toBe('no binario');
        expect(component.form.get('email')?.value).toBe('viejo@example.com');
        expect(component.form.get('calle')?.value).toBe('RENAPER 123');
        expect(component.form.get('barrio')?.value).toBe('CENTRO');
        expect(component.form.get('localidad')?.value).toBe('NEUQUEN');
    });

    it('valida un paciente existente por ID', () => {
        component.patient = Object.assign(new Patient('Perez', 'Juan', 'Masculino'), {
            idMPI: 'mpi-1',
            dni: '30123456',
        });
        component.form.get('dni')?.setValue('30123456');
        component.form.get('sex')?.setValue('Masculino');

        component.onValidate();

        expect(patientsService.validatePatientById).toHaveBeenCalledWith('mpi-1');
        expect(patientsService.validatePatient).not.toHaveBeenCalled();
    });
});
