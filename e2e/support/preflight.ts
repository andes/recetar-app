import fs from 'node:fs';
import path from 'node:path';
import { APIRequestContext } from '@playwright/test';
import {
    E2E_ROLES,
    apiURL,
    baseURL,
    hasCredentials,
    renaperEnabled,
    testData,
} from '../fixtures/test-data';

type EnvGate = 'renaper' | 'pin' | 'org';

const BASE_ROLES = ['professional', 'pharmacist', 'auditor', 'admin'] as const;

interface CheckRow {
    item: string;
    status: 'OK' | 'FALTA' | 'OFF' | 'PARCIAL';
    detail: string;
}

function listSpecFiles(dir: string): string[] {
    if (!fs.existsSync(dir)) {
        return [];
    }
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            return listSpecFiles(fullPath);
        }
        return entry.isFile() && entry.name.endsWith('.spec.ts') ? [fullPath] : [];
    });
}

function countEnvGates(): Record<EnvGate, number> {
    const specsDir = path.resolve(__dirname, '..', 'specs');
    const counts: Record<EnvGate, number> = { renaper: 0, pin: 0, org: 0 };

    for (const file of listSpecFiles(specsDir)) {
        const content = fs.readFileSync(file, 'utf8');
        for (const gate of Object.keys(counts) as EnvGate[]) {
            counts[gate] += (content.match(new RegExp(`@env:${gate}`, 'g')) || []).length;
        }
    }

    return counts;
}

async function checkService(
    request: APIRequestContext,
    label: string,
    url: string,
): Promise<CheckRow> {
    try {
        const response = await request.get(url, { timeout: 5000, failOnStatusCode: false });
        return {
            item: label,
            status: response.status() < 500 ? 'OK' : 'FALTA',
            detail: `${url} (${response.status()})`,
        };
    } catch (error) {
        return {
            item: label,
            status: 'FALTA',
            detail: `${url} (${(error as Error).message})`,
        };
    }
}

function printTable(rows: CheckRow[]): void {
    const itemWidth = Math.max('Item'.length, ...rows.map((row) => row.item.length));
    const statusWidth = Math.max('Estado'.length, ...rows.map((row) => row.status.length));
    const detailWidth = Math.max('Detalle'.length, ...rows.map((row) => row.detail.length));
    const separator = `+-${'-'.repeat(itemWidth)}-+-${'-'.repeat(statusWidth)}-+-${'-'.repeat(detailWidth)}-+`;

    process.stdout.write('\n[E2E] Preflight de ambiente\n');
    process.stdout.write(`${separator}\n`);
    process.stdout.write(`| ${'Item'.padEnd(itemWidth)} | ${'Estado'.padEnd(statusWidth)} | ${'Detalle'.padEnd(detailWidth)} |\n`);
    process.stdout.write(`${separator}\n`);
    for (const row of rows) {
        process.stdout.write(
            `| ${row.item.padEnd(itemWidth)} | ${row.status.padEnd(statusWidth)} | ${row.detail.padEnd(detailWidth)} |\n`,
        );
    }
    process.stdout.write(`${separator}\n`);
}

export async function runPreflight(request: APIRequestContext): Promise<void> {
    const rows: CheckRow[] = [];
    const failures: string[] = [];

    rows.push(await checkService(request, 'App', baseURL));
    rows.push(await checkService(request, 'API', apiURL));
    if (rows.some((row) => row.status === 'FALTA')) {
        failures.push('app/API no responden');
    }

    for (const role of E2E_ROLES) {
        const configured = hasCredentials(role);
        const required = (BASE_ROLES as readonly string[]).includes(role);
        rows.push({
            item: `Rol ${role}`,
            status: configured ? 'OK' : (required ? 'FALTA' : 'OFF'),
            detail: configured
                ? 'credenciales configuradas'
                : (required ? 'definir E2E_USER/ PASS' : 'opcional, tests se saltean'),
        });
        if (required && !configured) {
            failures.push(`rol ${role} sin credenciales`);
        }
    }

    const gates = countEnvGates();
    rows.push({
        item: 'RENAPER',
        status: renaperEnabled ? 'OK' : 'OFF',
        detail: renaperEnabled
            ? 'servicio habilitado'
            : `${gates.renaper} tests env-gated (@env:renaper)`,
    });

    const pinConfigured = process.env.E2E_PIN_REQUIRED === '1' && hasCredentials('pin');
    rows.push({
        item: 'PIN',
        status: pinConfigured ? 'OK' : 'OFF',
        detail: pinConfigured
            ? `usuario PIN configurado (${gates.pin} test)`
            : `${gates.pin} test env-gated (@env:pin)`,
    });

    const orgsConfigured = !!testData.organizationPublicName && !!testData.organizationPrivateName;
    rows.push({
        item: 'Organizaciones',
        status: orgsConfigured ? 'OK' : (testData.organizationPublicName || testData.organizationPrivateName ? 'PARCIAL' : 'OFF'),
        detail: orgsConfigured
            ? 'pública y privada configuradas'
            : `${gates.org} tests env-gated (@env:org)`,
    });

    rows.push({
        item: 'PIN profesional',
        status: process.env.E2E_PROFESSIONAL_PIN ? 'OK' : 'OFF',
        detail: process.env.E2E_PROFESSIONAL_PIN
            ? 'configurado (sólo aplica si el usuario tiene PIN activo)'
            : 'no configurado',
    });

    printTable(rows);
    process.stdout.write(
        `[E2E] Tests env-gated: renaper=${gates.renaper}, pin=${gates.pin}, org=${gates.org}\n`,
    );

    if (process.env.E2E_STRICT_ENV === '1' && failures.length) {
        throw new Error(`[E2E] Preflight estricto falló: ${failures.join('; ')}`);
    }
}
