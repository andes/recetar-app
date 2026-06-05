import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
    standalone: true,
    selector: 'app-os-item',
    imports: [CommonModule, MatIconModule],
    template: `
        <div class="os-avatar">
            <mat-icon>health_and_safety</mat-icon>
        </div>
        <div class="os-info">
            <div class="os-name">{{ obraSocial.nombre }}</div>
            <div class="os-detail">
                <small>{{ osDetail }}</small>
            </div>
        </div>
    `,
    styles: [`
        :host {
            display: flex;
            flex: 1;
            align-items: center;
            gap: var(--space-3);
            min-width: 0;
        }

        .os-avatar {
            width: 36px;
            height: 36px;
            flex-shrink: 0;
            border-radius: var(--radius-md);
            display: flex;
            align-items: center;
            justify-content: center;
            background: var(--secondary);
            color: #fff;
        }

        .os-avatar .mat-icon {
            font-size: 18px;
            width: 18px;
            height: 18px;
        }

        .os-info {
            flex: 1;
            min-width: 0;
        }

        .os-name {
            font-size: 13px;
            font-weight: 500;
            overflow: hidden;
            white-space: nowrap;
            text-overflow: ellipsis;
            text-transform: uppercase;
        }

        .os-detail {
            font-size: 12px;
            color: var(--text-secondary);
            margin-top: 2px;
            overflow: hidden;
            white-space: nowrap;
            text-overflow: ellipsis;
        }
    `]
})
export class OsItemComponent {
    @Input({ required: true }) obraSocial!: {
        nombre: string;
        codigoPuco?: string;
        numeroAfiliado?: string;
        plan?: string;
    };

    get osDetail(): string {
        const parts: string[] = [];
        if (this.obraSocial.plan) {
            parts.push(this.obraSocial.plan);
        }
        if (this.obraSocial.numeroAfiliado) {
            parts.push(`N.° ${this.obraSocial.numeroAfiliado}`);
        }
        if (this.obraSocial.codigoPuco && !this.obraSocial.numeroAfiliado) {
            parts.push(`PUCO ${this.obraSocial.codigoPuco}`);
        }
        return parts.join(' · ');
    }
}
