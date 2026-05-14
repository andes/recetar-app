import { ValidatorFn, AbstractControl, FormArray } from '@angular/forms';

// Array Validators
export class ArrayValidators {

    // max length
    public static maxLength(max: number): ValidatorFn | any {
        return (control: AbstractControl[]) => {
            if (!(control instanceof FormArray)) {return;}
            return control.length > max ? { maxLength: true } : null;
        };
    }

    // min length
    public static minLength(min: number): ValidatorFn | any {
        return (control: AbstractControl[]) => {
            if (!(control instanceof FormArray)) {return;}
            return control.length < min ? { minLength: true } : null;
        };
    }

    // min length filled
    public static minLengthFilled(min: number, fControlName: string, attribute?: string): ValidatorFn | any {
        return (suppliesArray: FormArray): any => {

            let counter = 0;
            suppliesArray.controls.forEach(ctrol => {
                if ( ctrol.get(fControlName).value && ( ctrol.get(fControlName).value.length >= 3 ||
            (attribute !== '' && Object.keys(ctrol.get(fControlName).value).includes(attribute)))) {counter++;}
            });
            const valid = (counter >= min);

            return valid ? null : { minLengthFilled: { valid: false, min: min } };
        };

    }

    // between length
    public static betweenLength(min: number, max: number): ValidatorFn | any {
        return (control: AbstractControl[]) => {
            if (!(control instanceof FormArray)) {return;}
            return control.length < min || control.length > max ? { betweenLength: true } : null;
        };
    }

    // compare in elements with a value, it need at least one match in a formGroup
    public static equalsToSomeGroupKey(key: string, toCompare: number | string, strict: boolean = false): ValidatorFn | any {
        return (control: AbstractControl[]) => {
            if (!(control instanceof FormArray)) {return;}

            for (const item of control.value) {
                if (!item[ key ] && typeof item[ key ] === 'undefined') {return { equalsToSomeGroupKey: true, err: 'Property invalid' };}

                const condition = strict ? item[ key ] === toCompare : String(item[ key ]) === String(toCompare);

                if (condition) {return null;}
            }

            return { equalsToSomeGroupKey: true };
        };
    }

    // compare in elements with a value, it need at least one match in a formControl
    public static equalsToSomeElement(toCompare: number | string, strict: boolean = false): ValidatorFn | any {
        return (control: AbstractControl[]) => {
            if (!(control instanceof FormArray)) {return;}

            for (const item of control.value) {
                const condition = strict ? item === toCompare : String(item) === String(toCompare);

                if (condition) {return null;}
            }

            return { equalsToSomeElement: true };
        };
    }

    // check if key exists in all elements
    public static keyExistsInGroups(key: string): ValidatorFn | any {
        return (control: AbstractControl[]) => {
            if (!(control instanceof FormArray)) {return;}

            for (const item of control.value) {
                if (!item[ key ]) {return { keyExistsInGroups: true, item };}
            }

            return null;
        };
    }

    // check if the key exists in at least one element group
    public static keyExistsInAtLeastOneGroup(key: string): ValidatorFn | any {
        return (control: AbstractControl[]) => {
            if (!(control instanceof FormArray)) {return;}

            for (const item of control.value) {
                if (item[ key ]) {return null;}
            }

            return { keyExistsInAtLeastOneGroup: true };
        };
    }

}
