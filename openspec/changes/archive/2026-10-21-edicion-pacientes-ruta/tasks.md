# Tasks

## 1. Renombrar el formulario nuevo

- [x] 1.1 Renombrar la carpeta `components/patient-form/` a `components/patient-edit-form/` y los archivos a `patient-edit-form.component.*`; verificar que el proyecto compila con los nuevos paths.
- [x] 1.2 Renombrar la clase a `PatientEditFormComponent` y el selector a `app-patient-edit-form`; verificar con `grep` que el nuevo selector no se repite y que el legacy `app-patient-form` queda solo en `shared/components/patient-form`.
- [x] 1.3 Actualizar los imports de `PatientsModule` y cualquier referencia al formulario nuevo; verificar con `npm run build`.

## 2. Página de edición y rutas

- [x] 2.1 Crear `PatientEditPageComponent` en `pages/patient-edit/` con `app-canvas`, header dinámico y botón Volver en un wrapper estático `[pageActions]`; verificar que el componente compila.
- [x] 2.2 Agregar las rutas `/pacientes/nuevo` y `/pacientes/:id/editar` con `AuthGuard` y `PatientManagerGuard`, y sumar la página a `routingComponents`; verificar navegación manual a ambas rutas.
- [x] 2.3 Implementar la carga por `:id` con `getPatientById`, spinner, estado de error para `undefined`/fallo y modo alta sin `id`; verificar con deep-link, refresh y un ID inexistente.
- [x] 2.4 Renderizar `app-patient-edit-form` dentro de un wrapper estático, pasando `patient` y `mode`; verificar que el formulario aparece al entrar a la ruta de edición y de alta.
- [x] 2.5 Implementar `onSaved`, `onCancel` y `onBack` en la página, navegando a `/pacientes` con los query params de retorno; verificar que guardar/cancelar/volver regresan al listado.

## 3. Refactorizar el listado

- [x] 3.1 Quitar de `PatientsHomeComponent` el estado `mode`, `formPatient`, `isCreate`, `@ViewChild`, `onSaved`, `onCancelled`, `onFormBack` y el template de edición inline; verificar con `npm run build`.
- [x] 3.2 Hacer que “Nuevo paciente” navegue a `/pacientes/nuevo` y que Editar navegue a `/pacientes/:id/editar`, bloqueando con snackbar si falta `idMPI`/`_id`; verificar con tests de navegación.
- [x] 3.3 Conectar la acción Editar del drawer de detalle a la misma navegación; verificar que abre la ruta de edición.

## 4. Query params de búsqueda

- [x] 4.1 Inicializar término y filtros del listado desde `queryParamMap` y disparar la búsqueda al entrar; verificar recargando `/pacientes?q=...`.
- [x] 4.2 Sincronizar la URL al buscar o filtrar con `replaceUrl: true`; verificar que los query params se actualizan sin llenar el historial.
- [x] 4.3 Pasar los query params actuales al navegar a alta/edición y restaurarlos al volver; verificar el ida y vuelta listado → edición → listado.

## 5. Confirmación al salir

- [x] 5.1 Extraer en `PatientEditFormComponent` una confirmación reutilizable de descarte y usarla en Volver y Cancelar; verificar que el diálogo aparece solo con cambios.
- [x] 5.2 Agregar `PatientEditCanDeactivateGuard` y registrarlo en la ruta de edición; verificar que el botón atrás del navegador pide confirmación con cambios sin guardar.

## 6. Tests, documentación y verificación

- [x] 6.1 Agregar tests del listado: navegación a alta/edición, bloqueo sin ID y restauración de búsqueda desde query params; verificar con ChromeHeadless.
- [x] 6.2 Agregar tests de la página de edición: carga por ID, modo alta, guardar/cancelar y deep-link; verificar con ChromeHeadless.
- [x] 6.3 Actualizar `docs/features-migration-tracker.md` con el renombre, la página y las rutas; verificar que el tracker refleja el estado final.
- [x] 6.4 Ejecutar `npm run lint`, `npm run build` y los tests puntuales; verificar que todo pasa sin errores.
- [x] 6.5 Ejecutar `/opsx-sync` del change y `openspec validate --specs`; verificar que el spec fuente queda actualizado y válido.

## 7. Ajustes de tabs, validación y género

- [x] 7.1 Crear `UiTabsComponent` en `shared/ui/` con `UiTabItem`, contador, error e icono; exportarlo en `shared/ui/index.ts` y verificar con un test que emite `valueChange` y marca la tab activa.
- [x] 7.2 Migrar `document-tabs` a `ui-tabs`, eliminar `.type-cards` de su SASS e importar el componente en `PrescriptionCreateModule`; verificar que las tabs de Paso 2 mantienen iconos, contadores y selección.
- [x] 7.3 Reemplazar `mat-tab-group` en `PatientEditFormComponent` por `ui-tabs`, con “Datos básicos” por defecto y error por tab; verificar que el panel cambia y que Guardar sigue detectando errores.
- [x] 7.4 Reordenar el formulario: DNI, Sexo, estado y Validar arriba; Nombre autopercibido y Género autopercibido juntos en Datos básicos; verificar visualmente desktop y mobile.
- [x] 7.5 Implementar `onValidate()` en el formulario para edición (`validatePatientById`) y alta (`validatePatient`), con spinner, patch de datos, chip, DNI bloqueado y snackbar; verificar ambos flujos.
- [x] 7.6 Crear el catálogo canónico de género (`mujer`, `mujer trans`, `varon`, `varon trans`, `no binario`, `travesti`, `masculinidad trans`) y agregar fallback dinámico para valores legacy; verificar que un paciente con género fuera del catálogo no rompe el select.
- [x] 7.7 Corregir `recetar-api` para preservar `genero` en update/validate y enviarlo en create con DNI; ajustar mapper y tipos; verificar con tests del módulo de pacientes.
- [x] 7.8 Quitar el botón Volver del header de `PatientEditPageComponent` y el `onBack` que quede sin uso; verificar que Cancelar y el back del navegador siguen funcionando.
- [x] 7.9 Actualizar tests de `ui-tabs`, `PatientEditFormComponent`, `PatientEditPageComponent` y API; verificar con ChromeHeadless y Jest.
- [x] 7.10 Actualizar tracker, ejecutar lint/build/tests en ambos repos, sincronizar el delta con el spec fuente y validar specs.

## 8. Estado de validación en el botón

- [x] 8.1 Quitar el badge de estado del formulario y hacer que el botón refleje el estado: tonal con `check` si no está validado, outlined verde con `done_all` si está validado; verificar visualmente ambos estados y la compilación.
- [x] 8.2 Actualizar el spec, sincronizarlo, ejecutar lint/build/tests y validar OpenSpec.

## 9. Tabs compactas y codificación de nombres

- [x] 9.1 Agregar a `ui-tabs` un modo compacto (`stretch=false`) con tabs de 160px alineadas a la izquierda y usarlo solo en el formulario de paciente; verificar que el Paso 2 conserve su ancho actual.
- [x] 9.2 Decodificar las respuestas MPI de ANDES desde bytes crudos (UTF-8 estricto con fallback Windows-1252) y normalizar a NFC; verificar que `NICOL�S` se lea como `NICOLÁS` y agregar tests con fixtures Latin-1/UTF-8.
- [x] 9.3 Actualizar tracker, ejecutar lint/build/tests en ambos repos, sincronizar el spec y validar OpenSpec.

## 10. Reparación de nombres doblemente codificados

- [x] 10.1 Replicar en `AndesMapper` la reparación de ANDES (`Buffer.from(texto, 'latin1').toString('utf8')`) conservando el original si el resultado contiene `U+FFFD`; aplicarla a nombre, apellido, alias, contactos y dirección; verificar con un test que `MATIAS NICOLÃS` se convierta en `MATIAS NICOLÁS`.
- [x] 10.2 Actualizar tracker/spec, ejecutar lint/build/tests en `recetar-api`, sincronizar el spec y validar OpenSpec.

## 11. Consistencia de notificaciones y skill

- [x] 11.1 Reemplazar `MatSnackBar` directo por `NotificationService` en pacientes, documentos y perfil; quitar `MatSnackBarModule` de los módulos de feature y actualizar tests.
- [x] 11.2 Actualizar el skill `recetar-app-ui-ux` con `NotificationService`, `ui-tabs`, `ui-alert`, `ui-drawer`, `pageActions`, reglas de proyección, `countMode` y checklist de UI.
- [x] 11.3 Actualizar tracker, ejecutar lint/build/tests y validar OpenSpec.

## 12. Validación: género, nombres y dirección

- [x] 12.1 Evitar que la validación modifique el género autopercibido en frontend y API; verificar con tests.
- [x] 12.2 Formatear nombres de RENAPER en título con partículas en minúscula usando `repairText`; verificar `MATIAS NICOLÁS` → `Matias Nicolás`.
- [x] 12.3 Recuperar la dirección de la validación, reemplazar solo la principal y conservar las adicionales; no tocar email/teléfono; verificar con tests de API y frontend.
- [x] 12.4 Actualizar tracker, sincronizar el spec y validar OpenSpec.
