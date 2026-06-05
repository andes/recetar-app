import {
    Component,
    Input,
    Output,
    EventEmitter,
    booleanAttribute,
    ViewEncapsulation,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatIconModule } from "@angular/material/icon";

@Component({
    standalone: true,
    selector: "ui-user-menu",
    encapsulation: ViewEncapsulation.None,
    imports: [CommonModule, MatIconModule],
    template: `
        <div class="ui-user-menu" [class.open]="open">
            <div class="ui-user-menu-trigger" (click)="toggle()">
                <ng-content select="[menuTrigger]"></ng-content>
            </div>

            <div
                class="ui-user-menu-backdrop"
                *ngIf="open"
                (click)="close()"
            ></div>

            <div class="ui-user-menu-panel" *ngIf="open" role="menu">
                <div class="ui-user-menu-header">
                    <ng-content select="[menuHeader]"></ng-content>
                </div>
                <div class="ui-user-menu-separator"></div>
                <div class="ui-user-menu-items">
                    <ng-content select="[menuItems]"></ng-content>
                </div>
            </div>
        </div>
    `,
    styles: [
        `
            :host {
                display: inline-block;
            }

            .ui-user-menu {
                position: relative;
                display: inline-block;
            }

            .ui-user-menu-trigger {
                display: flex;
                cursor: pointer;
            }

            .ui-user-menu-backdrop {
                position: fixed;
                inset: 0;
                z-index: 1049;
            }

            .ui-user-menu-panel {
                position: absolute;
                top: calc(100% + var(--space-2));
                right: 0;
                z-index: 1050;
                min-width: 280px;
                max-width: 340px;
                background: var(--bg-card);
                border: 1px solid var(--border-color);
                border-radius: var(--radius-lg);
                box-shadow: var(--elevation-3);
                overflow: hidden;
                animation: ui-user-menu-in 0.12s ease-out;
            }

            @keyframes ui-user-menu-in {
                from {
                    opacity: 0;
                    transform: translateY(calc(-1 * var(--space-1)));
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            .ui-user-menu-separator {
                height: 1px;
                background: var(--border-color);
                margin: 0;
            }

            /* ---- Contenido proyectado: solo layout y tokens de color ---- */
            .ui-user-menu-panel .menu-header {
                display: flex;
                align-items: center;
                gap: var(--space-3);
                padding: var(--space-4);
            }

            .ui-user-menu-panel .menu-header-info {
                display: flex;
                flex-direction: column;
                align-items: flex-start;
                min-width: 0;
            }

            .ui-user-menu-panel .menu-user-name {
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                max-width: 100%;
                line-height: normal;
            }

            .ui-user-menu-panel .menu-item {
                display: flex;
                align-items: center;
                gap: var(--space-3);
                width: 100%;
                min-height: 44px;
                padding: 0 var(--space-4);
                border: none;
                background: transparent;
                color: var(--text-primary);
                cursor: pointer;
                transition: background 0.15s ease;
            }

            .ui-user-menu-panel .menu-item:hover {
                background: var(--hover-bg);
            }

            .ui-user-menu-panel .menu-item.danger-item {
                color: var(--error-fill);
            }

            .ui-user-menu-panel .menu-item.danger-item:hover {
                background: color-mix(
                    in srgb,
                    var(--error-fill) 8%,
                    transparent
                );
            }

            .ui-user-menu-panel .menu-item.danger-item .mat-icon {
                color: var(--error-fill);
            }
        `,
    ],
})
export class UiUserMenuComponent {
    @Input({ transform: booleanAttribute }) open = false;
    @Output() openChange = new EventEmitter<boolean>();

    toggle(): void {
        this.open = !this.open;
        this.openChange.emit(this.open);
    }

    close(): void {
        if (this.open) {
            this.open = false;
            this.openChange.emit(false);
        }
    }
}
