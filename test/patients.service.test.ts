import { TestBed } from '@angular/core/testing';
import { HttpClientModule, HttpClient, HttpHeaders } from '@angular/common/http';
import { PatientsService } from '@services/patients.service';
import { Patient } from '@interfaces/patients';
import { AuthService } from '@auth/services/auth.service';
import { Router } from '@angular/router';
import { PrescriptionsService } from '@services/prescriptions.service';
import { AmbitoService } from '@auth/services/ambito.service';
import * as fs from 'fs';
import * as path from 'path';

describe('PatientsService Integration Test - Token from File', () => {
    let service: PatientsService;
    let authService: AuthService;
    let token: string;

    beforeAll(() => {
        // Leer el token generado por el script externo
        try {
            const tokenPath = path.resolve(process.cwd(), 'test', 'data/token.json');
            const tokenData = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
            token = tokenData.jwt;
            console.log('--- TEST: TOKEN CARGADO DESDE ARCHIVO ---');
        } catch (err) {
            console.error('--- TEST: ERROR AL LEER token.json ---', err.message);
            throw new Error('Debe ejecutar "node get-token.js" antes de los tests');
        }
    });

    beforeEach(async () => {
        const routerSpy = { navigate: jest.fn() };

        TestBed.configureTestingModule({
            imports: [HttpClientModule],
            providers: [
                PatientsService,
                AuthService,
                PrescriptionsService,
                AmbitoService,
                { provide: Router, useValue: routerSpy }
            ]
        });

        service = TestBed.inject(PatientsService);
        authService = TestBed.inject(AuthService);

        // Inyección manual de token en los métodos de HttpClient
        const originalPost = (service as any).http.post.bind((service as any).http);
        jest.spyOn((service as any).http, 'post').mockImplementation((url: any, body: any, options: any = {}) => {
            const targetUrl = (url as string).replace('localhost', '127.0.0.1');
            options.headers = (options.headers || new HttpHeaders())
                .set('Authorization', `Bearer ${token}`);
            return originalPost(targetUrl, body, options);
        });

        const originalGet = (service as any).http.get.bind((service as any).http);
        jest.spyOn((service as any).http, 'get').mockImplementation((url: any, options: any = {}) => {
            const targetUrl = (url as string).replace('localhost', '127.0.0.1');
            options.headers = (options.headers || new HttpHeaders())
                .set('Authorization', `Bearer ${token}`);
            return originalGet(targetUrl, options);
        });
    });

    /**
     * Valida la creación de un nuevo paciente real en la API.
     * Este test es prioritario y se realiza sobre la misma URL (127.0.0.1:4000).
     */
    it('debe crear un nuevo paciente correctamente en la API real', async () => {
        const uniqueDni = Math.floor(Math.random() * 100000000).toString();
        const testPatient: Patient = {
            firstName: 'Test',
            lastName: 'User',
            dni: uniqueDni,
            sex: 'Femenino',
            fechaNac: new Date('1990-01-01'),
            status: 'Validado'
        };

        try {
            const response: any = await service.newPatient(testPatient).toPromise();
            console.log('--- TEST: RESULTADO API ---', JSON.stringify(response, null, 2));

            // La API devuelve el objeto envuelto en { newPatient: ... }
            const result = response.newPatient || response;

            expect(result).toBeDefined();
            expect(result.dni).toBe(uniqueDni);
            expect(result._id).toBeDefined();
            console.log('--- TEST: PACIENTE CREADO CON EXITO --- ID:', result._id, 'DNI:', uniqueDni);

            // Guardamos el ID del paciente creado para usarlo en los siguientes tests (opcional)
            const patientDataPath = path.resolve(process.cwd(), 'test', 'data', 'test-patient-data.json');
            fs.writeFileSync(patientDataPath, JSON.stringify({
                _id: result._id,
                dni: uniqueDni,
                firstName: 'Test',
                lastName: 'User'
            }));

        } catch (error) {
            console.error('--- TEST: ERROR CREACION PACIENTE ---', error.status, error.message);
            throw error;
        }
    });
});
