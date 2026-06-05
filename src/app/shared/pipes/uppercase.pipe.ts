import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'upper',
    standalone: true
})
export class UppercasePipe implements PipeTransform {

    transform(value: unknown): string {
        if (!value) {
            return '';
        }
        return String(value).toUpperCase();
    }

}
