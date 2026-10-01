import { Component, Input, Output, EventEmitter } from '@angular/core';
import { UiCardComponent } from './card.component';

@Component({
    standalone: true,
    selector: 'ui-list-item',
    imports: [UiCardComponent],
    template: `
        <ui-card
            class="list-item selectable"
            [class.selected]="selected"
            tabindex="0"
            role="button"
            (click)="select.emit()"
            (keydown.enter)="select.emit()">
            <div class="list-content">
                <ng-content select="[itemContent]"></ng-content>
            </div>
            <div class="list-side" (click)="$event.stopPropagation()">
                <ng-content select="[itemActions]"></ng-content>
            </div>
        </ui-card>
    `,
    styles: [`
        :host {
            display: flex;
            width: 100%;
            min-width: 0;
        }

        .list-item {
            width: 100%;
            cursor: pointer;
        }

        .list-item ::ng-deep .ui-card-body {
            display: flex;
            flex-direction: column;
            padding: 0;
            min-width: 0;
        }

        .list-content {
            flex: 1;
            min-width: 0;
            padding: var(--space-3) var(--space-4);
        }

        .list-content ::ng-deep [itemContent] {
            display: flex;
            flex-direction: column;
            gap: var(--space-2);
            min-width: 0;
            width: 100%;
        }

        .list-side {
            flex-shrink: 0;
            padding: var(--space-3) var(--space-4);
            border-top: 1px solid var(--border-color);
        }

        .list-side ::ng-deep [itemActions] {
            display: flex;
            flex-direction: row;
            justify-content: flex-end;
            align-items: stretch;
            gap: var(--space-1);
            width: 100%;
        }

        @media (min-width: 769px) {
            .list-item ::ng-deep .ui-card-body {
                flex-direction: row;
            }

            .list-side {
                display: flex;
                align-items: center;
                width: 200px;
                padding: var(--space-4);
                border-top: none;
            }

            .list-side ::ng-deep [itemActions] {
                flex-direction: column;
                justify-content: center;
            }
        }
    `]
})
export class UiListItemComponent {
    @Input() selected = false;
    @Output() select = new EventEmitter<void>();
}
