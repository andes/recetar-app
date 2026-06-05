import { certificate } from './api.key';

export const environment = {
    production: false,
    API_END_POINT: '/api',
    ANDES_API: 'https://app.andes.gob.ar/api',
    CERTIFICATE_SECRET_KEY: certificate.local,
    FRONTEND_URL: '',
};
