import { test, expect } from '../../fixtures/test';
import { credentialsFor, hasCredentials, statePath } from '../../fixtures/test-data';
import { LoginPage } from '../../pages/login.page';

test.describe('Login', () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test('login exitoso redirige al dashboard @AUTH-001', async ({ page }) => {
        test.skip(!hasCredentials('professional'), 'Falta configurar E2E_USER_PROFESSIONAL / E2E_PASS_PROFESSIONAL');
        const credentials = credentialsFor('professional')!;

        const login = new LoginPage(page);
        await login.goto();
        await login.login(credentials.username, credentials.password);
        await login.expectDashboard();
    });

    test('credenciales inválidas muestran error visible @AUTH-002', async ({ page }) => {
        test.skip(!hasCredentials('professional'), 'Falta configurar el entorno de login');
        test.fail(true, 'Bug conocido: LoginComponent guarda el error pero la plantilla no lo renderiza.');

        const login = new LoginPage(page);
        await login.goto();
        await login.login('usuario-inexistente-e2e', 'clave-incorrecta-e2e');

        await expect(page).toHaveURL(/\/auth\/login/);
        await login.expectLoginError();
    });

    test('sin sesión redirige al login @AUTH-003', async ({ page }) => {
        test.skip(!hasCredentials('professional'), 'Falta configurar el entorno de login');
        await page.goto('/prescription/new');
        await expect(page).toHaveURL(/\/auth\/login/);
    });
});

test.describe('Acceso por rol', () => {
    test.use({ storageState: statePath('professional') });
    test.skip(!hasCredentials('professional'), 'Falta configurar usuario profesional');

    test('profesional es redirigido al salir de dispensación @ROLE-001', async ({ page }) => {
        await page.goto('/dispensar-nuevo');
        await expect(page).toHaveURL(/\/profesionales\/recetas\/nueva/);
    });

    test('profesional ve Documentos y Pacientes en el menú @ROLE-002', async ({ page }) => {
        await page.goto('/dashboard');
        await expect(page.getByText('Documentos', { exact: true })).toBeVisible();
        await expect(page.getByText('Pacientes', { exact: true })).toBeVisible();
    });
});

test.describe('Acceso farmacéutico', () => {
    test.use({ storageState: statePath('pharmacist') });
    test.skip(!hasCredentials('pharmacist'), 'Falta configurar usuario farmacéutico');

    test('farmacéutico es redirigido al salir de auditoría @ROLE-003', async ({ page }) => {
        await page.goto('/audit/recetas/auditar');
        await expect(page).toHaveURL(/\/farmacias\/recetas\/dispensar/);
    });

    test('farmacéutico ve Dispensar en el menú @ROLE-004', async ({ page }) => {
        await page.goto('/dashboard');
        await expect(page.getByText('Dispensar', { exact: true })).toBeVisible();
    });
});

test.describe('Acceso auditor', () => {
    test.use({ storageState: statePath('auditor') });
    test.skip(!hasCredentials('auditor'), 'Falta configurar usuario auditor');

    test('auditor es redirigido al salir de dispensación @ROLE-005', async ({ page }) => {
        await page.goto('/dispensar-nuevo');
        await expect(page).toHaveURL(/\/audit\/recetas\/auditar/);
    });

    test('auditor ve Auditoría y Usuarios en el menú @ROLE-006', async ({ page }) => {
        await page.goto('/dashboard');
        await expect(page.getByText('Auditar recetas', { exact: true })).toBeVisible();
        await expect(page.getByText('Usuarios', { exact: true })).toBeVisible();
    });
});
