import { Component, Output, EventEmitter } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
    standalone: true,
    selector: 'ui-item-card',
    imports: [MatIconModule],
    template: `
        <div class="item-card-inner" (click)="selected.emit()" (keydown.enter)="selected.emit()">
            <div class="card-slot">
                <ng-content select="[cardIcon]" />
            </div>
            <div class="info">
                <div class="name">
                    <ng-content select="[cardTitle]" />
                </div>
                <div class="meta">
                    <span class="meta-content">
                        <ng-content select="[cardMeta]" />
                    </span>
                </div>
            </div>
            <mat-icon class="chevron">chevron_right</mat-icon>
        </div>
    `,
    styles: [`
        :host {
            display: block;
            min-width: 0;
        }

        .item-card-inner {
            display: flex;
            align-items: center;
            gap: var(--space-3);
            padding: var(--space-3) var(--space-4);
            background: var(--bg-card);
            border: 1px solid var(--border-color);
            border-radius: var(--radius-md);
            cursor: pointer;
            text-align: left;
            transition: border-color .12s, background-color .12s;
            width: 100%;
            box-sizing: border-box;
        }

        .item-card-inner:hover {
            border-color: var(--border-strong);
            background: var(--hover-bg);
        }

        .card-slot {
            flex-shrink: 0;
        }

        .info {
            flex: 1;
            min-width: 0;
        }

        .name {
            font-size: 13px;
            font-weight: 500;
            color: var(--text-primary);
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            text-transform: uppercase;
        }

        .meta {
            font-size: 12px;
            color: var(--text-secondary);
            margin-top: 2px;
            display: flex;
            align-items: center;
            gap: var(--space-1);
            min-width: 0;
        }

        .meta-content {
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            min-width: 0;
            flex: 1;
        }

        .meta ::ng-deep .mat-icon {
            color: var(--text-disabled);
            font-size: 14px;
            width: 14px;
            height: 14px;
            line-height: 14px;
        }

        .chevron {
            color: var(--text-primary);
            font-size: 18px;
            flex-shrink: 0;
            width: 18px;
            height: 18px;
            line-height: 18px;
        }
    `]
})
export class UiItemCardComponent {
    @Output() selected = new EventEmitter<void>();
}
