import { Component } from '@angular/core';

@Component({
    standalone: true,
    selector: 'ui-detail-panel',
    template: `
        <div class="detail-panel">
            <div class="detail-header">
                <ng-content select="[detailHeader]"></ng-content>
            </div>
            <div class="detail-scroll">
                <ng-content></ng-content>
            </div>
        </div>
    `,
    styles: [`
        :host {
            display: flex;
            flex-direction: column;
            flex: 1;
            min-height: 0;
            width: 100%;
        }

        .detail-panel {
            display: flex;
            flex-direction: column;
            flex: 1;
            min-height: 0;
            overflow: hidden;
            color: var(--text-primary);
        }

        .detail-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: var(--space-2);
            padding: var(--space-4) var(--space-6);
            border-bottom: 1px solid var(--border-color);
            flex-shrink: 0;
        }

        .detail-header:empty {
            display: none;
        }

        .detail-scroll {
            flex: 1;
            min-height: 0;
            overflow-y: auto;
            padding: var(--space-6);
        }
    `]
})
export class UiDetailPanelComponent { }
