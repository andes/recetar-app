# Proposal

## Why

Las pantallas legadas de auto-registro (`new-user`, `new-user-pharmacist`) usan `mat-form-field`/`mat-select`/`mat-datepicker` y no siguen la UI nueva. Además, el CUIL del profesional se deshabilita, por lo que los profesionales sin `cuit` en ANDES no pueden informarlo y luego no pueden emitir documentos.

## What Changes

- Rehacer el auto-registro en la UI nueva: `features/auth/pages/register-professional` y `register-pharmacist` con `app-canvas`, `app-form-field`, `ui-card`, `ui-alert`, `NotificationService` y fecha nativa.
- Hacer el CUIL del profesional editable y con autocompletado desde ANDES; si ANDES no trae `cuit`, completarlo manualmente (11 dígitos + verificador).
- Permitir editar el CUIL desde el panel de cuenta (autogestión) para profesionales existentes.
- Eliminar los componentes legados `auth/components/new-user*` y actualizar el tracker.

## Impact

- Specs: `registration`.
- Código: `features/auth/pages`, `profile`, `models/dto`, `services/users`, `auth/auth-routing.module.ts`.
