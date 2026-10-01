# Tasks

## 1. Formulario de paciente

- [x] 1.1 Agregar el selector “Con DNI / Sin DNI” y ajustar validadores, estado no validado y payload, y verificar con build/lint
- [x] 1.2 Permitir agregar un DNI a un paciente sin DNI y volver a validarlo, y verificar con build/lint
- [x] 1.3 Mostrar “Sin DNI” y el estado no validado en el formulario y en la selección de paciente, y verificar visualmente

## 2. Documentos e historial

- [x] 2.1 Conservar `idMPI` en el modelo/adapter de paciente y usarlo al emitir documentos, y verificar con build/lint
- [x] 2.2 Consultar documentos recientes por DNI o `idMPI` y verificar con build/lint
- [x] 2.3 Mostrar “Sin DNI” en la selección de paciente y en la impresión de documentos, y verificar visualmente

## 3. Dispensación

- [x] 3.1 Mostrar “Sin DNI” en el listado y en la vista previa de dispensación, y verificar visualmente

## 4. Verificación

- [x] 4.1 Ejecutar `npm run lint` y `npm run build` en `recetar-app`, y registrar el resultado (sin errores)
- [x] 4.2 Ejecutar la suite de tests y registrar que las 6 fallas existentes en `NotFoundComponent` y `ResetPasswordComponent` no están relacionadas con este change
- [x] 4.3 Validar el change con `openspec validate emision-sin-dni-frontend --strict`

## Workflow follow-up

- Archivar el change cuando se cumplan los requisitos de revisión del proyecto.
- Verificar el resultado archivado con `openspec list --specs --json` y `openspec validate --specs --strict`.
