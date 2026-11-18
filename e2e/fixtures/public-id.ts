import * as CryptoJS from 'crypto-js';
import { certificate } from '../../src/environments/api.key';

const secretKey = process.env.E2E_CERTIFICATE_SECRET_KEY || certificate.local;

// certificates.service.encryptId: AES OpenSSL + base64 URL-safe.
export function encryptCertificatePublicId(id: string): string {
    if (!id || !id.trim()) {
        throw new Error('El ID a cifrar no puede estar vacío');
    }

    const encrypted = CryptoJS.AES.encrypt(id.trim(), secretKey).toString();
    return encrypted
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}

export function decryptCertificatePublicId(encryptedId: string): string {
    if (!encryptedId || !encryptedId.trim()) {
        throw new Error('El ID cifrado no puede estar vacío');
    }

    const clean = decodeURIComponent(encryptedId.trim());
    const base64 = clean.replace(/-/g, '+').replace(/_/g, '/')
        + '==='.slice(0, (4 - clean.length % 4) % 4);
    const decrypted = CryptoJS.AES.decrypt(base64, secretKey).toString(CryptoJS.enc.Utf8);

    if (!decrypted || !decrypted.trim()) {
        throw new Error('No se pudo descifrar el ID');
    }

    return decrypted;
}

// practices.service.encryptId: IV aleatorio + AES-CBC, combinado en hex y base64.
export function encryptPracticePublicId(id: string): string {
    if (!id || !id.trim()) {
        throw new Error('El ID a cifrar no puede estar vacío');
    }

    const iv = CryptoJS.lib.WordArray.random(16);
    const encrypted = CryptoJS.AES.encrypt(id.trim(), secretKey, {
        iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
    });
    const combined = iv.toString() + encrypted.toString();
    return CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(combined));
}

export function decryptPracticePublicId(encryptedId: string): string {
    const encryptedData = atob(decodeURIComponent(encryptedId));
    const iv = CryptoJS.enc.Hex.parse(encryptedData.substring(0, 32));
    const encrypted = encryptedData.substring(32);
    const decrypted = CryptoJS.AES.decrypt(encrypted, secretKey, {
        iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
    });
    const result = decrypted.toString(CryptoJS.enc.Utf8);

    if (!result || !result.trim()) {
        throw new Error('No se pudo descifrar el ID de práctica');
    }

    return result;
}
