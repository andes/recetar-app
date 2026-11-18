# Cobertura E2E por capability

Matriz de trazabilidad entre los requisitos de `openspec/specs/` y los escenarios de Playwright.
Estados: `cubierto`, `parcial`, `gap` y `env-gated` (requiere un dato/flag del ambiente).

> Estado inicial al crear la matriz. Cada tarea del change `cobertura-e2e-gaps` actualiza
> las filas que cubre. Los IDs remiten a los tests de `e2e/specs/`.

## audit (7 requisitos)

| Requisito | Tests | Estado | Notas |
|---|---|---|---|
| Acceso a auditoria | ROLE-005, ROLE-006 | cubierto | redirección y menú por rol |
| Listado de usuarios | AUD-010, USR-001 | parcial | listado; detalle y búsqueda se amplían en USR-001 |
| Edicion de usuario | USR-003 | gap | |
| Roles de usuario | USR-003 | gap | |
| Baja de usuario | USR-004 | gap | |
| Alta de usuario | USR-002 | gap | |
| Auditoria de recetas por farmacia | AUD-001, AUD-002 | cubierto | búsqueda por CUIT y validación |

## dispensing (10 requisitos)

| Requisito | Tests | Estado | Notas |
|---|---|---|---|
| Acceso a la dispensacion | ROLE-003, ROLE-004 | cubierto | |
| Listado inicial de recetas | DIS-001, DIS-002 | parcial | |
| Busqueda de recetas | DIS-001, DIS-002 | cubierto | búsqueda por DNI |
| Filtros de recetas | DSP-001 | gap | |
| Paginacion de recetas | DSP-002 | gap | |
| Vista previa de receta | DIS-002 | cubierto | |
| Dispensa de receta | DIS-001 | cubierto | |
| Reemplazo de medicamento en la dispensa | DSP-003 | gap | |
| Deshacer dispensa | DIS-001 | cubierto | |
| Impresion de receta | DSP-004 | gap | helper popup/blob pendiente |

## documents (8 requisitos)

| Requisito | Tests | Estado | Notas |
|---|---|---|---|
| Acceso a documentos | DOC-001, ROLE-002 | cubierto | |
| Pestanas y estadisticas | DOC-001 | parcial | |
| Listado paginado | DOC-001 | parcial | |
| Busqueda de documentos | DOC-001 | parcial | |
| Filtros de documentos | — | gap | |
| Detalle del documento | DOC-001 | cubierto | |
| Impresion de documentos | DOC-004 | gap | helper popup/blob pendiente |
| Eliminacion y anulacion de documentos | DOC-002, DOC-003, DOC-010, DOC-011 | cubierto | receta y certificado |

## patient-management (15 requisitos)

| Requisito | Tests | Estado | Notas |
|---|---|---|---|
| Acceso a la pantalla de pacientes | PAT-019, ROLE-002 | cubierto | |
| Búsqueda y filtros de pacientes | PAT-002, PAT-003 | cubierto | |
| Listado de pacientes | PAT-001 | cubierto | |
| Detalle del paciente | PAT-005, PAT-018, PAT-022 | cubierto | |
| Edición con tabs | PAT-009, PAT-019, PAT-021 | cubierto | |
| Errores de validación en tabs | PAT-010, PAT-021 | cubierto | |
| Validación de paciente | PAT-012, PAT-013, PAT-027, PAT-028 | parcial | PAT-012 es `env-gated` (RENAPER real) |
| Eliminación de paciente | PAT-015, PAT-016 | cubierto | |
| Consistencia con ANDES | PAT-006, PAT-011, PAT-031 | parcial | duplicados y estado validado |
| Experiencia mobile | MOB-001..003 | gap | se cubre con el project mobile |
| Navegación y estado de búsqueda | PAT-024, PAT-025, PAT-026 | cubierto | |
| Carga de la edición | PAT-009, PAT-019 | cubierto | |
| Validación desde el formulario | PAC-027, PAC-028 | cubierto | |
| Género autopercibido | PAT-029, PAT-030 | cubierto | |
| Codificación de nombres y tildes | — | gap | sin escenario explícito |

## prescription-authoring (17 requisitos)

| Requisito | Tests | Estado | Notas |
|---|---|---|---|
| Busqueda de paciente | PAC-001, PAC-002 | cubierto | |
| Seleccion de paciente | PAC-001 | cubierto | |
| Alta y edicion de paciente | PAC-003, PAC-004, PAC-005, PAC-007, PAC-008, PAC-009, PAC-019, PAC-020, PAC-022 | cubierto | |
| Tipo de documento | PAC-005, PAC-009 | parcial | sin DNI y DNI bloqueado |
| Busqueda de medicamento comercial | REC-003, MED-001, MED-002, MED-003 | cubierto | |
| Carga de medicamento magistral | MED-010, MED-011 | env-gated | requiere organizaciones pública/privada |
| Detalle del medicamento | REC-010, REC-011, REC-012, REC-013 | cubierto | |
| Tratamiento prolongado | REC-013, HIS-002 | parcial | validación y visualización |
| Marca de duplicado o triplicado | REC-012 | cubierto | |
| Limite de medicamentos | MED-003 | cubierto | |
| Datos del certificado | CERT-001, CERT-002 | parcial | CERT-002 falla por bug de producto (`cantDias`) |
| Datos de la practica | PRAC-001, PRAC-002 | cubierto | |
| Organizacion y ambito | MED-010, MED-011 | env-gated | requiere organizaciones configuradas |
| Historial reciente y reutilizacion | HIS-001 | cubierto | |
| Borrador y finalizacion | REC-003, REC-004, REC-014, PAC-015 | cubierto | |
| PIN de seguridad | REC-020 | env-gated | requiere usuario con PIN activo |
| Pendiente de receta al reanudar | REC-014 | cubierto | |

## profile (9 requisitos)

| Requisito | Tests | Estado | Notas |
|---|---|---|---|
| Acceso al perfil | PRO-001 | cubierto | |
| Secciones segun rol | PRO-001, PRO-010 | cubierto | |
| Identidad y matriculas | PRO-001 | parcial | sólo visualización |
| Estado de habilitacion de farmacia | PRO-010 | parcial | |
| Datos de cuenta | PRO-002 | parcial | validación de email |
| Cambio de contrasena | PRF-001 | gap | |
| Estado del PIN de seguridad | PRO-001 | parcial | sección visible |
| Gestion del PIN de seguridad | PRF-002 | gap | `env-gated` si no hay `E2E_USER_PIN` |
| Organizaciones del profesional | PRF-003 | gap | |

## public-documents (4 requisitos)

| Requisito | Tests | Estado | Notas |
|---|---|---|---|
| Acceso publico a documentos | PUB-001 | cubierto | sin sesión y ruta desconocida |
| Resolucion del identificador | PUB-002 | parcial | válido y carga cubiertos; inválido/inexistente bloqueados por bug de error state (`matButton="raised"`) |
| Visualizacion del certificado | PUB-003 | parcial | activo/expirado/anulado cubiertos; error bloqueado por el mismo bug |
| Visualizacion de la practica | PUB-004 | parcial | visible y secciones opcionales cubiertos; estados y error bloqueados |

## session-and-access (13 requisitos)

| Requisito | Tests | Estado | Notas |
|---|---|---|---|
| Inicio de sesion | AUTH-001 | cubierto | |
| Restauracion de sesion al iniciar | SES-001 | cubierto | storageState + reload |
| Renovacion automatica de token | SES-002 | cubierto | 406 + refresh mockeado |
| Cierre de sesion | SES-003 | cubierto | tokens y ruta protegida |
| Recuperacion de contrasena | SES-004 | parcial | UI con API mockeada; falta token real |
| Cambio de contrasena autenticado | SES-004, PRF-001 | cubierto | usuario descartable y login con clave nueva |
| Registro de profesional | SES-005 | cubierto | validaciones + alta con API/Turnstile mockeados |
| Registro de farmacia | SES-005 | cubierto | validaciones + alta con API/Turnstile mockeados |
| Confirmacion de actualizacion de datos | SES-005 | gap | bloqueado por `matButton="raised"` en confirm-update |
| Proteccion de rutas | AUTH-003 | cubierto | |
| Control de acceso por rol | ROLE-001..006 | cubierto | |
| Navegacion segun rol | ROLE-002, ROLE-004, ROLE-006 | cubierto | |
| Ambito de trabajo | MED-010, MED-011 | parcial | depende de organizaciones |

## Resumen

- Total: 8 capabilities, 83 requisitos.
- `env-gated` por defecto: 2 RENAPER reales, 1 PIN y 2 de organizaciones.
- Los 3 escenarios RENAPER que no requieren servicio real (`PAT-013`, `PAC-011`, `PAC-012`) corren siempre.
