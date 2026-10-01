# Tasks

## 1. Propuesta y alcance

- [x] 1.1 Crear el change `baseline-especificaciones-frontend` y verificar la estructura en `openspec/changes/` — verificado con `openspec status`
- [x] 1.2 Redactar `proposal.md` con las 7 capabilities y las observaciones del estado actual — verificado leyendo el archivo y `openspec validate --strict`

## 2. Specs de la tanda 1

- [x] 2.1 Redactar `specs/session-and-access/spec.md` desde `src/app/auth/**`, login y `sidebar.service` — verificado con `openspec validate --strict`
- [x] 2.2 Redactar `specs/prescription-authoring/spec.md` desde `features/prescription/create`, `medication-search` y servicios de seguridad — verificado con `openspec validate --strict`
- [x] 2.3 Redactar `specs/dispensing/spec.md` desde `features/pharmacists` y `dispense.service` — verificado con `openspec validate --strict`

## 3. Specs de la tanda 2

- [x] 3.1 Redactar `specs/documents/spec.md` desde `features/documents` y servicios de documentos — verificado con `openspec validate --strict`
- [x] 3.2 Redactar `specs/audit/spec.md` desde `features/audit` y servicios de usuarios/padrones — verificado con `openspec validate --strict`

## 4. Specs de la tanda 3

- [x] 4.1 Redactar `specs/profile/spec.md` desde `features/profile` y servicios de perfil/seguridad — verificado con `openspec validate --strict`
- [x] 4.2 Redactar `specs/public-documents/spec.md` desde `public-certificate`, `public-practice` y sus servicios — verificado con `openspec validate --strict`

## 5. Verificacion del change

- [x] 5.1 Ejecutar `openspec validate baseline-especificaciones-frontend --strict` y confirmar que el change es valido — verificado: "Change is valid"
- [x] 5.2 Verificar que la app no tuvo cambios de codigo ni de tests — verificado con `git status`

## Workflow follow-up

- Archivar el change cuando se cumplan los requisitos de revisión del proyecto.
- Verificar el resultado archivado con `openspec list --specs --json` y `openspec validate --specs --strict`.
