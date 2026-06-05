import { Component, Input, ContentChild, ViewChildren, QueryList, ViewChild, AfterViewInit, ChangeDetectorRef, TemplateRef, booleanAttribute, ViewEncapsulation, Directive } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTable, MatColumnDef } from '@angular/material/table';
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
export class UiTableDetail {}

@Component({
    standalone: true,
    encapsulation: ViewEncapsulation.None,
    selector: 'ui-table',
    imports: [CommonModule, MatTableModule, MatIconModule],
    template: `
        <table mat-table [dataSource]="dataSource" multiTemplateDataRows
            class="ui-table"
            [class.dense]="dense">

            <ng-container matColumnDef="expand">
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
                [class.active]="isExpanded(element)"
                (click)="toggle(element)"></tr>
            <tr mat-row *matRowDef="let element; columns: ['expandedDetail']"
                class="ui-table-detail-row"
                [class.expanded]="isExpanded(element)"></tr>
        </table>
    `,
    styles: [`
        .ui-table.mat-mdc-table {
            width: 100%;
            background: var(--bg-card);
            border: 1px solid var(--border-color);
            border-radius: var(--radius-md);
            overflow: hidden;
            border-collapse: separate;
            border-spacing: 0;
        }
        .ui-table .mat-mdc-header-row .mat-mdc-header-cell {
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: .03em;
            color: var(--text-disabled);
            background: var(--primary-50);
            border-bottom: 1px solid var(--border-color);
            padding: 8px 12px;
        }
        .ui-table .mat-mdc-header-row .mat-mdc-header-cell.col-centered {
            text-align: center;
        }
        .ui-table .mat-mdc-cell {
            padding: 10px 12px;
            border-bottom: 1px solid var(--border-color);
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
        .ui-table-row:hover {
            background: var(--hover-bg);
        }
        .ui-table-row.active {
            background: var(--secondary-50);
        }
        .ui-table-row.active .mat-mdc-cell {
            border-bottom-color: var(--secondary-200);
        }
        .ui-table-row:last-of-type .mat-mdc-cell {
            border-bottom: none;
        }
        .ui-table-row.active:last-of-type .mat-mdc-cell {
            border-bottom: 1px solid var(--secondary-200);
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
            border-bottom: 1px solid var(--border-color);
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
            padding: 0 12px !important;
        }
        .ui-table.dense .mat-mdc-cell {
            padding: 8px 12px;
        }
    `]
})
export class UiTableComponent<T> implements AfterViewInit {
    @Input() dataSource: T[] = [];
    @Input() columns: ColumnDef[] = [];
    @Input({ transform: booleanAttribute }) dense = false;

    @ViewChild(MatTable) table!: MatTable<T>;
    @ViewChildren(MatColumnDef) columnDefs!: QueryList<MatColumnDef>;
    @ContentChild(UiTableDetail, { read: TemplateRef }) detailTemplate?: TemplateRef<any>;

    expandedElement: T | null = null;

    constructor(private cdr: ChangeDetectorRef) {}

    get allColumns(): string[] {
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

    ngAfterViewInit(): void {
        this.columnDefs.forEach(def => this.table.addColumnDef(def));
        this.table.renderRows();
    }
}
