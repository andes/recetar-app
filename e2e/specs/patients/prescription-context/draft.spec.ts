import { test, expect } from '../../../fixtures/test';
import {
    hasCredentials,
    mutationsEnabled,
    statePath,
    testData
} from '../../../fixtures/test-data';
import { NewPrescriptionPage } from '../../../pages/new-prescription.page';

test.describe('Paciente y borrador en Nueva prescripción', () => {
    test.use({ storageState: statePath('professional') });
    test.skip(!hasCredentials('professional'), 'Falta configurar usuario profesional');

    test('quitar paciente limpia el borrador @PAC-015', async ({ page }) => {
        test.skip(!mutationsEnabled, 'E2E_SKIP_MUTATIONS=1');
        const prescription = new NewPrescriptionPage(page);
        await prescription.goto();
        await prescription.selectPatientByDni(testData.patient.dni);
        await prescription.addCommercialMedication({
            query: testData.medicationQuery,
            quantity: '1',
            diagnostic: testData.diagnostic
        });
        await prescription.expectDraftContains(testData.diagnostic);

        await prescription.removePatient();

        await prescription.expectDraftEmpty();
        await prescription.expectFinalizeDisabled();
    });


});
