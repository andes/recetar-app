

import { AbstractControl, ValidationErrors } from '@angular/forms';

export function fechaValida(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) return null;
    const fecha = new Date(value);
    const hoy = new Date();
    fecha.setHours(0, 0, 0, 0);
    hoy.setHours(0, 0, 0, 0);
    // Verifica que la fecha sea válida y anterior a hoy
    if (isNaN(fecha.getTime())) {
        return { invalidDate: true };
    }
    return null;
}