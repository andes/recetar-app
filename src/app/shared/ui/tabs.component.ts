import { Component, EventEmitter, Input, Output, booleanAttribute } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { UiBadgeChipComponent } from './badge-chip.component';

export interface UiTabItem {
    value: string;
    label: string;
    icon?: string;
    count?: number;
    error?: boolean;
    disabled?: boolean;
}

@Component({
    standalone: true,
    selector: 'ui-tabs',
    imports: [MatIconModule, UiBadgeChipComponent],
    template: `
        <div class="ui-tabs" [class.stretch]="stretch" role="tablist">
            @for (tab of items; track tab.value) {
                <button type="button" class="ui-tab" [class.active]="tab.value === value"
                    [disabled]="tab.disabled" role="tab" [attr.aria-selected]="tab.value === value"
                    (click)="select(tab)">
                    @if (tab.icon) {
                        <mat-icon class="sm">{{ tab.icon }}</mat-icon>
                    }
                    <span class="ui-tab-label text-sm">{{ tab.label }}</span>
                    @if (tab.error) {
                        <mat-icon class="xs text-error">error</mat-icon>
                    }
                    @if (tab.count !== undefined) {
                        <ui-badge-chip size="sm" [variant]="tab.value === value ? 'primary' : 'neutral'">
                            {{ tab.count }}
                        </ui-badge-chip>
                    }
                </button>
            }
        </div>
    `,
    styles: [`
        :host {
            display: block;
        }

        .ui-tabs {
            display: flex;
            justify-content: flex-start;
            width: fit-content;
            max-width: 100%;
            border-bottom: 1px solid var(--border-color);
            overflow-x: auto;
        }

        .ui-tabs.stretch {
            width: 100%;
        }

        .ui-tab {
            flex: 0 0 160px;
            width: 160px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: var(--space-2);
            min-width: 0;
            padding: var(--space-3);
            background: none;
            border: none;
            border-bottom: 2px solid transparent;
            color: var(--text-secondary);
            cursor: pointer;
            transition: border-color .12s, color .12s;
        }

        .ui-tabs.stretch .ui-tab {
            flex: 1;
            width: auto;
        }

        .ui-tab:hover {
            color: var(--text-primary);
        }

        .ui-tab.active {
            border-bottom-color: var(--primary);
            color: var(--text-primary);
        }

        .ui-tab:disabled {
            cursor: not-allowed;
            opacity: .5;
        }

        .ui-tab-label {
            font-weight: 500;
            white-space: nowrap;
        }
    `]
})
export class UiTabsComponent {
    @Input() items: UiTabItem[] = [];
    @Input() value = '';
    @Input({ transform: booleanAttribute }) stretch = true;
    @Output() valueChange = new EventEmitter<string>();

    select(tab: UiTabItem): void {
        if (tab.disabled || tab.value === this.value) {
            return;
        }
        this.valueChange.emit(tab.value);
    }
}
