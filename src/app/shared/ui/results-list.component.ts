import { Component, Input, Output, EventEmitter } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { UiPaginatorComponent } from './paginator.component';
import { UiEmptyStateComponent } from './empty-state.component';

@Component({
    standalone: true,
    selector: 'ui-results-list',
    imports: [MatProgressSpinnerModule, UiPaginatorComponent, UiEmptyStateComponent],
    template: `
        @if (!loading && total > 0) {
            <div class="results-count">
                <span class="results-count-type">{{ label }}</span>
                <small class="results-count-range">
                    Mostrando {{ from }}&ndash;{{ to }} de {{ total }} resultados
                </small>
            </div>
        }

        @if (loading) {
            <div class="loading-container">
                <mat-spinner diameter="40"></mat-spinner>
            </div>
        } @else if (total === 0) {
            <div class="empty-container">
                <ng-content select="[empty]">
                    <ui-empty-state [icon]="emptyIcon">{{ emptyMessage }}</ui-empty-state>
                </ng-content>
            </div>
        }

        @if (!loading && total > 0) {
            <div class="results-items">
                <ng-content></ng-content>
            </div>

            <ui-paginator [length]="total" [pageSize]="pageSize" [pageIndex]="pageIndex"
                [pageSizeOptions]="pageSizeOptions" (page)="page.emit($event)">
            </ui-paginator>
        }
    `,
    styles: [`
        :host {
            display: flex;
            flex-direction: column;
            flex: 1;
            gap: var(--space-3);
            min-height: 0;
        }

        .results-count {
            display: flex;
            align-items: baseline;
            gap: var(--space-4);
        }

        .results-count-type {
            font-weight: 500;
        }

        .results-count-range {
            color: var(--text-secondary);
        }

        .loading-container {
            display: flex;
            justify-content: center;
            padding: var(--space-8);
        }

        .empty-container {
            padding: var(--space-6);
        }

        .results-items {
            display: flex;
            flex-direction: column;
            gap: var(--space-3);
        }
    `]
})
export class UiResultsListComponent {
    @Input() loading = false;
    @Input() total = 0;
    @Input() label = '';
    @Input() emptyIcon = 'description';
    @Input() emptyMessage = '';
    @Input() pageSize = 10;
    @Input() pageIndex = 0;
    @Input() pageSizeOptions: number[] = [5, 10, 25];

    @Output() page = new EventEmitter<PageEvent>();

    get from(): number {
        return this.pageIndex * this.pageSize + 1;
    }

    get to(): number {
        return Math.min(this.from + this.pageSize - 1, this.total);
    }
}
