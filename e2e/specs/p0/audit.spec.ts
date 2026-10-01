import { test, expect } from '../../fixtures/test';
import {
    hasCredentials,
    mutationsEnabled,
    statePath,
    testData,
    uniqueLabel
} from '../../fixtures/test-data';
import { AuditPage } from '../../pages/audit.page';

test.describe('Auditoría de recetas', () => {
    test.use({ storageState: statePath('auditor') });
    test.skip(!hasCredentials('auditor'), 'Falta configurar usuario auditor');

    test('encuentra recetas dispensadas por CUIT @AUD-001', async ({ page, api }) => {
        test.skip(!mutationsEnabled, 'E2E_SKIP_MUTATIONS=1');
        test.skip(!hasCredentials('pharmacist'), 'Falta configurar usuario farmacéutico');

        await api.loginAs('pharmacist');
        const pharmacistName = api.getBusinessNameFromToken('pharmacist');
        const medication = uniqueLabel('Receta auditoría E2E');
        await api.createAndDispensePrescription({ medicationName: medication });

        const audit = new AuditPage(page);
        await audit.gotoPrescriptions();
        await audit.searchCuit(testData.pharmacyCuil);

        await audit.expectDispenser(pharmacistName);
        await audit.expectPrescriptionItem(medication);
    });

    test('valida CUIT inválido @AUD-002', async ({ page }) => {
        const audit = new AuditPage(page);
        await audit.gotoPrescriptions();
        await audit.searchCuit('abc');

        await audit.expectCuitError('El CUIT debe contener solo números');
    });

    test('lista usuarios de auditoría @AUD-010', async ({ page }) => {
        const audit = new AuditPage(page);
        await audit.gotoUsers();

        await expect(page.locator('app-audit-user-item').first()).toBeVisible();
    });
});
