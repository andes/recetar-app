import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { SidebarItem } from '@shared/components/layout/sidebar/sidebar.component';
import { SidebarService } from '@shared/services/sidebar.service';
import { NotificationService } from '@shared/services/notification.service';
import { Patient } from '@interfaces/patients';
import { PatientsService } from '@services/patients.service';
import { PatientEditFormComponent } from '../../components/patient-edit-form/patient-edit-form.component';

@Component({
    selector: 'app-patient-edit-page',
    templateUrl: './patient-edit-page.component.html',
    styleUrls: ['./patient-edit-page.component.sass'],
    standalone: false
})
export class PatientEditPageComponent implements OnInit {
    @ViewChild(PatientEditFormComponent) form?: PatientEditFormComponent;

    sidebarItems: SidebarItem[] = [];
    patient: Patient | null = null;
    isCreate = false;
    loading = false;
    loadError = false;

    private returnQueryParams: Params = {};

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private sidebarService: SidebarService,
        private patientsService: PatientsService,
        private notification: NotificationService,
    ) { }

    ngOnInit(): void {
        this.sidebarItems = this.sidebarService.getItems();
        this.returnQueryParams = { ...this.route.snapshot.queryParams };

        const id = this.route.snapshot.paramMap.get('id');
        this.isCreate = !id;
        if (id) {
            this.loadPatient(id);
        }
    }

    get pageTitle(): string {
        return this.isCreate ? 'Nuevo paciente' : 'Editar paciente';
    }

    get pageSubtitle(): string {
        return 'Completá los datos básicos y de contacto del paciente.';
    }

    goToList(): void {
        this.navigateBack();
    }

    onCancel(): void {
        this.navigateBack();
    }

    onSaved(patient: Patient): void {
        const queryParams: Params = { ...this.returnQueryParams };
        if (!queryParams['q']) {
            const term = patient.dni || `${patient.lastName} ${patient.firstName}`.trim();
            if (term) {
                queryParams['q'] = term;
            }
        }

        this.notification.success('Paciente guardado correctamente');
        this.router.navigate(['/pacientes'], { queryParams });
    }

    canDeactivate(): boolean | Observable<boolean> {
        return this.form ? this.form.canDeactivate() : true;
    }

    private loadPatient(id: string): void {
        this.loading = true;
        this.loadError = false;

        this.patientsService.getPatientById(id).pipe(
            finalize(() => this.loading = false),
        ).subscribe({
            next: (patient) => {
                if (!patient) {
                    this.loadError = true;
                    return;
                }
                this.patient = patient;
            },
            error: () => {
                this.loadError = true;
            }
        });
    }

    private navigateBack(): void {
        this.router.navigate(['/pacientes'], { queryParams: this.returnQueryParams });
    }
}
