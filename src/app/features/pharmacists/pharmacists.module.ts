import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { PharmacistsRoutingModule, routingComponents } from './pharmacists-routing.module';
import { SharedModule } from '@shared/shared.module';
import { UiSearchBarComponent } from '@shared/ui/search-bar.component';
import { UiDateFieldComponent } from '@shared/ui/date-field.component';
import { UiCardComponent } from '@shared/ui/card.component';
import { UiPaginatorComponent } from '@shared/ui/paginator.component';
import { UiUndoCountdownComponent } from '@shared/ui/undo-countdown.component';
import { DispenseService } from './services/dispense.service';
import { DispenseItemComponent } from './components/dispense-item/dispense-item.component';
import { DispensePreviewPanelComponent } from './components/dispense-preview-panel/dispense-preview-panel.component';

@NgModule({
    declarations: [
        routingComponents,
        DispenseItemComponent,
        DispensePreviewPanelComponent,
    ],
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatDialogModule,
        PharmacistsRoutingModule,
        SharedModule,
        UiSearchBarComponent,
        UiDateFieldComponent,
        UiCardComponent,
        UiPaginatorComponent,
        UiUndoCountdownComponent,
    ],
    providers: [
        DispenseService,
    ]
})
export class PharmacistsModule { }
