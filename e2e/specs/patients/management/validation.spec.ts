import type { Page } from '@playwright/test';
import { test, expect } from '../../../fixtures/test';
import {
    getPatientId,
    hasCredentials,
    mutationsEnabled,
    statePath,
    testData,
    uniqueLabel
} from '../../../fixtures/test-data';
import { PatientManagementFormPage } from '../../../pages/patient-management-form.page';
import { expectSnackbar } from '../../../support/ui';

function mockValidatedPatient(id: string): Record<string, unknown> {
    return {
        _id: id,
        idMPI: id,
        dni: testData.renaper.positiveDni,
        firstName: 'Paciente',
        lastName: 'Validado E2E',
        sex: testData.renaper.positiveSex,
        fechaNac: '1990-01-01T00:00:00.000Z',
        cuil: '20320569746',
        status: 'validado',
        estado: 'validado',
        contactos: [],
        direcciones: []
    };
}

function trackPatientRequests(page: Page): string[] {
    const requests: string[] = [];
    page.on('request', (req) => {
        const url = new URL(req.url());
        if (url.pathname.startsWith('/api/patients')) {
            requests.push(`${req.method()} ${url.pathname}`);
        }
    });
    return requests;
}

test.describe('Validación de pacientes y persistencia', () => {
    test.use({ storageState: statePath('professional') });
    test.skip(!hasCredentials('professional'), 'Falta configurar usuario profesional');

    test('validar y cancelar no persiste al paciente @PAT-027', async ({ page, api }) => {
        test.skip(!mutationsEnabled, 'E2E_SKIP_MUTATIONS=1');
        const disposable = await api.createDisposablePatient({
            firstName: 'Paciente',
            lastName: uniqueLabel('Validacion Preview E2E'),
            sex: 'Otro'
        });
        const id = getPatientId(disposable);
        const requests = trackPatientRequests(page);
        const validated = mockValidatedPatient(id);

        await page.route('**/api/patients/validate', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ status: 'success', data: validated })
            });
        });

        const form = new PatientManagementFormPage(page);
        await form.gotoEdit(id);
        await form.fillDni(testData.renaper.positiveDni);
        await form.validate();
        await expectSnackbar(page, 'Paciente validado correctamente');

        await form.cancel();
        await form.expectDiscardDialog();
        await form.confirmDiscard();
        await expect(page).toHaveURL(/\/pacientes(\?.*)?$/);

        expect(requests.filter((req) => req === 'POST /api/patients/validate')).toHaveLength(1);
        expect(requests.some((req) => /^POST \/api\/patients\/[^/]+\/validate$/.test(req))).toBe(false);
        expect(requests.some((req) => req.startsWith('PATCH /api/patients/'))).toBe(false);
    });

    test('validar y guardar persiste validación y datos @PAT-028', async ({ page, api }) => {
        test.skip(!mutationsEnabled, 'E2E_SKIP_MUTATIONS=1');
        const disposable = await api.createDisposablePatient({
            firstName: 'Paciente',
            lastName: uniqueLabel('Validacion Persistida E2E'),
            sex: 'Otro'
        });
        const id = getPatientId(disposable);
        const requests = trackPatientRequests(page);
        const validated = mockValidatedPatient(id);

        await page.route('**/api/patients/validate', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ status: 'success', data: validated })
            });
        });
        await page.route(/\/api\/patients\/[^/]+\/validate$/, async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ status: 'success', data: validated })
            });
        });
        await page.route(/\/api\/patients\/[0-9a-f]{24}$/, async (route) => {
            if (route.request().method() !== 'PATCH') {
                await route.continue();
                return;
            }
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ status: 'success', data: validated })
            });
        });

        const form = new PatientManagementFormPage(page);
        await form.gotoEdit(id);
        await form.fillDni(testData.renaper.positiveDni);
        await form.validate();
        await expectSnackbar(page, 'Paciente validado correctamente');

        await form.save();
        await expect(page).toHaveURL(/\/pacientes(\?.*)?$/);
        await expectSnackbar(page, 'Paciente guardado correctamente');

        expect(requests.filter((req) => req === 'POST /api/patients/validate')).toHaveLength(1);
        expect(requests.some((req) => /^POST \/api\/patients\/[^/]+\/validate$/.test(req))).toBe(true);
        expect(requests.some((req) => /^PATCH \/api\/patients\/[^/]+$/.test(req))).toBe(true);
    });
});

