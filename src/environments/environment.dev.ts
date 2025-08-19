import { certificate, url } from './api.key';

export const environment = {
    production: false,
    API_END_POINT: 'https://recetardemo.andes.gob.ar/api',
    ANDES_API: 'https://app.andes.gob.ar/api',
    CERTIFICATE_SECRET_KEY: certificate.demo,
    FRONTEND_URL: url.demo
};
