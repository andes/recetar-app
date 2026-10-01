import { test, expect } from '../../fixtures/test';
import { hasCredentials, statePath, testData } from '../../fixtures/test-data';
import { NewPrescriptionPage } from '../../pages/new-prescription.page';

test.describe('Búsqueda y carga de medicamentos', () => {
    test.use({ storageState: statePath('professional') });
    test.skip(!hasCredentials('professional'), 'Falta configurar usuario profesional');

    test('búsqueda sin resultados muestra estado vacío @MED-001', async ({ page }) => {
        const prescription = new NewPrescriptionPage(page);
        await prescription.goto();
        await prescription.selectPatientByDni(testData.patient.dni);
        await prescription.openMedicationForm();
        await prescription.searchMedication(testData.medicationQueryWithoutResults);

        await prescription.expectNoMedicationResults();
    });

    test('permite editar y quitar un medicamento del borrador @MED-002', async ({ page }) => {
        const prescription = new NewPrescriptionPage(page);
        await prescription.goto();
        await prescription.selectPatientByDni(testData.patient.dni);
        await prescription.addCommercialMedication({
            query: testData.medicationQuery,
            quantity: '1',
            diagnostic: testData.diagnostic
        });

        await prescription.editFirstDraftMedication();
        await page.getByLabel('Cantidad', { exact: true }).fill('2');
        await prescription.confirmMedication();
        await expect(page.locator('.draft-item .qty-value')).toHaveText('2');

        await prescription.removeFirstDraftMedication();
        await prescription.expectDraftEmpty();
    });

    test('bloquea el cuarto medicamento @MED-003', async ({ page }) => {
        const prescription = new NewPrescriptionPage(page);
        await prescription.goto();
        await prescription.selectPatientByDni(testData.patient.dni);

        for (let i = 0; i < 3; i++) {
            await prescription.addCommercialMedication({
                query: testData.medicationQuery,
                quantity: '1',
                diagnostic: `${testData.diagnostic} ${i + 1}`
            });
        }

        await prescription.expectDraftItemCount(3);
        await prescription.openMedicationForm();
        await prescription.searchMedication(testData.medicationQuery);
        await prescription.selectFirstMedicationResult();
        await prescription.fillMedicationDetails({ quantity: '1', diagnostic: testData.diagnostic });
        await prescription.confirmMedication();

        await prescription.expectMedicationLimitWarning();
        expect(await page.locator('.sidebar-items .sidebar-item').count()).toBe(3);
    });
});

test.describe('Medicamento magistral', () => {
    test.use({ storageState: statePath('professional') });
    test.skip(!hasCredentials('professional'), 'Falta configurar usuario profesional');

    test('en organización privada permite carga manual @MED-010', async ({ page }) => {
        test.skip(!testData.organizationPrivateName, 'Definir E2E_ORG_PRIVATE_NAME');

        const prescription = new NewPrescriptionPage(page);
        await prescription.goto();
        await prescription.selectPatientByDni(testData.patient.dni);
        await prescription.selectOrganization(testData.organizationPrivateName);
        await prescription.openMedicationForm();
        await prescription.enableMagistralMode();

        await prescription.expectManualMagistralInput();
        await prescription.fillManualMagistral('Magistral manual E2E');
        await prescription.fillMedicationDetails({ quantity: '1', diagnostic: testData.diagnostic });
        await prescription.confirmMedication();
        await prescription.expectDraftContains('Magistral manual E2E');
    });

    test('en organización pública busca magistrales en ANDES @MED-011', async ({ page }) => {
        test.skip(!testData.organizationPublicName, 'Definir E2E_ORG_PUBLIC_NAME');

        const prescription = new NewPrescriptionPage(page);
        await prescription.goto();
        await prescription.selectPatientByDni(testData.patient.dni);
        await prescription.selectOrganization(testData.organizationPublicName);
        await prescription.openMedicationForm();
        await prescription.enableMagistralMode();

        await prescription.expectMagistralSearch();
    });
});
