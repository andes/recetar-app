import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { SubOrganizacion } from '@interfaces/organizaciones';
import { AuthService } from '@auth/services/auth.service';
import { OrganizacionFormSessionService } from '@professionals/services/organizacion-form-session.service';
import { OrganizacionDialogComponent } from '../organizacion-dialog/organizacion-dialog.component';

@Component({
    selector: 'app-organizaciones-selector',
    templateUrl: './organizaciones-selector.component.html',
    styleUrls: ['./organizaciones-selector.component.sass']
})
export class OrganizacionesSelectorComponent implements OnInit, OnDestroy {
    @Input() organizacionControl: FormControl = new FormControl('', Validators.required);
    @Input() disabled = false;
    @Output() organizacionSelected = new EventEmitter<SubOrganizacion>();

    organizaciones: SubOrganizacion[] = [];
    private subscriptions = new Subscription();
    private userId: string | null = null;
    isAddingOrganizacion = false;
    private isInitialLoad = true;

    constructor(
        private authService: AuthService,
        private organizacionSessionService: OrganizacionFormSessionService,
        private dialog: MatDialog
    ) {}

    ngOnInit(): void {
        this.userId = this.authService.getLoggedUserId();
        if (!this.userId) {
            return;
        }

        const sessionSub = this.organizacionSessionService.initialize(this.userId).subscribe(
            () => this.loadOrganizaciones(),
            () => {}
        );
        this.subscriptions.add(sessionSub);

        // Escuchar cambios en el control
        const controlSub = this.organizacionControl.valueChanges.subscribe(value => {
            if (value) {
                this.organizacionSelected.emit(value);
                if (!this.isInitialLoad) {
                    this.reorderOrganizaciones(value);
                }
            }
        });
        this.subscriptions.add(controlSub);
    }

    ngOnDestroy(): void {
        this.subscriptions.unsubscribe();
    }

    private loadOrganizaciones(): void {
        this.organizaciones = this.organizacionSessionService.getOrganizaciones();

        if (this.organizaciones.length > 0 && !this.organizacionControl.value) {
            this.isInitialLoad = true;
            this.organizacionControl.setValue(this.organizaciones[0], { emitEvent: false });
            this.organizacionSelected.emit(this.organizaciones[0]);
        }

        setTimeout(() => {
            this.isInitialLoad = false;
        }, 100);
    }

    refreshOrganizaciones(): void {
        if (!this.userId) {
            return;
        }

        const refreshSub = this.organizacionSessionService.initialize(this.userId).subscribe(
            () => this.loadOrganizaciones(),
            () => {}
        );
        this.subscriptions.add(refreshSub);
    }

    private reorderOrganizaciones(selectedOrganizacion: SubOrganizacion): void {
        if (!selectedOrganizacion || this.organizaciones.length <= 1 || this.isInitialLoad) {
            return;
        }
        this.organizacionSessionService.markSelectedOrganizacion(selectedOrganizacion);
        this.organizaciones = this.organizacionSessionService.getOrganizaciones();
    }

    openOrganizacionDialog(): void {
        const dialogRef = this.dialog.open(OrganizacionDialogComponent, {
            width: '500px',
            data: {}
        });

        const dialogSub = dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.addNewOrganizacion(result);
            }
        });
        this.subscriptions.add(dialogSub);
    }

    private addNewOrganizacion(newOrganizacion: SubOrganizacion): void {
        if (!newOrganizacion) {
            return;
        }

        this.isAddingOrganizacion = true;

        this.organizacionSessionService.addOrganizacion(newOrganizacion);
        this.organizaciones = this.organizacionSessionService.getOrganizaciones();

        const preferred = this.organizacionSessionService.getPreferredOrganizacion();
        if (preferred) {
            this.organizacionControl.setValue(preferred);
        }

        this.isAddingOrganizacion = false;
    }

    compareOrganizaciones(e1: SubOrganizacion, e2: SubOrganizacion): boolean {
        if (!e1 || !e2) {
            return e1 === e2;
        }

        if (e1._id && e2._id) {
            return e1._id === e2._id;
        }

        return e1.nombre === e2.nombre && e1.direccion === e2.direccion;
    }
};
