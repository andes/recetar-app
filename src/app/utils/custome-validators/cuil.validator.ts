import { AbstractControl, ValidationErrors } from '@angular/forms';
import { isValidCuitCuil, normalizeTaxId } from '@shared/utils/tax-id.util';

export function cuilValidator(control: AbstractControl): ValidationErrors | null {
    const cuil = control.value;

    if (!cuil) {return null;} // No validar si está vacío (para uso combinado con Validators.required)

    const digits = normalizeTaxId(cuil);
    if (digits.length !== 11) {
        return { invalidFormat: true };
    }

    if (!isValidCuitCuil(digits)) {
        return { invalidCuil: true };
    }

    return null;
}
