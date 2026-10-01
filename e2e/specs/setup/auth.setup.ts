import fs from 'node:fs';
import path from 'node:path';
import { test as setup, request } from '@playwright/test';
import { unwrapApiResponse } from '../../fixtures/api-response';
import {
    E2E_ROLES,
    apiURL,
    baseOrigin,
    credentialsFor,
    defaultAmbito,
    hasCredentials,
    statePath,
    type E2ERole
} from '../../fixtures/test-data';

interface LoginResponse {
    jwt: string;
    refreshToken: string;
}

function ambitoForRole(role: E2ERole): string | null {
    if (role === 'professional' || role === 'pharmacist') {
        return defaultAmbito;
    }
    return null;
}

function writeStorageState(role: E2ERole, jwt?: string, refreshToken?: string): void {
    const localStorage = [
        ...(jwt ? [{ name: 'JWT_TOKEN', value: jwt }] : []),
        ...(refreshToken ? [{ name: 'REFRESH_TOKEN', value: refreshToken }] : [])
    ];

    const ambito = ambitoForRole(role);
    if (ambito) {
        localStorage.push({ name: 'ambito_seleccionado', value: ambito });
    }

    const filePath = statePath(role);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify({ cookies: [], origins: [{ origin: baseOrigin, localStorage }] }, null, 2));
}

setup.describe('Autenticación E2E', () => {
    for (const role of E2E_ROLES) {
        setup(`preparar sesión ${role}`, async () => {
            const credentials = credentialsFor(role);

            if (!credentials) {
                writeStorageState(role);
                setup.skip(true, `Faltan E2E_USER_${role.replace(/-/g, '_').toUpperCase()} y E2E_PASS_${role.replace(/-/g, '_').toUpperCase()}`);
                return;
            }

            const apiRequest = await request.newContext();
            try {
                const response = await apiRequest.post(`${apiURL}/auth/login`, {
                    data: {
                        identifier: credentials.username,
                        password: credentials.password
                    }
                });

                if (!response.ok()) {
                    throw new Error(`Login E2E falló para ${role}: ${response.status()} ${await response.text()}`);
                }

                const tokens = unwrapApiResponse<LoginResponse>(await response.json());
                if (!tokens.jwt || !tokens.refreshToken) {
                    throw new Error(`Login E2E para ${role} no devolvió jwt/refreshToken`);
                }

                writeStorageState(role, tokens.jwt, tokens.refreshToken);
            } finally {
                await apiRequest.dispose();
            }
        });
    }

    setup('registrar disponibilidad de roles', async () => {
        const summary = E2E_ROLES.reduce<Record<string, boolean>>((acc, role) => {
            acc[role] = hasCredentials(role);
            return acc;
        }, {});

        process.stdout.write(`[E2E] Roles configurados: ${JSON.stringify(summary)}\n`);
    });
});
