import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatListModule } from '@angular/material/list';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { PatientNamePipe } from './pipes/patient-name.pipe';
import { PatientFormComponent } from './components/patient-form/patient-form.component';
import { CanvasComponent } from './components/layout/canvas/canvas.component';
import { SidebarComponent } from './components/layout/sidebar/sidebar.component';
import { UiIconComponent } from './ui/icon.component';
import { UiBadgeChipComponent } from './ui/badge-chip.component';
import { UiAvatarComponent } from './ui/avatar.component';
import { UiItemCardComponent } from './ui/item-card.component';
import { UiCardComponent } from './ui/card.component';
import { UiSearchBarComponent } from './ui/search-bar.component';
import { UiSectionDividerComponent } from './ui/section-divider.component';
import { UiDocumentListComponent } from './ui/document-list.component';
import { UiTableComponent, UiTableDetail } from './ui/table.component';

const MATERIAL_MODULES = [
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatAutocompleteModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatToolbarModule,
    MatMenuModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatListModule,
    MatTooltipModule,
    MatSnackBarModule,
];

@NgModule({
    imports: [
        CommonModule,
        ReactiveFormsModule,
        RouterModule,
        FlexLayoutModule,
        PatientNamePipe,
        PatientFormComponent,
        CanvasComponent,
        SidebarComponent,
        UiIconComponent,
        UiBadgeChipComponent,
        UiAvatarComponent,
        UiItemCardComponent,
        UiCardComponent,
        UiSearchBarComponent,
        UiSectionDividerComponent,
        UiDocumentListComponent,
        UiTableComponent,
        UiTableDetail,
        ...MATERIAL_MODULES,
    ],
    exports: [
        PatientNamePipe,
        PatientFormComponent,
        CanvasComponent,
        SidebarComponent,
        UiIconComponent,
        UiBadgeChipComponent,
        UiAvatarComponent,
        UiItemCardComponent,
        UiCardComponent,
        UiSearchBarComponent,
        UiSectionDividerComponent,
        UiDocumentListComponent,
        UiTableComponent,
        UiTableDetail,
        FlexLayoutModule,
        ...MATERIAL_MODULES,
    ]
})
export class SharedModule { }
