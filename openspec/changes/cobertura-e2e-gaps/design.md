# Design

## Context

La suite E2E vive en `recetar-app/e2e/` y corre contra servicios reales (`recetar-api`, ANDES, vademecum). Usa un project `setup` que loguea por API y escribe `storageState` por rol, más projects de navegador. Hoy hay 91 escenarios en 22 archivos, con `workers: 1` por datos compartidos y varios tests gateados por `E2E_*`.

El relevamiento contra `openspec/specs/` mostró gaps por capability: `public-documents` sin tests, ciclo de sesión y CRUD de usuarios de auditoría casi ausentes, y cobertura parcial en dispensación, documentos y perfil. También hay 8 skips por ambiente y no existe cobertura mobile.

Ver `proposal.md` para la motivación.

## Goals / Non-Goals

**Goals:**

- Cubrir los requisitos sin tests o parcialmente cubiertos, con trazabilidad a `openspec/specs/`.
- Hacer visibles y medibles los skips por ambiente.
- Agregar una dimensión mobile acotada, sin duplicar toda la suite.
- Reducir el acoplamiento a datos mutables del ambiente local.
- Ejecutar la suite completa en Chromium y Firefox, y mobile en un subconjunto etiquetado.

**Non-Goals:**

- Corregir bugs de producto detectados por la suite (`CERT-002`, `AUTH-002`). Van como changes/bugfixes separados.
- Llegar a 100% de requisitos o fijar un umbral numérico de cobertura.
- Reemplazar la integración real por mocks masivos.
- Tests de contrato de API, unit tests o performance.
- Accesibilidad y visual regression (quedan como follow-up).

## Decisions

### 1. Organizar los nuevos specs por capability, no por página

Se agregan carpetas y prefijos de ID alineados a `openspec/specs/`:

```
e2e/specs/
  session/            SES-*   login restore, refresh, logout, recovery, registro
  audit/users/        USR-*   alta, edicion, roles, baja
  public-documents/   PUB-*   certificado y practica publicos
  dispensing/         DSP-*   filtros, paginacion, reemplazo, impresion
  documents/          DOC-*   impresion (se suma a los existentes)
  profile/            PRF-*   password, PIN, organizaciones
  mobile/             MOB-*   experiencia mobile
```

Los IDs existentes (`PAT`, `PAC`, `REC`, `MED`, `HIS`, `CERT`, `PRAC`, `AUD`, `DIS`, `DOC`, `PRO`, `AUTH`, `ROLE`) se mantienen.

**Por qué:** el gap se detectó contra capabilities, y los nombres por página diluyen la trazabilidad. **Alternativa descartada:** seguir agregando tests sueltos en `p0`/`p1`; no permite responder “qué requisito está cubierto”.

### 2. Matriz de cobertura como artefacto vivo

Se crea `e2e/COVERAGE.md` con una tabla:

| Spec / Requirement | Tests | Estado | Notas |
|---|---|---|---|
| `public-documents` / Acceso publico | PUB-001 | cubierto | |
| `session-and-access` / Refresh | SES-002 | cubierto | API + storageState |

Estados: `cubierto`, `parcial`, `gap`, `env-gated`.

**Por qué:** los nombres de tests no alcanzan para auditar cobertura. La matriz se actualiza en cada PR de este change y queda como fuente de verdad del alcance E2E. **Alternativa descartada:** generar cobertura automática desde los títulos; no distingue requisito cubierto de test que sólo lo menciona.

### 3. Mobile como project acotado y etiquetado

Se agrega un project `mobile-chrome` con `devices['Pixel 7']` y `grep: /@mobile/`. Sólo corren los escenarios marcados `@mobile` (gestión de pacientes y nueva receta en viewport reducido).

**Por qué:** el requisito “Experiencia mobile” necesita un viewport real, pero correr los 91 escenarios en mobile triplica tiempo y flakiness. **Alternativa descartada:** un único project mobile para toda la suite.

### 4. Skips explícitos, preflight y modo estricto

- Los tests dependientes de ambiente se etiquetan: `@env:renaper`, `@env:pin`, `@env:org`.
- Se agrega un preflight (`e2e/support/preflight.ts` o script) que valida roles, servicios y flags, e imprime una tabla de faltantes, incluyendo cuántos tests quedan `env-gated`.
- `E2E_STRICT_ENV=1` hace fallar el preflight si falta configuración requerida (roles base y servicios); los externos opcionales siguen siendo skip visible.
- El reporte final lista los tests skipped con su motivo.

**RENAPER sin infraestructura nueva:** sólo `PAT-012` y `PAC-010` dependen del servicio real. `PAT-013` y `PAC-012` ya mockean `/api/patients/validate` con `page.route`, y `PAC-011` valida el aviso local de DNI/sexo faltante. Esos tres se destapan y corren siempre; quedan **2 RENAPER reales** como `@env:renaper`. PIN y organizaciones siguen `env-gated` porque requieren datos que hoy no están garantizados.

**Por qué:** hoy un skip silencioso puede hacer parecer que hay cobertura cuando no la hay, y no hace falta infraestructura nueva para recuperar 3 de los 5 escenarios de RENAPER. **Alternativa descartada:** eliminar los skips y exigir todo siempre; rompe locales y CI sin secretos.

### 5. Datos descartables y cleanup determinista

- `ApiClient` suma helpers para crear y limpiar usuarios, certificados, prácticas y recetas descartables.
- Usuarios/CUIL/DNI/email únicos por corrida (`uniqueSuffix`).
- Los tests de password y PIN usan usuarios descartables; nunca el usuario base.
- La suite no depende de filas mutables del ambiente (fue la causa de los problemas de CUIL duplicado, organización faltante y contraseña vencida).

**Por qué:** portabilidad entre máquinas y menor flakiness. **Alternativa descartada:** seguir usando datos fijos y “arreglar” la base local antes de correr.

### 6. Sesión: API para el ciclo, UI para lo visible

- Refresh, logout, recovery y registro se prueban combinando llamadas API y estado del navegador.
- Restauración de sesión se prueba sembrando `localStorage` y recargando.
- Cambio de contraseña usa un usuario descartable y valida login con la clave nueva.
- Para refresh se evita esperar expiración real: se usa un token de corta vida o se intercepta `/auth/refresh`.

**Por qué:** el ciclo de tokens es difícil de observar sólo por UI y esperar expiraciones reales hace lento el test. **Alternativa descartada:** UI pura con esperas; lenta y frágil.

### 7. Documentos públicos con el mismo esquema de cifrado

- Un fixture genera el ID público con CryptoJS y la misma `CERTIFICATE_SECRET_KEY` que usa `certificates.service.encryptId` / `practices.service.encryptId`.
- Se crean certificado y práctica por API y se abren `/certificate/:id` y `/practice/:id` sin `storageState`.
- Se cubren: ID válido, ausente, inválido, documento inexistente, estado de carga y estados activo/expirado/anulado (certificado) y activo/completado/cancelado (práctica).

**Por qué:** es la única forma de llegar a la ruta pública sin acoplarse al printer. **Alternativa descartada:** navegar desde el botón de impresión; mezcla dos flujos y depende del popup.

### 8. Auditoría de usuarios con admin y datos descartables

- Los tests de alta/edición/roles/baja usan el rol `admin`, porque las rutas de `users` exigen `create:any` / `update:any`.
- Se crea un usuario descartable por API o por UI, se opera y se limpia en `finally`.
- Se valida que auditor no pueda ejecutar mutaciones (si la matriz de permisos lo confirma).

**Por qué:** el rol `auditor` actual no alcanza para CRUD; probar con admin evita falsos negativos. **Alternativa descartada:** usar el usuario auditor y saltar los tests por permisos.

### 9. Dispensación, documentos y perfil

- Dispensación: datos por API, UI para filtros/paginación, reemplazo de medicamento e impresión.
- Impresión: `UnifiedPrinterComponent` genera el PDF en el cliente con `pdfmake` y llama a `pdf.create().open()`. pdfmake abre una ventana con `window.open('', '_blank')` y luego le asigna `win.location.href = URL.createObjectURL(blob)`. **No usa `window.print()` ni el PDF del backend** para este flujo.
- El helper de impresión espera un `popup` y verifica que la URL sea `blob:`; valida que el blob tenga tamaño > 0 leyéndolo desde el popup. Si el browser dispara descarga (por ejemplo Firefox headless), hace fallback a `page.waitForEvent('download')` y valida `suggestedFilename()` con `.pdf`.
- Perfil: password con usuario descartable; PIN gateado por `E2E_USER_PIN`; organizaciones con alta/baja y restauración.
- Documentos: mismo helper para receta, certificado y práctica, incluyendo el caso duplicado (dos páginas).

**Por qué:** pdfmake no dispara `window.print`, así que interceptarlo sería un falso positivo. **Alternativa descartada:** stub de `window.open`, más frágil porque pdfmake necesita un `location` real para asignar el blob.

### 10. CI: matriz de browsers y mobile acotado

- CI instala Chromium + Firefox y corre la suite desktop completa en ambos.
- Mobile corre como paso aparte con `--project=mobile-chrome`.
- `workers: 1` se mantiene para suites que mutan datos. Se puede paralelizar más adelante por archivo cuando los datos sean descartables.

**Por qué:** Firefox ya está configurado y mobile necesita un gate propio. **Alternativa descartada:** correr mobile dentro del job desktop; mezcla tiempos y reportes.

### 11. `skip_specs` y trazabilidad

El change no cambia comportamiento de producto, así que `.openspec.yaml` queda con `skip_specs: true`. La trazabilidad se lleva en `e2e/COVERAGE.md`, no en specs nuevos.

## Risks / Trade-offs

- **Servicios reales inestables** → preflight, retries en CI, tags por ambiente y datos descartables.
- **Costo de mobile** → sólo `@mobile`; se amplía si el subconjunto se estabiliza.
- **Cifrado público acoplado a `CERTIFICATE_SECRET_KEY`** → centralizar el helper y agregar un test que valide ida/vuelta con el servicio.
- **CRUD de usuarios muta datos** → usuarios descartables y cleanup en `finally`.
- **Falta de RENAPER/PIN/orgs en CI** → skips visibles; `E2E_STRICT_ENV` sólo para roles/servicios base.
- **Bugs de producto bloquean tests** → `test.fail` sólo con issue asociado; no se usa para “verde artificial”.
- **Firefox puede revelar diferencias de locators** → correr temprano y corregir locators, no debilitar aserciones.
- **Suite más larga** → separar jobs por capability/browser y cachear dependencias.

## Migration Plan

1. Preflight + `COVERAGE.md` + tags de ambiente.
2. Documentos públicos y ciclo de sesión.
3. Auditoría de usuarios y dispensación.
4. Perfil, documentos (impresión) y mobile.
5. CI con Firefox completo y mobile.
6. Revisión final de la matriz y limpieza de skips.

Rollback: cada paso son specs/config nuevos; se puede revertir sin impacto en producto. No hay migración de datos ni cambios de contrato.

## Open Questions

- ¿Se provisionará en el futuro un usuario con PIN y organizaciones pública/privada en CI? Por ahora queda fuera de alcance: PIN y orgs siguen `env-gated`, y RENAPER real se limita a los 2 tests que dependen del servicio. No cambia el enfoque ni el desglose de tareas.
