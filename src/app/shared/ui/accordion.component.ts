import { Component, Input, TemplateRef, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatExpansionModule } from '@angular/material/expansion';

@Component({
    standalone: true,
    encapsulation: ViewEncapsulation.None,
    selector: 'ui-accordion',
    imports: [CommonModule, MatExpansionModule],
    template: `
        <mat-accordion class="accordion" [multi]="multi">
            <mat-expansion-panel
                *ngFor="let item of items; trackBy: trackByFn"
                class="panel"
                togglePosition="before"
                [expanded]="isExpanded(item)"
                (opened)="expandedItem = item"
                (closed)="expandedItem === item && (expandedItem = null)">
                <mat-expansion-panel-header class="panel-header">
                    <ng-container *ngTemplateOutlet="itemTemplate; context: { $implicit: item }" />
                </mat-expansion-panel-header>
                <div class="panel-body">
                    <ng-container *ngTemplateOutlet="expandTemplate; context: { $implicit: item }" />
                </div>
            </mat-expansion-panel>
        </mat-accordion>
    `,
    styles: [`
        :host {
            display: block;
        }
        .accordion {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
        .panel {
            background: var(--bg-card) !important;
            border: 1px solid var(--border-color) !important;
            border-radius: 8px !important;
            box-shadow: none !important;
            transition: border-color .12s, background .12s;
            overflow: hidden;
        }
        .panel.mat-expanded {
            border-color: var(--secondary-200) !important;
            background: var(--secondary-100) !important;
        }
        .panel-header {
            display: flex !important;
            padding: 0 !important;
            height: auto !important;
            min-height: 0 !important;
        }
        .panel-header .mat-content {
            flex-direction: row;
            flex: 1;
            min-width: 0;
        }
        .mat-expansion-panel-header {
            padding: var(--space-2) var(--space-4) !important;
        }
        .mat-expansion-panel-spacing {
            margin: 0;
        }
        .mat-expansion-indicator::after {
            color: var(--text-disabled) !important;
            transition: color .15s;
            display: block;
            border-width: 0 2px 2px 0 !important;
            padding: 2.5px !important;
            transform: rotate(-45deg) !important;
        }
        .panel.mat-expanded .mat-expansion-indicator::after {
            color: var(--secondary) !important;
            transform: rotate(-135deg) !important;
        }
        .mat-expansion-panel-header.mat-expansion-toggle-indicator-before .mat-expansion-indicator {
            display: block;
            margin-right: 20px;
        }
        .mat-expansion-panel-body {
            padding: var(--space-4) !important;
            background-color: var(--primary-50);
        }
        .panel-body {
            font-size: 13px;
            color: var(--text-secondary);
        }
    `]
})
export class UiAccordionComponent {
    @Input({ required: true }) items: any[] = [];
    @Input({ required: true }) itemTemplate!: TemplateRef<any>;
    @Input({ required: true }) expandTemplate!: TemplateRef<any>;
    @Input() multi = false;

    expandedItem: any = null;

    isExpanded(item: any): boolean {
        return this.expandedItem === item;
    }

    trackByFn(index: number): number {
        return index;
    }
}
