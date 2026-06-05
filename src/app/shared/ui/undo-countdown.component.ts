import {
    Component,
    Input,
    OnChanges,
    OnDestroy,
    SimpleChanges,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatIconModule } from "@angular/material/icon";
import { MatTooltipModule } from "@angular/material/tooltip";

const GRACE_MS = 2 * 60 * 60 * 1000;

@Component({
    standalone: true,
    selector: "ui-undo-countdown",
    imports: [CommonModule, MatIconModule, MatTooltipModule],
    template: `
        <div class="undo-countdown" *ngIf="percent > 0" matTooltip="Tiempo restante para deshacer la dispensación"
            matTooltipPosition="below">
            <mat-icon class="undo-clock">timer</mat-icon>
            <span class="undo-time">{{ label }}</span>
            <div class="undo-bar">
                <div class="undo-fill" [style.width.%]="percent"></div>
            </div>
        </div>
    `,
    styles: [
        `
            :host {
                display: inline-flex;
            }

            .undo-countdown {
                display: inline-flex;
                align-items: center;
                gap: 6px;
            }

            .undo-clock {
                font-size: 14px;
                width: 14px;
                height: 14px;
                line-height: 1;
                color: var(--secondary);
                flex-shrink: 0;
            }

            .undo-time {
                font-size: 11px;
                color: var(--text-secondary);
                font-variant-numeric: tabular-nums;
                white-space: nowrap;
            }

            .undo-bar {
                width: 40px;
                height: 3px;
                border-radius: 2px;
                background: var(--border-color);
                overflow: hidden;
                flex-shrink: 0;
            }

            .undo-fill {
                height: 100%;
                background: var(--secondary);
                border-radius: 2px;
                transition: width 1s linear;
            }
        `,
    ],
})
export class UiUndoCountdownComponent implements OnChanges, OnDestroy {
    @Input() dispensedAt = "";

    percent = 0;
    label = "";

    private timer: ReturnType<typeof setInterval> | null = null;

    ngOnChanges(changes: SimpleChanges): void {
        if (!changes["dispensedAt"]) {
            return;
        }
        this.update();
        if (this.dispensedAt) {
            if (!this.timer) {
                this.timer = setInterval(() => this.update(), 1000);
            }
        } else if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    ngOnDestroy(): void {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    private update(): void {
        if (!this.dispensedAt) {
            this.percent = 0;
            this.label = "";
            return;
        }
        const startedAt = new Date(this.dispensedAt).getTime();
        if (isNaN(startedAt)) {
            this.percent = 0;
            this.label = "";
            return;
        }
        const remainingMs = GRACE_MS - (Date.now() - startedAt);
        if (remainingMs <= 0) {
            this.percent = 0;
            this.label = "";
            return;
        }
        this.percent = Math.round((remainingMs / GRACE_MS) * 100);
        const totalSec = Math.ceil(remainingMs / 1000);
        this.label = `${Math.floor(totalSec / 60)}:${String(totalSec % 60).padStart(2, "0")}`;
    }
}
