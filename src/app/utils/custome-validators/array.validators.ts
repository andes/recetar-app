import { ValidatorFn, AbstractControl, FormArray, ValidationErrors } from '@angular/forms';

interface MinLengthFilledError {
    valid: boolean;
    min: number;
}

interface FormArrayItem {
    [key: string]: unknown;
}

// Array Validators
export class ArrayValidators {

    // max length
    public static maxLength(max: number): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            if (!(control instanceof FormArray)) { return null; }
            return control.length > max ? { maxLength: true } : null;
        };
    }

    // min length
    public static minLength(min: number): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            if (!(control instanceof FormArray)) { return null; }
            return control.length < min ? { minLength: true } : null;
        };
    }

    // min length filled
    public static minLengthFilled(min: number, fControlName: string, attribute?: string): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            if (!(control instanceof FormArray)) { return null; }

            let counter = 0;
            control.controls.forEach((ctrl) => {
                const fieldValue = ctrl.get(fControlName)?.value as unknown;
                const hasMinLength = typeof fieldValue === 'string' && fieldValue.length >= 3;
                const hasAttribute = !!attribute
                    && typeof fieldValue === 'object'
                    && fieldValue !== null
                    && attribute in (fieldValue as Record<string, unknown>);

                if (fieldValue && (hasMinLength || hasAttribute)) {
                    counter++;
                }
            });
            const valid = (counter >= min);

            return valid ? null : { minLengthFilled: { valid: false, min } as MinLengthFilledError };
        };

    }

    // between length
    public static betweenLength(min: number, max: number): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            if (!(control instanceof FormArray)) { return null; }
            return control.length < min || control.length > max ? { betweenLength: true } : null;
        };
    }

    // compare in elements with a value, it need at least one match in a formGroup
    public static equalsToSomeGroupKey(key: string, toCompare: number | string, strict: boolean = false): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            if (!(control instanceof FormArray)) { return null; }

            for (const rawItem of control.value as FormArrayItem[]) {
                if (!(key in rawItem)) {
                    return { equalsToSomeGroupKey: true, err: 'Property invalid' };
                }

                const value = rawItem[key];
                const condition = strict ? value === toCompare : String(value) === String(toCompare);

                if (condition) { return null; }
            }

            return { equalsToSomeGroupKey: true };
        };
    }

    // compare in elements with a value, it need at least one match in a formControl
    public static equalsToSomeElement(toCompare: number | string, strict: boolean = false): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            if (!(control instanceof FormArray)) { return null; }

            for (const item of control.value as Array<number | string>) {
                const condition = strict ? item === toCompare : String(item) === String(toCompare);

                if (condition) { return null; }
            }

            return { equalsToSomeElement: true };
        };
    }

    // check if key exists in all elements
    public static keyExistsInGroups(key: string): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            if (!(control instanceof FormArray)) { return null; }

            for (const item of control.value as FormArrayItem[]) {
                if (!item[key]) { return { keyExistsInGroups: true, item }; }
            }

            return null;
        };
    }

    // check if the key exists in at least one element group
    public static keyExistsInAtLeastOneGroup(key: string): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            if (!(control instanceof FormArray)) { return null; }

            for (const item of control.value as FormArrayItem[]) {
                if (item[key]) { return null; }
            }

            return { keyExistsInAtLeastOneGroup: true };
        };
    }

}
