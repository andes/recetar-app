import { Page, expect } from '@playwright/test';
import { escapeRegExp, expectSnackbar } from '../support/ui';

export class PatientsHomePage {
    constructor(private readonly page: Page) {}

    async goto(): Promise<void> {
        await this.page.goto('/pacientes');
        await expect(this.page.getByRole('heading', { name: 'Pacientes' })).toBeVisible();
    }

    async search(term: string): Promise<void> {
        await this.page.locator('input[placeholder*="Buscar por nombre, DNI, email o teléfono"]').first().fill(term);
    }

    async expectItem(text: string): Promise<void> {
        await expect(this.item(text)).toBeVisible();
    }

    async openItem(text: string): Promise<void> {
        await this.item(text).click();
        await expect(this.page.getByText('Detalle del paciente', { exact: true })).toBeVisible();
        await expect(this.page.locator('app-patient-detail-panel')).toBeVisible();
    }

    async editItem(text: string): Promise<void> {
        await this.item(text).getByRole('button', { name: 'Editar', exact: true }).click();
        await expect(this.page).toHaveURL(/\/pacientes\/[^/]+\/editar/);
    }

    async clickNewPatient(): Promise<void> {
        await this.page.getByRole('button', { name: 'Nuevo paciente' }).click();
        await expect(this.page).toHaveURL(/\/pacientes\/nuevo/);
    }

    async openFilters(): Promise<void> {
        await this.page.getByRole('button', { name: /Filtros/ }).click();
    }

    async selectEstado(value: 'validado' | 'temporal'): Promise<void> {
        await this.filterGroup('Estado').locator('select').selectOption(value);
    }

    async selectSexo(value: 'femenino' | 'masculino' | 'otro'): Promise<void> {
        await this.filterGroup('Sexo').locator('select').selectOption(value);
    }

    async clearFilters(): Promise<void> {
        await this.page.getByRole('button', { name: 'Limpiar' }).click();
    }

    async expectEmpty(): Promise<void> {
        await expect(this.page.getByText(/No se encontraron pacientes con esos criterios|Buscá un paciente por nombre/)).toBeVisible();
    }

    async openDeleteDialog(): Promise<void> {
        await this.page.locator('.drawer-actions').getByRole('button', { name: 'Eliminar', exact: true }).click();
        await expect(this.page.getByRole('dialog').last().getByText('Eliminar paciente')).toBeVisible();
    }

    async cancelDeleteDialog(): Promise<void> {
        await this.page.getByRole('dialog').last().getByRole('button', { name: 'Cancelar', exact: true }).click();
    }

    async deleteSelectedPatient(): Promise<void> {
        await this.openDeleteDialog();

        const dialog = this.page.getByRole('dialog').last();
        await dialog.getByRole('checkbox', { name: /Entiendo que la acción es irreversible/ }).check();
        await dialog.getByRole('button', { name: 'Eliminar definitivamente' }).click();

        await expectSnackbar(this.page, 'Paciente eliminado');
    }

    async expectDetailContains(text: string | RegExp): Promise<void> {
        await expect(this.page.locator('app-patient-detail-panel').getByText(text).first()).toBeVisible();
    }

    private item(text: string): ReturnType<Page['locator']> {
        return this.page.locator('app-patient-list-item')
            .filter({ hasText: new RegExp(escapeRegExp(text), 'i') })
            .first();
    }

    private filterGroup(label: string): ReturnType<Page['locator']> {
        return this.page.locator('.filter-group').filter({ hasText: new RegExp(escapeRegExp(label), 'i') }).first();
    }
}
