import { Page, expect } from '@playwright/test';

export class PatientManagementFormPage {
    constructor(private readonly page: Page) {}

    get root(): ReturnType<Page['locator']> {
        return this.page.locator('app-patient-edit-form');
    }

    async gotoCreate(): Promise<void> {
        await this.page.goto('/pacientes/nuevo');
        await expect(this.page.getByRole('heading', { name: 'Nuevo paciente' })).toBeVisible();
        await expect(this.root).toBeVisible();
    }

    async gotoEdit(id: string): Promise<void> {
        await this.page.goto(`/pacientes/${id}/editar`);
        await expect(this.page.getByRole('heading', { name: 'Editar paciente' })).toBeVisible();
        await expect(this.root).toBeVisible();
    }

    async fillDni(dni: string): Promise<void> {
        await this.page.getByLabel('DNI').fill(dni);
    }

    async selectSex(sex: 'Femenino' | 'Masculino' | 'Otro'): Promise<void> {
        await this.page.getByLabel('Sexo').selectOption({ label: sex });
    }

    async fillBasicData(data: { firstName: string; lastName: string; cuil?: string; fechaNac?: string }): Promise<void> {
        await this.page.getByLabel('Nombre', { exact: true }).fill(data.firstName);
        await this.page.getByLabel('Apellido').fill(data.lastName);
        if (data.cuil !== undefined) {
            await this.page.getByLabel('CUIL').fill(data.cuil);
        }
        if (data.fechaNac !== undefined) {
            await this.page.getByLabel('Fecha de nacimiento').fill(data.fechaNac);
        }
    }

    async selectGenero(label: string): Promise<void> {
        await this.page.getByLabel('Género autopercibido', { exact: true }).selectOption({ label });
    }

    async clearGenero(): Promise<void> {
        await this.page.getByRole('button', { name: 'Borrar género autopercibido' }).click();
    }

    async expectGeneroValue(value: string): Promise<void> {
        await expect(this.page.getByLabel('Género autopercibido', { exact: true })).toHaveValue(value);
    }

    async fillContactData(data: { email?: string; celular?: string; calle?: string }): Promise<void> {
        await this.page.getByRole('tab', { name: /Contacto/ }).click();
        if (data.email !== undefined) {
            await this.page.getByLabel('Email').fill(data.email);
        }
        if (data.celular !== undefined) {
            await this.page.getByLabel('Celular').fill(data.celular);
        }
        if (data.calle !== undefined) {
            await this.page.getByLabel('Calle y número').fill(data.calle);
        }
    }

    async save(): Promise<void> {
        await this.root.getByRole('button', { name: 'Guardar', exact: true }).click();
    }

    async cancel(): Promise<void> {
        await this.root.getByRole('button', { name: 'Cancelar', exact: true }).click();
    }

    get validateButton(): ReturnType<Page['locator']> {
        return this.root.getByRole('button', { name: /^(Validar|Volver a validar)$/ });
    }

    async validate(): Promise<void> {
        await this.validateButton.click();
    }

    async expectValidationStatus(status: 'Validado' | 'Sin validar'): Promise<void> {
        await expect(this.root.locator('.identity-status ui-badge-chip')).toContainText(status);
    }

    async expectValidateButtonNeutral(): Promise<void> {
        await expect(this.validateButton).not.toHaveClass(/mat-success/);
    }

    async expectButtonDisabled(text: string | RegExp): Promise<void> {
        await expect(this.root.getByRole('button', { name: text })).toBeDisabled();
    }

    async expectError(message: string | RegExp): Promise<void> {
        await expect(this.root.getByText(message).first()).toBeVisible();
    }

    async expectServerError(message: string | RegExp): Promise<void> {
        await expect(this.root.locator('.server-error').filter({ hasText: message })).toBeVisible();
    }

    async expectDiscardDialog(): Promise<void> {
        await expect(this.page.getByRole('dialog').last().getByRole('heading', { name: 'Cambios sin guardar' })).toBeVisible();
    }

    async confirmDiscard(): Promise<void> {
        await this.page.getByRole('dialog').last().getByRole('button', { name: 'Salir sin guardar', exact: true }).click();
    }

    async cancelDiscard(): Promise<void> {
        await this.page.getByRole('dialog').last().getByRole('button', { name: 'Seguir editando', exact: true }).click();
    }

    async expectStillEditing(): Promise<void> {
        await expect(this.page).toHaveURL(/\/pacientes\/[^/]+\/editar/);
        await expect(this.root).toBeVisible();
    }

    async expectFieldValue(label: string, value: string): Promise<void> {
        await expect(this.page.getByLabel(label, { exact: true })).toHaveValue(value);
    }
}
