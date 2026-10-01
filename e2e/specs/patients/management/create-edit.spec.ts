import { test, expect } from '../../../fixtures/test';
import {
    getPatientId,
    hasCredentials,
    mutationsEnabled,
    statePath,
    testData,
    uniqueLabel
} from '../../../fixtures/test-data';
import { PatientsHomePage } from '../../../pages/patients-home.page';
import { PatientManagementFormPage } from '../../../pages/patient-management-form.page';
import { expectNoSnackbar, expectSnackbar } from '../../../support/ui';

test.describe('Alta y edición en la pantalla de pacientes', () => {
    test.use({ storageState: statePath('professional') });
    test.skip(!hasCredentials('professional'), 'Falta configurar usuario profesional');

    test('validaciones del alta de paciente @PAT-008', async ({ page }) => {
        const form = new PatientManagementFormPage(page);
        await form.gotoCreate();
        await form.save();

        await form.expectError('Debe seleccionar el sexo');
        await form.expectError('Debe ingresar el nombre');
        await form.expectError('Debe ingresar el apellido');
    });

    test('paciente sin DNI no puede validarse @PAT-014', async ({ page, api }) => {
        test.skip(!mutationsEnabled, 'E2E_SKIP_MUTATIONS=1');
        const disposable = await api.createDisposablePatient({
            firstName: 'Paciente',
            lastName: uniqueLabel('Sin DNI Validar E2E'),
            sex: 'Otro'
        });

        const form = new PatientManagementFormPage(page);
        await form.gotoEdit(getPatientId(disposable));
        await form.expectValidationStatus('Sin validar');
        await form.expectValidateButtonNeutral();
        await form.expectButtonDisabled(/^(Validar|Volver a validar)$/);
    });

    test('muestra estado validado y botón neutral @PAT-031', async ({ page, api }) => {
        const matches = await api.searchPatients(testData.patient.dni);
        const patient = matches[0];
        test.skip(!patient, `No se encontró el paciente base ${testData.patient.dni}`);
        if (!patient) {
            return;
        }

        const form = new PatientManagementFormPage(page);
        await form.gotoEdit(getPatientId(patient));
        await form.expectValidationStatus('Validado');
        await form.expectValidateButtonNeutral();
    });

    test('crea un paciente sin DNI y lo muestra en el listado @PAT-007', async ({ page, api }) => {
        test.skip(!mutationsEnabled, 'E2E_SKIP_MUTATIONS=1');
        const lastName = uniqueLabel('Alta Sin DNI E2E');
        const form = new PatientManagementFormPage(page);
        await form.gotoCreate();
        await form.selectSex('Otro');
        await form.fillBasicData({ firstName: 'Paciente', lastName });
        await form.save();

        await expect(page).toHaveURL(/\/pacientes/);
        await expectSnackbar(page, 'Paciente guardado correctamente');

        const patients = new PatientsHomePage(page);
        await patients.search(lastName);
        await patients.expectItem(lastName);

        const matches = await api.searchPatients(lastName);
        const created = matches.find((item) => item.lastName === lastName);
        if (created) {
            await api.deletePatient(getPatientId(created));
        }
    });

    test('crea un paciente con DNI existente sin duplicarlo @PAT-006', async ({ page }) => {
        const form = new PatientManagementFormPage(page);
        await form.gotoCreate();
        await form.fillDni(testData.patient.dni);
        await form.selectSex(testData.patient.sex as 'Femenino' | 'Masculino' | 'Otro');
        await form.fillBasicData({ firstName: 'Paciente', lastName: 'Existente' });
        await form.save();

        await expect(page).toHaveURL(/\/pacientes/);
        await expectSnackbar(page, 'Paciente guardado correctamente');
    });

    test('edición positiva con paciente descartable @PAT-009', async ({ page, api }) => {
        test.skip(!mutationsEnabled, 'E2E_SKIP_MUTATIONS=1');
        const disposable = await api.createDisposablePatient({
            firstName: 'Paciente',
            lastName: uniqueLabel('Edicion Positiva Gestion E2E'),
            sex: 'Otro'
        });
        const id = getPatientId(disposable);
        const newLastName = uniqueLabel('Apellido Editado E2E');

        const form = new PatientManagementFormPage(page);
        await form.gotoEdit(id);
        await form.fillBasicData({ firstName: 'Paciente Editado', lastName: newLastName });
        await form.fillContactData({ email: 'paciente.e2e@example.com' });
        await form.save();

        await expect(page).toHaveURL(/\/pacientes/);
        await expectSnackbar(page, 'Paciente guardado correctamente');

        const updated = await api.getPatientById(id);
        expect(updated.firstName).toBe('Paciente Editado');
        expect(String(updated.lastName).toLowerCase()).toBe(newLastName.toLowerCase());
    });

    test('edición negativa con campos obligatorios @PAT-010', async ({ page, api }) => {
        test.skip(!mutationsEnabled, 'E2E_SKIP_MUTATIONS=1');
        const disposable = await api.createDisposablePatient({
            firstName: 'Paciente',
            lastName: uniqueLabel('Edicion Negativa Gestion E2E'),
            sex: 'Otro'
        });

        const form = new PatientManagementFormPage(page);
        await form.gotoEdit(getPatientId(disposable));
        await page.getByLabel('Nombre', { exact: true }).fill('');
        await form.save();

        await form.expectError('Debe ingresar el nombre');
        await form.cancel();
        await form.expectDiscardDialog();
        await form.confirmDiscard();
    });

    test('edición con DNI duplicado muestra error @PAT-011', async ({ page, api }) => {
        test.skip(!mutationsEnabled, 'E2E_SKIP_MUTATIONS=1');
        const disposable = await api.createDisposablePatient({
            firstName: 'Paciente',
            lastName: uniqueLabel('DNI Duplicado Gestion E2E'),
            sex: testData.patient.sex
        });

        const form = new PatientManagementFormPage(page);
        await form.gotoEdit(getPatientId(disposable));
        await form.fillDni(testData.patient.dni);
        await form.save();

        await form.expectServerError('Ya existe un paciente con ese DNI');
        await form.cancel();
        await form.expectDiscardDialog();
        await form.confirmDiscard();
    });

    test('cancelar y salir sin guardar no persiste @PAT-017', async ({ page, api }) => {
        test.skip(!mutationsEnabled, 'E2E_SKIP_MUTATIONS=1');
        const disposable = await api.createDisposablePatient({
            firstName: 'Paciente',
            lastName: uniqueLabel('Cambios Sin Guardar E2E'),
            sex: 'Otro'
        });
        const id = getPatientId(disposable);
        const original = await api.getPatientById(id);
        const requests: string[] = [];
        page.on('request', (req) => {
            const url = new URL(req.url());
            if (url.pathname.startsWith('/api/patients')) {
                requests.push(`${req.method()} ${url.pathname}`);
            }
        });

        const form = new PatientManagementFormPage(page);
        await form.gotoEdit(id);
        await page.getByLabel('Nombre', { exact: true }).fill('Nombre modificado');
        await form.cancel();

        await form.expectDiscardDialog();
        await form.confirmDiscard();

        await expect(page).toHaveURL(/\/pacientes(\?.*)?$/);
        await expectNoSnackbar(page, 'Paciente guardado correctamente');
        expect(requests.some((req) => req.startsWith('PATCH /api/patients/'))).toBe(false);

        const current = await api.getPatientById(id);
        expect(current.firstName).toBe(original.firstName);
    });

    test('seguir editando conserva cambios y no persiste @PAT-023', async ({ page, api }) => {
        test.skip(!mutationsEnabled, 'E2E_SKIP_MUTATIONS=1');
        const disposable = await api.createDisposablePatient({
            firstName: 'Paciente',
            lastName: uniqueLabel('Seguir Editando E2E'),
            sex: 'Otro'
        });
        const id = getPatientId(disposable);
        const original = await api.getPatientById(id);
        const requests: string[] = [];
        page.on('request', (req) => {
            const url = new URL(req.url());
            if (url.pathname.startsWith('/api/patients')) {
                requests.push(`${req.method()} ${url.pathname}`);
            }
        });

        const form = new PatientManagementFormPage(page);
        await form.gotoEdit(id);
        await page.getByLabel('Nombre', { exact: true }).fill('Nombre conservado');
        await form.cancel();
        await form.expectDiscardDialog();
        await form.cancelDiscard();

        await form.expectStillEditing();
        await form.expectFieldValue('Nombre', 'Nombre conservado');
        expect(requests.some((req) => req.startsWith('PATCH /api/patients/'))).toBe(false);

        const current = await api.getPatientById(id);
        expect(current.firstName).toBe(original.firstName);
    });

    test('atrás del navegador y salir sin guardar no persiste @PAT-024', async ({ page, api }) => {
        test.skip(!mutationsEnabled, 'E2E_SKIP_MUTATIONS=1');
        const disposable = await api.createDisposablePatient({
            firstName: 'Paciente',
            lastName: uniqueLabel('Atras Sin Guardar E2E'),
            sex: 'Otro'
        });
        const id = getPatientId(disposable);
        const original = await api.getPatientById(id);
        const requests: string[] = [];
        page.on('request', (req) => {
            const url = new URL(req.url());
            if (url.pathname.startsWith('/api/patients')) {
                requests.push(`${req.method()} ${url.pathname}`);
            }
        });

        const patients = new PatientsHomePage(page);
        const form = new PatientManagementFormPage(page);
        await patients.goto();
        await patients.search(String(disposable.lastName));
        await patients.editItem(String(disposable.lastName));
        await page.getByLabel('Nombre', { exact: true }).fill('Nombre desde atrás');
        const navigation = page.goBack({ timeout: 10_000 }).catch(() => null);

        await form.expectDiscardDialog();
        await form.confirmDiscard();
        await navigation;
        await expect(page).toHaveURL(/\/pacientes(\?.*)?$/);
        expect(requests.some((req) => req.startsWith('PATCH /api/patients/'))).toBe(false);

        const current = await api.getPatientById(id);
        expect(current.firstName).toBe(original.firstName);
    });

    test('atrás del navegador y seguir editando conserva el formulario @PAT-025', async ({ page, api }) => {
        test.skip(!mutationsEnabled, 'E2E_SKIP_MUTATIONS=1');
        const disposable = await api.createDisposablePatient({
            firstName: 'Paciente',
            lastName: uniqueLabel('Atras Seguir Editando E2E'),
            sex: 'Otro'
        });
        const patients = new PatientsHomePage(page);
        const form = new PatientManagementFormPage(page);
        await patients.goto();
        await patients.search(String(disposable.lastName));
        await patients.editItem(String(disposable.lastName));
        await page.getByLabel('Nombre', { exact: true }).fill('Nombre conservado atrás');
        const navigation = page.goBack({ timeout: 10_000 }).catch(() => null);

        await form.expectDiscardDialog();
        await form.cancelDiscard();
        await navigation;
        await form.expectStillEditing();
        await form.expectFieldValue('Nombre', 'Nombre conservado atrás');
    });

    test('guardar sigue persistiendo los cambios @PAT-026', async ({ page, api }) => {
        test.skip(!mutationsEnabled, 'E2E_SKIP_MUTATIONS=1');
        const disposable = await api.createDisposablePatient({
            firstName: 'Paciente',
            lastName: uniqueLabel('Guardar E2E'),
            sex: 'Otro'
        });
        const id = getPatientId(disposable);
        const newName = uniqueLabel('Nombre Guardado E2E');

        const form = new PatientManagementFormPage(page);
        await form.gotoEdit(id);
        await page.getByLabel('Nombre', { exact: true }).fill(newName);
        await form.save();

        await expect(page).toHaveURL(/\/pacientes(\?.*)?$/);
        await expectSnackbar(page, 'Paciente guardado correctamente');
        const current = await api.getPatientById(id);
        expect(String(current.firstName).toLowerCase()).toBe(newName.toLowerCase());
    });

    test('errores del tab Contacto @PAT-021', async ({ page, api }) => {
        test.skip(!mutationsEnabled, 'E2E_SKIP_MUTATIONS=1');
        const disposable = await api.createDisposablePatient({
            firstName: 'Paciente',
            lastName: uniqueLabel('Contacto Invalido E2E'),
            sex: 'Otro'
        });

        const form = new PatientManagementFormPage(page);
        await form.gotoEdit(getPatientId(disposable));
        await form.fillContactData({ email: 'no-es-un-email' });
        await form.save();

        await form.expectError('El email no es válido');
        await form.cancel();
        await form.expectDiscardDialog();
        await form.confirmDiscard();
    });
});

