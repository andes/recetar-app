# Design

## Context

Ver `proposal.md` — Why. La app ya tiene `PatientsService`, `PatientAdapter` y `EditPatientComponent` para el alta rápida, pero no una feature de pacientes. La API expone búsqueda, edición, validación y eliminación; el change `gestion-pacientes-completa` agrega filtros, paginación, contacto y dirección.

## Goals / Non-Goals

**Goals:**

- Nueva feature `features/patients/` con ruta, guard, menú y pantalla.
- Búsqueda con filtros y carga incremental.
- Listado con items, drawer de detalle y vista de edición con tabs.
- Edición completa de identidad, contacto y dirección.
- Validación y eliminación con las reglas de ANDES.
- Experiencia mobile.

**Non-Goals:**

- Cambiar el alta rápida de la prescripción.
- Editar familiares, foto, notas, documentos, cobertura o documento extranjero.
- Modificar el backend o ANDES.
- Rediseñar otras pantallas.

## Decisions

### Feature nueva y ruta `/pacientes`

Se crea `features/patients/` con `PatientsHomeComponent`, `PatientListItemComponent`, `PatientDetailPanelComponent`, `PatientFormComponent` y `DeletePatientDialogComponent`. La ruta se protege con un guard que permite profesionales y auditores. Alternativa descartada: reutilizar la pantalla de prescripción, porque mezcla responsabilidades.

### Búsqueda con “Cargar más”

La pantalla usa el contrato paginado de la API con `items` y `hasMore`. Se muestra “Cargar más” en lugar de un paginador con total exacto. Alternativa descartada: paginador numerado, porque la búsqueda por término libre no informa un total exacto.

### Listado con items, no tabla

Los resultados se muestran con `ui-results-list` + `ui-list-item` + `ui-entity` + `ui-badge-chip`. Cada item ofrece “Ver detalle” y “Editar”. No se usa `ui-table` porque cada paciente muestra identidad, estado, contacto y ubicación en un formato más rico y mobile-first; además, la app ya usa este patrón en Documentos, Dispensación y Auditoría.

### Drawer de detalle

El detalle se muestra en `ui-drawer` + `ui-detail-panel` + `ui-detail-section`. Es de solo lectura y ofrece Editar, Validar/Volver a validar y Eliminar. Alternativa descartada: editar dentro del drawer, porque no hay espacio suficiente para el formulario.

### Vista de edición con tabs

La edición reemplaza búsqueda y resultados dentro de `PatientsHomeComponent` con un estado `list` / `edit`. Se usa `MatTabs` con dos tabs:

- **Datos básicos:** nombre, apellido, alias, DNI, CUIL, sexo, género, fecha de nacimiento y estado.
- **Contacto:** email, celular, teléfono fijo, calle, código postal, barrio, localidad, provincia y país.

Se usa `app-form-field`/`ui-field-input` con inputs nativos y `ui-card` como contenedor. El mismo formulario sirve para alta y edición. Alternativa descartada: drawer de edición, porque el formulario necesita más espacio.

### Errores por tab y guardado único

El formulario tiene un único botón Guardar. Al guardar se marcan todos los campos como tocados, se valida el formulario completo y se calcula qué tabs tienen errores. La tab con error muestra un `mat-icon` de error en su etiqueta y el campo muestra su error inline. La vista cambia automáticamente a la primera tab con error usando `selectedIndex`. Alternativa descartada: validar por tab al cambiar, porque permite guardar datos incompletos.

### Volver, Cancelar y Guardar

- **Guardar:** valida, persiste y vuelve al listado; refresca los resultados.
- **Volver atrás:** vuelve al listado conservando la búsqueda.
- **Cancelar:** descarta y vuelve al listado conservando la búsqueda.
- Si hay cambios sin guardar, Volver y Cancelar piden confirmación.

El estado de búsqueda, filtros y resultados se conserva en memoria mientras se edita. Alternativa descartada: navegar a otra ruta, porque se pierde el contexto.

### Contacto y dirección

Se muestran y editan un contacto principal por tipo (email, celular, fijo) y una dirección principal. La API conserva los adicionales. Alternativa descartada: editar listas completas, porque agrega complejidad y riesgo de pérdida de datos.

### Eliminación con doble confirmación

Se usa un diálogo con advertencia y una confirmación adicional (checkbox o segundo paso). La eliminación impacta en ANDES y es irreversible. Alternativa descartada: una sola confirmación, porque la acción es destructiva y afecta el MPI.

### Refresco desde ANDES

Después de editar, validar o eliminar, se vuelve a consultar el paciente o el listado para mostrar datos vigentes. Alternativa descartada: actualizar solo el estado local, porque podría divergir de ANDES.

## Risks / Trade-offs

- [Paciente sin DNI] → Se muestra “Sin DNI” y estado no validado; la validación queda deshabilitada.
- [Datos adicionales] → La API fusiona contactos/direcciones; la UI solo edita el principal.
- [Búsqueda por nombre] → Puede ser ambigua; se muestran DNI o “Sin DNI”, sexo y edad.
- [Eliminación irreversible] → Doble confirmación y advertencia; los documentos conservan su snapshot.
- [Permisos] → El guard restringe la pantalla; la API valida los permisos de edición/eliminación.
- [Mobile] → Tabs y formulario en una columna; drawer a pantalla completa.
- [Cambios sin guardar] → Volver y Cancelar piden confirmación cuando el formulario está modificado.
