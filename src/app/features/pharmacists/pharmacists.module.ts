import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { PharmacistsRoutingModule, routingComponents } from './pharmacists-routing.module';
import { SharedModule } from '@shared/shared.module';
import { UiSearchBarComponent } from '@shared/ui/search-bar.component';
import { UiDateFieldComponent } from '@shared/ui/date-field.component';
import { UiCardComponent } from '@shared/ui/card.component';
import { UiPaginatorComponent } from '@shared/ui/paginator.component';
import { DispenseService } from './services/dispense.service';
import { DispenseMedicationsService } from './services/dispense-medications.service';
import { DispenseItemComponent } from './components/dispense-item/dispense-item.component';
import { DispenseMedicationsPanelComponent } from './components/dispense-medications-panel/dispense-medications-panel.component';
import { DispenseDrawerComponent } from './components/dispense-drawer/dispense-drawer.component';

@NgModule({
    declarations: [
        routingComponents,
        DispenseItemComponent,
        DispenseMedicationsPanelComponent,
        DispenseDrawerComponent,
    ],
    imports: [
        CommonModule,
        ReactiveFormsModule,
        PharmacistsRoutingModule,
        SharedModule,
        UiSearchBarComponent,
        UiDateFieldComponent,
        UiCardComponent,
        UiPaginatorComponent,
    ],
    providers: [
        DispenseService,
        DispenseMedicationsService,
    ]
})
export class PharmacistsModule { }
