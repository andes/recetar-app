# Design

## Context

Ver `proposal.md - Why`. El estado actual relevante:

- `PatientsHomeComponent` maneja la edición inline con `mode`, `formPatient` y `isCreate`, y proyecta la vista de edición dentro de `ui-drawer`.
- `PatientFormComponent` de la feature ya tiene tabs, validaciones, guardado y confirmación de salida, pero comparte el selector `app-patient-form` con el formulario legacy de `shared/components/patient-form` que usa professionals. Ambos quedan en scope en `PatientsModule`, lo que impide resolver el componente al abrir la edición.
- El listado conserva búsqueda y filtros solo en memoria.
- `PatientsService.getPatientById(id)` traga errores y emite `undefined` en vez de fallar, por lo que la página de edición debe tratar ese caso.
- La app ya tiene patrones de rutas por feature, `CanvasComponent`, `AuthGuard` y `PatientManagerGuard`.

## Goals / Non-Goals

**Goals:**

- Edición y alta navegables, con URL propia y soporte de deep-link/refresh.
- Eliminar la colisión de selectores y la edición inline.
- Conservar búsqueda y filtros del listado entre listado y edición.
- Confirmar cambios sin guardar también en el back del navegador.
- Mantener intacto el formulario legacy de professionals.

**Non-Goals:**

- No rediseñar el listado ni el drawer de detalle.
- No persistir página/scroll del listado; solo término y filtros.
- No migrar el formulario legacy de professionals a `shared/ui`.
- No migrar automáticamente datos legacy de género; se preservan como opción adicional.

## Decisions

### 1. Rutas planas dentro de `PatientsRoutingModule`

```text
/pacientes                → PatientsHomeComponent
/pacientes/nuevo          → PatientEditPageComponent (alta)
/pacientes/:id/editar     → PatientEditPageComponent (edición)
```

Todas con `canActivate: [AuthGuard, PatientManagerGuard]`. La ruta `nuevo` se declara antes de `:id/editar` para mantener el orden explícito, aunque los patrones no colisionan. Alternativa descartada: una única ruta con query param `mode`, porque pierde claridad y deep-linking.

### 2. Renombrar todo el formulario nuevo

- Carpeta `components/patient-form/` → `components/patient-edit-form/`.
- Archivos `patient-form.component.*` → `patient-edit-form.component.*`.
- Clase `PatientFormComponent` → `PatientEditFormComponent`.
- Selector `app-patient-form` → `app-patient-edit-form`.

Se mantiene el selector legacy `app-patient-form` para professionals. Alternativa descartada: quitar `SharedModule` de `PatientsModule`, porque arrastra otras dependencias compartidas y no elimina el riesgo de colisión a futuro.

### 3. Nueva página `PatientEditPageComponent`

Componente module-declared (`standalone: false`), declarado vía `routingComponents`, que usa `app-canvas` con:

- `pageTitle` dinámico: “Nuevo paciente” / “Editar paciente”.
- Sin botón Volver en el header; la salida manual es Cancelar y el back del navegador pasa por `CanDeactivate`.
- Un wrapper estático para el contenido y `@if` adentro, evitando los problemas de proyección de control flow dentro de `app-canvas`/`ui-drawer`.
- Estados: loading, error de carga y formulario.

La página orquesta la navegación; el formulario sigue encapsulando validación, guardado y confirmación de salida.

### 4. Carga de edición por `id`

`id` = `idMPI || _id`. Si el paciente no tiene identificador, el listado no navega y muestra un snackbar.

La página llama `getPatientById(id)` y:

- Muestra spinner mientras carga.
- Si recibe `undefined` (el service actual traga el error) o falla, muestra error y acción “Volver al listado”.
- Si no hay `:id`, entra en modo alta sin fetch.

Alternativa descartada: pasar el paciente por `router.state`, porque no soporta refresh ni deep-link.

### 5. Búsqueda por query params

El listado usa `q`, `estado`, `sexo`, `email`, `telefono` como fuente de estado de búsqueda:

- En `ngOnInit` inicializa los `FormControl` desde `queryParamMap` y dispara la búsqueda.
- Al buscar/filtrar sincroniza la URL con `router.navigate([], { relativeTo, queryParams, replaceUrl: true })`, para no llenar el historial.
- Al navegar a alta/edición pasa `route.snapshot.queryParams`.
- La página de edición guarda esos params y vuelve a `/pacientes` con ellos al guardar, cancelar o volver.

Alternativa descartada: servicio de estado en memoria, porque se pierde al refrescar y no es compartible por URL.

### 6. `CanDeactivate` para el back del navegador

Se agrega un guard `PatientEditCanDeactivateGuard` que consulta la página y esta delega en el formulario.

El formulario expone una operación única de confirmación (por ejemplo `confirmDiscard(): Observable<boolean>`), reutilizada por:

- Volver atrás.
- Cancelar.
- `CanDeactivate`.

Así se evita duplicar el diálogo o pedir confirmación dos veces. Si el formulario no tiene cambios, la salida es inmediata.

### 7. Listado sin estado de edición

`PatientsHomeComponent` pierde `mode`, `formPatient`, `isCreate`, `@ViewChild`, `onSaved`, `onCancelled`, `onFormBack` y todo el template de edición. Sus acciones pasan a ser navegación:

- “Nuevo paciente” → `/pacientes/nuevo`.
- Editar (item o drawer) → `/pacientes/:id/editar`.
- El drawer de detalle se mantiene para lectura.

### 8. Manejo de errores

- Carga de edición: estado de error visible + volver.
- Guardado: el formulario mantiene el manejo actual y muestra el error inline; la página no navega si falla.
- Identificador ausente: snackbar en el listado, sin navegación.

### 9. `ui-tabs` compartido

Se extrae el patrón visual de `.type-cards` de `document-tabs` a `shared/ui/tabs.component.ts`:

- `UiTabItem`: `value`, `label`, `icon?`, `count?`, `error?`, `disabled?`.
- Inputs `items` y `value`; output `valueChange`.
- Renderiza icono, label, contador opcional con `ui-badge-chip`, error opcional y subrayado activo.
- Sólo aporta la barra de tabs; cada consumidor decide el panel.
- Se usa en `document-tabs` y en `PatientEditFormComponent`.
- Se eliminan los estilos duplicados de `document-tabs.component.sass`.

Los labels usan utilidades tipográficas globales y los colores/tokens del design system.

### 10. Nuevo orden y validación del formulario

Dentro de `PatientEditFormComponent`:

1. Bloque superior: DNI, Sexo, chip de estado y botón Validar / Volver a validar.
2. Tabs (`ui-tabs`), por defecto “Datos básicos”.
3. Panel “Datos básicos”: Nombre, Apellido, Nombre autopercibido, Género autopercibido, CUIL y Fecha de nacimiento.
4. Panel “Contacto”: igual que hoy.
5. Acciones: Cancelar y Guardar.

La validación se mueve también al formulario:

- Edición con ID: `validatePatientById(id)`.
- Alta: `validatePatient(dni, sexo)` para RENAPER y precarga.
- Al validar: patch del form, `markAsDirty()`, chip actualizado y DNI bloqueado si queda validado.
- El botón se deshabilita sin DNI/Sexo o mientras valida.
- Se mantiene la validación del drawer.

### 11. Género autopercibido y contrato del API

El catálogo canónico es: `mujer`, `mujer trans`, `varon`, `varon trans`, `no binario`, `travesti`, `masculinidad trans`.

- El frontend usa esos valores exactos y agrega dinámicamente un valor legacy si el paciente trae uno fuera del catálogo.
- El API deja de pisar `genero` con `sex` al actualizar y validar.
- Al crear con DNI, el API envía `dto.genero` a ANDES; si no viene, usa el sexo como fallback.
- `toAndesValidatedPatient` y `toAndesPatient` usan el género provisto cuando existe.
- Se normaliza a minúscula y `trim` en la frontera del API.
- `validateById` preserva el género actual salvo que la validación devuelva uno explícito.

## Risks / Trade-offs

- [`getPatientById` emite `undefined` en error] → La página trata `undefined` como error de carga; no se cambia el contrato del service para no afectar otros consumidores.
- [El back del navegador puede disparar dos confirmaciones] → Centralizar la confirmación en `confirmDiscard()` y usarla tanto en la salida manual como en `CanDeactivate`.
- [Sincronizar query params en cada búsqueda puede llenar el historial] → Usar `replaceUrl: true`.
- [Al volver se pierde la página cargada y el scroll] → Aceptado; el spec solo exige conservar término y filtros.
- [Pacientes sin `idMPI`/`_id`] → No se permite editar y se informa; no se inventa una ruta alternativa por DNI.
- [El legacy y el nuevo formulario conviven] → Renombre completo del nuevo selector; test que verifique que no queda duplicado en `PatientsModule`.
- [Valores legacy de género fuera del catálogo] → Se agregan como opción dinámica; no se migran ni se descartan.
- [El API ahora preserva género independiente del sexo] → Tests de create/update/validate para evitar regresiones.
- [Doble validación desde form y drawer] → Ambas usan los mismos endpoints y refrescan datos; no hay estado compartido conflictivo.

## Migration Plan

- No hay migración de datos.
- Deploy coordinado de `recetar-app` y `recetar-api`: el frontend necesita que el API deje de sobrescribir `genero`.
- Rollback: revertir ambos cambios; el frontend vuelve a las tabs de Material y el API a su comportamiento anterior.

## Open Questions

Ninguna pendiente que afecte el alcance o los specs.
