import { Component, Input, booleanAttribute } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
    standalone: true,
    selector: 'ui-icon',
    imports: [CommonModule, MatIconModule],
    template: `
        <ng-container *ngIf="container; else bare">
            <div class="icon-box" [class]="size + ' ' + variant">
                <mat-icon *ngIf="icon; else projection">{{ icon }}</mat-icon>
                <ng-template #projection><ng-content /></ng-template>
            </div>
        </ng-container>
        <ng-template #bare>
            <mat-icon *ngIf="icon; else projectionBare">{{ icon }}</mat-icon>
            <ng-template #projectionBare><ng-content /></ng-template>
        </ng-template>
    `,
    styles: [`
        :host {
            display: inline-flex;
        }

        .icon-box {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            border-radius: var(--radius-md);
            width: 36px;
            height: 36px;
        }

        .icon-box ::ng-deep .mat-icon {
            font-size: 18px;
            width: 18px;
            height: 18px;
            line-height: 1;
        }

        /* Sizes */
        .icon-box.sm { width: 32px; height: 32px; }
        .icon-box.sm ::ng-deep .mat-icon { font-size: 16px; width: 16px; height: 16px; line-height: 1; }
        .icon-box.lg { width: 44px; height: 44px; }
        .icon-box.lg ::ng-deep .mat-icon { font-size: 22px; width: 22px; height: 22px; line-height: 1; }

        /* Variants */
        .icon-box.neutral   { background: var(--bg-raised); color: var(--text-secondary); }
        .icon-box.primary   { background: var(--primary-200); color: var(--text-secondary); }
        .icon-box.secondary { background: var(--secondary-50); color: var(--text-secondary); }
    `]
})
export class UiIconComponent {
    @Input({ transform: booleanAttribute }) container = true;
    @Input() size: 'sm' | 'md' | 'lg' = 'md';
    @Input() variant: 'neutral' | 'primary' | 'secondary' = 'neutral';
    @Input() icon: string | undefined;
}
