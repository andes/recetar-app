import { Page, expect } from '@playwright/test';

export async function expectSnackbar(page: Page, text: string | RegExp, timeout = 15_000): Promise<void> {
    await expect(page.locator('notification-snackbar').filter({ hasText: text }).last()).toBeVisible({ timeout });
}

export async function expectNoSnackbar(page: Page, text: string | RegExp): Promise<void> {
    await expect(page.locator('notification-snackbar').filter({ hasText: text })).toHaveCount(0);
}

export async function confirmVisibleDialog(page: Page, action = 'Confirmar'): Promise<void> {
    const dialog = page.getByRole('dialog').last();
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: action, exact: true }).click();
}

export async function cancelVisibleDialog(page: Page, action = 'Cancelar'): Promise<void> {
    const dialog = page.getByRole('dialog').last();
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: action, exact: true }).click();
}

export async function waitForDebouncedSearch(page: Page, assertion: () => Promise<void>): Promise<void> {
    await expect.poll(assertion, { timeout: 15_000 }).toBeTruthy();
}

export function escapeRegExp(value: string): RegExp {
    return new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
}
