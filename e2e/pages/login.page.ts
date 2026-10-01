import { Page, expect } from '@playwright/test';

export class LoginPage {
    constructor(private readonly page: Page) {}

    async goto(): Promise<void> {
        await this.page.goto('/auth/login');
        await expect(this.page.getByRole('heading', { name: 'Iniciar sesión' })).toBeVisible();
    }

    async login(username: string, password: string): Promise<void> {
        await this.page.getByLabel('Usuario').fill(username);
        await this.page.getByLabel('Contraseña').fill(password);
        await this.page.getByRole('button', { name: 'Iniciar sesión' }).click();
    }

    async expectDashboard(): Promise<void> {
        await expect(this.page).toHaveURL(/\/dashboard/);
        await expect(this.page.getByRole('heading', { name: 'Bienvenido a RecetAR' })).toBeVisible();
    }

    async expectLoginError(): Promise<void> {
        await expect(this.page.getByText(/Credenciales inválidas|Usuario o contraseña|No autorizado/i)).toBeVisible();
    }
}
