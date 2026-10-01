# Tasks

## 1. Feature y acceso

- [x] 1.1 Crear `features/patients/` con módulo, routing y página principal, y verificar con build
- [x] 1.2 Agregar el guard de profesionales/auditores y registrar la ruta `/pacientes`, y verificar con build
- [x] 1.3 Agregar el ítem Pacientes al menú lateral para profesionales y auditores, y verificar visualmente

## 2. Modelo, servicio y búsqueda

- [x] 2.1 Extender `Patient`/`PatientAdapter` y `PatientsService` para búsqueda paginada, contacto y dirección, y verificar con build/lint
- [x] 2.2 Implementar la búsqueda con término, filtros, estados de carga/vacío/error y “Cargar más”, y verificar visualmente
- [x] 2.3 Implementar el listado con items, acciones Ver detalle y Editar, y verificar visualmente

## 3. Detalle en drawer

- [x] 3.1 Implementar el drawer de detalle con secciones Identidad, Contacto y Dirección, y verificar visualmente
- [x] 3.2 Agregar acciones Editar, Validar/Volver a validar y Eliminar en el drawer, y verificar visualmente

## 4. Vista de edición con tabs

- [x] 4.1 Implementar el estado `list`/`edit` para reemplazar búsqueda y resultados, conservando búsqueda y filtros, y verificar visualmente
- [x] 4.2 Implementar las tabs Datos básicos y Contacto con sus campos, y verificar visualmente
- [x] 4.3 Implementar el mismo formulario para alta y edición, y verificar visualmente
- [x] 4.4 Implementar Guardar, Volver atrás y Cancelar con confirmación de cambios sin guardar, y verificar visualmente
- [x] 4.5 Implementar validación completa al Guardar, iconos de error en tabs, errores inline y cambio a la primera tab con error, y verificar visualmente

## 5. Validación y eliminación

- [x] 5.1 Implementar Validar y Volver a validar desde el drawer, con estado deshabilitado para pacientes sin DNI, y verificar visualmente
- [x] 5.2 Implementar la eliminación con advertencia y doble confirmación, y verificar visualmente
- [x] 5.3 Refrescar el listado y cerrar el drawer después de eliminar, y verificar visualmente

## 6. Verificación

- [x] 6.1 Verificar la pantalla en mobile (items, drawer y edición con tabs en una columna)
- [x] 6.2 Ejecutar `npm run lint` y `npm run build` en `recetar-app`, y registrar el resultado
- [x] 6.3 Validar el change con `openspec validate pantalla-pacientes --strict`

## Workflow follow-up

- Archivar el change cuando se cumplan los requisitos de revisión del proyecto.
- Verificar el resultado archivado con `openspec list --specs --json` y `openspec validate --specs --strict`.
