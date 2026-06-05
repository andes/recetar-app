import { Component, Input, Output, EventEmitter, ContentChild, ViewChild, AfterViewInit, ChangeDetectorRef, TemplateRef, booleanAttribute, ViewEncapsulation, Directive } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTable } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';

export interface ColumnDef {
    name: string;
    header: string;
    cell: TemplateRef<any>;
    headerClass?: string;
    cellClass?: string;
    stopPropagation?: boolean;
}

@Directive({
    selector: 'ng-template[uiTableDetail]',
    standalone: true,
})
export class UiTableDetailDirective { }

@Component({
    standalone: true,
    encapsulation: ViewEncapsulation.None,
    selector: 'ui-table',
    imports: [CommonModule, MatTableModule, MatIconModule],
    template: `
        <table mat-table [dataSource]="dataSource" multiTemplateDataRows
            class="ui-table"
            [class.dense]="dense"
            [class.frameless]="frameless">

            <ng-container *ngIf="expandable" matColumnDef="expand">
                <th mat-header-cell *matHeaderCellDef class="ui-table-col-expand"></th>
                <td mat-cell *matCellDef="let element" class="ui-table-col-expand">
                    <mat-icon class="ui-table-chevron" [class.open]="expandedElement === element">chevron_right</mat-icon>
                </td>
            </ng-container>

            <ng-container *ngFor="let col of columns" [matColumnDef]="col.name">
                <th mat-header-cell *matHeaderCellDef
                    [class.col-centered]="col.headerClass === 'col-centered'">
                    {{ col.header }}
                </th>
                <td mat-cell *matCellDef="let element"
                    [class.col-centered]="col.cellClass === 'col-centered'"
                    (click)="col.stopPropagation ? $event.stopPropagation() : null">
                    <ng-container *ngTemplateOutlet="col.cell; context: { $implicit: element }"></ng-container>
                </td>
            </ng-container>

            <ng-container matColumnDef="expandedDetail">
                <td mat-cell *matCellDef="let element" [attr.colspan]="allColumns.length">
                    <div class="ui-table-detail" [class.open]="isExpanded(element)">
                        <div class="ui-table-detail-inner">
                            <ng-container *ngTemplateOutlet="detailTemplate; context: { $implicit: element }"></ng-container>
                        </div>
                    </div>
                </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="allColumns"></tr>
            <tr mat-row *matRowDef="let element; columns: allColumns"
                class="ui-table-row"
                [class.active]="expandable && isExpanded(element)"
                (click)="onRowClick(element)"></tr>
            <tr mat-row *matRowDef="let element; columns: ['expandedDetail']"
                class="ui-table-detail-row"
                [class.expanded]="isExpanded(element)"></tr>
        </table>
    `,
    styles: [`
        .ui-table.mat-mdc-table {
            width: 100%;
            background: var(--bg-card);
            border: 1px solid var(--hover-bg);
            border-radius: var(--radius-md);
            overflow: hidden;
            border-collapse: separate;
            border-spacing: 0;
        }
        .ui-table .mat-mdc-header-row .mat-mdc-header-cell {
            font-size: 12px;
            font-weight: 500;
            background: var(--primary-50);
            border-bottom: 1px solid var(--secondary-100);
            padding: 8px 16px;
        }
        .ui-table .mat-mdc-header-row .mat-mdc-header-cell.col-centered {
            text-align: center;
        }
        .ui-table .mat-mdc-cell {
            padding: var(--space-5) var(--space-3);
            border-bottom: 1px solid var(--secondary-100);
            font-size: 13px;
        }
        .ui-table .mat-mdc-cell.col-centered {
            text-align: center;
        }
        .ui-table-col-expand {
            width: 30px;
            min-width: 30px;
            padding: 0 0 0 10px !important;
        }
        .ui-table-chevron {
            font-size: 18px;
            width: 18px;
            height: 18px;
            color: var(--text-disabled);
            transition: transform .2s, color .2s;
            display: flex;
            align-items: center;
        }
        .ui-table-chevron.open {
            transform: rotate(90deg);
            color: var(--secondary);
        }
        .ui-table-row {
            cursor: pointer;
            transition: background .12s;
        }
        .ui-table-row:hover .mat-mdc-cell {
            background: var(--hover-bg);
        }
        .ui-table-row.active .mat-mdc-cell {
            background: var(--hover-bg);
        }
        .ui-table-row.active .mat-mdc-cell {
            border-bottom-color: var(--hover-bg);
        }
        .ui-table-row:last-of-type .mat-mdc-cell {
            border-bottom: none;
        }
        .ui-table-row.active:last-of-type .mat-mdc-cell {
            border-bottom: 1px solid var(--hover-bg);
        }
        .ui-table-detail-row {
            display: none;
        }
        .ui-table-detail-row.expanded {
            display: table-row;
        }
        .ui-table-detail-row .mat-mdc-cell {
            padding: 0 !important;
            border: 0 !important;
        }
        .ui-table-detail {
            display: none;
        }
        .ui-table-detail.open {
            display: block;
            border-bottom: 1px solid var(--hover-bg);
        }
        .ui-table-detail-inner {
            padding: 14px 14px 14px 40px;
            background: #fafbfc;
        }
        .ui-table.dense .mat-mdc-header-row {
            height: 28px;
        }
        .ui-table.dense .mat-mdc-header-row .mat-mdc-header-cell {
            font-size: 10px;
            padding: 0 16px !important;
        }
        .ui-table.dense .mat-mdc-cell {
            padding: 8px 16px;
        }
        .ui-table.frameless {
            background: transparent;
            border: none;
            border-radius: 0;
        }
        .ui-table.frameless .mat-mdc-header-row .mat-mdc-header-cell {
            background: transparent;
            padding-left: 0;
            padding-right: 0;
        }
        .ui-table.frameless .mat-mdc-cell {
            padding-left: 0;
            padding-right: 0;
        }
        .ui-table.frameless .mat-mdc-cell:first-child {
            padding-left: 10px;
        }
            .ui-table.frameless .mat-mdc-cell:last-child {
            padding-left: 10px;
        }
        .ui-table.frameless .mat-mdc-row:last-of-type .mat-mdc-cell {
            border-bottom: none;
        }
    `]
})
export class UiTableComponent<T> implements AfterViewInit {
    @Input() dataSource: T[] = [];
    @Input() columns: ColumnDef[] = [];
    @Input({ transform: booleanAttribute }) dense = false;
    @Input({ transform: booleanAttribute }) expandable = true;
    @Input({ transform: booleanAttribute }) frameless = false;

    @Output() rowClick = new EventEmitter<T>();

    @ViewChild(MatTable) table!: MatTable<T>;
    @ContentChild(UiTableDetailDirective, { read: TemplateRef }) detailTemplate?: TemplateRef<any>;

    expandedElement: T | null = null;

    constructor(private cdr: ChangeDetectorRef) { }

    get allColumns(): string[] {
        if (!this.expandable) {
            return this.columns.map(c => c.name);
        }
        return ['expand', ...this.columns.map(c => c.name)];
    }

    isExpanded(element: T): boolean {
        if (!this.expandedElement || !element) { return false; }
        return JSON.stringify(this.expandedElement) === JSON.stringify(element);
    }

    toggle(element: T): void {
        if (this.isExpanded(element)) {
            this.expandedElement = null;
        } else {
            this.expandedElement = element;
        }
        this.cdr.markForCheck();
    }

    onRowClick(element: T): void {
        if (this.expandable) {
            this.toggle(element);
        }
        this.rowClick.emit(element);
    }

    ngAfterViewInit(): void {
        this.cdr.detectChanges();
        this.table.renderRows();
    }
}
