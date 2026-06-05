import { Component, Input, Output, EventEmitter, HostBinding } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
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

    logoPath$: Observable<string>;

    constructor(private themeService: ThemeService) {
        this.logoPath$ = this.themeService.isDarkMode$.pipe(
            map(isDark => isDark ? 'assets/logo-light.svg' : 'assets/logo.svg')
        );
    }

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
