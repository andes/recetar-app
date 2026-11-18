import { test, expect } from '../../../fixtures/test';
import {
    getPatientId,
    hasCredentials,
    renaperEnabled,
    statePath,
    testData,
    uniqueLabel
} from '../../../fixtures/test-data';
import { PatientManagementFormPage } from '../../../pages/patient-management-form.page';
import { expectSnackbar } from '../../../support/ui';

test.describe('RENAPER en la pantalla de pacientes', () => {
    test.use({ storageState: statePath('professional') });
    test.skip(!hasCredentials('professional'), 'Falta configurar usuario profesional');

    test('valida un paciente existente @PAT-012 @env:renaper', async ({ page, api }) => {
        test.skip(!renaperEnabled, 'Definir E2E_RENAPER_ENABLED=1 para ejecutar RENAPER');
        const patients = await api.getPatientByDni(testData.renaper.positiveDni);
        const patient = patients[0];
        test.skip(!patient, 'No existe en el ambiente un paciente con el DNI positivo de RENAPER');

        const form = new PatientManagementFormPage(page);
        await form.gotoEdit(getPatientId(patient));
        await form.validate();

        await expectSnackbar(page, 'Paciente validado correctamente', 30_000);
    });

    test('RENAPER no encuentra a la persona @PAT-013', async ({ page, api }) => {
        await page.route('**/api/patients/validate', async (route) => {
            await route.fulfill({
                status: 422,
                contentType: 'application/json',
                body: JSON.stringify({
                    status: 'error',
                    error: {
                        code: 'PATIENT_VALIDATION_NOT_FOUND',
                        message: 'Ciudadano no encontrado'
                    }
                })
            });
        });

        let patient = (await api.getPatientByDni(testData.renaper.negativeDni))[0];

        if (!patient) {
            const disposable = await api.createDisposablePatient({
                firstName: 'Paciente',
                lastName: uniqueLabel('RENAPER Negativo E2E'),
                sex: testData.renaper.negativeSex
            });
            const id = getPatientId(disposable);

            try {
                patient = await api.updatePatient(id, {
                    dni: testData.renaper.negativeDni,
                    sex: testData.renaper.negativeSex
                });
            } catch {
                test.skip(true, 'No se pudo preparar un paciente descartable con el DNI negativo');
                return;
            }
        }

        const form = new PatientManagementFormPage(page);
        await form.gotoEdit(getPatientId(patient));
        await form.validate();

        await expectSnackbar(page, /No se encontró el ciudadano|No se pudo validar|Ciudadano no encontrado/, 30_000);
    });
});
