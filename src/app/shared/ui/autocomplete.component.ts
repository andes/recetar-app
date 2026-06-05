import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
    standalone: true,
    selector: 'ui-autocomplete',
    imports: [CommonModule, FormsModule, MatIconModule, MatProgressSpinnerModule],
    template: `
        <div class="ui-autocomplete" #container>
            <div class="ui-autocomplete-input-wrapper" [class.focused]="focused" (click)="onWrapperClick()">
                <mat-icon *ngIf="icon" class="ui-autocomplete-icon">{{ icon }}</mat-icon>
                <input #inputEl class="ui-autocomplete-input" type="text"
                    [placeholder]="placeholder"
                    [(ngModel)]="searchText"
                    (focus)="onFocus()"
                    (blur)="onBlur()"
                    (input)="onInput($event)"
                    (keydown)="onKeydown($event)"
                    autocomplete="off">
                <mat-spinner *ngIf="loading" [diameter]="16" class="ui-autocomplete-spinner"></mat-spinner>
                <mat-icon *ngIf="searchText && !loading" class="ui-autocomplete-clear"
                    (mousedown)="clear($event)">close</mat-icon>
                <mat-icon class="ui-autocomplete-chevron" (mousedown)="toggleDropdown($event)">arrow_drop_down</mat-icon>
            </div>
            <div class="ui-autocomplete-dropdown" *ngIf="open && items.length > 0"
                [style.top.px]="dropdownTop"
                [style.left.px]="dropdownLeft"
                [style.width.px]="dropdownWidth">
                <button class="ui-autocomplete-option" *ngFor="let item of filteredItems; trackBy: trackByFn"
                    (mousedown)="select(item)"
                    [class.highlighted]="item === highlightedItem">
                    <span class="ui-autocomplete-option-primary">{{ displayFn(item) }}</span>
                    <span *ngIf="subtitleFn && subtitleFn(item)" class="ui-autocomplete-option-secondary">{{ subtitleFn(item) }}</span>
                </button>
            </div>
            <div class="ui-autocomplete-dropdown ui-autocomplete-empty" *ngIf="open && !loading && items.length === 0 && searchText.length >= 3"
                [style.top.px]="dropdownTop"
                [style.left.px]="dropdownLeft"
                [style.width.px]="dropdownWidth">
                Sin resultados
            </div>
        </div>
    `,
    styles: [`
        :host { display: block; }

        .ui-autocomplete-input-wrapper {
            display: flex;
            align-items: center;
            gap: 4px;
            padding: 6px 8px;
            border: 1px solid var(--border-color);
            border-radius: var(--radius-sm, 6px);
            background: var(--bg-card);
            min-height: 36px;
            transition: border-color .15s;
            cursor: text;
        }
        .ui-autocomplete-input-wrapper:hover { border-color: var(--secondary-300); }
        .ui-autocomplete-input-wrapper.focused {
            border-color: var(--secondary);
            box-shadow: 0 0 0 2px color-mix(in srgb, var(--secondary) 25%, transparent);
        }

        .ui-autocomplete-icon, .ui-autocomplete-clear, .ui-autocomplete-chevron {
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
        }

        .ui-autocomplete-icon { color: var(--text-secondary); font-size: 20px; margin-right: 2px; }

        .ui-autocomplete-input {
            flex: 1;
            min-width: 60px;
            border: none;
            outline: none;
            background: transparent;
            font-family: inherit;
            font-size: .8rem;
            color: var(--text-primary);
        }
        .ui-autocomplete-input::placeholder { color: var(--text-disabled); }

        .ui-autocomplete-spinner { flex-shrink: 0; }
        .ui-autocomplete-clear {
            font-size: 18px;
            color: var(--text-secondary);
            cursor: pointer;
            margin-left: 2px;
        }
        .ui-autocomplete-clear:hover { color: var(--text-primary); }

        .ui-autocomplete-chevron { color: var(--text-secondary); font-size: 20px; cursor: pointer; }
        .ui-autocomplete-chevron:hover { color: var(--text-primary); }

        .ui-autocomplete-dropdown {
            position: fixed;
            z-index: 2000;
            background: var(--bg-card);
            border: 1px solid var(--border-color);
            border-radius: var(--radius-sm, 6px);
            box-shadow: 0 4px 12px rgba(0,0,0,.12);
            margin-top: 4px;
            max-height: 300px;
            overflow-y: auto;
            box-sizing: border-box;
        }

        .ui-autocomplete-option {
            display: flex;
            flex-direction: column;
            width: 100%;
            padding: 8px 12px;
            border: none;
            background: transparent;
            cursor: pointer;
            text-align: left;
            font-family: inherit;
        }
        .ui-autocomplete-option:hover,
        .ui-autocomplete-option.highlighted { background: var(--bg-hover, #f5f5f5); }

        .ui-autocomplete-option-primary {
            font-size: 13px;
            font-weight: 500;
            color: var(--text-primary);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .ui-autocomplete-option-secondary {
            font-size: 11px;
            color: var(--text-secondary);
            margin-top: 2px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .ui-autocomplete-empty {
            padding: 16px;
            text-align: center;
            color: var(--text-secondary);
            font-size: 13px;
        }
    `]
})
export class UiAutocompleteComponent<T> {
    @Input() items: T[] = [];
    @Input() loading = false;
    @Input() placeholder = 'Buscar...';
    @Input() icon = '';
    @Input() displayFn: (item: T) => string = (item: T) => String(item ?? '');
    @Input() subtitleFn: ((item: T) => string) | null = null;
    @Input() trackByFn: (index: number, item: T) => unknown = (index: number) => index;
    @Input() selected: T | null = null;
    @Input() searchText = '';

    @Output() selectedChange = new EventEmitter<T>();
    @Output() searchTextChange = new EventEmitter<string>();

    @ViewChild('inputEl', { read: ElementRef }) inputEl!: ElementRef<HTMLInputElement>;
    @ViewChild('container', { read: ElementRef }) container!: ElementRef<HTMLElement>;

    focused = false;
    open = false;
    highlightedItem: T | null = null;
    dropdownTop = 0;
    dropdownLeft = 0;
    dropdownWidth = 0;

    get filteredItems(): T[] {
        return this.items;
    }

    private positionDropdown(): void {
        const wrapper = this.container?.nativeElement?.querySelector('.ui-autocomplete-input-wrapper') as HTMLElement;
        if (!wrapper) { return; }
        const rect = wrapper.getBoundingClientRect();
        this.dropdownTop = rect.bottom;
        this.dropdownLeft = rect.left;
        this.dropdownWidth = rect.width;
    }

    onWrapperClick(): void {
        this.inputEl.nativeElement.focus();
    }

    onFocus(): void {
        this.focused = true;
    }

    onBlur(): void {
        this.focused = false;
    }

    onInput(event: Event): void {
        this.searchTextChange.emit(this.searchText);
        const value = (event.target as HTMLInputElement).value;
        if (value.length >= 3) {
            this.positionDropdown();
            this.open = true;
        } else {
            this.open = false;
        }
    }

    onKeydown(event: KeyboardEvent): void {
        if (event.key === 'Escape') {
            this.open = false;
            return;
        }
        if (!this.open || this.items.length === 0) { return; }

        if (event.key === 'ArrowDown') {
            event.preventDefault();
            const idx = this.highlightedItem ? this.items.indexOf(this.highlightedItem) : -1;
            this.highlightedItem = this.items[Math.min(idx + 1, this.items.length - 1)];
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            const idx = this.highlightedItem ? this.items.indexOf(this.highlightedItem) : this.items.length;
            this.highlightedItem = this.items[Math.max(idx - 1, 0)];
        } else if (event.key === 'Enter' && this.highlightedItem) {
            event.preventDefault();
            this.select(this.highlightedItem);
        }
    }

    toggleDropdown(event: MouseEvent): void {
        event.preventDefault();
        if (!this.open) {
            this.positionDropdown();
        }
        this.open = !this.open;
        if (this.open) {
            this.inputEl.nativeElement.focus();
        }
    }

    select(item: T): void {
        this.selected = item;
        this.searchText = this.displayFn(item);
        this.selectedChange.emit(item);
        this.open = false;
        this.highlightedItem = null;
    }

    clear(event: MouseEvent): void {
        event.preventDefault();
        this.searchText = '';
        this.searchTextChange.emit('');
        this.selected = null;
        this.selectedChange.emit(null as unknown as T);
        this.inputEl.nativeElement.focus();
        this.open = false;
    }

    @HostListener('document:click', ['$event'])
    onDocumentClick(event: MouseEvent): void {
        const el = this.container?.nativeElement;
        if (el && !el.contains(event.target as Node)) {
            this.open = false;
        }
    }
}
