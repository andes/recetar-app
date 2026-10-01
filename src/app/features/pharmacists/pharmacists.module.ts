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
import { UiBadgeChipComponent } from '@shared/ui/badge-chip.component';
import { UiListItemComponent } from '@shared/ui/list-item.component';
import { UiEntityComponent } from '@shared/ui/entity.component';
import { UiDetailPanelComponent } from '@shared/ui/detail-panel.component';
import { UiDetailSectionComponent } from '@shared/ui/detail-section.component';
import { UiResultsListComponent } from '@shared/ui/results-list.component';
import { UiFieldInputComponent } from '@shared/ui/field-input.component';
import { UiResultsToolbarComponent } from '@shared/ui/results-toolbar.component';
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
        UiBadgeChipComponent,
        UiListItemComponent,
        UiEntityComponent,
        UiDetailPanelComponent,
        UiDetailSectionComponent,
        UiResultsListComponent,
        UiFieldInputComponent,
        UiResultsToolbarComponent,
    ],
    providers: [
        DispenseService,
    ]
})
export class PharmacistsModule { }
