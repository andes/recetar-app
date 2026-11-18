import { test, expect } from '../../fixtures/test';
import {
    hasCredentials,
    mutationsEnabled,
    statePath,
    testData,
    uniqueLabel
} from '../../fixtures/test-data';
import { DispensePage } from '../../pages/dispense.page';

test.describe('Dispensación', () => {
    test.use({ storageState: statePath('pharmacist') });
    test.skip(!hasCredentials('pharmacist'), 'Falta configurar usuario farmacéutico');

    test('dispensa una receta local y permite deshacer @DIS-001', async ({ page, api }) => {
        test.skip(!mutationsEnabled, 'E2E_SKIP_MUTATIONS=1');
        const medication = uniqueLabel('Receta dispensable E2E');
        await api.createPendingPrescription({ medicationName: medication });

        const dispense = new DispensePage(page);
        await dispense.goto();
        await dispense.search(testData.patient.dni);
        await dispense.expectItem(medication);

        await dispense.dispenseFromItem(medication);
        await dispense.expectToast('Dispensa realizada correctamente');
        await expect(page.locator('app-dispense-item').filter({ hasText: medication }).getByRole('button', { name: 'Deshacer', exact: true })).toBeVisible();

        await dispense.undoFromItem(medication);
        await dispense.expectToast('Dispensa deshecha correctamente');
    });

    test('muestra el detalle de la receta en el drawer @DIS-002', async ({ page, api }) => {
        test.skip(!mutationsEnabled, 'E2E_SKIP_MUTATIONS=1');
        const medication = uniqueLabel('Receta detalle dispensar E2E');
        await api.createPendingPrescription({ medicationName: medication });

        const dispense = new DispensePage(page);
        await dispense.goto();
        await dispense.search(testData.patient.dni);
        await dispense.openItem(medication);

        await expect(page.getByText('Detalle de receta')).toBeVisible();
        await expect(page.locator('app-dispense-preview-panel').getByText(medication)).toBeVisible();
    });
});
