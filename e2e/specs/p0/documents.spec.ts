import { test, expect } from '../../fixtures/test';
import {
    hasCredentials,
    mutationsEnabled,
    statePath,
    testData,
    uniqueLabel
} from '../../fixtures/test-data';
import { DocumentsPage } from '../../pages/documents.page';

test.describe('Gestión de documentos', () => {
    test.use({ storageState: statePath('professional') });
    test.skip(!hasCredentials('professional'), 'Falta configurar usuario profesional');

    test('lista y muestra el detalle de una receta @DOC-001', async ({ page, api }) => {
        test.skip(!mutationsEnabled, 'E2E_SKIP_MUTATIONS=1');
        const medication = uniqueLabel('Receta documento E2E');
        await api.createPendingPrescription({ medicationName: medication });

        const documents = new DocumentsPage(page);
        await documents.goto();
        await documents.search(testData.patient.dni);
        await documents.expectItem(medication);
        await documents.openItem(medication);

        await documents.expectDrawerContains(medication);
        await documents.expectDrawerContains('Paciente');
    });

    test('elimina una receta pendiente @DOC-002', async ({ page, api }) => {
        test.skip(!mutationsEnabled, 'E2E_SKIP_MUTATIONS=1');
        const medication = uniqueLabel('Receta a eliminar E2E');
        await api.createPendingPrescription({ medicationName: medication });

        const documents = new DocumentsPage(page);
        await documents.goto();
        await documents.search(testData.patient.dni);
        await documents.expectItem(medication);
        await documents.openItem(medication);
        await documents.clickDrawerAction('Eliminar');
        await documents.confirmDialog('Eliminar receta');

        await documents.expectToast('Receta eliminada');
    });

    test('suspende una receta pendiente @DOC-003', async ({ page, api }) => {
        test.skip(!mutationsEnabled, 'E2E_SKIP_MUTATIONS=1');
        const medication = uniqueLabel('Receta a suspender E2E');
        await api.createPendingPrescription({ medicationName: medication });

        const documents = new DocumentsPage(page);
        await documents.goto();
        await documents.search(testData.patient.dni);
        await documents.expectItem(medication);
        await documents.openItem(medication);
        await documents.clickDrawerAction('Suspender');
        await documents.confirmDialog('Suspender receta');

        await documents.expectToast('Receta suspendida');
    });

    test('anula un certificado @DOC-010', async ({ page, api }) => {
        test.skip(!mutationsEnabled, 'E2E_SKIP_MUTATIONS=1');
        await api.loginAs('professional');
        const certificateText = uniqueLabel('Certificado E2E');
        const patient = await api.getPatientSnapshot();
        await api.createCertificate({
            patient,
            professional: {
                userId: api.getUserIdFromToken('professional'),
                businessName: api.getBusinessNameFromToken('professional')
            },
            startDate: new Date().toISOString(),
            cantDias: 5,
            certificate: certificateText
        });

        const documents = new DocumentsPage(page);
        await documents.goto();
        await documents.selectType('Certificados');
        await documents.search(certificateText);
        await documents.expectItem(certificateText);
        await documents.openItem(certificateText);
        await documents.clickDrawerAction('Anular');
        await documents.confirmDialog('Anular certificado');

        await documents.expectToast('Certificado anulado');
    });

    test('elimina una práctica @DOC-011', async ({ page, api }) => {
        test.skip(!mutationsEnabled, 'E2E_SKIP_MUTATIONS=1');
        await api.loginAs('professional');
        const practiceName = uniqueLabel('Práctica E2E');
        const patient = await api.getPatientSnapshot();
        await api.createPractice({
            date: new Date().toISOString(),
            patient,
            professional: {
                userId: api.getUserIdFromToken('professional')
            },
            practice: practiceName,
            diagnostic: testData.practiceDiagnostic,
            indications: testData.indication
        });

        const documents = new DocumentsPage(page);
        await documents.goto();
        await documents.selectType('Prácticas');
        await documents.search(practiceName);
        await documents.expectItem(practiceName);
        await documents.openItem(practiceName);
        await documents.clickDrawerAction('Eliminar');
        await documents.confirmDialog('Eliminar práctica');

        await documents.expectToast('Práctica eliminada');
    });
});
