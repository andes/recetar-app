import { Component, Input, Output, EventEmitter, HostBinding } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

export interface SidebarItem {
    icon: string;
    label: string;
    route: string;
}

@Component({
    selector: 'app-sidebar',
    templateUrl: './sidebar.component.html',
    styleUrls: ['./sidebar.component.sass'],
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        MatListModule,
        MatIconModule,
        MatTooltipModule
    ]
})
export class SidebarComponent {
    @Input() items: SidebarItem[] = [];
    @Input() collapsed = false;
    @Input() overlayOpen = false;
    @Output() toggled = new EventEmitter<void>();

    readonly logoPath = 'assets/logo-light.svg';

    @HostBinding('class.sidebar-host-overlay-open') get isOverlayOpen() {
        return this.overlayOpen;
    }

    @HostBinding('class.sidebar-host-collapsed') get isCollapsed() {
        return this.collapsed;
    }

    toggle(): void {
        this.toggled.emit();
    }
}
