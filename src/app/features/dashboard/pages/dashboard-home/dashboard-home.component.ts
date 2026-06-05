import { Component, OnInit } from '@angular/core';
import { SidebarItem } from '@shared/components/layout/sidebar/sidebar.component';
import { SidebarService } from '@shared/services/sidebar.service';

@Component({
    selector: 'app-dashboard-home',
    templateUrl: './dashboard-home.component.html',
    styleUrls: ['./dashboard-home.component.sass'],
    standalone: false
})
export class DashboardHomeComponent implements OnInit {
    sidebarItems: SidebarItem[] = [];

    constructor(private sidebarService: SidebarService) {}

    ngOnInit(): void {
        this.sidebarItems = this.sidebarService.getItems();
    }
}
