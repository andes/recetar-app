import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { UiCardComponent } from './card.component';
import { UiSearchBarComponent } from './search-bar.component';

@Component({
    standalone: true,
    selector: 'ui-results-toolbar',
    imports: [ReactiveFormsModule, MatButtonModule, MatIconModule, MatTooltipModule, UiCardComponent, UiSearchBarComponent],
    template: `
        <ui-card stretch>
            <div class="results-toolbar">
                <div class="search-bar-wrap">
                    <ui-search-bar [control]="control" [placeholder]="placeholder" [isLoading]="isLoading"
                        [stretch]="true" (keydown.enter)="searchEnter.emit()">
                        <button matButton="tonal" class="btn-icon" searchAction *ngIf="control.value"
                            matTooltip="Borrar búsqueda" (click)="onClear()">
                            <mat-icon>close</mat-icon>
                        </button>
                    </ui-search-bar>
                </div>

                @if (showFilters) {
                    <button matButton="tonal" class="filter-toggle-btn" [class.has-filters]="hasActiveFilters"
                        (click)="filtersOpen = !filtersOpen">
                        <mat-icon>{{ !filtersOpen ? 'arrow_drop_down' : 'arrow_drop_up' }}</mat-icon>
                        Filtros{{ filterCount > 0 ? ' (' + filterCount + ')' : '' }}
                    </button>
                }

                @if (showRefresh) {
                    <button matButton="outlined" (click)="refresh.emit()" matTooltip="Actualizar datos">
                        <mat-icon>refresh</mat-icon> Actualizar
                    </button>
                }
            </div>

            <ng-content select="[searchExtra]"></ng-content>

            @if (showFilters) {
                <div class="filter-panel" [hidden]="!filtersOpen">
                    <div class="filter-fields">
                        <ng-content select="[filters]"></ng-content>
                    </div>
                    <div class="filter-actions">
                        <button matButton="tonal" (click)="clearFilters.emit()">
                            <mat-icon>clear_all</mat-icon> Limpiar
                        </button>
                    </div>
                </div>
            }
        </ui-card>
    `,
    styles: [`
        :host {
            display: flex;
            flex: 0 0 auto;
            margin-bottom: var(--space-4);
        }

        .results-toolbar {
            display: flex;
            align-items: center;
            gap: var(--space-3);
        }

        .search-bar-wrap {
            flex: 1;
        }

        .filter-toggle-btn.has-filters {
            border-color: var(--secondary);
            color: var(--secondary);
            background: var(--secondary-50);
        }

        .filter-panel {
            padding-top: var(--space-4);
        }

        .filter-fields {
            display: grid;
            grid-template-columns: 1fr;
            gap: var(--space-3);
        }

        .filter-actions {
            display: flex;
            justify-content: flex-end;
            gap: var(--space-2);
            margin-top: var(--space-3);
        }

        @media (min-width: 769px) {
            .filter-fields {
                grid-template-columns: repeat(2, 1fr);
            }
        }

        @media (min-width: 993px) {
            .filter-fields {
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            }
        }
    `]
})
export class UiResultsToolbarComponent {
    @Input({ required: true }) control!: FormControl;
    @Input() placeholder = '';
    @Input() isLoading = false;
    @Input() showFilters = false;
    @Input() showRefresh = true;
    @Input() filterCount = 0;
    @Input() hasActiveFilters = false;

    @Output() refresh = new EventEmitter<void>();
    @Output() clearSearch = new EventEmitter<void>();
    @Output() searchEnter = new EventEmitter<void>();
    @Output() clearFilters = new EventEmitter<void>();

    filtersOpen = false;

    onClear(): void {
        this.control.setValue('');
        this.clearSearch.emit();
    }
}
