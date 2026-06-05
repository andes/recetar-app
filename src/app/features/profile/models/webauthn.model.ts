export interface WebAuthnCredential {
    id: string;
    deviceType: string;
    backedUp: boolean;
    transport: string[];
    createdAt: string;
    lastUsedAt?: string;
}

export interface RegisterCredentialRequest {
    name?: string;
}

export interface RegisterCredentialResponse {
    credential: WebAuthnCredential;
}

export interface AuthenticateResponse {
    securityToken: string;
}

export interface PublicKeyCredentialCreationOptionsJSON {
    rp: {
        name: string;
        id: string;
    };
    user: {
        id: string;
        name: string;
        displayName: string;
    };
    challenge: string;
    pubKeyCredParams: Array<{
        type: string;
        alg: number;
    }>;
    timeout?: number;
    excludeCredentials?: Array<{
        id: string;
        type: string;
        transports?: string[];
    }>;
    authenticatorSelection?: {
        authenticatorAttachment?: string;
        requireResidentKey?: boolean;
        residentKey?: string;
        userVerification?: string;
    };
    attestation?: string;
}

export interface PublicKeyCredentialRequestOptionsJSON {
    challenge: string;
    timeout?: number;
    rpId?: string;
    allowCredentials?: Array<{
        id: string;
        type: string;
        transports?: string[];
    }>;
    userVerification?: string;
}

export interface AuthenticatorAttestationResponseJSON {
    id: string;
    rawId: string;
    type: string;
    response: {
        clientDataJSON: string;
        attestationObject: string;
        transports?: string[];
    };
    authenticatorAttachment?: string;
}

export interface AuthenticatorAssertionResponseJSON {
    id: string;
    rawId: string;
    type: string;
    response: {
        clientDataJSON: string;
        authenticatorData: string;
        signature: string;
        userHandle?: string;
    };
    authenticatorAttachment?: string;
}
