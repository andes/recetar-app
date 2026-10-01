import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
    standalone: true,
    selector: 'ui-med-avatar',
    imports: [MatIconModule],
    template: `
        <div class="med-avatar">
            <mat-icon>{{ icon }}</mat-icon>
        </div>
    `,
    styles: [`
        :host {
            display: inline-flex;
            flex-shrink: 0;
        }

        .med-avatar {
            width: 36px;
            height: 36px;
            flex-shrink: 0;
            border-radius: var(--radius-md);
            display: flex;
            align-items: center;
            justify-content: center;
            background: var(--primary-100);
            color: var(--text-primary);
        }

        .med-avatar .mat-icon {
            font-size: 18px;
            width: 18px;
            height: 18px;
        }
    `]
})
export class UiMedAvatarComponent {
    @Input() icon = 'science';
}
