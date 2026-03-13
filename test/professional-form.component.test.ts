import { ComponentFixture, TestBed, fakeAsync, tick, flush, discardPeriodicTasks } from '@angular/core/testing';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { ProfessionalFormComponent } from '@professionals/components/professional-form/professional-form.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { of } from 'rxjs';
import { PatientsService } from '@services/patients.service';
import { SnomedSuppliesService } from '@services/snomedSupplies.service';
import { PrescriptionsService } from '@services/prescriptions.service';
import { AuthService } from '@auth/services/auth.service';
import { AmbitoService } from '@auth/services/ambito.service';
import { PatientFormComponent } from '@shared/components/patient-form/patient-form.component';
import { PatientNamePipe } from '@shared/pipes/patient-name.pipe';
import { InteractionService } from '@professionals/interaction.service';
import { CertificatesService } from '@services/certificates.service';
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';
import * as fs from 'fs';
import * as path from 'path';

// Mock de pdfmake-wrapper para evitar errores en top-level side effects de otros componentes
jest.mock('pdfmake-wrapper', () => ({
    PdfMakeWrapper: {
        setFonts: jest.fn()
    },
    Txt: jest.fn(),
    Canvas: jest.fn(),
    Line: jest.fn(),
    Img: jest.fn(),
    Columns: jest.fn()
}));

/**
 * Test de Integración para ProfessionalFormComponent.
 * Simula el flujo completo de creación de una prescripción.
 */
describe('ProfessionalFormComponent Integration Test', () => {
    let component: ProfessionalFormComponent;
    let fixture: ComponentFixture<ProfessionalFormComponent>;
    let snomedService: SnomedSuppliesService;
    let patientsService: PatientsService;
    let prescriptionsService: PrescriptionsService;
    let tokenData: any;

    beforeAll(() => {
        // Ajustamos la ruta para que apunte a la raíz del proyecto donde está el token.json
        const tokenPath = path.resolve(process.cwd(), 'test', 'data/token.json');
        if (fs.existsSync(tokenPath)) {
            tokenData = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
        } else {
            throw new Error(`No se encontró el archivo token.json en ${tokenPath}. Ejecute get-token.js primero.`);
        }
    });

    beforeEach(async () => {
        const authServiceMock = {
            getLoggedUserId: () => '680659b140d74e29626fcdd4', // ID del profesional_test
            getJwtToken: () => tokenData.jwt,
            refreshToken: () => of(null)
        };

        const snomedServiceMock = {
            get: (term: string) => of([
                {
                    conceptId: '1000001',
                    term: 'Paracetamol 500mg',
                    fsn: 'Paracetamol 500mg',
                    semanticTag: 'producto'
                }
            ])
        };

        const ambitoServiceMock = {
            getAmbitoSeleccionado: of('privado'),
            getAmbito: () => 'privado'
        };

        await TestBed.configureTestingModule({
            imports: [
                ReactiveFormsModule,
                HttpClientTestingModule,
                NoopAnimationsModule,
                MatDialogModule,
                MatAutocompleteModule,
                MatInputModule,
                MatSelectModule,
                MatCheckboxModule,
                MatDatepickerModule,
                MatNativeDateModule
            ],
            declarations: [
                ProfessionalFormComponent,
                PatientFormComponent,
                PatientNamePipe
                // No declaramos PrescriptionsListComponent para simplificar (usa NO_ERRORS_SCHEMA)
            ],
            providers: [
                FormBuilder,
                { provide: AuthService, useValue: authServiceMock },
                { provide: SnomedSuppliesService, useValue: snomedServiceMock },
                { provide: AmbitoService, useValue: ambitoServiceMock },
                PatientsService,
                PrescriptionsService,
                InteractionService,
                CertificatesService,
                { provide: MatDialog, useValue: { open: () => ({ afterClosed: () => of(true) }) } }
            ],
            schemas: [NO_ERRORS_SCHEMA, CUSTOM_ELEMENTS_SCHEMA]
        }).compileComponents();

        fixture = TestBed.createComponent(ProfessionalFormComponent);
        component = fixture.componentInstance;
        snomedService = TestBed.inject(SnomedSuppliesService);
        patientsService = TestBed.inject(PatientsService);
        prescriptionsService = TestBed.inject(PrescriptionsService);
        fixture.detectChanges();
    });

    /**
     * Valida que el flujo de carga de paciente, medicamento y guardado funcione correctamente.
     */
    it('debe crear una prescripción exitosamente cargando un paciente y un medicamento', fakeAsync(() => {
        // 1. Simular carga de paciente por DNI
        const patientData = {
            dni: '123456789',
            firstName: 'Test',
            lastName: 'User',
            sex: 'Femenino',
            fechaNac: new Date('1990-01-01')
        };

        // Forzamos el valor en el componente de paciente (hijo) 
        // En un test real de UI buscaríamos el input, pero aquí queremos validar el flujo del formulario padre
        component.professionalForm.patchValue({
            patient: patientData
        });
        tick();
        fixture.detectChanges();

        expect(component.professionalForm.get('patient').value.dni).toBe('123456789');

        // 2. Simular búsqueda y selección de medicamento
        const supplyFormGroup = component.suppliesForm.at(0) as any;
        supplyFormGroup.get('supply.name').setValue('Paracetamol');
        tick(300); // debounceTime
        fixture.detectChanges();

        // Simulamos la selección del medicamento (onSupplySelected se llama al elegir del autocomplete)
        const mockSupply = {
            conceptId: '1000001',
            term: 'Paracetamol 500mg',
            fsn: 'Paracetamol 500mg',
            semanticTag: 'producto'
        };
        component.onSupplySelected(mockSupply, 0);
        fixture.detectChanges();

        expect(supplyFormGroup.get('supply.snomedConcept.conceptId').value).toBe('1000001');

        // 3. Completar campos obligatorios del suministro
        supplyFormGroup.patchValue({
            quantity: 1,
            quantityPresentation: 1,
            diagnostic: 'Dolor de cabeza'
        });
        fixture.detectChanges();

        // 4. Submit del formulario
        const spyNewPrescription = jest.spyOn(prescriptionsService, 'newPrescription');

        // Mockeamos el ID del profesional que se envía (ya lo hace el componente internamente desde authService)
        component.onSubmitProfessionalForm({ resetForm: () => { } } as any);

        // Verificamos que se haya intentado llamar al servicio
        expect(spyNewPrescription).toHaveBeenCalled();

        tick();
        fixture.detectChanges();

        // Limpiamos cualquier temporizador pendiente (ej: de debounceTime)
        flush();
        discardPeriodicTasks();
    }));
});
