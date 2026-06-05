import { Component, Input, Output, EventEmitter } from '@angular/core';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

interface ToggleOption<T extends string = string> {
    value: T;
    label: string;
    icon: string;
}

@Component({
    standalone: true,
    selector: 'ui-search-bar',
    imports: [CommonModule, ReactiveFormsModule, MatIconModule, MatProgressSpinnerModule],
    template: `
        <div class="search-bar">
            <div class="input-wrap">
                <mat-icon class="search-icon">search</mat-icon>
                <input
                    class="input"
                    [formControl]="control"
                    type="text"
                    [placeholder]="placeholder"
                    autocomplete="off" />
                <mat-spinner *ngIf="isLoading" diameter="18" class="spinner"></mat-spinner>
            </div>
            <div class="toggle" *ngIf="showToggle">
                <button
                    *ngFor="let opt of toggleOptions"
                    type="button"
                    class="toggle-btn"
                    [class.active]="toggleValue === opt.value"
                    (click)="onToggleClick(opt.value)">
                    <mat-icon *ngIf="opt.icon" class="toggle-icon">{{ opt.icon }}</mat-icon>
                    <span>{{ opt.label }}</span>
                </button>
            </div>
        </div>
    `,
    styles: [`
        :host {
            display: block;
        }

        .search-bar {
            display: flex;
            align-items: stretch;
            border: 1px solid var(--border-color);
            border-radius: var(--radius-sm);
            background: var(--bg-card);
            transition: border-color .15s;
            margin-bottom: var(--space-4);
        }

        .search-bar:focus-within {
            border-color: var(--secondary);
            box-shadow: 0 0 0 3px rgba(79, 70, 229, .1);
        }

        .input-wrap {
            flex: 1;
            min-width: 0;
            position: relative;
            display: flex;
            align-items: center;
        }

        .search-icon {
            position: absolute;
            left: var(--space-3);
            color: var(--text-secondary);
            font-size: 20px;
            pointer-events: none;
        }

        .input {
            width: 100%;
            height: 44px;
            padding: 0 var(--space-10) 0 38px;
            border: none;
            font-family: inherit;
            font-size: .875rem;
            color: var(--text-primary);
            background: transparent;
            outline: none;
        }

        .input::placeholder {
            color: var(--text-disabled);
        }

        .spinner {
            position: absolute;
            right: var(--space-3);
        }

        .toggle {
            display: flex;
            align-items: center;
            gap: 2px;
            padding: 2px;
            margin: 4px;
            background: var(--bg-body);
            border-radius: 6px;
            flex-shrink: 0;
        }

        .toggle-btn {
            display: flex;
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
export class UiSearchBarComponent<T extends string = string> {
    @Input({ required: true }) control!: FormControl;
    @Input() placeholder = '';
    @Input() isLoading = false;
    @Input() showToggle = false;
    @Input() toggleOptions: ToggleOption<T>[] = [];
    @Input() toggleValue: T | null = null;
    @Output() toggleValueChange = new EventEmitter<T>();

    onToggleClick(val: T): void {
        if (val !== this.toggleValue) {
            this.toggleValue = val;
            this.toggleValueChange.emit(val);
        }
    }
}
