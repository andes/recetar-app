import { certificate, url } from './api.key';

export const environment = {
    production: true,
    API_END_POINT: 'https://recetar.andes.gob.ar/api',
    ANDES_API: 'https://app.andes.gob.ar/api',
    CERTIFICATE_SECRET_KEY: certificate.produccion,
    FRONTEND_URL: url.produccion
};
