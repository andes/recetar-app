import { Component, Input, Output, EventEmitter } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { UiPaginatorComponent } from './paginator.component';
import { UiEmptyStateComponent } from './empty-state.component';

@Component({
    standalone: true,
    selector: 'ui-results-list',
    imports: [MatButtonModule, MatProgressSpinnerModule, UiPaginatorComponent, UiEmptyStateComponent],
    template: `
        @if (!loading && total > 0) {
            <div class="results-count">
                <span class="results-count-type">{{ label }}</span>
                <small class="results-count-range">
                    @if (countMode === 'loaded') {
                        Mostrando {{ total }} resultados cargados
                    } @else {
                        Mostrando {{ from }}&ndash;{{ to }} de {{ total }} resultados
                    }
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

            @if (showPaginator) {
                <ui-paginator [length]="total" [pageSize]="pageSize" [pageIndex]="pageIndex"
                    [pageSizeOptions]="pageSizeOptions" (page)="page.emit($event)">
                </ui-paginator>
            } @else if (hasMore) {
                <div class="load-more">
                    <button matButton="tonal" type="button" (click)="loadMore.emit()">Cargar más</button>
                </div>
            }
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

        .load-more {
            display: flex;
            justify-content: center;
            padding-top: var(--space-2);
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
    @Input() showPaginator = true;
    @Input() hasMore = false;
    @Input() countMode: 'range' | 'loaded' = 'range';

    @Output() page = new EventEmitter<PageEvent>();
    @Output() loadMore = new EventEmitter<void>();

    get from(): number {
        return this.pageIndex * this.pageSize + 1;
    }

    get to(): number {
        return Math.min(this.from + this.pageSize - 1, this.total);
    }
}
