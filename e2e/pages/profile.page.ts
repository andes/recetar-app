import { Page, expect } from '@playwright/test';

export class ProfilePage {
    constructor(private readonly page: Page) {}

    async goto(): Promise<void> {
        await this.page.goto('/perfil');
        await expect(this.page.getByText('Configuración y seguridad')).toBeVisible();
    }

    async openSection(label: 'Datos de cuenta' | 'Contraseña' | 'PIN de seguridad' | 'Organizaciones'): Promise<void> {
        await this.page.locator('.menu').getByRole('button', { name: new RegExp(label, 'i') }).click();
    }

    async expectSectionHeading(text: string | RegExp): Promise<void> {
        await expect(this.page.locator('.panel-wrap').getByText(text).first()).toBeVisible();
    }

    async expectMenuVisible(label: string | RegExp): Promise<void> {
        await expect(this.page.locator('.menu').getByRole('button', { name: label })).toBeVisible();
    }

    async expectMenuHidden(label: string | RegExp): Promise<void> {
        await expect(this.page.locator('.menu').getByRole('button', { name: label })).toHaveCount(0);
    }
}
