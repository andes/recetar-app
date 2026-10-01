import { test, expect } from '../../../fixtures/test';
import {
    getPatientId,
    hasCredentials,
    mutationsEnabled,
    statePath,
    uniqueLabel
} from '../../../fixtures/test-data';
import { PatientManagementFormPage } from '../../../pages/patient-management-form.page';
import { expectSnackbar } from '../../../support/ui';

test.describe('Género autopercibido', () => {
    test.use({ storageState: statePath('professional') });
    test.skip(!hasCredentials('professional'), 'Falta configurar usuario profesional');

    test('limpiar el género lo oculta y persiste el valor derivado @PAT-029', async ({ page, api }) => {
        test.skip(!mutationsEnabled, 'E2E_SKIP_MUTATIONS=1');
        const disposable = await api.createDisposablePatient({
            firstName: 'Paciente',
            lastName: uniqueLabel('Genero Limpiar E2E'),
            sex: 'Masculino',
            genero: 'mujer'
        });
        const id = getPatientId(disposable);

        const form = new PatientManagementFormPage(page);
        await form.gotoEdit(id);
        await form.expectGeneroValue('mujer');

        await form.clearGenero();
        await form.save();
        await expect(page).toHaveURL(/\/pacientes(\?.*)?$/);
        await expectSnackbar(page, 'Paciente guardado correctamente');

        const updated = await api.getPatientById(id);
        expect(updated.genero).toBe('varon');

        await form.gotoEdit(id);
        await form.expectGeneroValue('');
    });

    test('guardar un género distinto al derivado lo mantiene @PAT-030', async ({ page, api }) => {
        test.skip(!mutationsEnabled, 'E2E_SKIP_MUTATIONS=1');
        const disposable = await api.createDisposablePatient({
            firstName: 'Paciente',
            lastName: uniqueLabel('Genero Persistir E2E'),
            sex: 'Masculino'
        });
        const id = getPatientId(disposable);

        const form = new PatientManagementFormPage(page);
        await form.gotoEdit(id);
        await form.expectGeneroValue('');
        await form.selectGenero('Mujer');
        await form.save();
        await expect(page).toHaveURL(/\/pacientes(\?.*)?$/);
        await expectSnackbar(page, 'Paciente guardado correctamente');

        const updated = await api.getPatientById(id);
        expect(updated.genero).toBe('mujer');

        await form.gotoEdit(id);
        await form.expectGeneroValue('mujer');
    });
});
