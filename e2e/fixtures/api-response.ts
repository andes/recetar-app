export interface ApiSuccessEnvelope<T> {
    status: 'success';
    data: T;
}

export function unwrapApiResponse<T>(body: unknown): T {
    if (
        body &&
        typeof body === 'object' &&
        'status' in body &&
        (body as { status?: string }).status === 'success' &&
        'data' in body
    ) {
        return (body as ApiSuccessEnvelope<T>).data;
    }

    return body as T;
}
