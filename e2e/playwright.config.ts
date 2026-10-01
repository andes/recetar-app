import fs from 'node:fs';
import path from 'node:path';
import { defineConfig, devices } from '@playwright/test';

function loadEnvFile(filePath: string): void {
    if (!fs.existsSync(filePath)) {
        return;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    for (const rawLine of content.split(/\r?\n/)) {
        const line = rawLine.trim();
        if (!line || line.startsWith('#')) {
            continue;
        }

        const separator = line.indexOf('=');
        if (separator <= 0) {
            continue;
        }

        const key = line.slice(0, separator).trim();
        const value = line.slice(separator + 1).trim().replace(/^['"]|['"]$/g, '');
        if (key && process.env[key] === undefined) {
            process.env[key] = value;
        }
    }
}

loadEnvFile(path.resolve(process.cwd(), '.env.e2e'));

const baseURL = process.env.E2E_BASE_URL || 'http://localhost:4200';
const apiURL = process.env.E2E_API_URL || 'http://localhost:4000/api';
const startApp = process.env.E2E_START_APP === '1';

export default defineConfig({
    testDir: './specs',
    outputDir: './test-results',
    timeout: 90_000,
    expect: {
        timeout: 15_000
    },
    fullyParallel: false,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 1 : 0,
    // La suite comparte paciente/organizaciones y crea datos; correr en serie evita carreras.
    workers: 1,
    reporter: [
        ['list'],
        ['html', { outputFolder: './playwright-report', open: 'never' }],
        ...(process.env.CI
            ? [['junit', { outputFile: './test-results/junit.xml' }] as const]
            : [])
    ],
    use: {
        baseURL,
        locale: 'es-AR',
        timezoneId: 'America/Argentina/Buenos_Aires',
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure'
    },
    projects: [
        {
            name: 'setup',
            testMatch: /setup[\\/]auth\.setup\.ts/
        },
        {
            name: 'chromium',
            testIgnore: /setup[\\/]/,
            use: {
                ...devices['Desktop Chrome']
            },
            dependencies: ['setup']
        }
    ],
    metadata: {
        apiURL,
        baseURL
    },
    webServer: startApp
        ? [
              {
                  command: 'npx ng serve --port 4200',
                  url: baseURL,
                  reuseExistingServer: true,
                  timeout: 180_000,
                  stdout: 'pipe',
                  stderr: 'pipe'
              }
          ]
        : undefined
});
