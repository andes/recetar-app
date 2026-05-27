export interface Adapter<T> {
    adapt(item: unknown): T;
}

export function asRecord(value: unknown): Record<string, unknown> {
    return typeof value === 'object' && value !== null
        ? value as Record<string, unknown>
        : {};
}
