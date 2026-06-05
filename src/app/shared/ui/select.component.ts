import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, AfterViewInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { DOCUMENT } from '@angular/common';

let nextId = 0;

@Component({
    standalone: true,
    selector: 'ui-select',
    imports: [CommonModule, MatMenuModule, MatIconModule],
    template: `
        <button #triggerBtn class="ui-select-trigger"
            [class.borderless]="borderless"
            [matMenuTriggerFor]="menu"
            [matMenuTriggerRestoreFocus]="false">
            <mat-icon *ngIf="icon" class="ui-select-icon">{{ icon }}</mat-icon>
            <ng-container *ngIf="selected; else placeholderTpl">
                <small class="ui-select-value">{{ displayFn(selected) | titlecase }}</small>
                <small *ngIf="subtitleFn && subtitleFn(selected)" class="ui-select-subtitle">{{ subtitleFn(selected) }}</small>
            </ng-container>
            <ng-template #placeholderTpl>
                <span class="ui-select-placeholder">{{ placeholder }}</span>
            </ng-template>
            <mat-icon class="ui-select-chevron">arrow_drop_down</mat-icon>
        </button>
        <mat-menu #menu="matMenu" [class]="panelClass || menuClass" [overlapTrigger]="false">
            <button mat-menu-item *ngFor="let item of items; trackBy: trackByFn"
                (click)="select(item)">
                <div class="ui-select-item">
                    <span class="ui-select-item-primary">{{ displayFn(item) | titlecase }}</span>
                    <span *ngIf="subtitleFn && subtitleFn(item)" class="ui-select-item-secondary">{{ subtitleFn(item) }}</span>
                </div>
            </button>
            <ng-content select="[menuFooter]"></ng-content>
        </mat-menu>
    `,
    styles: [`
        :host {
            display: block;
        }

        .ui-select-trigger {
            display: flex;
            align-items: center;
            gap: var(--space-1, 8px);
            padding: var(--space-2, 8px) var(--space-3, 12px);
            border: 1px solid var(--border-color);
            border-radius: var(--radius-sm, 6px);
            background: var(--bg-card);
            cursor: pointer;
            user-select: none;
            min-height: 38px;
            width: 100%;
            font-family: inherit;
            outline: none;
            color: var(--text-primary);
            text-align: left;
            transition: border-color .15s;
        }

        .ui-select-trigger:hover {
            border-color: var(--secondary-300);
        }

        .ui-select-trigger.borderless {
            border: none;
            border-radius: 0;
            background: transparent;
            padding: 0 0 0 var(--space-3, 12px);
            min-height: auto;
        }

        .ui-select-trigger.borderless:hover {
            border-color: transparent;
        }

        .ui-select-icon {
            color: var(--text-secondary);
            font-size: 20px;
            height: 20px;
            flex-shrink: 0;
        }

        .ui-select-value {
            flex: 1;
            min-width: 0;
            font-weight: 500;
            color: var(--text-primary);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .ui-select-subtitle {
            font-size: .7rem;
            color: var(--text-secondary);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 140px;
        }

        .ui-select-placeholder {
            flex: 1;
            color: var(--text-disabled);
            font-size: 0.875rem;
        }

        .ui-select-chevron {
            color: var(--text-secondary);
            font-size: 20px;
            flex-shrink: 0;
        }

        .ui-select-item {
            display: flex;
            flex-direction: column;
            min-width: 0;
            width: 100%;
            overflow: hidden;
        }

        .ui-select-item-primary {
            font-size: 0.85rem;
            min-width: 0;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .ui-select-item-secondary {
            font-size: 11px;
            color: var(--text-secondary);
            margin-top: 2px;
            min-width: 0;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
    `]
})
export class UiSelectComponent<T> implements AfterViewInit, OnDestroy {
    @Input() items: T[] = [];
    @Input() selected: T | null = null;
    @Input() placeholder = 'Seleccionar...';
    @Input() icon = '';
    @Input() panelClass = '';
    @Input() borderless = false;
    @Input() matchTriggerWidth = true;
    @Input() displayFn: (item: T) => string = (item: T) => String(item ?? '');
    @Input() subtitleFn: ((item: T) => string) | null = null;
    @Input() trackByFn: (index: number, item: T) => unknown = (index: number) => index;

    @Output() selectedChange = new EventEmitter<T>();

    @ViewChild('triggerBtn', { read: ElementRef }) triggerBtn!: ElementRef<HTMLElement>;

    private resizeObserver: ResizeObserver | null = null;
    readonly menuClass = `ui-select-panel-${nextId++}`;
    private styleEl: HTMLStyleElement | null = null;
    private document = inject(DOCUMENT);

    select(item: T): void {
        if (item !== this.selected) {
            this.selected = item;
            this.selectedChange.emit(item);
        }
    }

    ngAfterViewInit(): void {
        if (!this.matchTriggerWidth || !this.triggerBtn) { return; }
        this.updatePanelWidth();
        this.resizeObserver = new ResizeObserver(() => this.updatePanelWidth());
        this.resizeObserver.observe(this.triggerBtn.nativeElement);
    }

    ngOnDestroy(): void {
        this.resizeObserver?.disconnect();
        this.removeStyle();
    }

    private updatePanelWidth(): void {
        const w = this.triggerBtn?.nativeElement?.offsetWidth;
        if (!w || w <= 0) { return; }
        this.injectStyle(w);
    }

    private injectStyle(width: number): void {
        if (!this.styleEl) {
            this.styleEl = this.document.createElement('style');
            this.document.head.appendChild(this.styleEl);
        }
        this.styleEl.textContent = `
            .${this.menuClass} {
                min-width: ${width}px !important;
                max-width: ${width}px !important;
                overflow: hidden;
            }
            .${this.menuClass} .mat-mdc-menu-content {
                overflow: hidden;
            }
            .${this.menuClass} .mat-mdc-menu-item {
                overflow: hidden;
                max-width: 100%;
            }
            .${this.menuClass} .mat-mdc-menu-item-text {
                overflow: hidden;
                max-width: 100%;
            }
        `;
    }

    private removeStyle(): void {
        if (this.styleEl && this.styleEl.parentNode) {
            this.styleEl.parentNode.removeChild(this.styleEl);
            this.styleEl = null;
        }
    }
}
