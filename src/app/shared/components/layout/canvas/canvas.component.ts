import { Component, Input, HostBinding } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { HeaderComponent } from '@shared/layouts/header/header.component';
import { SidebarComponent, SidebarItem } from '../sidebar/sidebar.component';
import { FooterComponent } from '@shared/layouts/footer/footer.component';
import { BreakpointService } from '@shared/services/breakpoint.service';

@Component({
    selector: 'app-canvas',
    templateUrl: './canvas.component.html',
    styleUrls: ['./canvas.component.sass'],
    standalone: true,
    imports: [
        CommonModule,
        MatCardModule,
        HeaderComponent,
        SidebarComponent,
        FooterComponent
    ]
})
export class CanvasComponent {
    @Input() showHeader = true;
    @Input() showSidebar = false;
    @Input() showFooter = true;
    @Input() sidebarItems: SidebarItem[] = [];
    @Input() adjustContent = false;
    @Input() noCard = false;

    sidebarCollapsed = false;
    sidebarOpen = false;

    constructor(private breakpointService: BreakpointService) { }

    @HostBinding('class.has-sidebar') get hasSidebar() {
        return this.showSidebar;
    }

    @HostBinding('class.sidebar-collapsed') get isSidebarCollapsed() {
        return this.sidebarCollapsed;
    }

    toggleSidebar(): void {
        if (this.breakpointService.isMobile()) {
            this.sidebarOpen = !this.sidebarOpen;
        } else {
            this.sidebarCollapsed = !this.sidebarCollapsed;
        }
    }
}
