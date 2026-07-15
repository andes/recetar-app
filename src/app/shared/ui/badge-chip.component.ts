import { Component, Input } from '@angular/core';
import { MatChipsModule } from '@angular/material/chips';

@Component({
    standalone: true,
    selector: 'ui-badge',
    imports: [MatChipsModule],
    template: `
        <mat-chip disableRipple [class]="variant + ' ' + size">
            <ng-content />
        </mat-chip>
    `,
    styles: [`
        :host {
            display: inline-flex;
        }
    `]
})
export class UiBadgeChipComponent {
    @Input() variant: 'success' | 'info' | 'warning' | 'error' = 'info';
    @Input() size: 'sm' | 'md' = 'sm';
}
