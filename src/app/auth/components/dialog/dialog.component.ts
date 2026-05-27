import { Component, OnInit } from '@angular/core';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { FlexLayoutModule } from '@angular/flex-layout';

@Component({
    selector: 'app-dialog',
    templateUrl: './dialog.component.html',
    styleUrls: ['./dialog.component.sass'],
    standalone: true,
    imports: [
        MatDialogModule,
        MatIconModule,
        MatButtonModule,
        FlexLayoutModule
    ]
})
export class DialogComponent implements OnInit {

    constructor(
        public dialogRef: MatDialogRef<DialogComponent>
    ) {}

    ngOnInit(): void {
    }

    onNoClick(): void {
        this.dialogRef.close();
    }


}
