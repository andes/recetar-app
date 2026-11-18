import { test, expect } from '../../fixtures/test';
import { hasCredentials, statePath, testData } from '../../fixtures/test-data';
import { NewPrescriptionPage } from '../../pages/new-prescription.page';

test.describe('Validaciones de medicamento', () => {
    test.use({ storageState: statePath('professional') });
    test.skip(!hasCredentials('professional'), 'Falta configurar usuario profesional');

    test('diagnóstico obligatorio @REC-010', async ({ page }) => {
        const prescription = new NewPrescriptionPage(page);
        await prescription.goto();
        await prescription.selectPatientByDni(testData.patient.dni);
        await prescription.openMedicationForm();
        await prescription.searchMedication(testData.medicationQuery);
        await prescription.selectFirstMedicationResult();
        await prescription.fillMedicationDetails({ quantity: '1' });
        await prescription.confirmMedication();

        await prescription.expectMedicationValidationError('El diagnóstico es requerido');
    });

    test('cantidad mínima 1 @REC-011', async ({ page }) => {
        const prescription = new NewPrescriptionPage(page);
        await prescription.goto();
        await prescription.selectPatientByDni(testData.patient.dni);
        await prescription.openMedicationForm();
        await prescription.searchMedication(testData.medicationQuery);
        await prescription.selectFirstMedicationResult();
        await prescription.fillMedicationDetails({ quantity: '0', diagnostic: testData.diagnostic });
        await prescription.confirmMedication();

        await prescription.expectMedicationValidationError('Mínimo 1');
    });

    test('triplicado exige serie y número @REC-012', async ({ page }) => {
        const prescription = new NewPrescriptionPage(page);
        await prescription.goto();
        await prescription.selectPatientByDni(testData.patient.dni);
        await prescription.openMedicationForm();
        await prescription.searchMedication(testData.medicationQuery);
        await prescription.selectFirstMedicationResult();
        await prescription.fillMedicationDetails({
            quantity: '1',
            diagnostic: testData.diagnostic,
            triplicate: true
        });
        await prescription.confirmMedication();

        await prescription.expectMedicationValidationError('La serie es requerida');
        await prescription.expectMedicationValidationError('El número es requerido');
    });

    test('tratamiento personalizado valida rango 2-12 @REC-013', async ({ page }) => {
        const prescription = new NewPrescriptionPage(page);
        await prescription.goto();
        await prescription.selectPatientByDni(testData.patient.dni);
        await prescription.openMedicationForm();
        await prescription.searchMedication(testData.medicationQuery);
        await prescription.selectFirstMedicationResult();
        await prescription.fillMedicationDetails({
            quantity: '1',
            diagnostic: testData.diagnostic,
            treatment: 'Personalizado',
            customMonths: '1'
        });
        await prescription.confirmMedication();
        await prescription.expectMedicationValidationError('Mínimo 2 meses');

        await page.getByLabel('Cantidad de meses').fill('13');
        await prescription.confirmMedication();
        await prescription.expectMedicationValidationError('Máximo 12 meses');
    });

    test('muestra aviso de borrador pendiente y permite continuar @REC-014', async ({ page }) => {
        await page.route('**/api/prescriptions', async (route) => {
            if (route.request().method() === 'POST') {
                await route.fulfill({
                    status: 500,
                    contentType: 'application/json',
                    body: JSON.stringify({ status: 'error', error: { code: 'INTERNAL_ERROR', message: 'Fallo E2E' } })
                });
                return;
            }
            await route.continue();
        });

        const prescription = new NewPrescriptionPage(page);
        await prescription.goto();
        await prescription.selectPatientByDni(testData.patient.dni);
        await prescription.selectFirstOrganizationIfNeeded();
        await prescription.addCommercialMedication({
            query: testData.medicationQuery,
            quantity: '1',
            diagnostic: testData.diagnostic
        });
        await prescription.finalize();
        await prescription.expectInlineError(/Fallo E2E|No se pudo emitir la receta/);

        await page.unroute('**/api/prescriptions');
        await page.reload();
        await prescription.expectPendingBanner();
        await prescription.resumePending();
        await prescription.expectDraftContains(testData.diagnostic);
    });
});

test.describe('PIN de seguridad', () => {
    test.use({ storageState: statePath('pin') });
    test.skip(process.env.E2E_PIN_REQUIRED !== '1', 'Definir E2E_PIN_REQUIRED=1 y un usuario con PIN activo');

    test('PIN incorrecto reabre el diálogo con error @REC-020 @env:pin', async ({ page }) => {
        const prescription = new NewPrescriptionPage(page);
        await prescription.goto();
        await prescription.selectPatientByDni(testData.patient.dni);
        await prescription.selectFirstOrganizationIfNeeded();
        await prescription.addCommercialMedication({
            query: testData.medicationQuery,
            quantity: '1',
            diagnostic: testData.diagnostic
        });
        await prescription.finalize(false);

        const dialog = page.getByRole('dialog').last();
        await expect(dialog.getByText('Confirmar receta')).toBeVisible();
        await dialog.getByLabel('PIN de seguridad').fill(testData.wrongPin);
        await dialog.getByRole('button', { name: 'Confirmar con PIN' }).click();

        await expect(dialog.getByText('PIN incorrecto. Intentá de nuevo.')).toBeVisible();
        await dialog.getByRole('button', { name: 'Cancelar' }).click();
    });
});
