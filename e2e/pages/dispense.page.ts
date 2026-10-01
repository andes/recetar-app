import { Page, expect } from '@playwright/test';
import { expectSnackbar } from '../support/ui';

export class DispensePage {
    constructor(private readonly page: Page) {}

    async goto(): Promise<void> {
        await this.page.goto('/dispensar-nuevo');
        await expect(this.page.getByRole('heading', { name: 'Dispensar' })).toBeVisible();
    }

    async search(term: string): Promise<void> {
        await this.page.locator('input[placeholder*="Buscar por DNI, nombre del paciente"]').first().fill(term);
    }

    async expectItem(text: string): Promise<void> {
        await expect(this.page.locator('app-dispense-item').filter({ hasText: text }).first()).toBeVisible();
    }

    async openItem(text: string): Promise<void> {
        await this.page.locator('app-dispense-item').filter({ hasText: text }).first().click();
        await expect(this.page.locator('app-dispense-preview-panel')).toBeVisible();
    }

    async dispenseFromItem(text: string): Promise<void> {
        const item = this.page.locator('app-dispense-item').filter({ hasText: text }).first();
        await expect(item).toBeVisible();
        await item.getByRole('button', { name: 'Dispensar', exact: true }).click();

        const dialog = this.page.getByRole('dialog').last();
        await expect(dialog.getByText('Confirmar dispensacion')).toBeVisible();
        await dialog.getByRole('button', { name: 'Dispensar', exact: true }).click();
    }

    async dispenseFromDrawer(): Promise<void> {
        await this.page.locator('.drawer-actions').getByRole('button', { name: 'Dispensar', exact: true }).click();
        const dialog = this.page.getByRole('dialog').last();
        await expect(dialog.getByText('Confirmar dispensacion')).toBeVisible();
        await dialog.getByRole('button', { name: 'Dispensar', exact: true }).click();
    }

    async undoFromItem(text: string): Promise<void> {
        const item = this.page.locator('app-dispense-item').filter({ hasText: text }).first();
        await item.getByRole('button', { name: 'Deshacer', exact: true }).click();
    }

    async expectToast(text: string | RegExp): Promise<void> {
        await expectSnackbar(this.page, text);
    }

    async expectPublicationWarning(text: string | RegExp): Promise<void> {
        await expect(this.page.getByText(text).first()).toBeVisible();
    }

    async expectDispenseDisabled(text: string): Promise<void> {
        const item = this.page.locator('app-dispense-item').filter({ hasText: text }).first();
        await expect(item.getByRole('button', { name: 'Dispensar', exact: true })).toBeDisabled();
    }
}
