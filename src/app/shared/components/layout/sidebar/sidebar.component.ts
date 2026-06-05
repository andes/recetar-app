import { Component, Input, Output, EventEmitter, HostBinding } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ThemeService } from '@shared/services/theme.service';

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

    constructor(private themeService: ThemeService) {}

    @HostBinding('class.sidebar-host-overlay-open') get isOverlayOpen() {
        return this.overlayOpen;
    }

    toggle(): void {
        this.toggled.emit();
    }

    get isDark(): boolean {
        return this.themeService.isDark();
    }

    toggleTheme(): void {
        this.themeService.toggle();
    }
}
