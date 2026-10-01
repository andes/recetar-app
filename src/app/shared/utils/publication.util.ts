import { Prescriptions } from '@interfaces/prescriptions';

export type EstadoPublicacion = NonNullable<Prescriptions['estadoPublicacion']>;

export const PUBLICATION_WARNING =
    'Pendiente de publicación electrónica. Solo puede dispensarse en el ámbito público desde RecetAr.';

// Estados en los que la receta NO está publicada y debe avisarse / bloquearse en privado.
export function needsPublicationWarning(estado?: EstadoPublicacion): boolean {
    return estado === 'pendiente' || estado === 'error' || estado === 'no_aplicable';
}

// 'desconocido' mantiene el comportamiento histórico (no avisa ni bloquea).
export function isDispenseBlockedByPublication(
    estado: EstadoPublicacion | undefined,
    ambito: 'publico' | 'privado' | null,
): boolean {
    if (ambito !== 'privado') {
        return false;
    }
    return needsPublicationWarning(estado);
}
