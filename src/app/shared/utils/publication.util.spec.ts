import { isDispenseBlockedByPublication, needsPublicationWarning } from './publication.util';

describe('publication.util', () => {
    it('avisa cuando la receta no está publicada', () => {
        expect(needsPublicationWarning('pendiente')).toBeTrue();
        expect(needsPublicationWarning('error')).toBeTrue();
        expect(needsPublicationWarning('no_aplicable')).toBeTrue();
        expect(needsPublicationWarning('ok')).toBeFalse();
        expect(needsPublicationWarning('desconocido')).toBeFalse();
        expect(needsPublicationWarning(undefined)).toBeFalse();
    });

    it('bloquea la dispensa solo en ámbito privado y con receta no publicada', () => {
        expect(isDispenseBlockedByPublication('pendiente', 'privado')).toBeTrue();
        expect(isDispenseBlockedByPublication('error', 'privado')).toBeTrue();
        expect(isDispenseBlockedByPublication('no_aplicable', 'privado')).toBeTrue();
        expect(isDispenseBlockedByPublication('ok', 'privado')).toBeFalse();
        expect(isDispenseBlockedByPublication('desconocido', 'privado')).toBeFalse();
        expect(isDispenseBlockedByPublication('pendiente', 'publico')).toBeFalse();
        expect(isDispenseBlockedByPublication('pendiente', null)).toBeFalse();
    });
});
