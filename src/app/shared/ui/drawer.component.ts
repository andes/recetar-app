import { Component, Input, Output, EventEmitter, ViewEncapsulation, booleanAttribute, OnChanges, SimpleChanges, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
    standalone: true,
    encapsulation: ViewEncapsulation.None,
    selector: 'ui-drawer',
    imports: [CommonModule, MatSidenavModule, MatButtonModule, MatIconModule, MatTooltipModule],
    template: `
        <mat-drawer-container class="ui-drawer-container" [class.ui-drawer-open]="open"
            [hasBackdrop]="hasBackdrop">
            <mat-drawer
                class="ui-drawer"
                position="end"
                mode="over"
                [opened]="open"
                [disableClose]="disableClose"
                (closedStart)="closed.emit()">
                <div class="ui-drawer-header" *ngIf="title">
                    <span class="ui-drawer-title">{{ title }}</span>
                    <button mat-icon-button type="button" (click)="closed.emit()" matTooltip="Cerrar">
                        <mat-icon>close</mat-icon>
                    </button>
                </div>
                <div class="ui-drawer-body">
                    <ng-content select="[drawerContent]"></ng-content>
                </div>
                <div class="ui-drawer-footer">
                    <ng-content select="[drawerFooter]"></ng-content>
                </div>
            </mat-drawer>
            <mat-drawer-content class="ui-drawer-content">
                <ng-content></ng-content>
            </mat-drawer-content>
        </mat-drawer-container>
    `,
    styles: [`
        .ui-drawer-container.mat-drawer-container {
            height: auto;
            min-height: calc(100vh - var(--header-area) - var(--space-6));
            background: transparent;
            z-index: auto;
            overflow: visible !important;
        }

        .ui-drawer-container .ui-drawer.mat-drawer {
            position: fixed;
            top: 0;
            right: 0;
            bottom: 0;
            width: 450px;
            max-width: 100%;
            z-index: 1300;
            background: var(--bg-card);
            border-left: 1px solid var(--border-color);
            box-shadow: var(--elevation-3);
            overflow: hidden;
        }

        .ui-drawer-container .ui-drawer .mat-drawer-inner-container {
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }

        .ui-drawer-container .mat-drawer-backdrop {
            position: fixed;
            top: 0;
            right: 0;
            bottom: 0;
            left: 0;
            z-index: 1200;
        }

        .ui-drawer-container .ui-drawer-content {
            min-height: 100%;
            height: auto;
            overflow: visible !important;
        }

        html.ui-drawer-open,
        body.ui-drawer-open {
            overflow: hidden;
        }

        .ui-drawer-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: var(--space-3);
            padding: var(--space-3) var(--space-4);
            border-bottom: 1px solid var(--border-color);
            flex-shrink: 0;
        }

        .ui-drawer-title {
            font-size: 14px;
            font-weight: 600;
            color: var(--text-primary);
        }

        .ui-drawer-body {
            flex: 1;
            min-height: 0;
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }

        .ui-drawer-footer {
            flex-shrink: 0;
            padding: var(--space-3) var(--space-4);
            border-top: 1px solid var(--border-color);
            background: var(--bg-card);
        }

        @media (max-width: 768px) {
            .ui-drawer-container .ui-drawer.mat-drawer {
                width: 100%;
            }
        }
    `]
})
export class UiDrawerComponent implements OnChanges, OnDestroy {
    @Input() title = '';
    @Input({ transform: booleanAttribute }) open = false;
    @Input({ transform: booleanAttribute }) disableClose = false;
    @Input({ transform: booleanAttribute }) hasBackdrop = true;
    @Output() closed = new EventEmitter<void>();

    ngOnChanges(changes: SimpleChanges): void {
        if (!changes['open']) { return; }
        this.toggleBodyLock(this.open);
    }

    ngOnDestroy(): void {
        this.toggleBodyLock(false);
    }

    private toggleBodyLock(open: boolean): void {
        const html = document.documentElement;
        if (open && !html.classList.contains('ui-drawer-open')) {
            const scrollbarWidth = window.innerWidth - html.clientWidth;
            document.body.style.paddingRight = `${scrollbarWidth}px`;
        } else if (!open) {
            document.body.style.paddingRight = '';
        }
        document.body.classList.toggle('ui-drawer-open', open);
        html.classList.toggle('ui-drawer-open', open);
    }
}
