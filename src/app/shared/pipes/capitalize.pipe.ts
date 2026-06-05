import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'capitalize',
    standalone: true
})
export class CapitalizePipe implements PipeTransform {

    transform(value: unknown): string {
        if (!value) {
            return '';
        }
        const str = String(value);
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

}
