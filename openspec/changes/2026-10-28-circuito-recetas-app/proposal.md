# Proposal

## Why

La API pasó a ser la fuente de recetas con un nuevo modelo (un documento por insumo y por mes en tratamiento prolongado, estados ampliados) e integra la prescripción electrónica de forma interna. La app debe adaptarse a ese contrato y modelo, reflejar la suspensión/anulación de recetas y **avisar** cuando una receta no se publicó electrónicamente, además de aplicar las reglas de ámbito (magistrales y pacientes sin DNI solo en público). Praxis no se conoce en la app: la API expone un estado neutral `estadoPublicacion`.

## What Changes

- Adaptar el adapter de `Prescriptions` al nuevo contrato, incluyendo `estadoPublicacion` y sin exponer identificadores de integración.
- Emisión por ámbito con notificación neutra: "receta creada" (201) / "error al crear" (fallo).
- Nueva acción "Suspender/Anular" para recetas locales suspendibles; "Eliminar" solo para recetas Pendiente no emitidas.
- Reflejar el nuevo modelo en listado y detalle (una entrada por insumo/mes, agrupada por tratamiento).
- Mostrar un **aviso** en el detalle y en el ítem de dispensa cuando `estadoPublicacion` no sea `ok` (salvo `desconocido`).
- **Bloquear** la dispensa en ámbito privado de recetas no publicadas.
- Magistrales y pacientes sin DNI: solo organizaciones públicas (cartel + bloqueo de finalización).
- Impresión local sin cambios (el reformato de PDF es un follow-up).

## Capabilities

### New Capabilities

### Modified Capabilities

- `documents`: suspensión/anulación, modelo por insumo/mes y aviso de publicación electrónica.
- `dispensing`: bloqueo de dispensa en privado para recetas no publicadas.
- `prescription-authoring`: resultado neutro de creación y reglas de ámbito (magistral / sin DNI).

## Impact

- **recetar-app**: `interfaces/prescriptions.ts`, `shared/utils/publication.util.ts`, `features/documents`, `features/prescription/create`, `features/pharmacists`.
- **recetar-api**: endpoints neutrales y `estadoPublicacion` (change `2026-10-28-anulacion-pdf-praxis`).
- Superficies de lista afectadas por el modelo por insumo/mes: `documents`, `dispensing`, listado legacy de profesionales y auditoría.
