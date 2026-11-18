import { test, expect } from '../../fixtures/test';
import {
    decryptCertificatePublicId,
    decryptPracticePublicId,
    encryptCertificatePublicId,
    encryptPracticePublicId,
} from '../../fixtures/public-id';

const PUBLIC_STATE = { cookies: [], origins: [] };

test.describe('Documentos públicos', () => {
    test.use({ storageState: PUBLIC_STATE });

    test('cifra y descifra IDs públicos de certificado y práctica @PUB-001', () => {
        expect(decryptCertificatePublicId(encryptCertificatePublicId('cert-123'))).toBe('cert-123');
        expect(decryptPracticePublicId(encryptPracticePublicId('prac-456'))).toBe('prac-456');
    });

    test('accede sin sesión y resuelve rutas desconocidas @PUB-001', async ({ page, api }) => {
        const certificate = await api.createDisposableCertificate();
        const url = `/certificate/${encryptCertificatePublicId(String(certificate._id))}`;

        await page.goto(url);
        await expect(page.getByRole('heading', { name: 'Certificado Médico' })).toBeVisible();
        await expect(page).not.toHaveURL(/\/auth\/login/);

        const practice = await api.createDisposablePractice();
        await page.goto(`/practice/${encodeURIComponent(encryptPracticePublicId(String(practice._id)))}`);
        await expect(page.getByRole('heading', { name: 'Práctica Médica' })).toBeVisible();
        await expect(page).not.toHaveURL(/\/auth\/login/);

        await page.goto('/ruta-publica-inexistente');
        await expect(page).toHaveURL(/\/404$/);
        await expect(page.getByText('Página no encontrada!')).toBeVisible();
    });

    test('resuelve un identificador válido @PUB-002', async ({ page, api }) => {
        const certificate = await api.createDisposableCertificate();
        const validId = encryptCertificatePublicId(String(certificate._id));

        await page.goto(`/certificate/${validId}`);
        await expect(page.getByRole('heading', { name: 'Certificado Médico' })).toBeVisible();
    });

    test('muestra el estado de carga mientras consulta @PUB-002', async ({ page, api }) => {
        const certificate = await api.createDisposableCertificate();
        const validId = encryptCertificatePublicId(String(certificate._id));

        await page.route('**/api/certificates/**', async (route) => {
            await new Promise((resolve) => setTimeout(resolve, 3000));
            await route.continue();
        });

        await page.goto(`/certificate/${validId}`, { waitUntil: 'commit' });
        await expect(page.getByText('Cargando certificado...')).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Certificado Médico' })).toBeVisible();
    });

    test('muestra un certificado activo @PUB-003', async ({ page, api }) => {
        const certificate = await api.createDisposableCertificate({
            certificate: `Certificado activo E2E ${Date.now()}`,
        });
        const url = `/certificate/${encryptCertificatePublicId(String(certificate._id))}`;

        await page.goto(url);

        await expect(page.getByRole('heading', { name: 'Certificado Médico' })).toBeVisible();
        await expect(page.locator('.certificate-status')).toContainText(/Activo/i);
        await expect(page.getByText('Fecha de Inicio:')).toBeVisible();
        await expect(page.getByText('Cantidad de días:')).toBeVisible();
        await expect(page.getByText('Descripción')).toBeVisible();
        await expect(page.getByText('Profesional')).toBeVisible();
    });

    test('muestra un certificado expirado @PUB-003', async ({ page, api }) => {
        const certificate = await api.createDisposableCertificate({
            startDate: '2020-01-01T00:00:00.000Z',
            cantDias: 2,
        });
        const url = `/certificate/${encryptCertificatePublicId(String(certificate._id))}`;

        await page.goto(url);

        await expect(page.getByRole('heading', { name: 'Certificado Médico' })).toBeVisible();
        await expect(page.locator('.certificate-status')).toContainText(/Expirado/i);
    });

    test('muestra un certificado anulado con motivo @PUB-003', async ({ page, api }) => {
        const certificate = await api.createDisposableCertificate();
        const id = String(certificate._id);
        await api.annulCertificate(id, 'Motivo de anulación E2E');

        await page.goto(`/certificate/${encryptCertificatePublicId(id)}`);

        await expect(page.locator('.certificate-status')).toContainText(/Anulado/i);
        await expect(page.getByRole('heading', { name: 'Motivo de anulación', exact: true })).toBeVisible();
        await expect(page.getByText('Motivo de anulación E2E')).toBeVisible();
        await expect(page.getByText('Fecha anulación:')).toBeVisible();
    });

    test('muestra una práctica con datos y omite secciones opcionales @PUB-004', async ({ page, api }) => {
        const practice = await api.createDisposablePractice({
            practice: `Práctica pública E2E ${Date.now()}`,
            diagnostic: 'Diagnóstico público E2E',
            indications: 'Indicaciones públicas E2E',
        });
        const url = `/practice/${encodeURIComponent(encryptPracticePublicId(String(practice._id)))}`;

        await page.goto(url);

        await expect(page.getByRole('heading', { name: 'Práctica Médica' })).toBeVisible();
        await expect(page.getByText('Descripción de la Práctica')).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Diagnóstico', exact: true })).toBeVisible();
        await expect(page.getByText('Diagnóstico público E2E')).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Indicaciones', exact: true })).toBeVisible();
        await expect(page.getByText('Indicaciones públicas E2E')).toBeVisible();

        const minimal = await api.createDisposablePractice({
            practice: `Práctica mínima E2E ${Date.now()}`,
            diagnostic: '',
            indications: '',
        });
        await page.goto(`/practice/${encodeURIComponent(encryptPracticePublicId(String(minimal._id)))}`);

        await expect(page.getByRole('heading', { name: 'Práctica Médica' })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Diagnóstico', exact: true })).toHaveCount(0);
        await expect(page.getByRole('heading', { name: 'Indicaciones', exact: true })).toHaveCount(0);
        await expect(page.getByRole('heading', { name: 'Observaciones', exact: true })).toHaveCount(0);
    });

    // Bloqueado por bug de producto: los templates de error de ambos componentes
    // públicos usan `matButton="raised"`, apariencia no soportada por Angular Material M3.
    // El render del error rompe la página y no permite asertar el mensaje.
    test.fixme('muestra error con identificador inválido @PUB-002', async ({ page }) => {
        await page.goto('/certificate/id-invalido');
        await expect(page.getByText('ID de certificado inválido')).toBeVisible();
    });

    test.fixme('muestra error con documento inexistente @PUB-002', async ({ page }) => {
        const missingId = encryptCertificatePublicId('000000000000000000000000');
        await page.goto(`/certificate/${missingId}`);
        await expect(page.getByText('Certificado no encontrado o inválido')).toBeVisible();
    });

    test.fixme('muestra error cuando falla la consulta pública @PUB-003', async ({ page, api }) => {
        const certificate = await api.createDisposableCertificate();
        await page.route('**/api/certificates/**', async (route) => {
            await route.fulfill({
                status: 500,
                contentType: 'application/json',
                body: JSON.stringify({ status: 'error', error: { code: 'INTERNAL_ERROR', message: 'Fallo E2E' } }),
            });
        });

        await page.goto(`/certificate/${encryptCertificatePublicId(String(certificate._id))}`);
        await expect(page.getByText('Certificado no encontrado o inválido')).toBeVisible();
    });

    test.fixme('muestra error cuando falla la consulta de la práctica @PUB-004', async ({ page, api }) => {
        const practice = await api.createDisposablePractice();
        await page.route('**/api/practices/**', async (route) => {
            await route.fulfill({
                status: 500,
                contentType: 'application/json',
                body: JSON.stringify({ status: 'error', error: { code: 'INTERNAL_ERROR', message: 'Fallo E2E' } }),
            });
        });

        await page.goto(`/practice/${encodeURIComponent(encryptPracticePublicId(String(practice._id)))}`);
        await expect(page.getByText('Práctica no encontrada o inválida')).toBeVisible();
    });

    // Gap de producto: el componente público de práctica no renderiza la etiqueta
    // de estado (activo/completado/cancelado), aunque el modelo la expone.
    test.fixme('muestra el estado de la práctica @PUB-004', async ({ page, api }) => {
        const practice = await api.createDisposablePractice({ status: 'completed' });
        await page.goto(`/practice/${encodeURIComponent(encryptPracticePublicId(String(practice._id)))}`);
        await expect(page.getByText('Completado')).toBeVisible();
    });
});
