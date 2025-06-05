import { AbstractControl, ValidationErrors } from '@angular/forms';

export function cuilValidator(control: AbstractControl): ValidationErrors | null {
    const cuil = control.value;

    if (!cuil) return null; // No validar si está vacío (para uso combinado con Validators.required)

    const cuilRegex = /^\d{11}$/;
    if (!cuilRegex.test(cuil)) {
        return { invalidFormat: true };
    }

    const coeficientes = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
    const nums = cuil.split('').map(n => parseInt(n, 10));

    let sum = 0;
    for (let i = 0; i < 10; i++) {
        sum += nums[i] * coeficientes[i];
    }

    let verificador = 11 - (sum % 11);
    if (verificador === 11) verificador = 0;
    else if (verificador === 10) verificador = 9;

    if (verificador !== nums[10]) {
        return { invalidCuil: true };
    }

    return null;
}