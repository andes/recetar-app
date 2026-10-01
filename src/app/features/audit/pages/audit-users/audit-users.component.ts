import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { PageEvent } from '@angular/material/paginator';
import { User } from '@interfaces/users';
import { Role, RolesService } from '@services/roles.service';
import { UserService } from '@services/users.service';
import { SidebarItem } from '@shared/components/layout/sidebar/sidebar.component';
import { NotificationService } from '@shared/services/notification.service';
import { SidebarService } from '@shared/services/sidebar.service';
import { getValidationDetails } from '@shared/utils/http-error.util';
import { buildFieldErrors } from '@shared/utils/validation-messages.util';
import { Subject, of } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, switchMap, takeUntil, tap } from 'rxjs/operators';
import {
    AuditUserDetailPanelComponent,
    AuditUserSavePayload
} from '../../components/audit-user-detail-panel/audit-user-detail-panel.component';
import { AuditConfirmDialogComponent } from '../../components/audit-confirm-dialog/audit-confirm-dialog.component';

@Component({
    selector: 'app-audit-users',
    standalone: false,
    templateUrl: './audit-users.component.html',
    styleUrls: ['./audit-users.component.sass']
})
export class AuditUsersComponent implements OnInit, OnDestroy {

    @ViewChild(AuditUserDetailPanelComponent) detailPanel?: AuditUserDetailPanelComponent;

    sidebarItems: SidebarItem[] = [];

    users: User[] = [];
    loadingUsers = false;
    saving = false;
    canSave = false;
    availableRoleOptions: Role[] = [];
    showCreateForm = false;
    totalUsers = 0;
    usersPageSize = 10;
    usersPageIndex = 0;
    currentSearchTerm = '';
    searchControl = new FormControl('');

    drawerOpen = false;
    selectedUser: User | null = null;

    private load$ = new Subject<void>();
    private destroy$ = new Subject<void>();

    constructor(
        private usersService: UserService,
        private rolesService: RolesService,
        private notificationService: NotificationService,
        private sidebarService: SidebarService,
        private dialog: MatDialog
    ) { }

    ngOnInit(): void {
        this.sidebarItems = this.sidebarService.getItems();
        this.loadRoles();

        this.load$.pipe(
            takeUntil(this.destroy$),
            switchMap(() => this.fetchUsers().pipe(
                catchError(() => {
                    this.loadingUsers = false;
                    return of(null);
                })
            ))
        ).subscribe();

        this.searchControl.valueChanges.pipe(
            debounceTime(500),
            distinctUntilChanged(),
            takeUntil(this.destroy$)
        ).subscribe(value => {
            this.currentSearchTerm = (value || '').trim();
            this.usersPageIndex = 0;
            this.load$.next();
        });

        this.load$.next();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    private fetchUsers() {
        this.loadingUsers = true;
        const offset = this.usersPageIndex * this.usersPageSize;
        const request$ = this.currentSearchTerm
            ? this.usersService.searchUsers(this.currentSearchTerm, { offset, limit: this.usersPageSize })
            : this.usersService.getUsers({ offset, limit: this.usersPageSize });

        return request$.pipe(
            tap(response => {
                this.totalUsers = response.total || 0;
                this.users = response.items;
                this.loadingUsers = false;
            })
        );
    }

    private loadRoles(): void {
        this.rolesService.getFilteredRoleTypes().subscribe({
            next: (roles: Role[]) => {
                this.availableRoleOptions = roles;
            },
            error: () => {
                this.notificationService.error('Error al cargar los roles');
            }
        });
    }

    get resultsFrom(): number {
        return this.totalUsers === 0 ? 0 : this.usersPageIndex * this.usersPageSize + 1;
    }

    get resultsTo(): number {
        return Math.min(this.resultsFrom + this.usersPageSize - 1, this.totalUsers);
    }

    onPageChange(event: PageEvent): void {
        this.usersPageIndex = event.pageIndex;
        this.usersPageSize = event.pageSize;
        this.load$.next();
    }

    openDrawer(user: User): void {
        this.selectedUser = user;
        this.canSave = false;
        this.drawerOpen = true;
    }

    closeDrawer(): void {
        this.drawerOpen = false;
        this.selectedUser = null;
        this.canSave = false;
    }

    isSelected(user: User): boolean {
        return this.drawerOpen && this.selectedUser?._id === user._id;
    }

    onFormState(state: { canSave: boolean }): void {
        this.canSave = state.canSave;
    }

    onSaveUser(payload: AuditUserSavePayload): void {
        if (this.saving) { return; }
        this.saving = true;

        this.usersService.updateUser(payload._id, {
            businessName: payload.businessName,
            username: payload.username,
            email: payload.email,
            roles: payload.roles,
            isActive: payload.isActive
        }).subscribe({
            next: (updatedUser: User) => {
                this.saving = false;
                const index = this.users.findIndex(user => user._id === updatedUser._id);
                if (index !== -1) {
                    this.users[index] = updatedUser;
                }
                this.closeDrawer();
                this.notificationService.success('Cambios guardados exitosamente');
            },
            error: (error) => {
                this.saving = false;
                this.detailPanel?.setServerErrors(buildFieldErrors(getValidationDetails(error)));
                this.notificationService.httpError(error);
            }
        });
    }

    showCreateUserForm(): void {
        this.showCreateForm = true;
        this.closeDrawer();
    }

    onDeleteUser(user: User | null): void {
        if (!user || !user._id) { return; }

        const dialogRef = this.dialog.open(AuditConfirmDialogComponent, {
            panelClass: ['confirm-dialog-panel', 'dialog-sm'],
            data: {
                title: 'Eliminar usuario',
                message: `¿Eliminar al usuario "${user.businessName || user.username || user.email}"? Esta acción no se puede deshacer.`
            }
        });

        dialogRef.afterClosed().subscribe(confirmed => {
            if (!confirmed) { return; }

            this.usersService.deleteUser(user._id).subscribe({
                next: () => {
                    this.users = this.users.filter(u => u._id !== user._id);
                    this.totalUsers = Math.max(0, this.totalUsers - 1);
                    if (this.selectedUser?._id === user._id) {
                        this.closeDrawer();
                    }
                    this.notificationService.success('Usuario eliminado exitosamente');
                },
                error: (error) => {
                    this.notificationService.httpError(error);
                }
            });
        });
    }

    onCancelCreateUser(): void {
        this.showCreateForm = false;
        this.load$.next();
    }

    onUserCreated(): void {
        this.showCreateForm = false;
        this.load$.next();
    }
}
