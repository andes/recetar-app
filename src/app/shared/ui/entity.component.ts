import { Component, Input, booleanAttribute } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { UiIconComponent } from './icon.component';

@Component({
    standalone: true,
    selector: 'ui-entity',
    imports: [CommonModule, MatIconModule, UiIconComponent],
    template: `
        <ng-content select="[entityIcon]"></ng-content>
        <ui-icon *ngIf="container && icon" [icon]="icon" [variant]="variant" [size]="size"></ui-icon>
        <mat-icon *ngIf="!container && icon" class="sm text-secondary">{{ icon }}</mat-icon>
        <div class="entity-body">
            <ng-content select="[entityName]"></ng-content>
            <ng-content select="[entityMeta]"></ng-content>
        </div>
    `,
    styles: [`
        :host {
            display: flex;
            align-items: center;
            gap: var(--space-2);
            min-width: 0;
        }

        .entity-body {
            display: flex;
            flex-direction: column;
            gap: var(--space-1);
            min-width: 0;
        }
    `]
})
export class UiEntityComponent {
    @Input() icon: string | undefined;
    @Input() variant: 'neutral' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'gold' = 'neutral';
    @Input() size: 'sm' | 'md' | 'lg' = 'md';
    @Input({ transform: booleanAttribute }) container = true;
}
