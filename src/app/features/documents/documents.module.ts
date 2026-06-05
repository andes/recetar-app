import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SharedModule } from '@shared/shared.module';
import { UiToggleComponent } from '@shared/ui/toggle.component';
import { UiDateFieldComponent } from '@shared/ui/date-field.component';
import { UiCardComponent } from '@shared/ui/card.component';
import { UiPaginatorComponent } from '@shared/ui/paginator.component';
import { UiSearchBarComponent } from '@shared/ui/search-bar.component';
import { UiDrawerComponent } from '@shared/ui/drawer.component';
import { UiEmptyStateComponent } from '@shared/ui/empty-state.component';
import { ConfirmDialogComponent } from './components/confirm-dialog/confirm-dialog.component';
import { DocumentItemComponent } from './components/document-item/document-item.component';
import { DocumentDetailPanelComponent } from './components/document-detail-panel/document-detail-panel.component';
import { DocumentsRoutingModule, routingComponents } from './documents-routing.module';

@NgModule({
    declarations: [
        routingComponents,
        DocumentItemComponent,
        DocumentDetailPanelComponent,
    ],
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        FlexLayoutModule,
        MatDialogModule,
        MatSnackBarModule,
        MatProgressSpinnerModule,
        SharedModule,
        ConfirmDialogComponent,
        UiToggleComponent,
        UiDateFieldComponent,
        UiCardComponent,
        UiPaginatorComponent,
        UiSearchBarComponent,
        UiDrawerComponent,
        UiEmptyStateComponent,
        DocumentsRoutingModule,
    ]
})
export class DocumentsModule { }
