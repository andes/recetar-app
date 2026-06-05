import { Component, Input, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { UiSectionDividerComponent } from './section-divider.component';

@Component({
    standalone: true,
    selector: 'ui-document-list',
    imports: [CommonModule, MatIconModule, MatExpansionModule, UiSectionDividerComponent],
    template: `
        <ng-container *ngIf="items.length > 0; else empty">
            <ui-section-divider>{{ sectionTitle }}</ui-section-divider>

            <div class="history-list" *ngIf="!expandTemplate">
                <div class="history-item" *ngFor="let item of items">
                    <div class="item-icon" *ngIf="icon">
                        <mat-icon>{{ icon }}</mat-icon>
                    </div>
                    <div class="history-item-body">
                        <ng-container *ngTemplateOutlet="itemTemplate; context: { $implicit: item }" />
                    </div>
                </div>
            </div>

            <mat-accordion *ngIf="expandTemplate" class="history-accordion">
                <mat-expansion-panel *ngFor="let item of items" class="history-item">
                    <mat-expansion-panel-header class="history-item-header">
                        <div class="header-row">
                            <div class="item-icon" *ngIf="icon">
                                <mat-icon>{{ icon }}</mat-icon>
                            </div>
                            <div class="history-item-body">
                                <ng-container *ngTemplateOutlet="itemTemplate; context: { $implicit: item }" />
                            </div>
                        </div>
                    </mat-expansion-panel-header>
                    <ng-container *ngTemplateOutlet="expandTemplate; context: { $implicit: item }" />
                </mat-expansion-panel>
            </mat-accordion>
        </ng-container>
        <ng-template #empty>
            <div class="empty-msg">
                <mat-icon>{{ emptyIcon }}</mat-icon>
                <p>{{ emptyText }}</p>
            </div>
        </ng-template>
    `,
    styles: [`
        :host {
            display: block;
        }
        .history-list, .history-accordion {
            display: flex;
            flex-direction: column;
            gap: 8px;
            margin-bottom: 16px;
        }
        .history-item {
            background: var(--bg-card);
            border: 1px solid var(--border-color);
            border-radius: 8px !important;
            box-shadow: none !important;
        }
        :host .history-item:not(:has(.history-item-header)) {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px;
        }
        .history-item-header {
            display: flex;
            flex-direction: column !important;
            padding: 12px !important;
            height: auto !important;
            min-height: 0 !important;
        }
        .header-row {
            display: flex;
            align-items: center;
            gap: 12px;
            width: 100%;
        }
        :host ::ng-deep .mat-expansion-panel-header .mat-content {
            flex-direction: column;
            width: 100%;
        }
        :host ::ng-deep .mat-expansion-indicator {
            display: flex;
            justify-content: center;
            width: 100%;
            padding-top: 8px;
        }
        .history-item-body {
            flex: 1;
            min-width: 0;
            display: flex;
            flex-direction: column;
            gap: 4px;
        }
        .item-icon {
            flex-shrink: 0;
            width: 36px;
            height: 36px;
            border-radius: 10px;
            background: var(--bg-over-body);
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .item-icon mat-icon {
            font-size: 18px;
            width: 18px;
            height: 18px;
            color: var(--text-secondary);
        }
        ::ng-deep .history-item-title {
            font-weight: 500;
            font-size: 13px;
            text-transform: uppercase;
            color: var(--text-primary);
        }
        ::ng-deep .history-item-detail {
            font-size: 13px;
            color: var(--text-secondary);
        }
        ::ng-deep .history-item-head {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
        }
        .empty-msg {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 8px;
            padding: 24px;
            color: var(--text-disabled);
            text-align: center;
        }
        .empty-msg mat-icon {
            font-size: 36px;
            width: 36px;
            height: 36px;
        }
        .expanded-detail {
            padding: 12px 0;
            font-size: 13px;
            color: var(--text-secondary);
            line-height: 1.5;
        }
    `]
})
export class UiDocumentListComponent {
    @Input({ required: true }) items: any[] = [];
    @Input() sectionTitle = '';
    @Input() emptyIcon = '';
    @Input() emptyText = '';
    @Input() icon = '';
    @Input({ required: true }) itemTemplate!: TemplateRef<any>;
    @Input() expandTemplate?: TemplateRef<any>;
}
