import { test, expect } from '../../../fixtures/test';
import {
    hasCredentials,
    renaperEnabled,
    statePath,
    testData
} from '../../../fixtures/test-data';
import { NewPrescriptionPage } from '../../../pages/new-prescription.page';
import { PatientFormPage } from '../../../pages/patient-form.page';
import { expectSnackbar } from '../../../support/ui';

test.describe('RENAPER dentro de Nueva prescripción', () => {
    test.use({ storageState: statePath('professional') });
    test.skip(!hasCredentials('professional'), 'Falta configurar usuario profesional');

    test('valida una persona existente en RENAPER @PAC-010 @env:renaper', async ({ page }) => {
        test.skip(!renaperEnabled, 'Definir E2E_RENAPER_ENABLED=1 para ejecutar RENAPER');
        const prescription = new NewPrescriptionPage(page);
        const form = new PatientFormPage(page);

        await prescription.goto();
        await prescription.openCreatePatient();
        await form.fillDni(testData.renaper.positiveDni);
        await form.selectSex(testData.renaper.positiveSex as 'Femenino' | 'Masculino' | 'Otro');
        await form.validate();

        await expectSnackbar(page, 'Paciente validado correctamente', 30_000);
        await expect(page.getByLabel('Nombre', { exact: true })).not.toHaveValue('');
        await expect(page.getByLabel('Apellido')).not.toHaveValue('');
        await form.cancel();
    });

    test('valida sin DNI ni sexo muestra aviso @PAC-011', async ({ page }) => {
        const prescription = new NewPrescriptionPage(page);
        const form = new PatientFormPage(page);

        await prescription.goto();
        await prescription.openCreatePatient();
        await form.validate();

        await expectSnackbar(page, 'Debe ingresar DNI y Sexo para validar');
        await form.cancel();
    });

    test('RENAPER no encuentra a la persona @PAC-012', async ({ page }) => {
        await page.route('**/api/patients/validate', async (route) => {
            await route.fulfill({
                status: 422,
                contentType: 'application/json',
                body: JSON.stringify({
                    status: 'error',
                    error: {
                        code: 'VALIDATION_NOT_FOUND',
                        message: 'Ciudadano no encontrado'
                    }
                })
            });
        });

        const prescription = new NewPrescriptionPage(page);
        const form = new PatientFormPage(page);

        await prescription.goto();
        await prescription.openCreatePatient();
        await form.fillDni(testData.renaper.negativeDni);
        await form.selectSex(testData.renaper.negativeSex as 'Femenino' | 'Masculino' | 'Otro');
        await form.validate();

        await expectSnackbar(page, /Persona no encontrada|No fue posible validar|Ciudadano no encontrado/, 30_000);
        await form.cancel();
    });
});
