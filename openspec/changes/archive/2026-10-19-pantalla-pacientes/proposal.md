# Proposal

## Why

Los profesionales y auditores no tienen una pantalla para buscar, consultar y editar pacientes de forma completa. Hoy solo existe el alta rápida dentro de la prescripción, que no permite gestionar contacto, dirección, validación ni eliminación. Necesitamos una sección de pacientes que use ANDES como fuente de verdad y concentre las tareas de gestión.

## What Changes

- Agregar la pantalla `/pacientes` para profesionales y auditores.
- Agregar el ítem “Pacientes” al menú lateral de esos roles.
- Implementar búsqueda por término con filtros y carga incremental.
- Mostrar un listado con identidad, estado, contacto y ubicación del paciente, usando items en lugar de tabla.
- Mostrar un drawer de detalle con identidad, contacto y dirección.
- Permitir editar y crear pacientes desde una vista con dos tabs: Datos básicos y Contacto.
- La vista de edición reemplaza la búsqueda y el listado, conserva el estado de búsqueda y permite volver.
- Validar todos los campos con un único botón Guardar, mostrando errores en las tabs y en los campos.
- Permitir validar o volver a validar pacientes con DNI.
- Permitir eliminar pacientes con doble confirmación.
- Mantener la emisión sin DNI y el alta rápida existentes.
- **Fuera de alcance**: familiares, foto, notas, documentos adjuntos, cobertura, documento extranjero y flujo legacy `/profesionales/recetas/nueva`.

## Capabilities

### New Capabilities

- `patient-management`: pantalla de búsqueda, listado, detalle, edición, validación y eliminación de pacientes para profesionales y auditores.

### Modified Capabilities

- `session-and-access`: se agrega la sección Pacientes al menú de profesionales y auditores.

## Impact

- **recetar-app**: nueva feature `features/patients/`, routing, guard, sidebar, modelos/servicio de pacientes, componentes de listado, detalle y formulario con tabs.
- **recetar-api**: consume el change `gestion-pacientes-completa` para búsqueda paginada, contacto y dirección, y reutiliza los endpoints de validación y eliminación.
- **ANDES**: sin cambios; la API resuelve lecturas y escrituras contra MPI.
- **Datos**: no se migran datos. Los cambios de contacto y dirección se persisten en ANDES.
- **Limitación**: la eliminación es definitiva en ANDES; los documentos ya emitidos conservan su snapshot.
