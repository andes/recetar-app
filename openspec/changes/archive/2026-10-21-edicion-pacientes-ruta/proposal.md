# Proposal

## Why

La edición de pacientes ya está implementada como formulario con tabs, pero hoy vive embebida en el listado y no puede alcanzarse: el formulario nuevo y el legacy comparten el selector `app-patient-form`, por lo que Angular no resuelve el componente al abrir la edición. Además, una edición inline no permite deep-link, refresh ni conservar el contexto de búsqueda de forma robusta.

## What Changes

- Renombrar el formulario de pacientes de la feature a `PatientEditFormComponent`, selector `app-patient-edit-form` y carpeta `patient-edit-form/`, eliminando la colisión con el `app-patient-form` legacy.
- Agregar la ruta `/pacientes/nuevo` para el alta de paciente.
- Agregar la ruta `/pacientes/:id/editar` para la edición de paciente.
- Proteger ambas rutas con los mismos guards que `/pacientes` (`AuthGuard` + `PatientManagerGuard`).
- Crear una página `PatientEditPageComponent` que cargue el paciente por `id` (deep-link/refresh) o inicialice el modo alta, y contenga el formulario.
- Hacer que las acciones “Nuevo paciente”, “Editar” del listado y “Editar” del drawer naveguen a las nuevas rutas.
- Quitar del listado (`PatientsHomeComponent`) el estado y el template de edición inline.
- Conservar la búsqueda del listado mediante query params (`q`, `estado`, `sexo`, `email`, `telefono`) al ir y volver de la edición.
- Agregar un `CanDeactivate` para que el botón atrás del navegador también pida confirmación cuando hay cambios sin guardar.
- Extraer las tabs del “Paso 2: Documento” de Nueva prescripción a un componente compartido `ui-tabs` y usarlo también en la edición de pacientes.
- Reordenar el formulario de paciente: DNI, Sexo y acción Validar arriba; debajo las tabs, con “Datos básicos” activa por defecto.
- Renombrar “Género” a “Género autopercibido”, ubicarlo junto a “Nombre autopercibido” y usar el catálogo canónico de género (`mujer`, `mujer trans`, `varon`, `varon trans`, `no binario`, `travesti`, `masculinidad trans`).
- Permitir validar contra RENAPER desde la edición (paciente existente) y desde el alta (precarga de datos).
- Corregir el API para que el género autopercibido no sea sobrescrito por el sexo al crear, actualizar o validar.
- Quitar el botón Volver del header de la edición; la salida queda en Cancelar y en el back del navegador con confirmación.
- **BREAKING** para el spec `patient-management`: la edición deja de reemplazar búsqueda y listado en la misma pantalla y pasa a rutas propias; además cambia el orden del formulario, el catálogo de género y la validación.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `patient-management`: cambia el acceso a las rutas de edición, la navegación desde listado/drawer, la experiencia de edición (rutas, deep-link, búsqueda conservada, confirmación al salir, tabs compartidas, validación desde el formulario y género autopercibido) y la experiencia mobile.
- `patient-management` (contrato API): el género autopercibido deja de ser sobrescrito por el sexo al crear, actualizar o validar.

## Impact

- **recetar-app**: `features/patients/` (formulario renombrado, página de edición nueva, routing, módulo, listado), `shared/ui/` (`ui-tabs`), `prescription/create` (migración de tabs), `docs/features-migration-tracker.md`, tests de navegación, edición y tabs.
- **recetar-api**: `modules/patients/patients.service.ts`, `integrations/andes/andes.mapper.ts`, `andes.types.ts` y tests del módulo de pacientes para preservar el género autopercibido.
- **Specs**: delta en `openspec/specs/patient-management/spec.md`; sin cambios en `session-and-access` porque la protección general de rutas ya existe.
- **Backend/ANDES**: se reutilizan `GET /patients/:id`, `PATCH /patients/:id`, `POST /patients` y `POST /patients/validate`; se corrige el payload de género enviado a ANDES.
- **Legacy**: el `app-patient-form` compartido que usan professionals no se modifica.
