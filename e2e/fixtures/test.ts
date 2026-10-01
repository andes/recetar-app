import { test as base } from '@playwright/test';
import { ApiClient } from './api-client';

interface Fixtures {
    api: ApiClient;
}

export const test = base.extend<Fixtures>({
    api: async ({ request }, use) => {
        const api = new ApiClient(request);
        try {
            await use(api);
        } finally {
            await api.cleanup();
        }
    }
});

export { expect } from '@playwright/test';
