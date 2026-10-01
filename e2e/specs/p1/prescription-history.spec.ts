import { test, expect } from '../../fixtures/test';
import {
    hasCredentials,
    mutationsEnabled,
    statePath,
    testData,
    uniqueLabel
} from '../../fixtures/test-data';
import { NewPrescriptionPage } from '../../pages/new-prescription.page';
import { escapeRegExp } from '../../support/ui';

test.describe('Historial y reutilización', () => {
    test.use({ storageState: statePath('professional') });
    test.skip(!hasCredentials('professional'), 'Falta configurar usuario profesional');

    test('reutiliza una receta previa @HIS-001', async ({ page, api }) => {
        test.skip(!mutationsEnabled, 'E2E_SKIP_MUTATIONS=1');
        const medication = uniqueLabel('Receta reutilizable E2E');
        await api.createPendingPrescription({ medicationName: medication });

        const prescription = new NewPrescriptionPage(page);
        await prescription.goto();
        await prescription.selectPatientByDni(testData.patient.dni);

        const historyItem = page.locator('mat-expansion-panel.history-panel')
            .filter({ hasText: new RegExp(escapeRegExp(medication), 'i') })
            .first();
        await expect(historyItem).toBeVisible();
        await historyItem.locator('.rx-reuse-btn').click();

        // Reutilizar abre el medicamento en modo edición, por eso no se ve el draft-list.
        await expect(page.getByRole('heading', { name: 'Editar medicamento' })).toBeVisible();
        await expect(page.locator('app-medication-search'))
            .toContainText(new RegExp(escapeRegExp(medication), 'i'));
    });

    test('muestra tratamiento prolongado en el borrador @HIS-002', async ({ page }) => {
        const prescription = new NewPrescriptionPage(page);
        await prescription.goto();
        await prescription.selectPatientByDni(testData.patient.dni);
        await prescription.addCommercialMedication({
            query: testData.medicationQuery,
            quantity: '1',
            diagnostic: testData.diagnostic,
            treatment: '6 meses'
        });

        await prescription.expectDraftContains('Tratamiento 6 meses');
    });
});
