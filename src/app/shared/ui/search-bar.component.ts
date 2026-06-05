import { Component, Input, Output, EventEmitter, booleanAttribute } from '@angular/core';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { UiToggleComponent, ToggleOption } from './toggle.component';

@Component({
    standalone: true,
    selector: 'ui-search-bar',
    imports: [CommonModule, ReactiveFormsModule, MatIconModule, MatProgressSpinnerModule, UiToggleComponent],
    template: `
        <div class="search-bar" [class.stretch]="stretch">
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
            <span class="search-action"><ng-content select="[searchAction]" /></span>
        </div>
        <ui-toggle *ngIf="showToggle"
            [options]="toggleOptions"
            [value]="toggleValue"
            (valueChange)="onToggle($event)">
        </ui-toggle>
    `,
    styles: [`
        :host {
            display: flex;
            flex-direction: column;
            gap: var(--space-2);
        }

        .search-bar.stretch {
            width: 100%;
        }

        .search-bar {
            display: flex;
                        align-items: center;
            border: 1px solid var(--border-color);
            border-radius: var(--radius-sm);
            background: var(--bg-card);
            transition: border-color .15s;
        }

        .search-bar>.mdc-button {
            margin-right: var(--space-2);
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
            height: 58px;
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

        .search-action {
            flex-shrink: 0;
            display: flex;
            align-items: center;
            padding-right: var(--space-2);
        }

        @media (min-width: 769px) {
            :host {
                flex-direction: row;
                align-items: stretch;
                gap: var(--space-2);
            }

            .search-bar {
                flex: 1;
            }
        }
    `]
})
export class UiSearchBarComponent<T extends string = string> {
    @Input({ required: true }) control!: FormControl;
    @Input() placeholder = '';
    @Input() isLoading = false;
    @Input({ transform: booleanAttribute }) stretch = false;
    @Input() showToggle = false;
    @Input() toggleOptions: ToggleOption[] = [];
    @Input() toggleValue: string | null = null;
    @Output() toggleValueChange = new EventEmitter<string>();

    onToggle(val: string): void {
        this.toggleValue = val;
        this.toggleValueChange.emit(val);
    }
}
