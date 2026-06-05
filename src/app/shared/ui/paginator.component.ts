import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PageEvent } from '@angular/material/paginator';

@Component({
    standalone: true,
    selector: 'ui-paginator',
    imports: [CommonModule, FormsModule, MatButtonModule, MatIconModule],
    template: `
        <div class="ui-paginator" *ngIf="totalPages > 0">
            <div class="paginator-nav">
                <button
                    mat-icon-button
                    class="paginator-nav-btn"
                    [disabled]="pageIndex <= 0"
                    (click)="goToPage(pageIndex - 1)"
                    aria-label="Página anterior">
                    <mat-icon>chevron_left</mat-icon>
                </button>

                <div class="paginator-chips">
                    <ng-container *ngFor="let p of visiblePages">
                        <span *ngIf="p === -1" class="paginator-ellipsis">...</span>
                        <button
                            *ngIf="p !== -1"
                            class="paginator-chip"
                            [class.active]="p === pageIndex"
                            (click)="goToPage(p)">
                            {{ p + 1 }}
                        </button>
                    </ng-container>
                </div>

                <button
                    mat-icon-button
                    class="paginator-nav-btn"
                    [disabled]="pageIndex >= totalPages - 1"
                    (click)="goToPage(pageIndex + 1)"
                    aria-label="Página siguiente">
                    <mat-icon>chevron_right</mat-icon>
                </button>
            </div>

            <div class="paginator-right">
                <span class="paginator-range">{{ rangeLabel }}</span>
                <select
                    class="paginator-select"
                    [ngModel]="pageSize"
                    (ngModelChange)="onPageSizeSelect($event)"
                    aria-label="Elementos por página">
                    <option *ngFor="let size of pageSizeOptions" [value]="size">{{ size }} items</option>
                </select>
            </div>
        </div>
    `,
    styles: [`
        .ui-paginator {
            display: flex;
            align-items: center;
            gap: 16px;
            flex-wrap: wrap;
            padding: 12px 24px;
            justify-content: flex-end;
        }

        .paginator-nav {
            display: flex;
            align-items: center;
            gap: 4px;
        }

        .paginator-nav-btn {
            flex-shrink: 0;
        }

        .paginator-nav-btn .mat-icon {
            font-size: 20px;
            width: 20px;
            height: 20px;
        }

        .paginator-chips {
            display: flex;
            align-items: center;
            gap: 2px;
        }

        .paginator-chip {
            min-width: 36px;
            height: 36px;
            padding: 0 6px;
            border: none;
            border-radius: 6px;
            background: transparent;
            font-family: inherit;
            font-size: 13px;
            font-weight: 500;
            color: var(--text-secondary, #556070);
            cursor: pointer;
            transition: all .15s;
            display: flex;
            align-items: center;
            justify-content: center;
            line-height: 1;
        }

        .paginator-chip:hover {
            background: var(--hover-bg, #e8e9eb);
            color: var(--text-primary, #111821);
        }

        .paginator-chip.active {
            background: var(--hover-bg, #e8e9eb);
            color: var(--primary-500, #0B4F82);
            font-weight: 600;
        }

        .paginator-ellipsis {
            width: 36px;
            height: 36px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            color: var(--text-disabled, #B0B8C6);
        }

        .paginator-right {
            display: flex;
            align-items: center;
            gap: 16px;
        }

        .paginator-range {
            font-size: 13px;
            color: var(--text-secondary, #556070);
            white-space: nowrap;
        }

        .paginator-select {
            height: 36px;
            padding: 0 28px 0 10px;
            border: 1px solid var(--border-color, #D6DAE3);
            border-radius: 8px;
            background: var(--bg-card, #FFFFFF);
            font-family: inherit;
            font-size: 13px;
            color: var(--text-secondary, #556070);
            cursor: pointer;
            outline: none;
            appearance: none;
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24'%3E%3Cpath fill='%236f7c95' d='M7 10l5 5 5-5z'/%3E%3C/svg%3E");
            background-repeat: no-repeat;
            background-position: right 8px center;
            transition: border-color .15s;
        }

        .paginator-select:hover {
            border-color: var(--secondary-300, #8496EB);
        }

        .paginator-select:focus {
            border-color: var(--secondary-300, #8496EB);
            box-shadow: 0 0 0 2px rgba(58, 83, 222, 0.15);
        }

        @media (max-width: 768px) {
            .ui-paginator {
                justify-content: center;
                gap: 12px;
            }

            .paginator-nav {
                margin-right: 0;
            }

            .paginator-right {
                width: 100%;
                justify-content: center;
            }
        }
    `]
})
export class UiPaginatorComponent implements OnChanges {
    @Input() length = 0;
    @Input() pageSize = 10;
    @Input() pageIndex = 0;
    @Input() pageSizeOptions: number[] = [5, 10, 25];
    @Input() maxVisiblePages = 5;

    @Output() page = new EventEmitter<PageEvent>();

    visiblePages: number[] = [];

    get totalPages(): number {
        if (this.pageSize <= 0) { return 0; }
        return Math.ceil(this.length / this.pageSize);
    }

    get rangeLabel(): string {
        if (this.length === 0) { return '0 resultados'; }
        const start = this.pageIndex * this.pageSize + 1;
        const end = Math.min(start + this.pageSize - 1, this.length);
        return `${start} \u2013 ${end} de ${this.length}`;
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['length'] || changes['pageSize'] || changes['pageIndex'] || changes['maxVisiblePages']) {
            this.computeVisiblePages();
        }
    }

    goToPage(page: number): void {
        if (page < 0 || page >= this.totalPages || page === this.pageIndex) { return; }
        this.pageIndex = page;
        this.computeVisiblePages();
        this.page.emit({ pageIndex: page, pageSize: this.pageSize, length: this.length });
    }

    onPageSizeSelect(newSize: number): void {
        if (newSize === this.pageSize) { return; }
        this.pageSize = newSize;
        const newTotal = Math.ceil(this.length / this.pageSize);
        const newIndex = Math.min(this.pageIndex, Math.max(newTotal - 1, 0));
        if (newIndex !== this.pageIndex) {
            this.pageIndex = newIndex;
        }
        this.computeVisiblePages();
        this.page.emit({ pageIndex: this.pageIndex, pageSize: this.pageSize, length: this.length });
    }

    private computeVisiblePages(): void {
        if (this.totalPages <= this.maxVisiblePages) {
            this.visiblePages = Array.from({ length: this.totalPages }, (_, i) => i);
            return;
        }

        const half = Math.floor(this.maxVisiblePages / 2);
        let start = this.pageIndex - half;
        let end = this.pageIndex + half;

        if (start < 0) {
            start = 0;
            end = this.maxVisiblePages - 1;
        }
        if (end >= this.totalPages) {
            end = this.totalPages - 1;
            start = this.totalPages - this.maxVisiblePages;
        }

        const pages: number[] = [];
        if (start > 0) {
            pages.push(0);
            if (start > 1) { pages.push(-1); }
        }
        for (let i = start; i <= end; i++) {
            pages.push(i);
        }
        if (end < this.totalPages - 1) {
            if (end < this.totalPages - 2) { pages.push(-1); }
            pages.push(this.totalPages - 1);
        }

        this.visiblePages = pages;
    }
}
