export function normalizeTaxId(value?: string | null): string {
    return (value || '').replace(/\D/g, '');
}

// Valida CUIT/CUIL argentino: 11 dígitos con dígito verificador.
export function isValidCuitCuil(value?: string | null): boolean {
    const digits = normalizeTaxId(value);
    if (digits.length !== 11) {
        return false;
    }
    const weights = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
    const sum = weights.reduce((acc, weight, index) => acc + parseInt(digits[index], 10) * weight, 0);
    let verifier = 11 - (sum % 11);
    if (verifier === 11) {
        verifier = 0;
    } else if (verifier === 10) {
        verifier = 9;
    }
    return verifier === parseInt(digits[10], 10);
}
