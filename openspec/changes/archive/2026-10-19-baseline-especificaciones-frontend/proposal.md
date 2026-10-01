# Proposal

## Why

El frontend `recetar-app` no tiene specs OpenSpec: el comportamiento actual solo se conoce leyendo el código y el tracker de migración. Eso dificulta revisar cambios, hacer onboarding y coordinar los contratos con `recetar-api`. Necesitamos una línea base explícita del comportamiento actual para que los próximos cambios se expresen como deltas sobre una fuente de verdad.

## What Changes

- Se crean specs baseline de siete capabilities del frontend: `session-and-access`, `prescription-authoring`, `dispensing`, `documents`, `audit`, `profile` y `public-documents`.
- Las specs describen el comportamiento observable **actual**, no el deseado. No se modifica código ni se corrigen bugs.
- Se documentan las inconsistencias detectadas como observaciones; se resolverán en changes posteriores.
- **Fuera de alcance**: flujos legacy (`/profesionales/recetas/nueva`, `/profesionales/productos`, `/profesionales/seleccionador-ambito` y `/farmacias/recetas/dispensar`) y cualquier refactor de código.

## Capabilities

### New Capabilities

- `session-and-access`: login, restauración y renovación de sesión, logout, recuperación y cambio de contraseña, registro y confirmación de usuarios, guards de autenticación/rol y navegación según rol.
- `prescription-authoring`: alta de recetas, certificados y prácticas; selección/edición de paciente; búsqueda de medicamentos comerciales y magistrales; detalle, límites y validaciones; organización/ámbito; historial reciente; borrador, finalización y PIN de seguridad.
- `dispensing`: listado y búsqueda de recetas locales y de ANDES, filtros, paginación, vista previa, dispensa, reemplazo de medicamento y deshacer dentro de las 2 horas.
- `documents`: historial y consulta de recetas, certificados, prácticas e insumos, con estadísticas, búsqueda, filtros, detalle e impresión.
- `audit`: auditoría de recetas por CUIT y gestión de usuarios (alta, edición, baja, roles y validaciones).
- `profile`: perfil según rol, datos de cuenta, contraseña, PIN de seguridad, biometría y organizaciones.
- `public-documents`: consulta pública de certificados y prácticas por identificador cifrado, estados, errores e impresión.

### Modified Capabilities

_(ninguna)_

## Impact

- **Documentación**: `openspec/specs/<capability>/spec.md` (al archivar el change). Sin impacto en código, build ni runtime.
- **Dependencias**: los contratos REST y de comportamiento del backend viven en `recetar-api`; las integraciones con ANDES no usan OpenSpec.
- **Verificación**: `openspec validate baseline-especificaciones-frontend --strict`, y al archivar `openspec validate --specs --strict`.

### Observaciones del estado actual (no se corrigen en este change)

- `AuthService.login` declara `{ username, password }`, pero el formulario de login envía `{ identifier, password }`; el tipado no coincide con el dato real.
- `RoleProfessionalGuard` evalúa las referencias de función `isProfessionalRole`/`isProfessionalPublicRole` sin invocarlas en su segunda condición, por lo que los usuarios auditores no son redirigidos desde rutas de profesional.
- Los guards de rol y `ResetPasswordComponent` redirigen a rutas legacy (`/profesionales/recetas/nueva`, `/farmacias/recetas/dispensar`) en lugar de las nuevas.
- `PatientsService.getPatientInsurance` llama directo a `https://app.andes.gob.ar/...` con la URL hardcodeada.
- `NewUserComponent` define un regex de contraseña que no aplica al control `password`.
- `NewUserPharmacistComponent` valida CUIL/matrícula/disposición/vencimiento contra el padrón, pero solo email, password y captcha son obligatorios en el formulario.
- El borrador de receta vive en memoria; solo se persiste el `pending_prescription` al finalizar, con expiración de 24 h y conteo de intentos.
- La búsqueda de dispensación usa `limit` por defecto 15, mientras el backend acota la búsqueda de recetas a 50 resultados.
- El diálogo de PIN intenta autenticación WebAuthn y, si funciona, cierra con el valor `'biometric'`, que se envía como `X-Security-Pin` al crear la receta en lugar de un PIN válido.
- No hay pantalla de enrolamiento o borrado de biometría en el perfil; WebAuthn solo se usa desde el diálogo de PIN al finalizar una receta.
- Las vistas públicas de certificado y práctica exponen métodos de impresión con `window.print()`, pero ningún control visible los invoca.
- La vista pública de práctica formatea fechas con locale `es-ES`, mientras la de certificado usa `es-AR`.
