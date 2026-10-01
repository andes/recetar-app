import { UiPatientAvatarComponent } from './patient-avatar.component';

describe('UiPatientAvatarComponent', () => {
    let avatar: UiPatientAvatarComponent;

    beforeEach(() => {
        avatar = new UiPatientAvatarComponent();
    });

    it('usa el ícono femenino cuando el sexo es femenino y no hay género autopercibido', () => {
        avatar.sex = 'Femenino';

        expect(avatar.hasAutopercibido).toBe(false);
        expect(avatar.isFemale).toBe(true);
        expect(avatar.isOther).toBe(false);
        expect(avatar.icon).toBe('female');
    });

    it('usa el ícono masculino cuando el sexo es masculino y no hay género autopercibido', () => {
        avatar.sex = 'Masculino';

        expect(avatar.hasAutopercibido).toBe(false);
        expect(avatar.isFemale).toBe(false);
        expect(avatar.isOther).toBe(false);
        expect(avatar.icon).toBe('male');
    });

    it('no considera autopercibido el género derivado del sexo', () => {
        avatar.sex = 'Femenino';
        avatar.genero = 'mujer';
        expect(avatar.hasAutopercibido).toBe(false);
        expect(avatar.icon).toBe('female');

        avatar.sex = 'Masculino';
        avatar.genero = 'varon';
        expect(avatar.hasAutopercibido).toBe(false);
        expect(avatar.icon).toBe('male');
    });

    it('normaliza variantes del género derivado del sexo', () => {
        avatar.sex = 'Femenino';
        avatar.genero = 'femenino';
        expect(avatar.hasAutopercibido).toBe(false);
        expect(avatar.icon).toBe('female');

        avatar.sex = 'Masculino';
        avatar.genero = 'masculino';
        expect(avatar.hasAutopercibido).toBe(false);
        expect(avatar.icon).toBe('male');
    });

    it('usa el ícono de otros para sexos fuera de femenino/masculino', () => {
        avatar.sex = 'Otro';

        expect(avatar.isOther).toBe(true);
        expect(avatar.icon).toBe('transgender');
    });

    it('usa otros cuando el género no coincide con el derivado del sexo', () => {
        avatar.sex = 'Femenino';
        avatar.genero = 'varon';

        expect(avatar.hasAutopercibido).toBe(true);
        expect(avatar.isFemale).toBe(false);
        expect(avatar.isOther).toBe(true);
        expect(avatar.icon).toBe('transgender');

        avatar.sex = 'Masculino';
        avatar.genero = 'mujer';

        expect(avatar.hasAutopercibido).toBe(true);
        expect(avatar.icon).toBe('transgender');
    });

    it('usa otros para géneros autopercibidos especiales', () => {
        avatar.sex = 'Femenino';
        avatar.genero = 'no binario';

        expect(avatar.hasAutopercibido).toBe(true);
        expect(avatar.icon).toBe('transgender');
    });

    it('usa otros para sexo vacío o desconocido', () => {
        avatar.sex = '';

        expect(avatar.sexKey).toBe('other');
        expect(avatar.isOther).toBe(true);
        expect(avatar.icon).toBe('transgender');
    });
});
