import { Component, Input, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    standalone: true,
    encapsulation: ViewEncapsulation.None,
    selector: 'ui-draft-tag',
    imports: [CommonModule],
    template: `
        <div class="draft-tag">
            <span class="draft-tag-pulse"></span>
            <small class="draft-tag-label">{{ label }}</small>
            <small class="draft-tag-hint" *ngIf="hint">{{ hint }}</small>
        </div>
    `,
    styles: [`
        .draft-tag {
            display: flex;
            align-items: center;
            gap: var(--space-2);
            padding: calc(var(--space-2) + 2px) var(--space-4);
            color: var(--secondary);
            border-bottom: 1px solid var(--secondary-200);
        }

        .draft-tag-label {
            flex-shrink: 0;
            font-weight: 500;
            font-size: 12px;
        }

        .draft-tag-hint {
            margin-left: auto;
            color: var(--secondary);
            font-size: 12px;
        }

        .draft-tag-pulse {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: var(--secondary);
            box-shadow: 0 0 0 4px rgba(79, 70, 229, .18);
            animation: draft-tag-pulse 1.6s infinite;
            flex-shrink: 0;
        }

        @keyframes draft-tag-pulse {
            0% {
                box-shadow: 0 0 0 0 rgba(79, 70, 229, .4);
            }
            70% {
                box-shadow: 0 0 0 8px rgba(79, 70, 229, 0);
            }
            100% {
                box-shadow: 0 0 0 0 rgba(79, 70, 229, 0);
            }
        }
    `]
})
export class UiDraftTagComponent {
    @Input() label = 'Borrador';
    @Input() hint = '';
}
