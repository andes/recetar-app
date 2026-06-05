import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SharedModule } from '@shared/shared.module';
import { UiToggleComponent } from '@shared/ui/toggle.component';
import { ConfirmDialogComponent } from './components/confirm-dialog/confirm-dialog.component';
import { DocumentsRoutingModule, routingComponents } from './documents-routing.module';

@NgModule({
    declarations: [
        routingComponents
    ],
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        FlexLayoutModule,
        MatTableModule,
        MatPaginatorModule,
        MatSortModule,
        MatCardModule,
        MatDialogModule,
        MatSnackBarModule,
        MatProgressSpinnerModule,
        SharedModule,
        ConfirmDialogComponent,
        UiToggleComponent,
        DocumentsRoutingModule,
    ]
})
export class DocumentsModule { }
