import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardRoutingModule, routingComponents } from './dashboard-routing.module';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { SharedModule } from '@shared/shared.module';

@NgModule({
    declarations: [
        routingComponents
    ],
    imports: [
        CommonModule,
        DashboardRoutingModule,
        FlexLayoutModule,
        MatListModule,
        MatIconModule,
        MatCardModule,
        SharedModule,
    ]
})
export class DashboardModule { }
