import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'titlecase',
    standalone: true
})
export class TitleCasePipe implements PipeTransform {

    transform(value: unknown): string {
        if (!value) {
            return '';
        }
        const str = String(value);
        return str
            .toLowerCase()
            .replace(/(?:^|\s|-)\S/g, (char) => char.toUpperCase());
    }
}
