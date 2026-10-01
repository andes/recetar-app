# Proposal

## Why

El frontend exige DNI para crear o editar pacientes y para seleccionarlos en una prescripción. Eso bloquea la emisión de recetas, certificados y prácticas para pacientes sin DNI, aunque la API ya permite crearlos como temporales en ANDES MPI y emitir documentos usando el identificador de MPI. Necesitamos que el profesional pueda cargar y usar pacientes sin DNI, viéndolos claramente como no validados.

## What Changes

- Agregar la opción “Con DNI / Sin DNI” en el alta y edición de paciente.
- Permitir crear un paciente sin DNI con nombre, apellido y sexo; queda como no validado.
- Permitir buscar, seleccionar y prescribir para pacientes sin DNI.
- Mostrar “Sin DNI” en la selección de paciente, el historial, la dispensación y la impresión.
- Consultar el historial de documentos recientes por identificador de MPI cuando no haya DNI.
- Permitir agregar el DNI más adelante desde el mismo formulario y validar al paciente.
- Mantener el flujo actual para pacientes con DNI.

## Capabilities

### New Capabilities

_(ninguna)_

### Modified Capabilities

- `prescription-authoring`: alta y edición de paciente con o sin DNI, selección de paciente sin DNI, historial por identificador de MPI y emisión de documentos sin DNI.
- `dispensing`: búsqueda por nombre y visualización de pacientes sin DNI.
- `documents`: visualización e impresión de documentos de pacientes sin DNI.

## Impact

- **recetar-app**: `EditPatientComponent`, `PatientItemComponent`, `NewPrescriptionComponent`, `DocumentTabsComponent`, `DocumentHistoryService`, `PatientsService`, `PatientAdapter`, `DispenseItemComponent`, `DispensePreviewPanelComponent` y `UnifiedPrinterComponent`.
- **recetar-api**: consume el contrato del change `2026-10-19-emision-sin-dni-api` (paciente temporal, DNI opcional, `idMPI`, historial y validación).
- **ANDES**: sin cambios; la API resuelve el paciente contra MPI.
- **Limitaciones**: la búsqueda de farmacia por DNI no encuentra recetas de pacientes sin DNI; se busca por nombre. El flujo legacy `/profesionales/recetas/nueva` no se modifica.
- **Fuera de alcance**: pantalla completa de gestión de pacientes y edición de contacto/dirección.
