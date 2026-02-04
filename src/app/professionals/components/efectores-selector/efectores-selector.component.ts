import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { Efector } from '@interfaces/efectores';
import { AuthService } from '@auth/services/auth.service';
import { UserService } from '@services/users.service';
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
    currentUser: any;
    isAddingEfector = false;
    private isInitialLoad = true;

    constructor(
        private authService: AuthService,
        private userService: UserService,
        private dialog: MatDialog
    ) {}

    ngOnInit(): void {
        // Obtener usuario actual por ID
        const userId = this.authService.getLoggedUserId();
        if (userId) {
            const userSub = this.userService.getUserById(userId).subscribe(
                user => {
                    this.currentUser = user;
                    this.loadEfectores();
                },
                error => {
                }
            );
            this.subscriptions.add(userSub);
        } else {
        }

        // Escuchar cambios en el control
        const controlSub = this.efectorControl.valueChanges.subscribe(value => {
            if (value) {
                this.efectorSelected.emit(value);
                // Reordenar efectores moviendo el seleccionado al primer lugar
                this.reorderEfectores(value);
            }
        });
        this.subscriptions.add(controlSub);
    }

    ngOnDestroy(): void {
        this.subscriptions.unsubscribe();
    }

    private loadEfectores(): void {
        if (this.currentUser && this.currentUser.efectores) {
            this.efectores = this.currentUser.efectores;
            // Seleccionar el primer efector por defecto
            if (this.efectores.length > 0 && !this.efectorControl.value) {
                // Marcar como carga inicial para evitar reordenamiento
                this.isInitialLoad = true;
                this.efectorControl.setValue(this.efectores[0], { emitEvent: false });
                // Emitir el evento manualmente ya que usamos emitEvent: false
                this.efectorSelected.emit(this.efectores[0]);
                // Después de un breve delay, permitir reordenamientos
                setTimeout(() => {
                    this.isInitialLoad = false;
                }, 500);
            } else if (this.efectores.length > 0) {
                // Si ya hay un valor seleccionado, asegurarse de que isInitialLoad sea false
                setTimeout(() => {
                    this.isInitialLoad = false;
                }, 100);
            }
        } else {
        }
    }

    /**
     * Refresca los efectores del usuario desde el servidor
     * Útil después de operaciones que modifican los efectores
     */
    refreshEfectores(): void {
        if (this.currentUser) {
            const refreshSub = this.userService.getUserById(this.currentUser._id).subscribe(
                updatedUser => {
                    this.currentUser = updatedUser;
                    this.loadEfectores();
                }
            );
            this.subscriptions.add(refreshSub);
        }
    }

    /**
     * Reordena el array de efectores moviendo el efector seleccionado al primer lugar
     * y actualiza el orden en la base de datos
     */
    private reorderEfectores(selectedEfector: Efector): void {
        // No reordenar durante la carga inicial
        if (!this.currentUser || !selectedEfector || this.efectores.length <= 1 || this.isInitialLoad) {
            return;
        }
        // Encontrar el índice del efector seleccionado
        const selectedIndex = this.efectores.findIndex(e => e._id === selectedEfector._id);
        // Si el efector ya está en primera posición, no hacer nada
        if (selectedIndex === 0) {
            return;
        }

        // Si se encontró el efector, reordenar el array
        if (selectedIndex > 0) {
            // Crear nuevo array con el efector seleccionado al principio
            const reorderedEfectores = [
                selectedEfector,
                ...this.efectores.filter(e => e._id !== selectedEfector._id)
            ];

            // Actualizar localmente primero para UX inmediata
            this.efectores = reorderedEfectores;

            // Preparar efectores para enviar al servidor
            const efectoresParaServidor = reorderedEfectores.map(e => this.prepareEfectorForServer(e));

            // Actualizar en el servidor
            const updateSub = this.userService.updateUserEfectores(
                this.currentUser._id,
                efectoresParaServidor
            ).subscribe(
                updatedUser => {
                    // Actualizar el usuario con la respuesta del servidor
                    if (updatedUser) {
                        this.currentUser = updatedUser;
                        // Si la respuesta del servidor es diferente, usar esa
                        if (updatedUser.efectores) {
                            this.efectores = updatedUser.efectores;
                        }
                    }
                },
                error => {
                    // En caso de error, revertir al orden original
                    this.loadEfectores();
                }
            );
            this.subscriptions.add(updateSub);
        }
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
        if (!this.currentUser) {
            return;
        }
        this.isAddingEfector = true;
        // Crear la lista actualizada de efectores incluyendo el nuevo
        const efectoresActualizados = [...this.efectores, newEfector];
        // Preparar los efectores para enviar a la api
        const efectoresParaServidor = efectoresActualizados.map(e => this.prepareEfectorForServer(e));
        // Actualizar en la api usando el servicio UserService
        const updateSub = this.userService.updateUserEfectores(
            this.currentUser._id,
            efectoresParaServidor
        ).subscribe(
            updatedUser => {
                // Actualizar el usuario y los efectores con la respuesta a la api
                if (updatedUser) {
                    this.currentUser = updatedUser;
                    this.efectores = updatedUser.efectores || [];
                    const nuevoEfectorEnLista = this.efectores.find(e =>
                        e.nombre === newEfector.nombre && e.direccion === newEfector.direccion
                    );
                    if (nuevoEfectorEnLista) {
                        this.efectorControl.setValue(nuevoEfectorEnLista);
                    }
                }
                this.isAddingEfector = false;
            },
            error => {
                this.isAddingEfector = false;
            }
        );
        this.subscriptions.add(updateSub);
    }

    compareEfectores(e1: Efector, e2: Efector): boolean {
        return e1 && e2 ? e1._id === e2._id : e1 === e2;
    }

    /**
     * Prepara un efector para enviar a la api, omitiendo el _id si está vacío
     */
    private prepareEfectorForServer(efector: Efector): any {
        const result: any = {
            nombre: efector.nombre,
            direccion: efector.direccion
        };
        // Solo incluir _id si existe, no está vacío y no es null/undefined
        if (efector._id && efector._id.trim() !== '') {
            result._id = efector._id;
        }
        return result;
    }
};
