import { test, expect } from '../../fixtures/test';
import {
    hasCredentials,
    mutationsEnabled,
    statePath,
    testData,
    todayForDateField,
    uniqueLabel
} from '../../fixtures/test-data';
import { NewPrescriptionPage } from '../../pages/new-prescription.page';

test.describe('Certificados', () => {
    test.use({ storageState: statePath('professional') });
    test.skip(!hasCredentials('professional'), 'Falta configurar usuario profesional');

    test('valida campos obligatorios del certificado @CERT-001', async ({ page }) => {
        const prescription = new NewPrescriptionPage(page);
        await prescription.goto();
        await prescription.selectPatientByDni(testData.patient.dni);
        await prescription.openCertificateForm();
        await page.getByLabel('Cantidad de días').fill('0');
        await page.getByRole('button', { name: 'Agregar certificado' }).click();

        await expect(page.getByText('Debe ingresar el tipo de certificado')).toBeVisible();
        await expect(page.getByText('Mínimo 1 día')).toBeVisible();
    });

    test('crea un certificado y lo deja en el historial @CERT-002', async ({ page, api }) => {
        test.skip(!mutationsEnabled, 'E2E_SKIP_MUTATIONS=1');
        const certificateText = uniqueLabel('Certificado UI E2E');

        const prescription = new NewPrescriptionPage(page);
        await prescription.goto();
        await prescription.selectPatientByDni(testData.patient.dni);
        await prescription.openCertificateForm();
        await prescription.fillCertificate(certificateText, todayForDateField(), '2');
        await prescription.saveCertificate();
        await prescription.expectDraftContains(certificateText);

        await prescription.finalize();
        await prescription.expectSuccessToast('Certificado creado exitosamente');

        const certificate = await api.findCertificateByText(certificateText);
        expect(certificate).not.toBeNull();
        api.trackExistingCertificate(String(certificate!._id));
    });
});

test.describe('Prácticas', () => {
    test.use({ storageState: statePath('professional') });
    test.skip(!hasCredentials('professional'), 'Falta configurar usuario profesional');

    test('valida campos obligatorios de la práctica @PRAC-001', async ({ page }) => {
        const prescription = new NewPrescriptionPage(page);
        await prescription.goto();
        await prescription.selectPatientByDni(testData.patient.dni);
        await prescription.openPracticeForm();
        await page.getByRole('button', { name: 'Agregar práctica' }).click();

        await expect(page.getByText('Debe ingresar la práctica')).toBeVisible();
        await expect(page.getByText('El diagnóstico es requerido')).toBeVisible();
    });

    test('crea una práctica y la deja en el historial @PRAC-002', async ({ page, api }) => {
        test.skip(!mutationsEnabled, 'E2E_SKIP_MUTATIONS=1');
        const practiceName = uniqueLabel('Práctica UI E2E');

        const prescription = new NewPrescriptionPage(page);
        await prescription.goto();
        await prescription.selectPatientByDni(testData.patient.dni);
        await prescription.openPracticeForm();
        await prescription.fillPractice(practiceName, testData.practiceDiagnostic, testData.indication);
        await prescription.savePractice();
        await prescription.expectDraftContains(practiceName);

        await prescription.finalize();
        await prescription.expectSuccessToast('Práctica creada exitosamente');

        const practice = await api.findPracticeByName(practiceName);
        expect(practice).not.toBeNull();
        api.trackExistingPractice(String(practice!._id));
    });
});
