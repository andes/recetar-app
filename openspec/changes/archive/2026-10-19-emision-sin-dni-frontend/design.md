# Design

## Context

Ver `proposal.md` — Why. El frontend ya usa `Patient` y `PatientAdapter` para leer pacientes, `EditPatientComponent` para el alta/edición dentro de la prescripción y `DocumentHistoryService` para el historial. La API ya expone pacientes temporales sin DNI y acepta documentos con `idMPI`.

## Goals / Non-Goals

**Goals:**

- Permitir alta y edición de pacientes con o sin DNI.
- Mantener el paciente sin DNI como no validado.
- Permitir prescribir y consultar historial con pacientes sin DNI.
- Mostrar “Sin DNI” de forma consistente en selección, historial, dispensación e impresión.

**Non-Goals:**

- Pantalla completa de gestión de pacientes.
- Edición de contacto y dirección.
- Cambios en el flujo legacy `/profesionales/recetas/nueva`.
- Dispensación por DNI de recetas sin DNI.

## Decisions

### Selector “Con DNI / Sin DNI”

`EditPatientComponent` incorpora un toggle que cambia los validadores del DNI y el payload. Con “Sin DNI” el DNI se limpia, deja de ser obligatorio y el paciente se muestra como temporal. Alternativa descartada: dejar el DNI opcional sin control explícito, porque no comunica el estado no validado.

### Identificador de MPI en el modelo

`Patient` y `PatientAdapter` conservan `idMPI`. Los documentos y el historial usan ese identificador cuando no hay DNI. Alternativa descartada: generar un identificador local, porque rompe la trazabilidad con ANDES.

### Historial por DNI o idMPI

`DocumentHistoryService` envía el DNI cuando existe y, si no, el `idMPI`. La ruta de documentos recientes prioriza `idMPI`. Alternativa descartada: mostrar historial vacío para pacientes sin DNI.

### Visualización “Sin DNI”

La selección de paciente, el listado de dispensación y la impresión muestran “Sin DNI” cuando el documento está vacío. Alternativa descartada: mostrar un espacio vacío o “-”, porque no distingue un dato faltante de un paciente sin documento.

### Sin coberturas por DNI

Para pacientes sin DNI no se consultan coberturas por DNI. La carga de medicamentos y la emisión siguen funcionando con los datos disponibles.

## Risks / Trade-offs

- [Búsqueda de farmacia por DNI] → La receta local se busca por nombre; se muestra “Sin DNI” para evitar ambigüedad.
- [Duplicados por nombre] → No hay control automático sin DNI; se bloquean duplicados al agregar un DNI.
- [Paciente no validado] → Se muestra el estado temporal; la validación queda disponible al cargar un DNI.
- [Flujo legacy] → No se modifica; el soporte sin DNI aplica al flujo nuevo de prescripción.
- [Historial] → La consulta por `idMPI` depende del contrato de la API; si el paciente no tiene ninguno de los dos identificadores, no se carga historial.
