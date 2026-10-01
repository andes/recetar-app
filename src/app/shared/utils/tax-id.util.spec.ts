import { isValidCuitCuil, normalizeTaxId } from './tax-id.util';

describe('tax-id.util', () => {
    it('normaliza un CUIT/CUIL a dígitos', () => {
        expect(normalizeTaxId('20-12345678-6')).toBe('20123456786');
        expect(normalizeTaxId(null)).toBe('');
    });

    it('valida el dígito verificador', () => {
        expect(isValidCuitCuil('20-12345678-6')).toBe(true);
        expect(isValidCuitCuil('20-12345678-9')).toBe(false);
        expect(isValidCuitCuil('12345678')).toBe(false);
        expect(isValidCuitCuil('')).toBe(false);
    });
});
