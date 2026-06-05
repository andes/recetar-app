import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

export interface ToggleOption {
    value: string;
    label: string;
    icon?: string;
    count?: number;
    color?: string;
}

@Component({
    standalone: true,
    selector: 'ui-toggle',
    imports: [CommonModule, MatIconModule],
    host: {
        '[class.big]': 'variant === "big"'
    },
    template: `
        <div class="toggle-group toggle-big" *ngIf="variant === 'big'">
            <button
                *ngFor="let opt of options"
                type="button"
                class="toggle-btn"
                [class.active]="value === opt.value"
                (click)="select(opt.value)">
                <span class="toggle-icon-box" [ngClass]="'color-' + (opt.color || 'primary')">
                    <mat-icon *ngIf="opt.icon">{{ opt.icon }}</mat-icon>
                </span>
                <span class="toggle-label-group">
                    <small class="toggle-title">{{ opt.label }}</small>
                    <small class="toggle-count" *ngIf="opt.count !== undefined">{{ opt.count }} docs</small>
                </span>
            </button>
        </div>

        <div class="toggle-group" *ngIf="variant !== 'big'">
            <button
                *ngFor="let opt of options"
                type="button"
                class="toggle-btn"
                [class.active]="value === opt.value"
                (click)="select(opt.value)">
                <mat-icon *ngIf="opt.icon" class="toggle-icon">{{ opt.icon }}</mat-icon>
                <small>{{ opt.label }}</small>
            </button>
        </div>
    `,
    styles: [`
        :host {
            display: inline-flex;
            height: fit-content;
            margin-left: auto;
        }

        :host(.big) {
            width: 100%;
            margin-left: 0;
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

        /* ---- Big variant ---- */
        .toggle-group.toggle-big {
            width: 100%;
            padding: 4px;
            border-radius: var(--radius-lg, 12px);
            gap: 4px;
        }

        .toggle-group.toggle-big .toggle-btn {
            flex: 1;
            height: auto;
            padding: 12px 16px;
            gap: 10px;
            font-size: 14px;
            border-radius: var(--radius-md, 10px);
        }

        .toggle-icon-box {
            width: 32px;
            height: 32px;
            border-radius: var(--radius-sm, 8px);
            background-color: var(--primary-50);
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            transition: all .2s ease;
        }

        .toggle-icon-box mat-icon {
            font-size: 18px;
            width: 18px;
            height: 18px;
            line-height: 18px;
        }
        .toggle-btn.active .toggle-icon-box.color-primary {
            background: var(--secondary);
            color: white;
        }

        .toggle-btn.active .toggle-icon-box.color-success {
            background: var(--success-text);
            color: white;
        }

        .toggle-btn.active .toggle-icon-box.color-warning {
            background: var(--warning-fill);
            color: white;
        }

        .toggle-btn.active .toggle-icon-box.color-info {
            background: var(--info-text);
            color: white;
        }

        .toggle-btn.active .toggle-icon-box.color-receta {
            background: var(--receta);
            color: white;
        }

        .toggle-label-group {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            gap: 1px;
        }

        .toggle-title {
            font-weight: 600;
            font-size: 14px;
            line-height: normal;
        }

        .toggle-count {
            font-size: 12px;
            color: var(--text-disabled);
            line-height: normal;
        }

        .toggle-btn.active .toggle-count {
            color: var(--text-secondary);
        }
    `]
})
export class UiToggleComponent {
    @Input() options: ToggleOption[] = [];
    @Input() value: string | null = null;
    @Input() variant: 'default' | 'big' = 'default';
    @Output() valueChange = new EventEmitter<string>();

    select(val: string): void {
        if (val !== this.value) {
            this.value = val;
            this.valueChange.emit(val);
        }
    }
}
