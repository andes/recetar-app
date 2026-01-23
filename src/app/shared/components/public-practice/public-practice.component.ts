import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Practice } from '@interfaces/practices';
import { PracticesService } from '@services/practices.service';
import { PatientNamePipe } from '@shared/pipes/patient-name.pipe';
import { Observable, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';

@Component({
    selector: 'app-public-practice',
    templateUrl: './public-practice.component.html',
    styleUrls: ['./public-practice.component.sass']
})

export class PublicPracticeComponent implements OnInit {

    practice$: Observable<Practice | null>;
    loading = true;
    error: string | null = null;

    constructor(
        private route: ActivatedRoute,
        private practicesService: PracticesService,
        public patientName: PatientNamePipe,
    ) { }

    ngOnInit(): void {
        this.loadPractice();
    }

    private loadPractice(): void {
        this.practice$ = this.route.params.pipe(
            switchMap(params => {
                const encryptedId = params['id'];

                if (!encryptedId) {
                    this.error = 'ID de práctica no proporcionado';
                    this.loading = false;
                    return of(null);
                }

                try {
                    // Descifrar el ID
                    const decryptedId = this.practicesService.decryptId(encryptedId);

                    // Obtener la práctica
                    return this.practicesService.getById(decryptedId, true).pipe(
                        catchError(() => {
                            this.error = 'Práctica no encontrada o inválida';
                            this.loading = false;
                            return of(null);
                        })
                    );
                } catch (error) {
                    this.error = 'ID de práctica inválido';
                    this.loading = false;
                    return of(null);
                }
            })
        );

        this.practice$.subscribe(practice => {
            if (practice) {
                this.loading = false;
            }
        });
    }

    formatDate(date: Date | string): string {
        if (!date) {return '';}
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        return dateObj.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    }

    getStatusText(status: string): string {
        const statusMap = {
            'active': 'Activo',
            'completed': 'Completado',
            'cancelled': 'Cancelado'
        };
        return statusMap[status?.toLowerCase()] || 'Activo';
    }

    printPractice(): void {
        window.print();
    }
}
