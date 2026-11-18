import { test, expect } from '../../fixtures/test';
import { statePath, uniqueSuffix } from '../../fixtures/test-data';
import { LoginPage } from '../../pages/login.page';

const EMPTY_STATE = { cookies: [], origins: [] };

test.describe('Restauración de sesión', () => {
    test.use({ storageState: statePath('professional') });

    test('restaura la sesión al iniciar @SES-001', async ({ page }) => {
        await page.goto('/dashboard');

        await expect(page.getByRole('heading', { name: 'Bienvenido a RecETAR' })).toBeVisible();
        const tokens = await page.evaluate(() => ({
            jwt: localStorage.getItem('JWT_TOKEN'),
            refresh: localStorage.getItem('REFRESH_TOKEN'),
        }));
        expect(tokens.jwt).toBeTruthy();
        expect(tokens.refresh).toBeTruthy();
    });
});

test.describe('Renovación de token', () => {
    test.use({ storageState: statePath('professional') });

    test('renueva el token ante un 406 y conserva la sesión @SES-002', async ({ page, api }) => {
        const token = await api.loginAs('professional');
        const refreshToken = 'e2e-refresh-token';
        let refreshCalls = 0;
        let loginCalls = 0;

        await page.route('**/api/auth/refresh', async (route) => {
            refreshCalls += 1;
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ status: 'success', data: { jwt: token, refreshToken } }),
            });
        });

        await page.route('**/api/auth/jwt-login', async (route) => {
            loginCalls += 1;
            if (loginCalls === 1) {
                await route.fulfill({
                    status: 406,
                    contentType: 'application/json',
                    body: JSON.stringify({ status: 'error', error: { code: 'TOKEN_EXPIRED', message: 'Token vencido' } }),
                });
                return;
            }
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ status: 'success', data: { jwt: token, refreshToken } }),
            });
        });

        await page.goto('/dashboard');

        await expect(page.getByRole('heading', { name: 'Bienvenido a RecETAR' })).toBeVisible();
        expect(refreshCalls).toBe(1);
        expect(loginCalls).toBeGreaterThanOrEqual(2);
        await expect(page).not.toHaveURL(/\/auth\/login/);
    });
});

test.describe('Cierre de sesión', () => {
    test.use({ storageState: statePath('professional') });

    test('limpia tokens y protege rutas @SES-003', async ({ page }) => {
        await page.goto('/dashboard');
        await page.locator('.ui-user-menu-trigger').click();
        await page.getByRole('button', { name: 'Salir' }).click();

        await expect(page).toHaveURL(/\/auth\/login/);
        const tokens = await page.evaluate(() => ({
            jwt: localStorage.getItem('JWT_TOKEN'),
            refresh: localStorage.getItem('REFRESH_TOKEN'),
        }));
        expect(tokens.jwt).toBeNull();
        expect(tokens.refresh).toBeNull();

        await page.goto('/perfil');
        await expect(page).toHaveURL(/\/auth\/login/);
    });
});

test.describe('Contraseña', () => {
    test.use({ storageState: EMPTY_STATE });

    test('cambia la contraseña y valida el login con la nueva clave @SES-004', async ({ page, api }) => {
        const suffix = uniqueSuffix();
        const username = `e2e-password-${suffix}`;
        const oldPassword = 'E2e!Passw0rd';
        const newPassword = 'Nueva!Passw0rd';
        await api.createDisposableUser({ username, password: oldPassword });

        const login = new LoginPage(page);
        await login.goto();
        await login.login(username, oldPassword);
        await expect(page).not.toHaveURL(/\/auth\/login/);

        await page.goto('/perfil');
        await page.locator('.menu-item').filter({ hasText: 'Contraseña' }).click();
        await page.getByLabel('Contraseña actual').fill(oldPassword);
        await page.getByLabel('Nueva contraseña').fill(newPassword);
        await page.getByLabel('Confirmar contraseña').fill(newPassword);
        await page.getByRole('button', { name: 'Cambiar contraseña', exact: true }).click();

        await expect(page.locator('notification-snackbar')).toContainText(/contraseña/i);

        await page.evaluate(() => localStorage.clear());
        await login.goto();
        await login.login(username, newPassword);
        await expect(page).not.toHaveURL(/\/auth\/login/);

        await page.evaluate(() => localStorage.clear());
        await login.goto();
        await login.login(username, oldPassword);
        await expect(page).toHaveURL(/\/auth\/login/);
        const oldLoginToken = await page.evaluate(() => localStorage.getItem('JWT_TOKEN'));
        expect(oldLoginToken).toBeNull();
    });

    test('valida y recupera contraseña con token @SES-004', async ({ page }) => {
        await page.goto('/auth/recovery-password/token-e2e');

        await page.getByLabel('Nueva contraseña').fill('Nueva!Passw0rd');
        await page.getByLabel('Confirmar contraseña').fill('Otra!Passw0rd');
        await page.getByRole('button', { name: 'Cambiar contraseña' }).click();
        await expect(page.getByText('Las contraseñas no coinciden')).toBeVisible();

        await page.route('**/api/auth/recovery-password', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ status: 'success', data: 'Contraseña actualizada correctamente' }),
            });
        });

        await page.getByLabel('Confirmar contraseña').fill('Nueva!Passw0rd');
        await page.getByRole('button', { name: 'Cambiar contraseña' }).click();

        await expect(page.locator('.mat-mdc-snack-bar-label').last()).toContainText(/Contraseña actualizada/i);
        await expect(page).toHaveURL(/\/auth\/login/, { timeout: 10000 });
    });
});

test.describe('Registro', () => {
    test.use({ storageState: EMPTY_STATE });

    test('valida campos obligatorios del registro profesional @SES-005', async ({ page }) => {
        await page.route('https://challenges.cloudflare.com/turnstile/v0/api.js*', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/javascript',
                body: `window.turnstile = { render: () => 'e2e-widget', reset: () => {}, remove: () => {}, getResponse: () => undefined };`,
            });
        });

        await page.goto('/auth/new-user');
        await page.getByRole('button', { name: 'Crear cuenta' }).click();

        await expect(page.getByText('El DNI es obligatorio')).toBeVisible();
        await expect(page.getByText('El CUIL es obligatorio')).toBeVisible();
        await expect(page.getByText('El email es obligatorio')).toBeVisible();
        await expect(page.getByText('Completá el captcha para continuar.')).toBeVisible();
    });

    test('valida campos obligatorios del registro de farmacia @SES-005', async ({ page }) => {
        await page.route('https://challenges.cloudflare.com/turnstile/v0/api.js*', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/javascript',
                body: `window.turnstile = { render: () => 'e2e-widget', reset: () => {}, remove: () => {}, getResponse: () => undefined };`,
            });
        });

        await page.goto('/auth/new-user-pharmacist');
        await page.getByRole('button', { name: 'Crear cuenta' }).click();

        await expect(page.getByText(/obligatorio|obligatoria/i).first()).toBeVisible();
        await expect(page.getByText('Completá el captcha para continuar.')).toBeVisible();
    });

    test('crea una cuenta profesional con captcha mockeado @SES-005', async ({ page }) => {
        const suffix = uniqueSuffix();
        let registerPayload: Record<string, unknown> | null = null;

        await page.route('https://challenges.cloudflare.com/turnstile/v0/api.js*', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/javascript',
                body: `
                    window.turnstile = {
                        render: (el, options) => {
                            setTimeout(() => options.callback('e2e-captcha'), 0);
                            return 'e2e-widget';
                        },
                        reset: () => {},
                        remove: () => {},
                        getResponse: () => 'e2e-captcha'
                    };
                    if (window.onloadTurnstileCallback) window.onloadTurnstileCallback();
                `,
            });
        });

        await page.route('**/api/auth/authorizedProfessions', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ status: 'success', data: [{ codigoProfesion: 1, profesion: 'Médico' }] }),
            });
        });

        await page.route('**/api/auth/register', async (route) => {
            registerPayload = route.request().postDataJSON() as Record<string, unknown>;
            await route.fulfill({
                status: 201,
                contentType: 'application/json',
                body: JSON.stringify({ status: 'success', data: { newUser: { businessName: 'E2E Profesional' } } }),
            });
        });

        await page.goto('/auth/new-user');
        await page.getByLabel('DNI').fill('26810582');
        await page.getByLabel('CUIL').fill('27268105829');
        await page.getByLabel('N° matrícula provincial').fill('5488');
        await page.getByLabel('Profesión').selectOption({ label: 'Médico' });
        await page.getByLabel('Fecha de egreso').fill('2020-01-01');
        await page.getByLabel('Vencimiento de matrícula').fill('2030-01-01');
        await page.getByLabel('Email').fill(`e2e-register-${suffix}@e2e.local`);
        await page.getByLabel('Contraseña').fill('E2e!Passw0rd');
        await page.getByRole('button', { name: 'Crear cuenta' }).click();

        await expect(page.locator('notification-snackbar')).toContainText(/Cuenta creada/i);
        await expect(page).toHaveURL(/\/auth\/login/);
        expect(registerPayload).not.toBeNull();
        expect(String(registerPayload!['email'])).toContain('e2e-register-');
        expect(String(registerPayload!['captcha'])).toBe('e2e-captcha');
    });

    test('crea una cuenta de farmacia con captcha mockeado @SES-005', async ({ page }) => {
        const suffix = uniqueSuffix();
        let registerPayload: Record<string, unknown> | null = null;

        await page.route('https://challenges.cloudflare.com/turnstile/v0/api.js*', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/javascript',
                body: `
                    window.turnstile = {
                        render: (el, options) => {
                            setTimeout(() => options.callback('e2e-captcha'), 0);
                            return 'e2e-widget';
                        },
                        reset: () => {},
                        remove: () => {},
                        getResponse: () => 'e2e-captcha'
                    };
                    if (window.onloadTurnstileCallback) window.onloadTurnstileCallback();
                `,
            });
        });

        await page.route('**/api/auth/pharmacies-andes*', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    status: 'success',
                    data: [{
                        disposicionHabilitacion: '12345',
                        matriculaDTResponsable: '5488',
                        vencimientoHabilitacion: '2030-01-01',
                    }],
                }),
            });
        });

        await page.route('**/api/auth/register', async (route) => {
            registerPayload = route.request().postDataJSON() as Record<string, unknown>;
            await route.fulfill({
                status: 201,
                contentType: 'application/json',
                body: JSON.stringify({ status: 'success', data: { newUser: { businessName: 'Farmacia E2E' } } }),
            });
        });

        await page.goto('/auth/new-user-pharmacist');
        await page.getByLabel('CUIT de la farmacia').fill('27268105829');
        await page.getByLabel('N° disposición de habilitación').fill('12345');
        await page.getByLabel('Matrícula del director técnico').fill('5488');
        await page.getByLabel('Vencimiento de habilitación').fill('2030-01-01');
        await page.getByLabel('Email').fill(`e2e-farmacia-${suffix}@e2e.local`);
        await page.getByLabel('Contraseña').fill('E2e!Passw0rd');
        await page.getByRole('button', { name: 'Crear cuenta' }).click();

        await expect(page.locator('notification-snackbar')).toContainText(/Cuenta creada/i);
        await expect(page).toHaveURL(/\/auth\/login/);
        expect(registerPayload).not.toBeNull();
        expect(String(registerPayload!['captcha'])).toBe('e2e-captcha');
    });

    // Bloqueado por bug de producto: el template de confirm-update usa
    // `matButton="raised"`, apariencia no soportada por Angular Material M3.
    test.fixme('confirma la actualización de datos @SES-005', async ({ page }) => {
        await page.route('**/api/users/confirm-email-update', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ status: 'success', data: true }),
            });
        });

        await page.goto('/auth/confirm-update/token-e2e');
        await expect(page.getByText('Actualización confirmada exitosamente')).toBeVisible();
    });
});
