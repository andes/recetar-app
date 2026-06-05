import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from, of } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';
import { environment } from '@root/environments/environment';
import {
    WebAuthnCredential,
    PublicKeyCredentialCreationOptionsJSON,
    PublicKeyCredentialRequestOptionsJSON,
    AuthenticatorAttestationResponseJSON,
    AuthenticatorAssertionResponseJSON,
    RegisterCredentialResponse,
    AuthenticateResponse
} from '../models/webauthn.model';

@Injectable({
    providedIn: 'root'
})
export class WebAuthnService {
    private readonly apiEndPoint = environment.API_END_POINT;

    constructor(private http: HttpClient) { }

    isSupported(): boolean {
        return window.PublicKeyCredential !== undefined &&
            typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function';
    }

    isPlatformAuthenticatorAvailable(): Observable<boolean> {
        if (!this.isSupported()) {
            return of(false);
        }

        return from(window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()).pipe(
            catchError(() => of(false))
        );
    }

    hasCredentials(): Observable<boolean> {
        return this.getCredentials().pipe(
            map(credentials => credentials.length > 0),
            catchError(() => of(false))
        );
    }

    getCredentials(): Observable<WebAuthnCredential[]> {
        return this.http.get<WebAuthnCredential[]>(
            `${this.apiEndPoint}/users/me/webauthn/credentials`
        );
    }

    registerCredential(name?: string): Observable<RegisterCredentialResponse> {
        return this.http.post<PublicKeyCredentialCreationOptionsJSON>(
            `${this.apiEndPoint}/users/me/webauthn/register/options`,
            { name }
        ).pipe(
            switchMap(options => {
                const convertedOptions = this.convertCreationOptions(options);
                return from(navigator.credentials.create({ publicKey: convertedOptions })).pipe(
                    switchMap(credential => {
                        if (!credential) {
                            throw new Error('No se pudo crear la credencial');
                        }
                        const attestationResponse = this.convertAttestationResponse(credential as PublicKeyCredential);
                        return this.http.post<RegisterCredentialResponse>(
                            `${this.apiEndPoint}/users/me/webauthn/register/verify`,
                            attestationResponse
                        );
                    })
                );
            })
        );
    }

    authenticate(): Observable<AuthenticateResponse> {
        return this.http.post<PublicKeyCredentialRequestOptionsJSON>(
            `${this.apiEndPoint}/users/me/webauthn/authenticate/options`,
            {}
        ).pipe(
            switchMap(options => {
                const convertedOptions = this.convertAssertionOptions(options);
                return from(navigator.credentials.get({ publicKey: convertedOptions })).pipe(
                    switchMap(credential => {
                        if (!credential) {
                            throw new Error('No se pudo autenticar');
                        }
                        const assertionResponse = this.convertAssertionResponse(credential as PublicKeyCredential);
                        return this.http.post<AuthenticateResponse>(
                            `${this.apiEndPoint}/users/me/webauthn/authenticate/verify`,
                            assertionResponse
                        );
                    })
                );
            })
        );
    }

    deleteCredential(credentialId: string): Observable<void> {
        return this.http.delete<void>(
            `${this.apiEndPoint}/users/me/webauthn/credentials/${credentialId}`
        );
    }

    private convertCreationOptions(options: PublicKeyCredentialCreationOptionsJSON): PublicKeyCredentialCreationOptions {
        return {
            rp: options.rp,
            user: {
                ...options.user,
                id: this.base64URLToBuffer(options.user.id)
            },
            challenge: this.base64URLToBuffer(options.challenge),
            pubKeyCredParams: options.pubKeyCredParams.map(param => ({
                type: 'public-key' as const,
                alg: param.alg
            })),
            timeout: options.timeout,
            excludeCredentials: options.excludeCredentials?.map(cred => ({
                id: this.base64URLToBuffer(cred.id),
                type: 'public-key' as const,
                transports: cred.transports as AuthenticatorTransport[]
            })),
            authenticatorSelection: options.authenticatorSelection as AuthenticatorSelectionCriteria,
            attestation: options.attestation as AttestationConveyancePreference
        };
    }

    private convertAssertionOptions(options: PublicKeyCredentialRequestOptionsJSON): PublicKeyCredentialRequestOptions {
        return {
            challenge: this.base64URLToBuffer(options.challenge),
            timeout: options.timeout,
            rpId: options.rpId,
            allowCredentials: options.allowCredentials?.map(cred => ({
                id: this.base64URLToBuffer(cred.id),
                type: 'public-key' as const,
                transports: cred.transports as AuthenticatorTransport[]
            })),
            userVerification: options.userVerification as UserVerificationRequirement
        };
    }

    private convertAttestationResponse(credential: PublicKeyCredential): AuthenticatorAttestationResponseJSON {
        const response = credential.response as AuthenticatorAttestationResponse;
        return {
            id: credential.id,
            rawId: this.bufferToBase64URL(credential.rawId),
            type: credential.type,
            response: {
                clientDataJSON: this.bufferToBase64URL(response.clientDataJSON),
                attestationObject: this.bufferToBase64URL(response.attestationObject),
                transports: response.getTransports ? response.getTransports() : []
            },
            authenticatorAttachment: credential.authenticatorAttachment
        };
    }

    private convertAssertionResponse(credential: PublicKeyCredential): AuthenticatorAssertionResponseJSON {
        const response = credential.response as AuthenticatorAssertionResponse;
        return {
            id: credential.id,
            rawId: this.bufferToBase64URL(credential.rawId),
            type: credential.type,
            response: {
                clientDataJSON: this.bufferToBase64URL(response.clientDataJSON),
                authenticatorData: this.bufferToBase64URL(response.authenticatorData),
                signature: this.bufferToBase64URL(response.signature),
                userHandle: response.userHandle ? this.bufferToBase64URL(response.userHandle) : undefined
            },
            authenticatorAttachment: credential.authenticatorAttachment
        };
    }

    private base64URLToBuffer(base64url: string): ArrayBuffer {
        const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
        const padding = '='.repeat((4 - base64.length % 4) % 4);
        const base64Padded = base64 + padding;

        const binary = atob(base64Padded);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes.buffer;
    }

    private bufferToBase64URL(buffer: ArrayBuffer): string {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        const base64 = btoa(binary);
        return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    }
}
