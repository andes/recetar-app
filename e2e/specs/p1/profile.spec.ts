import { test, expect } from '../../fixtures/test';
import { hasCredentials, statePath } from '../../fixtures/test-data';
import { ProfilePage } from '../../pages/profile.page';

test.describe('Perfil profesional', () => {
    test.use({ storageState: statePath('professional') });
    test.skip(!hasCredentials('professional'), 'Falta configurar usuario profesional');

    test('muestra secciones de PIN y organizaciones @PRO-001', async ({ page }) => {
        const profile = new ProfilePage(page);
        await profile.goto();

        await profile.expectMenuVisible(/PIN de seguridad/);
        await profile.expectMenuVisible(/Organizaciones/);
    });

    test('valida email obligatorio en datos de cuenta @PRO-002', async ({ page }) => {
        const profile = new ProfilePage(page);
        await profile.goto();
        await profile.openSection('Datos de cuenta');

        await page.getByLabel('Email').fill('');
        await page.getByRole('button', { name: 'Guardar cambios' }).click();

        await expect(page.getByText('El email es obligatorio')).toBeVisible();
        await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
    });
});

test.describe('Perfil farmacéutico', () => {
    test.use({ storageState: statePath('pharmacist') });
    test.skip(!hasCredentials('pharmacist'), 'Falta configurar usuario farmacéutico');

    test('no muestra secciones exclusivas de profesional @PRO-010', async ({ page }) => {
        const profile = new ProfilePage(page);
        await profile.goto();

        await profile.expectMenuHidden(/PIN de seguridad/);
        await profile.expectMenuHidden(/Organizaciones/);
    });
});
