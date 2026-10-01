import { test, expect } from '../../../fixtures/test';
import { hasCredentials, statePath, testData } from '../../../fixtures/test-data';
import { NewPrescriptionPage } from '../../../pages/new-prescription.page';

test.describe('Paciente dentro de Nueva prescripción', () => {
    test.use({ storageState: statePath('professional') });
    test.skip(!hasCredentials('professional'), 'Falta configurar usuario profesional');

    test('busca y selecciona un paciente por DNI @PAC-001', async ({ page }) => {
        const prescription = new NewPrescriptionPage(page);
        await prescription.goto();
        await prescription.selectPatientByDni(testData.patient.dni);
        await prescription.expectPatientSelected();
    });

    test('muestra estado vacío cuando no hay resultados @PAC-002', async ({ page }) => {
        const prescription = new NewPrescriptionPage(page);
        await prescription.goto();
        await prescription.searchPatient('zzzz-paciente-inexistente-e2e');
        await prescription.expectPatientNotFound();
    });

    test('muestra pacientes frecuentes sin búsqueda @PAC-016', async ({ page }) => {
        const prescription = new NewPrescriptionPage(page);
        await prescription.goto();

        await expect(page.getByText('Pacientes frecuentes', { exact: true })).toBeVisible();
    });
});
