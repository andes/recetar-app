import { test, expect } from '../../../fixtures/test';
import {
    hasCredentials,
    mutationsEnabled,
    statePath,
    testData,
    uniqueLabel
} from '../../../fixtures/test-data';
import { NewPrescriptionPage } from '../../../pages/new-prescription.page';
import { PatientFormPage } from '../../../pages/patient-form.page';
import { expectSnackbar } from '../../../support/ui';

test.describe('Alta y edición de paciente en Nueva prescripción', () => {
    test.use({ storageState: statePath('professional') });
    test.skip(!hasCredentials('professional'), 'Falta configurar usuario profesional');

    test('crear paciente sin datos muestra errores de validación @PAC-003', async ({ page }) => {
        const prescription = new NewPrescriptionPage(page);
        const form = new PatientFormPage(page);

        await prescription.goto();
        await prescription.openCreatePatient();
        await form.expectCreateMode();
        await form.save();

        await form.expectError('Debe ingresar el DNI');
        await form.expectError('Debe seleccionar el sexo');
        await form.expectError('Debe ingresar el apellido');
        await form.expectError('Debe ingresar el nombre');
    });

    test('editar paciente valida apellido obligatorio @PAC-004', async ({ page }) => {
        const prescription = new NewPrescriptionPage(page);
        const form = new PatientFormPage(page);

        await prescription.goto();
        await prescription.selectPatientByDni(testData.patient.dni);
        await prescription.openEditPatient();
        await form.expectEditMode();

        await page.getByLabel('Apellido').fill('');
        await form.save();
        await form.expectError('Debe ingresar el apellido');
        await form.cancel();
    });

    test('modo Sin DNI deshabilita DNI y muestra aviso @PAC-005', async ({ page }) => {
        const prescription = new NewPrescriptionPage(page);
        const form = new PatientFormPage(page);

        await prescription.goto();
        await prescription.openCreatePatient();
        await form.switchToWithoutDni();

        await expect(page.getByLabel('DNI')).toBeDisabled();
        await expect(page.getByText(/El paciente quedará como no validado/)).toBeVisible();
        await expect(page.getByRole('button', { name: 'Validar' })).toHaveCount(0);
        await form.cancel();
    });

    test('alta con DNI existente abre diálogo de paciente existente @PAC-007', async ({ page }) => {
        const prescription = new NewPrescriptionPage(page);
        const form = new PatientFormPage(page);

        await prescription.goto();
        await prescription.openCreatePatient();
        await form.fillDni(testData.patient.dni);
        await form.selectSex(testData.patient.sex as 'Femenino' | 'Masculino' | 'Otro');
        await form.fillLastAndFirstName('Paciente', 'Existente');
        await form.save();

        await form.expectDuplicatePatientDialog();
        await form.cancelDuplicatePatient();
    });

    test('editar paciente valida DNI duplicado @PAC-008', async ({ page, api }) => {
        test.skip(!mutationsEnabled, 'E2E_SKIP_MUTATIONS=1');
        const disposable = await api.createDisposablePatient({
            firstName: 'Paciente',
            lastName: uniqueLabel('Duplicado DNI E2E'),
            sex: testData.patient.sex
        });
        const lastName = String(disposable.lastName);

        const prescription = new NewPrescriptionPage(page);
        const form = new PatientFormPage(page);
        await prescription.goto();
        await prescription.searchPatient(lastName);
        await prescription.selectFirstPatientResult();
        await prescription.openEditPatient();
        await form.switchToWithDni();
        await form.fillDni(testData.patient.dni);
        await form.save();

        await form.expectError('Ya existe un paciente con ese DNI');
        await form.cancel();
    });

    test('paciente validado mantiene el DNI bloqueado @PAC-009', async ({ page }) => {
        const prescription = new NewPrescriptionPage(page);
        await prescription.goto();
        await prescription.selectPatientByDni(testData.patient.dni);
        await prescription.openEditPatient();

        await expect(page.getByLabel('DNI')).toBeDisabled();
        await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
    });

    test('edición positiva con paciente descartable @PAC-019', async ({ page, api }) => {
        test.skip(!mutationsEnabled, 'E2E_SKIP_MUTATIONS=1');
        const disposable = await api.createDisposablePatient({
            firstName: 'Paciente',
            lastName: uniqueLabel('Edicion Positiva E2E'),
            sex: 'Otro'
        });
        const lastName = String(disposable.lastName);
        const newName = uniqueLabel('Nombre Editado E2E');

        const prescription = new NewPrescriptionPage(page);
        const form = new PatientFormPage(page);
        await prescription.goto();
        await prescription.searchPatient(lastName);
        await prescription.selectFirstPatientResult();
        await prescription.expectPatientSelected();
        await prescription.openEditPatient();
        await page.getByLabel('Nombre', { exact: true }).fill(newName);
        await form.save();

        await expectSnackbar(page, 'Paciente guardado correctamente');
        await expect(page.getByText(newName).first()).toBeVisible();
    });

    test('cancelar edición no guarda cambios @PAC-020', async ({ page, api }) => {
        test.skip(!mutationsEnabled, 'E2E_SKIP_MUTATIONS=1');
        const disposable = await api.createDisposablePatient({
            firstName: 'Paciente',
            lastName: uniqueLabel('Edicion Cancelada E2E'),
            sex: 'Otro'
        });
        const lastName = String(disposable.lastName);

        const prescription = new NewPrescriptionPage(page);
        const form = new PatientFormPage(page);
        await prescription.goto();
        await prescription.searchPatient(lastName);
        await prescription.selectFirstPatientResult();
        await prescription.openEditPatient();
        await page.getByLabel('Nombre', { exact: true }).fill('Nombre que no debe guardarse');
        await form.cancel();

        await expect(page.getByText(lastName).first()).toBeVisible();
        await expect(page.getByText('Nombre que no debe guardarse')).toHaveCount(0);
    });

    test('edición inválida de CUIL muestra error @PAC-022', async ({ page, api }) => {
        test.skip(!mutationsEnabled, 'E2E_SKIP_MUTATIONS=1');
        const disposable = await api.createDisposablePatient({
            firstName: 'Paciente',
            lastName: uniqueLabel('CUIL Invalido E2E'),
            sex: 'Otro'
        });
        const lastName = String(disposable.lastName);

        const prescription = new NewPrescriptionPage(page);
        const form = new PatientFormPage(page);
        await prescription.goto();
        await prescription.searchPatient(lastName);
        await prescription.selectFirstPatientResult();
        await prescription.openEditPatient();
        await form.fillCuil('123');
        await form.save();

        await form.expectError('El CUIL debe tener 11 dígitos');
        await form.cancel();
    });
});
