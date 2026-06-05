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

        .icon-box.transparent {
            width: auto;
            height: auto;
            background: none !important;
            border-radius: 0;
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
        .icon-box.neutral   { background: var(--bg-card); color: var(--text-primary); }
        .icon-box.primary   { background: var(--primary-200); color: var(--text-secondary); }
        .icon-box.secondary { background: var(--secondary-50); color: var(--text-secondary); }
        .icon-box.success   { background: var(--success-bg); color: var(--success-text); }
        .icon-box.warning   { background: var(--warning-bg); color: var(--warning-fill); }
        .icon-box.error     { background: var(--error-bg); color: var(--error-fill); }
        .icon-box.info      { background: var(--info-bg); color: var(--info-text); }
        .icon-box.commercial { background: var(--med-commercial-bg); color: var(--med-commercial-icon); }
        .icon-box.generic    { background: var(--med-generic-bg); color: var(--med-generic-icon); }
    `]
})
export class UiIconComponent {
    @Input({ transform: booleanAttribute }) container = true;
    @Input() size: 'sm' | 'md' | 'lg' = 'md';
    @Input() variant: 'neutral' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'commercial' | 'generic' | 'transparent' = 'neutral';
    @Input() icon: string | undefined;
}
