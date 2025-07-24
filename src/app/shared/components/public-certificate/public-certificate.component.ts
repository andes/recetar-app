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
        // console.log("id", this.certificatesService.encryptId('687903e961c4b13b343ab97a'))
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
                    return this.certificatesService.getById(decryptedId).pipe(
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

    printCertificate(): void {
        window.print();
    }
}
