import { test, expect } from '../../../fixtures/test';
import {
    getPatientId,
    hasCredentials,
    mutationsEnabled,
    statePath,
    uniqueLabel
} from '../../../fixtures/test-data';
import { PatientsHomePage } from '../../../pages/patients-home.page';

test.describe('Detalle y eliminación de pacientes', () => {
    test.use({ storageState: statePath('professional') });
    test.skip(!hasCredentials('professional'), 'Falta configurar usuario profesional');

    test('elimina un paciente con doble confirmación @PAT-015', async ({ page, api }) => {
        test.skip(!mutationsEnabled, 'E2E_SKIP_MUTATIONS=1');
        const disposable = await api.createDisposablePatient({
            firstName: 'Paciente',
            lastName: uniqueLabel('Eliminar E2E'),
            sex: 'Otro'
        });
        const id = getPatientId(disposable);
        const lastName = String(disposable.lastName);

        const patients = new PatientsHomePage(page);
        await patients.goto();
        await patients.search(lastName);
        await patients.openItem(lastName);
        await patients.deleteSelectedPatient();

        await expect.poll(async () => {
            try {
                await api.getPatientById(id);
                return false;
            } catch {
                return true;
            }
        }, { timeout: 15_000 }).toBe(true);
    });

    test('cancelar eliminación conserva al paciente @PAT-016', async ({ page, api }) => {
        test.skip(!mutationsEnabled, 'E2E_SKIP_MUTATIONS=1');
        const disposable = await api.createDisposablePatient({
            firstName: 'Paciente',
            lastName: uniqueLabel('Conservar E2E'),
            sex: 'Otro'
        });
        const id = getPatientId(disposable);
        const lastName = String(disposable.lastName);

        const patients = new PatientsHomePage(page);
        await patients.goto();
        await patients.search(lastName);
        await patients.openItem(lastName);
        await patients.openDeleteDialog();
        await patients.cancelDeleteDialog();

        const stillExists = await api.getPatientById(id);
        expect(stillExists).toBeTruthy();
    });

    test('deep link a paciente inexistente muestra error @PAT-018', async ({ page }) => {
        await page.goto('/pacientes/000000000000000000000000/editar');

        await expect(page.getByText('No pudimos cargar el paciente. Volvé al listado e intentá nuevamente.')).toBeVisible();
    });

    test('paciente sin DNI muestra aviso en el detalle @PAT-022', async ({ page, api }) => {
        test.skip(!mutationsEnabled, 'E2E_SKIP_MUTATIONS=1');
        const disposable = await api.createDisposablePatient({
            firstName: 'Paciente',
            lastName: uniqueLabel('Sin DNI Detalle E2E'),
            sex: 'Otro'
        });
        const lastName = String(disposable.lastName);

        const patients = new PatientsHomePage(page);
        await patients.goto();
        await patients.search(lastName);
        await patients.openItem(lastName);

        await patients.expectDetailContains('Este paciente no tiene DNI. Agregalo desde Editar para poder validarlo.');
    });
});
