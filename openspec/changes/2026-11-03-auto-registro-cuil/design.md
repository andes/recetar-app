# Design

## Context

- El login ya vive en `features/auth/pages/login` y usa `app-canvas` + `app-form-field`.
- El auto-registro sigue en componentes legacy con Material forms.
- El backend ahora acepta el CUIL del formulario cuando ANDES no lo trae y lo exige para emitir.

## Goals / Non-Goals

**Goals:**

- Unificar el auto-registro con la UI nueva y el manejo de errores (`NotificationService`).
- Permitir informar/editar el CUIL del profesional.
- Mantener las rutas `/auth/new-user` y `/auth/new-user-pharmacist`.

**Non-Goals:**

- Rehacer la creación de usuarios desde auditoría.
- Cambiar el flujo de login/recuperación.
- Editar el CUIL de farmacias desde el panel de cuenta.

## Decisions

- **Rutas**: se conservan `/auth/new-user` y `/auth/new-user-pharmacist`; solo cambian los componentes cargados.
- **Formularios**: `app-form-field` (inputs nativos) y `ui-card`/`ui-alert`; sin `mat-form-field` ni `MatSnackBar`.
- **CUIL profesional**: editable; se autocompleta desde `GET /auth/professionals-andes` cuando ANDES trae `cuit`; si no, se muestra un aviso y se exige completarlo.
- **Validación**: `cuilValidator` (11 dígitos + verificador) en alta y en el panel de cuenta.
- **Payload**: funciones `toRegisterProfessionalPayload`/`toRegisterPharmacistPayload` en `models/dto`.
- **Autogestión**: el panel de cuenta envía `cuil` a `PATCH /users/me` solo para profesionales.

## Risks / Trade-offs

- [Profesionales existentes sin CUIL] → lo completan desde el perfil.
- [ANDES no responde al buscar el DNI] → el CUIL queda manual; el alta se valida igual contra ANDES en la API.
- [Captcha] → se mantiene Turnstile con el mismo site key.
