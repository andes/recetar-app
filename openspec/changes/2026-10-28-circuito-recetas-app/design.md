# Design

## Context

- La app crea la receta vía `POST /prescriptions` y descarta la respuesta (`PrescriptionsService.newPrescription` con `mapTo(true)`).
- `Prescriptions`/`PrescriptionsAdapter` no incluían `ambito`, `estadoPublicacion`, `ordenTratamiento` ni estados ampliados.
- El circuito nuevo crea un documento por insumo (y uno por mes en tratamiento prolongado), por lo que una "receta" de la UI con N medicamentos produce N documentos.
- La API expone `estadoPublicacion` (`ok` | `pendiente` | `error` | `no_aplicable` | `desconocido`) y oculta los identificadores de integración.
- Magistrales y pacientes sin DNI no se publican; solo pueden prescribirse en organizaciones públicas.

## Goals / Non-Goals

**Goals:**

- Mantener a Praxis invisible: la app solo usa `estadoPublicacion`.
- Adaptar listado/detalle al modelo por insumo/mes y a los estados vigentes.
- Avisar y bloquear la dispensa privada de recetas no publicadas.
- Aplicar las reglas de ámbito (magistral / sin DNI).

**Non-Goals:**

- Consumir el PDF de Praxis ni reformatear PDFs (follow-up).
- Modelar `tipoPrescripcion = G`.

## Decisions

- **Estado neutral**: `shared/utils/publication.util.ts` centraliza `needsPublicationWarning` y `isDispenseBlockedByPublication`. Aviso para `pendiente`, `error` y `no_aplicable`; `desconocido` mantiene el comportamiento histórico (sin aviso ni bloqueo).
- **Bloqueo de dispensa**: en ámbito privado, deshabilitar Dispensar y avisar. En ámbito público no se bloquea.
- **Reglas de ámbito**: en la creación, si hay magistral o el paciente no tiene DNI, solo organizaciones públicas; se muestra un cartel y se bloquea la finalización. El backend responde 422 como respaldo.
- **Agrupado por tratamiento**: ordenar por `treatmentGroupId`/`ordenTratamiento` y mostrar chip de tratamiento; no se colapsan filas (una entrada por insumo/mes).
- **Notificación neutra**: éxito/error sin nombrar servicios externos.

## Risks / Trade-offs

- [Modelo por insumo cambia la cantidad de ítems] → agrupar por tratamiento y por insumo para no confundir.
- [Recetas antiguas con múltiples `supplies`] → el adapter tolera ambos shapes.
- [La impresión local no coincide con Praxis] → follow-up de formato.

## Open Questions

- ¿Se unifica el agrupado por insumo en todas las superficies (dispensing/auditoría) en esta tarea o en follow-ups?
