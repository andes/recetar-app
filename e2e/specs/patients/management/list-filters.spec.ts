import { test, expect } from '../../../fixtures/test';
import {
    hasCredentials,
    statePath,
    testData
} from '../../../fixtures/test-data';
import { PatientsHomePage } from '../../../pages/patients-home.page';

test.describe('Listado y búsqueda de pacientes', () => {
    test.use({ storageState: statePath('professional') });
    test.skip(!hasCredentials('professional'), 'Falta configurar usuario profesional');

    test('muestra el estado inicial del listado @PAT-001', async ({ page }) => {
        const patients = new PatientsHomePage(page);
        await patients.goto();
        await patients.expectEmpty();
    });

    test('busca un paciente por DNI @PAT-002', async ({ page, api }) => {
        const patient = await api.getPatientSnapshot();
        const patients = new PatientsHomePage(page);
        await patients.goto();
        await patients.search(testData.patient.dni);
        await patients.expectItem(patient.lastName);
    });

    test('filtra pacientes por estado y limpia filtros @PAT-003', async ({ page, api }) => {
        const patient = await api.getPatientSnapshot();
        const patients = new PatientsHomePage(page);
        await patients.goto();
        await patients.search(testData.patient.dni);
        await patients.openFilters();
        await patients.selectEstado('validado');
        await patients.expectItem(patient.lastName);

        await patients.clearFilters();
        await patients.expectItem(patient.lastName);
    });

    test('abre el detalle de un paciente @PAT-005', async ({ page, api }) => {
        const patient = await api.getPatientSnapshot();
        const patients = new PatientsHomePage(page);
        await patients.goto();
        await patients.search(testData.patient.dni);
        await patients.expectItem(patient.lastName);
        await patients.openItem(patient.lastName);

        await patients.expectDetailContains(patient.lastName);
        await patients.expectDetailContains(testData.patient.dni);
    });
});

test.describe('Acceso a pacientes por rol', () => {
    test.use({ storageState: statePath('pharmacist') });
    test.skip(!hasCredentials('pharmacist'), 'Falta configurar usuario farmacéutico');

    test('farmacéutico es redirigido al intentar entrar a pacientes @PAT-019', async ({ page }) => {
        await page.goto('/pacientes');
        await expect(page).toHaveURL(/\/dispensar-nuevo/);
    });
});

test.describe('Acceso auditor a pacientes', () => {
    test.use({ storageState: statePath('auditor') });
    test.skip(!hasCredentials('auditor'), 'Falta configurar usuario auditor');

    test('auditor puede acceder a pacientes @PAT-019', async ({ page }) => {
        await page.goto('/pacientes');
        await expect(page.getByRole('heading', { name: 'Pacientes' })).toBeVisible();
    });
});
