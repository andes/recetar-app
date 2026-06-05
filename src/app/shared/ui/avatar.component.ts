import { Component, Input } from '@angular/core';

@Component({
    standalone: true,
    selector: 'ui-avatar',
    template: `
        <div class="avatar" [class]="size + ' ' + variant">
            <ng-content />
        </div>
    `,
    styles: [`
        :host {
            display: inline-flex;
        }

        .avatar {
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            border-radius: 50%;
            width: 44px;
            height: 44px;
            font-size: 14px;
            font-weight: 600;
        }

        .avatar ::ng-deep .mat-icon {
            font-size: 22px;
            width: 22px;
            height: 22px;
            line-height: 22px;
        }

        /* Sizes */
        .avatar.sm { width: 36px; height: 36px; font-size: 12px; }
        .avatar.sm ::ng-deep .mat-icon { font-size: 18px; width: 18px; height: 18px; line-height: 18px; }
        .avatar.lg { width: 60px; height: 60px; font-size: 18px; }
        .avatar.lg ::ng-deep .mat-icon { font-size: 28px; width: 28px; height: 28px; line-height: 28px; }

        /* Variants */
        .avatar.neutral { background: var(--bg-raised); color: var(--text-primary); }
        .avatar.primary { background: var(--primary-50);     color: var(--text-primary); }
        .avatar.colored { background: var(--secondary);      color: #fff; }
    `]
})
export class UiAvatarComponent {
    @Input() size: 'sm' | 'md' | 'lg' = 'md';
    @Input() variant: 'neutral' | 'primary' | 'colored' = 'neutral';
}
