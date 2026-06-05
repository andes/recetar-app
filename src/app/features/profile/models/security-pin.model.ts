export interface SetupSecurityPinRequest {
    currentPassword: string;
    pin: string;
}

export interface VerifySecurityPinRequest {
    pin: string;
}

export interface ChangeSecurityPinRequest {
    currentPin: string;
    newPin: string;
}

export interface DisableSecurityPinRequest {
    password: string;
}

export interface SecurityPinStatusResponse {
    isActive: boolean;
}

export interface PendingPrescription {
    payload: unknown;
    savedAt: string;
    attemptCount: number;
}
