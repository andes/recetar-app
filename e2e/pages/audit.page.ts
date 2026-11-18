import { Page, expect } from '@playwright/test';

export class AuditPage {
    constructor(private readonly page: Page) {}

    async gotoPrescriptions(): Promise<void> {
        await this.page.goto('/audit/recetas/auditar');
        await expect(this.page.getByRole('heading', { name: 'Auditoría de recetas' })).toBeVisible();
    }

    async gotoUsers(): Promise<void> {
        await this.page.goto('/audit/users');
        await expect(this.page.getByRole('heading', { name: 'Gestión de usuarios' })).toBeVisible();
    }

    async searchCuit(cuit: string): Promise<void> {
        const input = this.page.locator('input[placeholder="Ingrese el CUIT de la farmacia"]').first();
        await input.fill(cuit);
        // El mensaje de validación sólo se muestra cuando el control queda tocado.
        await input.blur();
    }

    async expectCuitError(message: string | RegExp): Promise<void> {
        await expect(this.page.getByText(message)).toBeVisible();
    }

    async expectDispenser(name: string): Promise<void> {
        await expect(this.page.locator('.dispenser-name')).toContainText(new RegExp(name, 'i'));
    }

    async expectPrescriptionItem(text: string): Promise<void> {
        await expect(this.page.locator('app-prescription-item').filter({ hasText: text }).first()).toBeVisible();
    }

    async openPrescriptionItem(text: string): Promise<void> {
        await this.page.locator('app-prescription-item').filter({ hasText: text }).first().click();
        await expect(this.page.locator('app-prescription-detail-panel')).toBeVisible();
    }

    async expectEmpty(text: string | RegExp): Promise<void> {
        await expect(this.page.getByText(text)).toBeVisible();
    }

    async searchUser(term: string): Promise<void> {
        await this.page.locator('input[placeholder="Buscar por nombre, usuario, email o CUIL"]').first().fill(term);
    }

    async expectUserItem(text: string): Promise<void> {
        await expect(this.page.locator('app-audit-user-item').filter({ hasText: text }).first()).toBeVisible();
    }

    async openUserItem(text: string): Promise<void> {
        await this.page.locator('app-audit-user-item').filter({ hasText: text }).first().click();
        await expect(this.page.getByText('Editar usuario', { exact: true })).toBeVisible();
    }
}
