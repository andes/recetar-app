import { Page, expect } from '@playwright/test';
import { expectSnackbar } from '../support/ui';

export class DocumentsPage {
    constructor(private readonly page: Page) {}

    async goto(): Promise<void> {
        await this.page.goto('/documentos');
        await expect(this.page.getByRole('heading', { name: 'Gestión de Documentos' })).toBeVisible();
    }

    async selectType(label: 'Recetas' | 'Certificados' | 'Prácticas'): Promise<void> {
        await this.page.locator('.type-toggle-section').getByRole('button', { name: new RegExp(label, 'i') }).click();
    }

    async search(term: string): Promise<void> {
        await this.page.locator('input[placeholder*="Buscar por paciente, DNI, medicamento"]').first().fill(term);
    }

    async expectItem(text: string): Promise<void> {
        await expect(this.page.locator('app-document-item').filter({ hasText: text }).first()).toBeVisible();
    }

    async openItem(text: string): Promise<void> {
        await this.page.locator('app-document-item').filter({ hasText: text }).first().click();
        await expect(this.page.locator('app-document-detail-panel')).toBeVisible();
    }

    async expectDrawerContains(text: string | RegExp): Promise<void> {
        await expect(this.page.locator('app-document-detail-panel').getByText(text).first()).toBeVisible();
    }

    async clickDrawerAction(name: 'Imprimir' | 'Suspender' | 'Eliminar' | 'Anular'): Promise<void> {
        await this.page.locator('.drawer-actions').getByRole('button', { name, exact: true }).click();
    }

    async confirmDialog(title: string): Promise<void> {
        const dialog = this.page.getByRole('dialog').last();
        await expect(dialog.getByText(title)).toBeVisible();
        await dialog.getByRole('button', { name: 'Confirmar', exact: true }).click();
    }

    async expectToast(text: string | RegExp): Promise<void> {
        await expectSnackbar(this.page, text);
    }

    async expectEmpty(term: string): Promise<void> {
        await expect(this.page.getByText(new RegExp(`No se encontraron ${term}`, 'i'))).toBeVisible();
    }
}
