import { APIRequestContext } from '@playwright/test';
import { unwrapApiResponse } from './api-response';
import {
    apiURL,
    credentialsFor,
    testData,
    uniqueLabel,
    type E2ERole
} from './test-data';

export interface PrescriptionRecord {
    _id: string;
    status?: string;
    ambito?: string;
    patient?: { dni?: string; firstName?: string; lastName?: string; sex?: string };
    supplies?: Array<{ supply?: { name?: string; type?: string } }>;
    [key: string]: unknown;
}

interface CleanupTask {
    label: string;
    run: () => Promise<void>;
}

export class ApiClient {
    private readonly tokens = new Map<E2ERole, string>();
    private readonly cleanupTasks: CleanupTask[] = [];

    constructor(private readonly request: APIRequestContext) {}

    async loginAs(role: E2ERole): Promise<string> {
        const cached = this.tokens.get(role);
        if (cached) {
            return cached;
        }

        const credentials = credentialsFor(role);
        if (!credentials) {
            throw new Error(`No hay credenciales E2E configuradas para el rol ${role}`);
        }

        const response = await this.request.post(`${apiURL}/auth/login`, {
            data: {
                identifier: credentials.username,
                password: credentials.password
            }
        });

        if (!response.ok()) {
            throw new Error(`Login API falló para ${role}: ${response.status()} ${await response.text()}`);
        }

        const body = unwrapApiResponse<{ jwt?: string }>(await response.json());
        if (!body.jwt) {
            throw new Error(`Login API para ${role} no devolvió jwt`);
        }

        this.tokens.set(role, body.jwt);
        return body.jwt;
    }

    getUserIdFromToken(role: E2ERole): string {
        const token = this.tokens.get(role);
        if (!token) {
            throw new Error(`Primero hay que llamar loginAs('${role}')`);
        }

        const payload = token.split('.')[1];
        const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { sub?: string };
        if (!decoded.sub) {
            throw new Error(`El token de ${role} no contiene sub`);
        }
        return decoded.sub;
    }

    getBusinessNameFromToken(role: E2ERole): string {
        const token = this.tokens.get(role);
        if (!token) {
            throw new Error(`Primero hay que llamar loginAs('${role}')`);
        }

        const payload = token.split('.')[1];
        const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { bsname?: string };
        return decoded.bsname || 'E2E';
    }

    async getPatientByDni(dni: string): Promise<Record<string, unknown>[]> {
        return this.getJson<Record<string, unknown>[]>('/patients/dni/' + encodeURIComponent(dni), 'professional');
    }

    async searchPatients(term: string): Promise<Record<string, unknown>[]> {
        return this.getJson<Record<string, unknown>[]>(`/patients/search?q=${encodeURIComponent(term)}`, 'professional');
    }

    async createPatient(payload: Record<string, unknown>, role: E2ERole = 'professional'): Promise<Record<string, unknown>> {
        const patient = await this.postJson<Record<string, unknown>>('/patients', payload, role);
        const id = String(patient.idMPI || patient._id || patient.id || '');
        if (id) {
            this.track(`patient ${id}`, async () => this.deletePatient(id, role));
        }
        return patient;
    }

    async createDisposablePatient(overrides: Record<string, unknown> = {}): Promise<Record<string, unknown>> {
        return this.createPatient({
            firstName: 'Paciente',
            lastName: uniqueLabel('Temporal E2E'),
            sex: 'Otro',
            ...overrides
        });
    }

    async getPatientById(id: string): Promise<Record<string, unknown>> {
        return this.getJson<Record<string, unknown>>(`/patients/${id}`, 'professional');
    }

    async updatePatient(id: string, payload: Record<string, unknown>, role: E2ERole = 'professional'): Promise<Record<string, unknown>> {
        await this.loginAs(role);
        const response = await this.request.patch(`${apiURL}/patients/${id}`, {
            headers: this.headers(role),
            data: payload
        });
        await this.assertOk(response, `${role} PATCH /patients/${id}`);
        return unwrapApiResponse<Record<string, unknown>>(await response.json());
    }

    async validatePatient(dni: string, sexo: string): Promise<Record<string, unknown>> {
        return this.postJson<Record<string, unknown>>('/patients/validate', { dni, sexo }, 'professional');
    }

    async validatePatientById(id: string): Promise<Record<string, unknown>> {
        return this.postJson<Record<string, unknown>>(`/patients/${id}/validate`, {}, 'professional');
    }

    async deletePatient(id: string, role: E2ERole = 'professional'): Promise<void> {
        await this.delete(`/patients/${id}`, role);
    }

    async findByDni(dni: string): Promise<PrescriptionRecord[]> {
        const response = await this.getJson<{ prescriptions?: PrescriptionRecord[] }>(
            `/prescriptions/find/${encodeURIComponent(dni)}`,
            'professional'
        );
        return response.prescriptions || [];
    }

    async getPrescription(id: string): Promise<PrescriptionRecord> {
        return this.getJson<PrescriptionRecord>(`/prescriptions/${id}`, 'professional');
    }

    trackExistingPrescription(id: string): void {
        this.trackPrescription(id);
    }

    async trackNewPrescriptionsForDni(dni: string, knownIds: string[]): Promise<PrescriptionRecord[]> {
        const known = new Set(knownIds);
        const current = await this.findByDni(dni);
        const created = current.filter((item) => !known.has(item._id));
        created.forEach((item) => this.trackPrescription(item._id));
        return created;
    }

    async createPrescription(payload: Record<string, unknown>, role: E2ERole = 'professional'): Promise<PrescriptionRecord> {
        const prescription = await this.postJson<PrescriptionRecord>('/prescriptions', payload, role);
        if (prescription?._id) {
            this.trackPrescription(prescription._id);
        }
        return prescription;
    }

    async deletePrescription(id: string): Promise<void> {
        await this.delete(`/prescriptions/${id}`, 'professional');
    }

    async suspendPrescription(id: string): Promise<void> {
        await this.patch(`/prescriptions/${id}/suspend`, {}, 'professional');
    }

    async dispensePrescription(id: string, role: E2ERole = 'pharmacist'): Promise<void> {
        await this.loginAs(role);
        const body = {
            userId: this.getUserIdFromToken(role),
            businessName: this.getBusinessNameFromToken(role),
            cuil: testData.pharmacyCuil
        };
        await this.patch(`/prescriptions/${id}/dispense`, body, role);
    }

    async cancelDispense(id: string, role: E2ERole = 'pharmacist'): Promise<void> {
        await this.loginAs(role);
        const userId = this.getUserIdFromToken(role);
        await this.patch(`/prescriptions/${id}/cancel-dispense?userId=${encodeURIComponent(userId)}`, {}, role);
    }

    async getPatientSnapshot(): Promise<{
        firstName: string;
        lastName: string;
        dni: string;
        sex: string;
        fechaNac: string;
    }> {
        const patients = await this.getPatientByDni(testData.patient.dni);
        const patient = patients[0];

        if (!patient) {
            throw new Error(`No se encontró el paciente E2E con DNI ${testData.patient.dni}`);
        }

        return {
            firstName: String(patient.firstName || 'Paciente'),
            lastName: String(patient.lastName || 'E2E'),
            dni: String(patient.dni || testData.patient.dni),
            sex: String(patient.sex || testData.patient.sex),
            fechaNac: String(patient.fechaNac || '1990-01-01')
        };
    }

    async createPendingPrescription(options?: {
        medicationName?: string;
        quantity?: number;
        treatmentMonths?: number;
        ambito?: 'publico' | 'privado';
    }): Promise<PrescriptionRecord> {
        await this.loginAs('professional');
        const userId = this.getUserIdFromToken('professional');
        const businessName = this.getBusinessNameFromToken('professional');
        const medicationName = options?.medicationName || uniqueLabel('Magistral E2E');
        const patient = await this.getPatientSnapshot();
        const payload = {
            patient,
            professional: {
                userId,
                businessName
            },
            supplies: [
                {
                    supply: {
                        name: medicationName,
                        code: { source: 'ANDES', value: uniqueLabel('E2E-CODE') },
                        type: 'magistral'
                    },
                    quantity: options?.quantity || 1,
                    diagnostic: testData.diagnostic,
                    indication: testData.indication,
                    ...(options?.treatmentMonths ? { tratamientoProlongado: options.treatmentMonths } : {})
                }
            ],
            ambito: options?.ambito || 'publico',
            date: new Date().toISOString()
        };

        return this.createPrescription(payload, 'professional');
    }

    async createAndDispensePrescription(options?: {
        medicationName?: string;
    }): Promise<PrescriptionRecord> {
        const prescription = await this.createPendingPrescription({
            medicationName: options?.medicationName,
            ambito: 'publico'
        });
        await this.dispensePrescription(prescription._id, 'pharmacist');
        return prescription;
    }

    async listCertificates(): Promise<Record<string, unknown>[]> {
        await this.loginAs('professional');
        const userId = this.getUserIdFromToken('professional');
        const response = await this.getJson<{ certificates?: Record<string, unknown>[] }>(
            `/certificates?userId=${encodeURIComponent(userId)}&skip=0&limit=50`,
            'professional'
        );
        return response.certificates || [];
    }

    async findCertificateByText(text: string): Promise<Record<string, unknown> | null> {
        const items = await this.listCertificates();
        return items.find((item) => item.certificate === text) || null;
    }

    trackExistingCertificate(id: string): void {
        this.track(`certificate ${id}`, async () => this.delete(`/certificates/${id}`, 'professional'));
    }

    async createCertificate(payload: Record<string, unknown>): Promise<Record<string, unknown>> {
        const certificate = await this.postJson<Record<string, unknown>>('/certificates', payload, 'professional');
        const id = String(certificate._id || certificate.id || '');
        if (id) {
            this.track(`certificate ${id}`, async () => this.delete(`/certificates/${id}`, 'professional'));
        }
        return certificate;
    }

    async deleteCertificate(id: string): Promise<void> {
        await this.delete(`/certificates/${id}`, 'professional');
    }

    async listPractices(): Promise<Record<string, unknown>[]> {
        await this.loginAs('professional');
        const userId = this.getUserIdFromToken('professional');
        const response = await this.getJson<{ practices?: Record<string, unknown>[] }>(
            `/practices?userId=${encodeURIComponent(userId)}&skip=0&limit=50`,
            'professional'
        );
        return response.practices || [];
    }

    async findPracticeByName(name: string): Promise<Record<string, unknown> | null> {
        const items = await this.listPractices();
        return items.find((item) => item.practice === name) || null;
    }

    trackExistingPractice(id: string): void {
        this.track(`practice ${id}`, async () => this.delete(`/practices/${id}`, 'professional'));
    }

    async createPractice(payload: Record<string, unknown>): Promise<Record<string, unknown>> {
        const practice = await this.postJson<Record<string, unknown>>('/practices', payload, 'professional');
        const id = String(practice._id || practice.id || '');
        if (id) {
            this.track(`practice ${id}`, async () => this.delete(`/practices/${id}`, 'professional'));
        }
        return practice;
    }

    async deletePractice(id: string): Promise<void> {
        await this.delete(`/practices/${id}`, 'professional');
    }

    async getDispensedByCuil(cuil: string): Promise<{ prescriptions: PrescriptionRecord[]; total: number }> {
        return this.getJson<{ prescriptions: PrescriptionRecord[]; total: number }>(
            `/prescriptions/dispensed-by/${encodeURIComponent(cuil)}?skip=0&limit=20`,
            'auditor'
        );
    }

    async cleanup(): Promise<void> {
        for (const task of [...this.cleanupTasks].reverse()) {
            try {
                await task.run();
            } catch (error) {
                console.warn(`[E2E] No se pudo limpiar ${task.label}:`, error);
            }
        }
        this.cleanupTasks.length = 0;
    }

    private trackPrescription(id: string): void {
        this.track(`prescription ${id}`, async () => {
            const current = await this.getPrescription(id).catch(() => null);
            if (!current) {
                return;
            }

            if (String(current.status || '').toLowerCase() === 'dispensada') {
                await this.cancelDispense(id).catch(() => undefined);
            }
            await this.deletePrescription(id).catch(() => undefined);
        });
    }

    private track(label: string, run: () => Promise<void>): void {
        this.cleanupTasks.push({ label, run });
    }

    private headers(role: E2ERole): Record<string, string> {
        const token = this.tokens.get(role);
        const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
        const securityPin = process.env.E2E_PROFESSIONAL_PIN;
        if (role === 'professional' && securityPin) {
            headers['X-Security-Pin'] = securityPin;
        }
        return headers;
    }

    private async getJson<T>(path: string, role: E2ERole): Promise<T> {
        await this.loginAs(role);
        const response = await this.request.get(`${apiURL}${path}`, { headers: this.headers(role) });
        return this.readJson<T>(response, `${role} GET ${path}`);
    }

    private async postJson<T>(path: string, data: Record<string, unknown>, role: E2ERole): Promise<T> {
        await this.loginAs(role);
        const response = await this.request.post(`${apiURL}${path}`, {
            headers: this.headers(role),
            data
        });
        return this.readJson<T>(response, `${role} POST ${path}`);
    }

    private async patch(path: string, data: Record<string, unknown>, role: E2ERole): Promise<void> {
        await this.loginAs(role);
        const response = await this.request.patch(`${apiURL}${path}`, {
            headers: this.headers(role),
            data
        });
        await this.assertOk(response, `${role} PATCH ${path}`);
    }

    private async delete(path: string, role: E2ERole): Promise<void> {
        await this.loginAs(role);
        const response = await this.request.delete(`${apiURL}${path}`, { headers: this.headers(role) });
        if (response.status() === 404) {
            return;
        }
        await this.assertOk(response, `${role} DELETE ${path}`);
    }

    private async readJson<T>(response: Awaited<ReturnType<APIRequestContext['get']>>, label: string): Promise<T> {
        await this.assertOk(response, label);
        const text = await response.text();
        return unwrapApiResponse<T>(text ? JSON.parse(text) : {});
    }

    private async assertOk(response: Awaited<ReturnType<APIRequestContext['get']>>, label: string): Promise<void> {
        if (!response.ok()) {
            throw new Error(`${label} falló: ${response.status()} ${await response.text()}`);
        }
    }
}
