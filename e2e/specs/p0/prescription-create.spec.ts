import { test, expect } from '../../fixtures/test';
import {
    hasCredentials,
    mutationsEnabled,
    statePath,
    testData
} from '../../fixtures/test-data';
import { NewPrescriptionPage } from '../../pages/new-prescription.page';

test.describe('Creación de receta', () => {
    test.use({ storageState: statePath('professional') });
    test.skip(!hasCredentials('professional'), 'Falta configurar usuario profesional');

    test('sin paciente no se puede finalizar @REC-001', async ({ page }) => {
        const prescription = new NewPrescriptionPage(page);
        await prescription.goto();

        await expect(page.getByText('Primero seleccioná un paciente para ver documentos.')).toBeVisible();
        await prescription.expectFinalizeDisabled();
    });

    test('con paciente y sin medicamento no se puede finalizar @REC-002', async ({ page }) => {
        const prescription = new NewPrescriptionPage(page);
        await prescription.goto();
        await prescription.selectPatientByDni(testData.patient.dni);
        await prescription.selectFirstOrganizationIfNeeded();

        await prescription.expectFinalizeDisabled();
    });

    test('crea una receta comercial y limpia el borrador @REC-003', async ({ page, api }) => {
        test.skip(!mutationsEnabled, 'E2E_SKIP_MUTATIONS=1');
        const before = (await api.findByDni(testData.patient.dni)).map((item) => item._id);

        const prescription = new NewPrescriptionPage(page);
        await prescription.goto();
        await prescription.selectPatientByDni(testData.patient.dni);
        await prescription.selectFirstOrganizationIfNeeded();

        await prescription.addCommercialMedication({
            query: testData.medicationQuery,
            quantity: '1',
            diagnostic: testData.diagnostic,
            indication: testData.indication
        });

        await prescription.expectDraftContains(testData.diagnostic);
        await prescription.expectFinalizeEnabled();
        await prescription.finalize();
        await prescription.expectSuccessToast(/Receta creada exitosamente/, 60_000);
        await prescription.expectDraftEmpty();

        const created = await api.trackNewPrescriptionsForDni(testData.patient.dni, before);
        expect(created.length, 'La emisión debe crear al menos una receta en el backend').toBeGreaterThan(0);
    });

    test('muestra error inline cuando el backend rechaza la emisión @REC-004', async ({ page }) => {
        const prescription = new NewPrescriptionPage(page);
        await page.route('**/api/prescriptions', async (route) => {
            if (route.request().method() === 'POST') {
                await route.fulfill({
                    status: 422,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        status: 'error',
                        error: {
                            code: 'VALIDATION_ERROR',
                            message: 'Error de validación E2E',
                            details: [{ field: 'supplies', message: 'Medicamento rechazado por E2E' }]
                        }
                    })
                });
                return;
            }
            await route.continue();
        });

        await prescription.goto();
        await prescription.selectPatientByDni(testData.patient.dni);
        await prescription.selectFirstOrganizationIfNeeded();
        await prescription.addCommercialMedication({
            query: testData.medicationQuery,
            quantity: '1',
            diagnostic: testData.diagnostic
        });
        await prescription.finalize();

        await prescription.expectInlineError(/Error de validación E2E|Medicamento rechazado por E2E/);
        await prescription.expectDraftContains(testData.diagnostic);
    });
});
