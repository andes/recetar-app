import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { take, takeUntil } from 'rxjs/operators';
import { SubOrganizacion } from '@interfaces/organizaciones';
import { AuthService } from '@auth/services/auth.service';
import { OrganizacionFormSessionService } from '@professionals/services/organizacion-form-session.service';
import { OrganizacionDialogComponent } from '../organizacion-dialog/organizacion-dialog.component';

@Component({
    selector: 'app-organizaciones-selector',
    templateUrl: './organizaciones-selector.component.html',
    styleUrls: ['./organizaciones-selector.component.sass'],
    standalone: false
})
export class OrganizacionesSelectorComponent implements OnInit, OnDestroy {
    @Input() set organizacionControl(value: FormControl) {
        this._organizacionControl = value;
        if (this._disabled) {
            value.disable({ emitEvent: false });
        }
    }
    get organizacionControl(): FormControl {
        return this._organizacionControl;
    }
    @Input() set disabled(value: boolean) {
        this._disabled = value;
        if (value) {
            this._organizacionControl.disable({ emitEvent: false });
        } else {
            this._organizacionControl.enable({ emitEvent: false });
        }
    }
    get disabled(): boolean {
        return this._disabled;
    }
    @Output() organizacionSelected = new EventEmitter<SubOrganizacion>();

    organizaciones: SubOrganizacion[] = [];
    private _disabled = false;
    private _organizacionControl: FormControl = new FormControl('', Validators.required);
    private destroy$ = new Subject<void>();
    private userId: string | null = null;
    isAddingOrganizacion = false;
    private isInitialLoad = true;
    private clearInitialLoadFrameId: number | null = null;

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

        this.organizacionSessionService.initialize(this.userId)
            .pipe(takeUntil(this.destroy$))
            .subscribe(
                () => this.loadOrganizaciones(),
                () => {}
            );

        // Escuchar cambios en el control
        this.organizacionControl.valueChanges
            .pipe(takeUntil(this.destroy$))
            .subscribe((value: SubOrganizacion) => {
                if (value) {
                    this.organizacionSelected.emit(value);
                    if (!this.isInitialLoad) {
                        this.reorderOrganizaciones(value);
                    }
                }
            });
    }

    ngOnDestroy(): void {
        if (this.clearInitialLoadFrameId !== null) {
            cancelAnimationFrame(this.clearInitialLoadFrameId);
            this.clearInitialLoadFrameId = null;
        }

        this.destroy$.next();
        this.destroy$.complete();
    }

    private loadOrganizaciones(): void {
        this.organizaciones = this.organizacionSessionService.getOrganizaciones();

        if (this.organizaciones.length > 0 && !this.organizacionControl.value) {
            this.isInitialLoad = true;
            this.organizacionControl.setValue(this.organizaciones[0], { emitEvent: false });
            this.organizacionSelected.emit(this.organizaciones[0]);
        }

        this.scheduleInitialLoadEnd(() => {
            this.isInitialLoad = false;
        });
    }

    private scheduleInitialLoadEnd(action: () => void): void {
        if (this.clearInitialLoadFrameId !== null) {
            cancelAnimationFrame(this.clearInitialLoadFrameId);
        }

        this.clearInitialLoadFrameId = requestAnimationFrame(() => {
            this.clearInitialLoadFrameId = null;
            action();
        });
    }

    refreshOrganizaciones(): void {
        if (!this.userId) {
            return;
        }

        this.organizacionSessionService.initialize(this.userId)
            .pipe(takeUntil(this.destroy$))
            .subscribe(
                () => this.loadOrganizaciones(),
                () => {}
            );
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

        dialogRef.afterClosed().pipe(take(1)).subscribe(result => {
            if (result) {
                this.addNewOrganizacion(result);
            }
        });
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
