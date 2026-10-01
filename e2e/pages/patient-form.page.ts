import { Page, expect } from '@playwright/test';

export class PatientFormPage {
    constructor(private readonly page: Page) {}

    get root(): ReturnType<Page['locator']> {
        return this.page.locator('app-edit-patient');
    }

    async expectCreateMode(): Promise<void> {
        await expect(this.root.getByText('Crear paciente')).toBeVisible();
    }

    async expectEditMode(): Promise<void> {
        await expect(this.root.getByText('Editar paciente')).toBeVisible();
    }

    async fillDni(dni: string): Promise<void> {
        await this.page.getByLabel('DNI').fill(dni);
    }

    async selectSex(sex: 'Femenino' | 'Masculino' | 'Otro'): Promise<void> {
        await this.page.getByLabel('Sexo').selectOption({ label: sex });
    }

    async fillLastAndFirstName(lastName: string, firstName: string): Promise<void> {
        await this.page.getByLabel('Apellido').fill(lastName);
        await this.page.getByLabel('Nombre').fill(firstName);
    }

    async fillBirthDate(isoDate: string): Promise<void> {
        await this.page.getByLabel('Fecha de nacimiento').fill(isoDate);
    }

    async fillCuil(cuil: string): Promise<void> {
        await this.page.getByLabel('CUIL').fill(cuil);
    }

    async switchToWithoutDni(): Promise<void> {
        await this.root.getByRole('button', { name: 'Sin DNI', exact: true }).click();
    }

    async switchToWithDni(): Promise<void> {
        await this.root.getByRole('button', { name: 'Con DNI', exact: true }).click();
    }

    async validate(): Promise<void> {
        await this.root.getByRole('button', { name: 'Validar', exact: true }).click();
    }

    async expectBadge(label: 'Validado' | 'Sin validar'): Promise<void> {
        await expect(this.root.getByText(label, { exact: true })).toBeVisible();
    }

    async save(): Promise<void> {
        await this.root.getByRole('button', { name: /^(Crear|Guardar cambios)$/ }).click();
    }

    async cancel(): Promise<void> {
        await this.root.getByRole('button', { name: 'Cancelar', exact: true }).click();
    }

    async expectError(message: string | RegExp): Promise<void> {
        await expect(this.root.getByText(message)).toBeVisible();
    }

    async expectDuplicatePatientDialog(): Promise<void> {
        const dialog = this.page.getByRole('dialog').last();
        await expect(dialog.getByText('Paciente existente')).toBeVisible();
        await expect(dialog.getByText(/Ya existe un paciente registrado con el DNI/)).toBeVisible();
    }

    async confirmDuplicatePatient(): Promise<void> {
        await this.page.getByRole('dialog').last().getByRole('button', { name: 'Confirmar', exact: true }).click();
    }

    async cancelDuplicatePatient(): Promise<void> {
        await this.page.getByRole('dialog').last().getByRole('button', { name: 'Cancelar', exact: true }).click();
    }
}
