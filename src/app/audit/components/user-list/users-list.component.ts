
import { AfterContentInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import { MatSelect } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { arrowDirection, detailExpand } from '@animations/animations.template';
import { AuthService } from '@auth/services/auth.service';
import { User } from '@interfaces/users';
import { Role, RolesService } from '@services/roles.service';
import { UserService } from '@services/users.service';
import { SpanishPaginatorIntl } from '@shared/services/spanish-paginator-intl.service';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { PrescriptionPrinterComponent } from '../prescription-printer/prescription-printer.component';

@Component({
    selector: 'app-users-list',
    templateUrl: './users-list.component.html',
    styleUrls: ['./users-list.component.sass'],
    animations: [
        detailExpand,
        arrowDirection
    ],
    providers: [
        PrescriptionPrinterComponent,
        { provide: MatPaginatorIntl, useClass: SpanishPaginatorIntl }
    ]
})
export class UsersListComponent implements OnInit, AfterContentInit, OnDestroy {

    displayedColumns: string[] = ['businessName', 'username', 'email', 'cuil', 'enrollment', 'roles', 'lastLogin', 'isActive', 'actions'];
    dataSource = new MatTableDataSource<User>([]);
    expandedElement: User | null;
    loadingUsers: boolean;
    auditId: string;
    pharmacistId: string;
    isAdmin = false;
    fechaDesde: Date;
    fechaHasta: Date;
    users: User[];
    user: User;
    editingUser: User | null = null;
    editingField: string | null = null;
    availableRoles: Role[] = [];
    tempEditValue = '';
    tempSelectedRoles: Role[] = [];
    showCreateForm = false;
    totalUsers = 0;
    usersPageSize = 10;
    usersPageIndex = 0;
    pageSizeOptions = [10, 20, 30];
    currentSearchTerm = '';

    private searchSubject = new Subject<string>();
    private destroy$ = new Subject<void>();

    apiRoles: Role[] = [];

    availableRoleOptions: Role[] = [];

    @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
    @ViewChild(MatSort, { static: true }) sort: MatSort;
    @ViewChild('roleSelect') roleSelect: MatSelect;
    @ViewChild('tbSort') tbSort = new MatSort();

    constructor(
        private authService: AuthService,
        private usersService: UserService,
        private rolesService: RolesService,
        public dialog: MatDialog,
        private snackBar: MatSnackBar) { }

    ngOnInit(): void {
        this.loadUsers(0, this.usersPageSize);
        this.auditId = this.authService.getLoggedUserId();
        this.loadRoles();

        this.searchSubject.pipe(
            debounceTime(500),
            distinctUntilChanged(),
            takeUntil(this.destroy$)
        ).subscribe(searchTerm => {
            this.performSearch(searchTerm);
        });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    private loadRoles(): void {
        this.rolesService.getFilteredRoleTypes().subscribe({
            next: (roles: Role[]) => {
                this.apiRoles = roles;
                this.availableRoleOptions = roles;
            },
            error: () => {
                this.snackBar.open('Error al cargar los roles', 'Cerrar', { duration: 3000 });
            }
        });
    }

    private loadUsers(offset: number = 0, limit: number = 10, searchTerm?: string) {
        this.loadingUsers = true;

        const serviceCall = searchTerm && searchTerm.trim()
            ? this.usersService.searchUsers(searchTerm.trim(), { offset, limit })
            : this.usersService.getUsers({ offset, limit });

        serviceCall.subscribe((response) => {
            this.totalUsers = response.total || 0;

            this.dataSource.data = response.users;

            this.dataSource.sortingDataAccessor = (item, property) => {
                switch (property) {
                    case 'businessName': return item.businessName;
                    case 'role': return item.roles[0].role;
                    default: return item[property];
                }
            };
            this.dataSource.sort = this.tbSort;
            this.dataSource.paginator = this.paginator;
            this.loadingUsers = false;
        });
    }

    ngAfterContentInit() {
        this.dataSource.sort = this.tbSort;
    }

    applyFilter(filterValue: string) {
        this.searchSubject.next(filterValue.trim());
    }

    private performSearch(searchTerm: string) {
        this.currentSearchTerm = searchTerm;
        this.usersPageIndex = 0;

        this.loadUsers(0, this.usersPageSize, this.currentSearchTerm);

        if (this.paginator) {
            this.paginator.firstPage();
        }
    }

    startEdit(user: User, field: string): void {
        this.editingUser = user;
        this.editingField = field;

        if (field === 'email') {
            this.tempEditValue = user.email;
        } else if (field === 'businessName') {
            this.tempEditValue = user.businessName;
        } else if (field === 'username') {
            this.tempEditValue = user.username || '';
        } else if (field === 'roles') {
            this.tempSelectedRoles = (user.roles || []).map(userRole => {
                return this.apiRoles.find(apiRole => apiRole.role === userRole.role) || userRole;
            });
        }
    }

    cancelEdit(): void {
        this.editingUser = null;
        this.editingField = null;
        this.tempEditValue = '';
        this.tempSelectedRoles = [];
    }

    activateUser(user: User) {
        this.loadingUsers = true;
        this.usersService.updateIsActive(user._id, true).subscribe((updatedUser: User) => {
            const data = this.dataSource.data.slice();
            const index: number = data.findIndex((u: User) => u._id === updatedUser._id);
            if (index !== -1) {
                data[index] = updatedUser;
                this.dataSource.data = data;
            }
        });
        this.loadingUsers = false;
    };

    deactivateUser(user: User) {
        this.loadingUsers = true;
        this.usersService.updateIsActive(user._id, false).subscribe((updatedUser: User) => {
            const data = this.dataSource.data.slice();
            const index: number = data.findIndex((u: User) => u._id === updatedUser._id);
            if (index !== -1) {
                data[index] = updatedUser;
                this.dataSource.data = data;
            }
        })
        this.loadingUsers = false;
    }

    toggleRole(role: Role): void {
        const index = this.tempSelectedRoles.findIndex(r => r._id === role._id);
        if (index > -1) {
            this.tempSelectedRoles.splice(index, 1);
        } else {
            this.tempSelectedRoles.push(role);
        }
    }

    isRoleSelected(role: Role): boolean {
        return this.tempSelectedRoles.some(r => r._id === role._id);
    }

    onRoleSelectionChange(event: any): void {
        this.tempSelectedRoles = event.value || [];
    }

    onRoleOptionClick(event: Event, clickedRole: Role): void {
        const isCurrentlySelected = this.tempSelectedRoles.some(role => role._id === clickedRole._id);

        if (isCurrentlySelected) {
            return;
        }

        const hasPharmacist = this.tempSelectedRoles.some(role => this.rolesService.isPharmacistRole(role.role));
        const hasProfessional = this.tempSelectedRoles.some(role => this.rolesService.isProfessionalRole(role.role));

        const clickedIsPharmacist = this.rolesService.isPharmacistRole(clickedRole.role);
        const clickedIsProfessional = this.rolesService.isProfessionalRole(clickedRole.role);

        if ((hasPharmacist && clickedIsProfessional) || (hasProfessional && clickedIsPharmacist)) {
            event.preventDefault();
            event.stopPropagation();

            const conflictType = hasPharmacist ? 'farmacéutico' : 'profesional';
            const clickedType = clickedIsPharmacist ? 'farmacéutico' : 'profesional';

            this.snackBar.open(
                `No se puede seleccionar un rol ${clickedType} cuando ya hay un rol ${conflictType} seleccionado. Primero deselecciona el rol ${conflictType}.`,
                'Cerrar',
                { duration: 4000 }
            );
        }
    }

    isRoleDisabled(role: Role): boolean {
        const hasPharmacist = this.tempSelectedRoles.some(r => this.rolesService.isPharmacistRole(r.role));
        const hasProfessional = this.tempSelectedRoles.some(r => this.rolesService.isProfessionalRole(r.role));

        const roleIsPharmacist = this.rolesService.isPharmacistRole(role.role);
        const roleIsProfessional = this.rolesService.isProfessionalRole(role.role);

        if (hasProfessional && roleIsPharmacist) {
            return true;
        }

        if (hasPharmacist && roleIsProfessional) {
            return true;
        }

        return false;
    }

    compareRoles(role1: Role, role2: Role): boolean {
        return role1 && role2 ? role1._id === role2._id : role1 === role2;
    }

    translateRole(role: string): string {
        const apiRole = this.apiRoles.find(r => r.role === role);
        return apiRole?.displayName || apiRole?.name || role;
    }

    getRoleColor(role: string): string {
        const apiRole = this.apiRoles.find(r => r.role === role);
        return apiRole?.color || '#757575';
    }

    getUserRolesTooltip(user: User): string {
        if (!user.roles || user.roles.length === 0) {
            return 'Sin roles asignados';
        }

        const roleNames = user.roles.map(role => this.translateRole(role.role));
        return roleNames.join(', ');
    }

    getAvailableRoleOptions(): Role[] {
        if (!this.tempSelectedRoles || this.tempSelectedRoles.length === 0) {
            return this.availableRoleOptions;
        }

        const hasPharmacistRole = this.tempSelectedRoles.some(role =>
            this.rolesService.isPharmacistRole(role.role)
        );
        const hasProfessionalRole = this.tempSelectedRoles.some(role =>
            this.rolesService.isProfessionalRole(role.role)
        );

        return this.availableRoleOptions.filter(role => {
            if (hasPharmacistRole && this.rolesService.isProfessionalRole(role.role)) {
                return false;
            }
            if (hasProfessionalRole && this.rolesService.isPharmacistRole(role.role)) {
                return false;
            }
            return true;
        });
    }

    isEditing(user: User, field: string): boolean {
        return this.editingUser?._id === user._id && this.editingField === field;
    }

    isUserInEditMode(user: User): boolean {
        return this.editingUser?._id === user._id;
    }

    startEditMode(user: User): void {
        this.editingUser = user;
        this.editingField = 'general';

        this.tempEditValue = '';
        this.tempSelectedRoles = user.roles ? user.roles.map(userRole => {
            return this.apiRoles.find(apiRole => apiRole.role === userRole.role) || userRole;
        }) : [];
    }

    saveAllChanges(): void {
        if (!this.editingUser) { return; }

        const emailInput = document.querySelector('input[type="email"]') as HTMLInputElement;
        const businessNameInput = document.querySelector('input[placeholder="Nombre del negocio"]') as HTMLInputElement;
        const usernameInput = document.querySelector('input[placeholder="Nombre de usuario"]') as HTMLInputElement;

        const currentEmail = emailInput ? emailInput.value.trim() : this.editingUser.email;
        const currentBusinessName = businessNameInput ? businessNameInput.value.trim() : this.editingUser.businessName;
        const currentUsername = usernameInput ? usernameInput.value.trim() : this.editingUser.username;

        const hasEmailChanges = currentEmail && currentEmail !== this.editingUser.email;
        const hasBusinessNameChanges = currentBusinessName && currentBusinessName !== this.editingUser.businessName;
        const hasUsernameChanges = currentUsername !== (this.editingUser.username || '');
        const hasRolesChanges = this.hasRolesChanged();

        if (!hasEmailChanges && !hasBusinessNameChanges && !hasUsernameChanges && !hasRolesChanges) {
            this.cancelEdit();
            return;
        }

        const updateData = {
            _id: this.editingUser._id,
            enrollment: this.editingUser.enrollment,
            businessName: currentBusinessName,
            email: currentEmail,
            cuil: this.editingUser.cuil,
            username: currentUsername,
            roles: this.tempSelectedRoles.map(role => ({
                _id: role._id,
                role: role.role
            })),
            isActive: this.editingUser.isActive,
            lastLogin: this.editingUser.lastLogin,
            createdAt: this.editingUser.createdAt,
            updatedAt: this.editingUser.updatedAt
        };

        const isPharmacist = this.tempSelectedRoles.some(role => role.role === 'pharmacist');
        if (isPharmacist && hasEmailChanges) {
            updateData.username = currentEmail;
        }

        this.loadingUsers = true;

        this.usersService.updateUser(this.editingUser._id, updateData).subscribe({
            next: () => {
                this.editingUser.email = currentEmail;
                this.editingUser.businessName = currentBusinessName;
                this.editingUser.username = currentUsername;
                this.editingUser.roles = this.tempSelectedRoles;
                if (isPharmacist && hasEmailChanges) {
                    this.editingUser.username = currentEmail;
                }

                this.loadingUsers = false;
                this.cancelEdit();
                this.snackBar.open('Cambios guardados exitosamente', 'Cerrar', { duration: 3000 });
            },
            error: (err) => {
                this.loadingUsers = false;
                const errorMessage = err || 'Error al guardar cambios';
                this.snackBar.open(errorMessage, 'Cerrar', { duration: 3000 });
            }
        });
    }

    private hasRolesChanged(): boolean {
        if (this.tempSelectedRoles.length !== this.editingUser.roles.length) {
            return true;
        }

        const currentRoleIds = this.editingUser.roles.map(role => role._id);
        return !this.tempSelectedRoles.every(tempRole =>
            currentRoleIds.includes(tempRole._id)
        );
    }

    showCreateUserForm(): void {
        this.showCreateForm = true;
        this.cancelEdit();
    }

    onCancelCreateUser(): void {
        this.showCreateForm = false;
        this.cancelEdit();
        this.loadUsers(this.usersPageIndex * this.usersPageSize, this.usersPageSize, this.currentSearchTerm);
    }

    onUserCreated(): void {
        this.showCreateForm = false;
        this.loadUsers(this.usersPageIndex * this.usersPageSize, this.usersPageSize, this.currentSearchTerm);
    }

    onUsersPageChange(event: any) {
        this.usersPageIndex = event.pageIndex;
        this.usersPageSize = event.pageSize;
        this.loadUsers(event.pageIndex * event.pageSize, event.pageSize, this.currentSearchTerm);
    }

}
