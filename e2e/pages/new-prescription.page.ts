import { Page, expect } from '@playwright/test';
import { escapeRegExp, expectSnackbar } from '../support/ui';

export interface MedicationOptions {
    query?: string;
    quantity?: string;
    diagnostic?: string;
    indication?: string;
    treatment?: 'Sin tratamiento' | '3 meses' | '6 meses' | '12 meses' | 'Personalizado';
    customMonths?: string;
    duplicate?: boolean;
    triplicate?: boolean;
    serie?: string;
    numero?: string;
}

export class NewPrescriptionPage {
    constructor(private readonly page: Page) {}

    async goto(): Promise<void> {
        await this.page.goto('/prescription/new');
        await expect(this.page.getByRole('heading', { name: 'Nueva prescripción' })).toBeVisible();
    }

    async searchPatient(term: string): Promise<void> {
        await this.page.locator('input[placeholder*="Buscar por DNI, nombre o apellido"]').first().fill(term);
    }

    async selectFirstPatientResult(): Promise<void> {
        const result = this.page.locator('.search-result').first();
        await expect(result).toBeVisible();
        await result.click();
    }

    async selectPatientByDni(dni: string): Promise<void> {
        await this.searchPatient(dni);
        const formattedDni = dni.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        const result = this.page.locator('.search-result').first();
        await expect(result).toContainText(new RegExp(formattedDni));
        await result.click();
        await this.expectPatientSelected();
    }

    async expectPatientSelected(): Promise<void> {
        await expect(this.page.getByText('Paciente seleccionado', { exact: true })).toBeVisible();
    }

    async expectPatientNotFound(): Promise<void> {
        await expect(this.page.getByText('No se encontraron pacientes con ese término.')).toBeVisible();
    }

    async openCreatePatient(): Promise<void> {
        await this.page.getByRole('button', { name: 'Crear', exact: true }).click();
        await expect(this.page.getByText('Crear paciente')).toBeVisible();
    }

    async openEditPatient(): Promise<void> {
        await this.page.locator('.patient-card-actions-desktop button').first().click();
        await expect(this.page.getByText('Editar paciente')).toBeVisible();
    }

    async removePatient(): Promise<void> {
        await this.page.locator('.patient-card-actions-desktop button').last().click();
    }

    async selectOrganization(name: string): Promise<void> {
        const trigger = this.page.locator('.sidebar-col ui-select .ui-select-trigger').first();
        await trigger.click();
        const item = this.page.getByRole('menuitem').filter({ hasText: new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') }).first();
        await expect(item).toBeVisible();
        await item.click();
        await expect(trigger).toContainText(new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'));
    }

    async selectFirstOrganizationIfNeeded(): Promise<void> {
        const trigger = this.page.locator('.sidebar-col ui-select .ui-select-trigger').first();
        if ((await trigger.count()) === 0) {
            return;
        }

        const text = await trigger.innerText();
        if (!/Seleccioná una organización/i.test(text)) {
            return;
        }

        await trigger.click();
        const firstItem = this.page.getByRole('menuitem').first();
        await expect(firstItem).toBeVisible();
        await firstItem.click();
    }

    async expectOrganizationRequiredMessage(message: string | RegExp): Promise<void> {
        await expect(this.page.locator('.sidebar-col').getByText(message)).toBeVisible();
    }

    async openMedicationForm(): Promise<void> {
        await this.page.getByRole('button', { name: 'Medicamento', exact: true }).click();
        await expect(this.page.getByRole('heading', { name: /Agregar medicamento|Editar medicamento/ })).toBeVisible();
    }

    async searchMedication(query: string): Promise<void> {
        await this.page.locator('app-medication-search input[placeholder*="Buscar medicamento"]').first().fill(query);
    }

    async selectFirstMedicationResult(): Promise<void> {
        const result = this.page.locator('.search-result').first();
        await expect(result).toBeVisible();
        await result.click();
    }

    async expectNoMedicationResults(): Promise<void> {
        await expect(this.page.getByText('No se encontraron medicamentos con ese término.')).toBeVisible();
    }

    async enableMagistralMode(): Promise<void> {
        await this.page.getByRole('switch', { name: /Medicamento magistral/ }).click();
    }

    async expectManualMagistralInput(): Promise<void> {
        await expect(this.page.getByLabel('Nombre del medicamento magistral')).toBeVisible();
    }

    async fillManualMagistral(name: string): Promise<void> {
        await this.page.getByLabel('Nombre del medicamento magistral').fill(name);
        await this.page.getByRole('button', { name: 'Continuar' }).click();
        await expect(this.page.getByRole('heading', { name: /Agregar medicamento/ })).toBeVisible();
    }

    async expectMagistralSearch(): Promise<void> {
        await expect(this.page.locator('input[placeholder*="Buscar medicamento magistral"]').first()).toBeVisible();
    }

    async expectMedicationLimitWarning(): Promise<void> {
        await expect(this.page.locator('notification-snackbar').filter({ hasText: 'Máximo 3 medicamentos por receta.' }).last()).toBeVisible();
    }

    async removeFirstDraftMedication(): Promise<void> {
        await this.page.locator('.draft-item .draft-actions button').last().click();
    }

    async editFirstDraftMedication(): Promise<void> {
        await this.page.locator('.draft-item .draft-actions button').first().click();
        await expect(this.page.getByRole('heading', { name: 'Editar medicamento' })).toBeVisible();
    }

    async draftItemCount(): Promise<number> {
        return this.page.locator('.draft-item').count();
    }

    async expectDraftItemCount(count: number): Promise<void> {
        await expect(this.page.locator('.draft-item')).toHaveCount(count);
    }

    async fillMedicationDetails(options: MedicationOptions): Promise<void> {
        if (options.quantity !== undefined) {
            await this.page.getByLabel('Cantidad', { exact: true }).fill(options.quantity);
        }

        if (options.diagnostic !== undefined) {
            await this.page.getByLabel(/Diagnóstico/).fill(options.diagnostic);
        }

        if (options.indication !== undefined) {
            await this.page.getByLabel(/Indicaciones/).fill(options.indication);
        }

        if (options.treatment) {
            await this.page.getByLabel('Tratamiento prolongado').selectOption({ label: options.treatment });
            if (options.treatment === 'Personalizado' && options.customMonths !== undefined) {
                await this.page.getByLabel('Cantidad de meses').fill(options.customMonths);
            }
        }

        if (options.duplicate) {
            await this.page.getByRole('checkbox', { name: /Duplicado/ }).check();
        }

        if (options.triplicate) {
            await this.page.getByRole('checkbox', { name: /Triplicado/ }).check();
        }

        if (options.triplicate && options.serie !== undefined) {
            await this.page.getByLabel('Serie').fill(options.serie);
        }

        if (options.triplicate && options.numero !== undefined) {
            await this.page.getByLabel('Número').fill(options.numero);
        }
    }

    async confirmMedication(): Promise<void> {
        await this.page.getByRole('button', { name: /^(Agregar a la receta|Guardar cambios)$/ }).click();
    }

    async cancelMedication(): Promise<void> {
        await this.page.locator('.detail-actions').getByRole('button', { name: /Cancelar/ }).click();
    }

    async addCommercialMedication(options: MedicationOptions): Promise<void> {
        await this.openMedicationForm();
        await this.searchMedication(options.query || 'ibuprofeno');
        await this.selectFirstMedicationResult();
        await this.fillMedicationDetails(options);
        await this.confirmMedication();
    }

    async expectMedicationValidationError(message: string | RegExp): Promise<void> {
        await expect(this.page.locator('app-medication-search').getByText(message)).toBeVisible();
    }

    async expectDraftContains(text: string): Promise<void> {
        await expect(this.page.locator('.draft-list')).toContainText(new RegExp(escapeRegExp(text), 'i'));
    }

    async expectDraftEmpty(): Promise<void> {
        await expect(this.page.locator('.draft-list')).toHaveCount(0);
    }

    async expectFinalizeEnabled(): Promise<void> {
        await expect(this.page.locator('.sidebar-footer').getByRole('button')).toBeEnabled();
    }

    async expectFinalizeDisabled(): Promise<void> {
        await expect(this.page.locator('.sidebar-footer').getByRole('button')).toBeDisabled();
    }

    async finalize(autoConfirmPin = true): Promise<void> {
        await this.page.locator('.sidebar-footer').getByRole('button').click();

        if (!autoConfirmPin) {
            return;
        }

        const pinDialog = this.page.getByRole('dialog').filter({ hasText: 'Confirmar receta' });
        if (await pinDialog.isVisible({ timeout: 2_000 }).catch(() => false)) {
            const securityPin = process.env.E2E_PROFESSIONAL_PIN;
            if (!securityPin) {
                throw new Error('La receta pidió PIN, pero E2E_PROFESSIONAL_PIN no está configurado');
            }
            await pinDialog.getByLabel('PIN de seguridad').fill(securityPin);
            await pinDialog.getByRole('button', { name: 'Confirmar con PIN' }).click();
        }
    }

    async expectSuccessToast(text: string | RegExp = /Receta creada exitosamente/, timeout = 15_000): Promise<void> {
        await expectSnackbar(this.page, text, timeout);
    }

    async expectInlineError(text: string | RegExp): Promise<void> {
        await expect(this.page.locator('.draft-errors, .sidebar-error-hint').getByText(text).first()).toBeVisible();
    }

    async selectTab(label: 'Recetas' | 'Certificados' | 'Prácticas'): Promise<void> {
        await this.page.getByRole('tab', { name: new RegExp(label, 'i') }).click();
    }

    async openCertificateForm(): Promise<void> {
        await this.selectTab('Certificados');
        await this.page.getByRole('button', { name: 'Certificado', exact: true }).click();
        await expect(this.page.getByRole('heading', { name: /Nuevo certificado|Editar certificado/ })).toBeVisible();
    }

    async fillCertificate(text: string, date: string, days: string): Promise<void> {
        await this.page.getByLabel('Tipo de certificado').fill(text);
        await this.page.locator('app-certificate-form ui-date-field input').fill(date);
        await this.page.getByLabel('Cantidad de días').fill(days);
    }

    async saveCertificate(): Promise<void> {
        await this.page.getByRole('button', { name: 'Agregar certificado' }).click();
    }

    async openPracticeForm(): Promise<void> {
        await this.selectTab('Prácticas');
        await this.page.getByRole('button', { name: 'Práctica', exact: true }).click();
        await expect(this.page.getByRole('heading', { name: /Nueva práctica|Editar práctica/ })).toBeVisible();
    }

    async fillPractice(name: string, diagnostic: string, indications?: string): Promise<void> {
        await this.page.getByLabel(/Práctica \/ procedimiento/).fill(name);
        await this.page.getByLabel('Diagnóstico', { exact: true }).fill(diagnostic);
        if (indications) {
            await this.page.getByLabel('Indicaciones').fill(indications);
        }
    }

    async savePractice(): Promise<void> {
        await this.page.getByRole('button', { name: 'Agregar práctica' }).click();
    }

    async expectPendingBanner(): Promise<void> {
        await expect(this.page.getByText('Tenés una receta pendiente de enviar')).toBeVisible();
    }

    async resumePending(): Promise<void> {
        await this.page.locator('.pending-alert').getByRole('button', { name: 'Continuar' }).click();
    }

    async discardPending(): Promise<void> {
        await this.page.locator('.pending-alert').getByRole('button', { name: 'Descartar' }).click();
    }
}
