import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Certificate } from '@interfaces/certificate';
import { CertificatesService } from '@services/certificates.service';
import { Observable, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';

@Component({
    selector: 'app-public-certificate',
    templateUrl: './public-certificate.component.html',
    styleUrls: ['./public-certificate.component.sass']
})

export class PublicCertificateComponent implements OnInit {

    certificate$: Observable<Certificate | null>;
    loading = true;
    error: string | null = null;

    constructor(
        private route: ActivatedRoute,
        private certificatesService: CertificatesService
    ) { }

    ngOnInit(): void {
        this.loadCertificate();
    }

    private loadCertificate(): void {
        this.certificate$ = this.route.params.pipe(
            switchMap(params => {
                const encryptedId = params['id'];

                if (!encryptedId) {
                    this.error = 'ID de certificado no proporcionado';
                    this.loading = false;
                    return of(null);
                }

                try {
                    // Descifrar el ID
                    const decryptedId = this.certificatesService.decryptId(encryptedId);

                    // Obtener el certificado
                    return this.certificatesService.getById(decryptedId,true).pipe(
                        catchError(() => {
                            this.error = 'Certificado no encontrado o inválido';
                            this.loading = false;
                            return of(null);
                        })
                    );
                } catch (error) {
                    this.error = 'ID de certificado inválido';
                    this.loading = false;
                    return of(null);
                }
            })
        );

        // Suscribirse para manejar el estado de carga
        this.certificate$.subscribe(certificate => {
            this.loading = false;
            if (certificate) {
                this.error = null;
            }
        });
    }

    formatDate(date: Date | string): string {
        if (!date) { return 'No especificada'; }
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        return dateObj.toLocaleDateString('es-AR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    getCertificateStatus(certificate: any): string {

        if (!certificate.endDate) {
            return 'activo';
        }
         if (certificate.anulateDate) {
            return 'anulado';
        }
        const today = new Date();
        const endDate = new Date(certificate.endDate);

        today.setHours(0, 0, 0, 0);
        endDate.setHours(0, 0, 0, 0);

        return today > endDate ? 'expirado' : 'activo';
    }
    getCurrentDate() {
        return new Date()}

    getStatusText(status: string): string {
        const statusMap = {
            'activo': 'Activo',
            'expirado': 'Expirado',
            'anulado':'Anulado'
        };
        return statusMap[status] || 'Activo';
    }

    printCertificate(): void {
        window.print();
    }
}
