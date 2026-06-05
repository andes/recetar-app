import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

export interface ToggleOption {
    value: string;
    label: string;
    icon?: string;
}

@Component({
    standalone: true,
    selector: 'ui-toggle',
    imports: [CommonModule, MatIconModule],
    template: `
        <div class="toggle-group">
            <button
                *ngFor="let opt of options"
                type="button"
                class="toggle-btn"
                [class.active]="value === opt.value"
                (click)="select(opt.value)">
                <mat-icon *ngIf="opt.icon" class="toggle-icon">{{ opt.icon }}</mat-icon>
                <span>{{ opt.label }}</span>
            </button>
        </div>
    `,
    styles: [`
        :host {
            display: inline-flex;
            height: fit-content;
            margin-left: auto;
        }

        @media (min-width: 769px) {
            :host {
                align-self: center;
                margin-left: 0;
            }
        }

        .toggle-group {
            display: flex;
            align-items: center;
            gap: 2px;
            padding: 2px;
            background: var(--bg-over-body);
            border-radius: 6px;
            flex-shrink: 0;
        }

        .toggle-btn {
            display: flex;
            height: 34px;
            align-items: center;
            gap: 4px;
            padding: 5px 10px;
            border: none;
            border-radius: 6px;
            background: transparent;
            font-family: inherit;
            font-size: .75rem;
            font-weight: 500;
            color: var(--text-secondary);
            cursor: pointer;
            white-space: nowrap;
            transition: all .15s;
            line-height: 1;
        }

        .toggle-btn:hover {
            color: var(--text-primary);
        }

        .toggle-btn.active {
            background: var(--bg-card);
            color: var(--primary);
            box-shadow: var(--shadow-sm);
        }

        .toggle-icon {
            font-size: 16px;
            width: 16px;
            height: 16px;
            line-height: 16px;
        }
    `]
})
export class UiToggleComponent {
    @Input() options: ToggleOption[] = [];
    @Input() value: string | null = null;
    @Output() valueChange = new EventEmitter<string>();

    select(val: string): void {
        if (val !== this.value) {
            this.value = val;
            this.valueChange.emit(val);
        }
    }
}
