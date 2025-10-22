import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { Efector } from '@interfaces/efectores';
import { AuthService } from '@auth/services/auth.service';
import { EfectorFormSessionService } from '@professionals/services/efector-form-session.service';
import { EfectorDialogComponent } from '../efector-dialog/efector-dialog.component';

@Component({
    selector: 'app-efectores-selector',
    templateUrl: './efectores-selector.component.html',
    styleUrls: ['./efectores-selector.component.sass']
})
export class EfectoresSelectorComponent implements OnInit, OnDestroy {
    @Input() efectorControl: FormControl = new FormControl('', Validators.required);
    @Input() disabled = false;
    @Output() efectorSelected = new EventEmitter<Efector>();

    efectores: Efector[] = [];
    private subscriptions = new Subscription();
    private userId: string;
    isAddingEfector = false;
    private isInitialLoad = true;

    constructor(
        private authService: AuthService,
        private efectorSessionService: EfectorFormSessionService,
        private dialog: MatDialog
    ) {}

    ngOnInit(): void {
        this.userId = this.authService.getLoggedUserId();
        if (!this.userId) {
            return;
        }

        const sessionSub = this.efectorSessionService.initialize(this.userId).subscribe(
            () => this.loadEfectores(),
            () => {}
        );
        this.subscriptions.add(sessionSub);

        // Escuchar cambios en el control
        const controlSub = this.efectorControl.valueChanges.subscribe(value => {
            if (value) {
                this.efectorSelected.emit(value);
                if (!this.isInitialLoad) {
                    this.reorderEfectores(value);
                }
            }
        });
        this.subscriptions.add(controlSub);
    }

    ngOnDestroy(): void {
        this.subscriptions.unsubscribe();
    }

    private loadEfectores(): void {
        this.efectores = this.efectorSessionService.getEfectores();

        if (this.efectores.length > 0 && !this.efectorControl.value) {
            this.isInitialLoad = true;
            this.efectorControl.setValue(this.efectores[0], { emitEvent: false });
            this.efectorSelected.emit(this.efectores[0]);
        }

        setTimeout(() => {
            this.isInitialLoad = false;
        }, 100);
    }

    refreshEfectores(): void {
        if (!this.userId) {
            return;
        }

        const refreshSub = this.efectorSessionService.initialize(this.userId).subscribe(
            () => this.loadEfectores(),
            () => {}
        );
        this.subscriptions.add(refreshSub);
    }

    private reorderEfectores(selectedEfector: Efector): void {
        if (!selectedEfector || this.efectores.length <= 1 || this.isInitialLoad) {
            return;
        }
        this.efectorSessionService.markSelectedEfector(selectedEfector);
        this.efectores = this.efectorSessionService.getEfectores();
    }

    openEfectorDialog(): void {
        const dialogRef = this.dialog.open(EfectorDialogComponent, {
            width: '500px',
            data: {}
        });

        const dialogSub = dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.addNewEfector(result);
            }
        });
        this.subscriptions.add(dialogSub);
    }

    private addNewEfector(newEfector: Efector): void {
        if (!newEfector) {
            return;
        }

        this.isAddingEfector = true;

        this.efectorSessionService.addEfector(newEfector);
        this.efectores = this.efectorSessionService.getEfectores();

        const preferred = this.efectorSessionService.getPreferredEfector();
        if (preferred) {
            this.efectorControl.setValue(preferred);
        }

        this.isAddingEfector = false;
    }

    compareEfectores(e1: Efector, e2: Efector): boolean {
        if (!e1 || !e2) {
            return e1 === e2;
        }

        if (e1._id && e2._id) {
            return e1._id === e2._id;
        }

        return e1.nombre === e2.nombre && JSON.stringify(e1.direccion) === JSON.stringify(e2.direccion);
    }
};
