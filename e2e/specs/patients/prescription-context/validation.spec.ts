import type { Page } from '@playwright/test';
import { test, expect } from '../../../fixtures/test';
import { hasCredentials, statePath, testData } from '../../../fixtures/test-data';
import { NewPrescriptionPage } from '../../../pages/new-prescription.page';
import { PatientFormPage } from '../../../pages/patient-form.page';
import { expectSnackbar } from '../../../support/ui';

const FAKE_DNI = '30000000';

function mockValidatedPatient(): Record<string, unknown> {
    return {
        _id: 'patient-validado-e2e',
        idMPI: 'patient-validado-e2e',
        dni: FAKE_DNI,
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

test.describe('Validación dentro de Nueva prescripción', () => {
    test.use({ storageState: statePath('professional') });
    test.skip(!hasCredentials('professional'), 'Falta configurar usuario profesional');

    test('validar y cancelar el alta no persiste @PAC-027', async ({ page }) => {
        const requests = trackPatientRequests(page);
        const validated = mockValidatedPatient();

        await page.route('**/api/patients/validate', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ status: 'success', data: validated })
            });
        });

        const prescription = new NewPrescriptionPage(page);
        const form = new PatientFormPage(page);
        await prescription.goto();
        await prescription.openCreatePatient();
        await form.fillDni(FAKE_DNI);
        await form.selectSex(testData.renaper.positiveSex as 'Femenino' | 'Masculino' | 'Otro');
        await form.validate();
        await expectSnackbar(page, 'Paciente validado correctamente');

        await form.cancel();

        expect(requests.filter((req) => req === 'POST /api/patients/validate')).toHaveLength(1);
        expect(requests.some((req) => /^POST \/api\/patients\/[^/]+\/validate$/.test(req))).toBe(false);
        expect(requests.some((req) => req === 'POST /api/patients')).toBe(false);
        expect(requests.some((req) => req.startsWith('PATCH /api/patients/'))).toBe(false);
    });

    test('validar y guardar el alta persiste al paciente @PAC-028', async ({ page }) => {
        const requests = trackPatientRequests(page);
        const validated = mockValidatedPatient();

        await page.route('**/api/patients/validate', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ status: 'success', data: validated })
            });
        });
        await page.route(new RegExp(`/api/patients/dni/${FAKE_DNI}$`), async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ status: 'success', data: [] })
            });
        });
        await page.route(/\/api\/patients$/, async (route) => {
            if (route.request().method() !== 'POST') {
                await route.continue();
                return;
            }
            await route.fulfill({
                status: 201,
                contentType: 'application/json',
                body: JSON.stringify({ status: 'success', data: validated })
            });
        });

        const prescription = new NewPrescriptionPage(page);
        const form = new PatientFormPage(page);
        await prescription.goto();
        await prescription.openCreatePatient();
        await form.fillDni(FAKE_DNI);
        await form.selectSex(testData.renaper.positiveSex as 'Femenino' | 'Masculino' | 'Otro');
        await form.validate();
        await expectSnackbar(page, 'Paciente validado correctamente');
        await form.save();

        await prescription.expectPatientSelected();
        await expectSnackbar(page, 'Paciente guardado correctamente');

        expect(requests.filter((req) => req === 'POST /api/patients/validate')).toHaveLength(1);
        expect(requests.some((req) => req === `GET /api/patients/dni/${FAKE_DNI}`)).toBe(true);
        expect(requests.some((req) => req === 'POST /api/patients')).toBe(true);
        expect(requests.some((req) => /^POST \/api\/patients\/[^/]+\/validate$/.test(req))).toBe(false);
    });
});
