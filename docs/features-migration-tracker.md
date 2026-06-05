# Features Migration Tracker

> **Regla:** este archivo se actualiza al crear, modificar o eliminar componentes/features en `src/app/features/`.  
> Revisarlo antes y después de cada cambio para mantener visibilidad de qué está migrado y qué queda por migrar.

---

## 1. Features (nuevo)

| Feature | Páginas / Componentes | Estado | Módulo/Routing | Dependencias de `@shared/` |
|---|---|---|---|---|
| `auth/pages/login/` | `LoginComponent` | Built | No (standalone, lazy) | `CanvasComponent`, `FormFieldComponent`, `getHttpErrorMessage` |
| `auth/` (resto) | `register`, `forgot`, `reset`, `new-user`, etc. | Planned | — | — |
| `dashboard/` | `DashboardHomeComponent` | Built | `DashboardModule` + routing | `SidebarService`, `SidebarItem`, `SharedModule` |
| `prescription/create/` | `NewPrescriptionComponent`, `MedicationSearchComponent` | Built | `PrescriptionCreateModule` + routing | `EditPatientComponent`, `SidebarService`, `SidebarItem`, `NotificationService`, `FrequencyTrackerService`, `SharedModule`, `SecurityPinDialogComponent`, `SecurityPinService`, `PendingPrescriptionService` |
| `prescription/` (resto) | `list`, `detail`, `edit` | Planned | — | — |
| `profile/` | `ProfileHomeComponent` (shell: identidad + menú lateral + panel activo) | Built | `ProfileModule` + routing (`/perfil`) | `CanvasComponent`, `SidebarService`, `ProfileService`, `AuthService`, `SharedModule`, `UiAvatarComponent`, `AccountPanelComponent`, `PasswordPanelComponent`, `PinPanelComponent`, `OrganizationsPanelComponent` |
| `profile/components/account-panel` | `AccountPanelComponent` | Built | standalone | `FormFieldComponent`, `ProfileService` |
| `profile/components/password-panel` | `PasswordPanelComponent` | Built | standalone | `FormFieldComponent`, `AuthService` |
| `profile/components/pin-panel` | `PinPanelComponent` | Built | standalone | `FormFieldComponent`, `SecurityPinService` |
| `profile/components/organizations-panel` | `OrganizationsPanelComponent` | Built | standalone | `OrganizationsService`, `OrganizationsDialogComponent`, `UiEmptyStateComponent` |
| `profile/security-dialog` | `SecurityPinDialogComponent` | Built | — | `SecurityPinService`, `PendingPrescriptionService`, `WebAuthnService` |
| `documents/` | `DocumentsHomeComponent` | Built | `DocumentsModule` + routing | `SidebarService`, `SharedModule`, `UnifiedPrinterComponent`, `PrescriptionsService`, `CertificatesService`, `PracticesService`, `StockService`, `AndesPrescriptionsService` |
| `pharmacists/` | `DispenseHomeComponent`, `DispenseItemComponent`, `DispensePreviewPanelComponent` | Built | `FeaturesPharmacistsModule` + routing (`/farmacias/dispensar-nuevo`) | `SidebarService`, `UnifiedPrinterComponent`, `DispenseService` |
| `professionals/` | Todo el módulo legacy | Planned | — | — |
| `pharmacists/` | Todo el módulo legacy | Planned | — | — |
| `audit/` | Todo el módulo legacy | Planned | — | — |

---

## 2. Shared components — matriz de uso

Leyenda: **Usado por features** / _Solo usado por legacy_ / ~~No usado~~

### `shared/components/`

| Componente | Login | Dashboard | Prescription | Profile | Legacy | ¿Se elimina? |
|---|---|---|---|---|---|---|
| `layout/canvas/` | x | — | — | x | x (auth legacy) | No |
| `layout/sidebar/` | — | x | x | x | x (dashboard legacy) | No |
| `edit-patient/` | — | — | x | — | x (professionals) | No |
| `form-field/` | x | — | — | x | — | No |
| `edit-user-info/` | — | — | — | — | ~~x (professionals, pharmacists)~~ | Eliminado (reemplazado por `features/profile/`) |
| `patient-form/` | — | — | — | — | x (professionals, pharmacists, audit) | Evaluar al migrar esas features |
| `public-certificate/` | — | — | — | — | x (ruta pública standalone + lazy) | Evaluar si se recrea en features |
| `public-practice/` | — | — | — | — | x (ruta pública standalone + lazy) | Evaluar si se recrea en features |
| `unified-printer/` | — | — | — | — | x (professionals, pharmacists, audit) | Evaluar al migrar esas features |
| `security-pin-dialog/` | — | — | x | x | — | No (nuevo, standalone) |

### `shared/layouts/`

| Componente | Login | Dashboard | Prescription | Legacy | ¿Se elimina? |
|---|---|---|---|---|---|
| `header/` | — | — | — | x (app shell) | Migrar a `shared/components/layout/header/` |
| `footer/` | — | — | — | x (app shell) | Migrar a `shared/components/layout/footer/` |

### `shared/services/`

| Servicio | Usado por features | Legacy | ¿Se elimina? |
|---|---|---|---|
| `sidebar.service.ts` | x (dashboard, prescription, profile) | x | No |
| `notification.service.ts` | x (prescription, profile) | x | No |
| `frequency-tracker.service.ts` | x (prescription) | x | No |
| `breakpoint.service.ts` | — | x | Evaluar |
| `theme.service.ts` | — | x | Evaluar |
| `spanish-paginator-intl.service.ts` | x (all) | x | No — ahora es root-provided, aplica globalmente |

### `features/profile/services/`

| Servicio | Usado por features | Legacy | ¿Se elimina? |
|---|---|---|---|
| `security-pin.service.ts` | x (prescription/create, profile/security) | — | No (nuevo) |
| `pending-prescription.service.ts` | x (prescription/create) | — | No (nuevo) |
| `profile.service.ts` | x (profile) | — | No (nuevo) |
| `webauthn.service.ts` | x (profile/biometric, profile/security-dialog) | — | No (nuevo) |
| `organizations.service.ts` | x (profile/organizations) | — | No (nuevo) |

### `shared/ui/`

| Componente | Usado por features | Legacy | ¿Se elimina? |
|---|---|---|---|
| Todos (`icon`, `card`, `avatar`, `badge-chip`, `item-card`, `search-bar`, `section-divider`, `document-list`, `toggle`, `accordion`, `paginator`, `draft-tag`) | x (documents, dashboard, prescription) | — | No — son nuevos, se usarán en features |

### `shared/` restante

| Pieza | Usado por features | Legacy | Notas |
|---|---|---|---|
| `pipes/patient-name.pipe.ts` | — (vía SharedModule) | x | Migrado a standalone, se hereda |
| `pipes/capitalize.pipe.ts` | — (vía SharedModule) | | Standalone; capitaliza solo la primera letra sin alterar el resto |
| `pipes/titlecase.pipe.ts` | — (vía SharedModule) | | Standalone; capitaliza cada palabra y baja el resto |
| `pipes/uppercase.pipe.ts` | — (vía SharedModule) | | Standalone |
| `ngx-turnstile/` | — | x (auth legacy) | Evaluar al migrar register |
| `not-found/` | — | x (ruta pública standalone + lazy) | Podría migrarse a features |
| `utils/http-error.util.ts` | x (login) | x | No |
| `shared.module.ts` | x (dashboard, prescription) | x | Se eliminará cuando todos los consumidores migren a standalone |

---

## 3. Código viejo (legacy) — checklist de reemplazo

### `src/app/auth/` (módulo legacy)

| Pieza | Cantidad | Reemplazado por | Estado |
|---|---|---|---|
| `auth.module.ts` | 1 | — | Se eliminará al migrar todo |
| `auth-routing.module.ts` | 1 | — | Se eliminará al migrar todo |
| `components/` | 7 | `features/auth/pages/` | `login` migrado, 6 pendientes |
| `guards/` | 5 | `core/guards/` (target) | Pendiente migración |
| `services/auth.service.ts` | 1 | `core/services/` (target) | Pendiente migración |
| `services/ambito.service.ts` | 1 | — | Evaluar |
| `models/tokens.ts` | 1 | — | Evaluar |
| `token-initializer.service.ts` | 1 | `core/` (target) | Pendiente migración |
| `token-interceptor.service.ts` | 1 | `core/` (target) | Pendiente migración |
| `httpInterceptorProvider.ts` | 1 | `core/` (target) | Pendiente migración |

### `src/app/professionals/` (módulo legacy)

| Pieza | Cantidad | Reemplazado por | Estado |
|---|---|---|---|
| `professionals.module.ts` | 1 | `features/professionals/` | Planeado |
| `professionals-routing.module.ts` | 1 | `features/professionals/` | Planeado |
| `components/` | 13 | `features/professionals/pages/` y `components/` | Planeado |
| `services/` | 2 | `features/professionals/services/` | Planeado |
| `guards/` | 1 | — | Evaluar |
| `supply.component.ts` (root) | 1 | — | Evaluar |

### `src/app/pharmacists/` (módulo legacy)

| Pieza | Cantidad | Reemplazado por | Estado |
|---|---|---|---|
| `pharmacists.module.ts` | 1 | `features/pharmacists/` | Planeado |
| `pharmacists-routing.module.ts` | 1 | `features/pharmacists/` | Planeado |
| `components/` | 6 | `features/pharmacists/pages/` y `components/` | Planeado |
| `pipes/` | 1 | Evaluar si se mueve a shared | Planeado |

### `src/app/audit/` (módulo legacy)

| Pieza | Cantidad | Reemplazado por | Estado |
|---|---|---|---|
| `audit.module.ts` | 1 | `features/audit/` | Planeado |
| `audit-routing.module.ts` | 1 | `features/audit/` | Planeado |
| `components/` | 7 | `features/audit/pages/` y `components/` | Planeado |
| `pipes/` | 1 | Evaluar si se mueve a shared | Planeado |

### `src/app/services/` (servicios de dominio legacy)

| Servicio | Archivos | ¿Migrado a feature? | Estado |
|---|---|---|---|
| Prescriptions | `prescriptions.service.ts` | `features/prescription/create/services/` tiene `prescription-draft.service.ts` (servicio nuevo, no reemplazo) | Evaluar |
| Practices | `practices.service.ts` | — | Planeado |
| Certificates | `certificates.service.ts` | — | Planeado |
| Patients | `patients.service.ts` | — | Planeado |
| Professionals | `professionals.service.ts` | — | Planeado |
| Pharmacists | `pharmacists.service.ts` | — | Planeado |
| Users | `users.service.ts` | — | Planeado |
| Stock | `stock.service.ts` | — | Planeado |
| Supplies | `supplies.service.ts` | — | Planeado |
| Roles | `roles.service.ts` | — | Planeado |
| Insurance | `insurance.service.ts` | — | Planeado |
| Andes search | `andes-search.service.ts` | — | Planeado |
| Andes prescriptions | `andesPrescription.service.ts` | — | Planeado |
| Barcode | `barcode.service.ts` | — | Planeado |
| Organizaciones Andes | `organizacionesAndes.service.ts` | — | Planeado |
| Snomed supplies | `snomedSupplies.service.ts` | — | Planeado |
| Vademecum | `vademecum.service.ts` | — | Planeado |

### `src/app/interfaces/` (modelos legacy)

Todos los modelos, DTOs y adapters del directorio `interfaces/` se migrarán a `models/entities/`, `models/dto/` o `models/adapters/` según corresponda, siguiendo la arquitectura target.

---

## 4. Historial de cambios

| Fecha | Cambio | Feature afectada |
|---|---|---|
| 2026-07-01 | Creación del tracker | — |
| 2026-07-01 | Inventario inicial de features, shared y legacy | — |
| 2026-07-02 | Creación de `features/profile/` con `ProfileHomeComponent` para editar datos personales (email, businessName, username). Reemplaza a `shared/components/edit-user-info/` | `profile/` |
| 2026-07-02 | Implementación de seguridad con PIN: `SecurityPinService`, `PendingPrescriptionService`, `SecurityPinDialogComponent`. Integración en `NewPrescriptionComponent` con persistencia de borradores en localStorage para reintentos | `profile/security`, `prescription/create/` |
| 2026-07-02 | UI de gestión del PIN: `SecuritySettingsComponent` con formularios para activar, cambiar y desactivar PIN. Ruta `/perfil/seguridad` agregada | `profile/security` |
| 2026-07-02 | Implementación de biometría con WebAuthn: `WebAuthnService`, `BiometricSettingsComponent`, integración en `SecurityPinDialogComponent`. Ruta `/perfil/biometria` agregada | `profile/biometric` |
| 2026-07-08 | `LoginComponent` ahora usa `FormFieldComponent` para inputs de usuario y contraseña. `FormFieldComponent` extendido con soporte `type='password'` y `(suffixClick)` para toggle de visibilidad | `auth/login`, `shared/form-field` |
| 2026-07-23 | Creado `UiAccordionComponent` en `shared/ui/`. `DocumentTabsComponent` (Paso 2) reemplaza `ui-table` por `ui-accordion` para historial de recetas. Eliminado `MatTableModule` de `PrescriptionCreateModule` | `prescription/create/`, `shared/ui/` |
| 2026-08-04 | Creado `UiDraftTagComponent` en `shared/ui/`. Extraido el banner "Borrador" con pulse animation de `ui-card` (se elimino `variant='draft'` y sus inputs). `DocumentTabsComponent`, `CertificateFormComponent` y `PracticeFormComponent` migrados a `ui-draft-tag`. | `shared/ui/`, `prescription/create/` |
| 2026-08-10 | Registrada feature `pharmacists/` (pantalla dispensar-nuevo). El panel de medicamentos del día se refresca al dispensar o cancelar dispensa, alimentado por `GET /prescriptions/medications-summary` (backend nuevo). | `pharmacists/` |
| 2026-08-10 | La pantalla de dispensar reemplaza la tabla por cards: nuevo `DispenseItemComponent` enfocado en medicamento + paciente, usando `ui-paginator` directamente en el home. `DispenseTableComponent` queda sin uso (sin declarar) hasta decidir su eliminación. | `pharmacists/` |
| 2026-08-10 | Rediseño visual de `DispenseItemComponent` al layout "ticket split": contenido (tags fuente/tipo, medicamento, paciente, fecha de emisión, cantidad) a la izquierda y banda lateral con estado, countdown y acciones apiladas a la derecha. Layout responsivo a pila en pantallas chicas. | `pharmacists/` |
| 2026-08-10 | `DispenseItemComponent` ahora renderiza cada receta como `<ui-card>` (shared/ui) con `[bordered]`, sobreescribiendo solo el body (flex row, sin padding) vía `::ng-deep` scoped. Se quita el estado `selected` del item. | `pharmacists/` |
| 2026-08-18 | Pantalla dispensar-nuevo: se elimina el panel "Medicamentos del día" (`DispenseMedicationsPanelComponent` + `DispenseMedicationsService`) y el drawer (`DispenseDrawerComponent`). En su lugar, un sidebar de vista previa (`DispensePreviewPanelComponent`) con la receta seleccionada (por defecto la primera) y borde de color en el item activo. El confirm dialog ahora muestra paciente/DNI/profesional/fecha/cantidad y reemplazo. El reemplazo se guarda como medicamento actual y el original en `replacedMedication`. Se elimina `DispenseTableComponent` (dead code). | `pharmacists/` |
| 2026-08-19 | `DispensePreviewPanelComponent`: la fecha de prescripción se mueve al header (reemplaza el código RX) y junto a la cantidad de envases se muestra el total de unidades (`getUnits()`). Se agregan datos faltantes del paciente: sexo en la línea DNI, y obra social + nº de afiliado como campos (`getPatientSex`, `getPatientObraSocial`, `getPatientAfiliado`). | `pharmacists/` |
| 2026-08-19 | La vista previa de receta deja de ser un sidebar sticky y pasa a un drawer que se abre al clickear un ítem de resultados. Nuevo componente standalone `UiDrawerComponent` en `shared/ui/` (wrapper sobre `mat-drawer-container`/`mat-drawer`, mode `over`, position `end`). `DispenseHomeComponent` maneja `drawerOpen` (abrir al seleccionar, cerrar con X o backdrop). `DispensePreviewPanelComponent` ahora llena la altura del drawer (scroll interno en `.preview-scroll`). | `pharmacists/`, `shared/ui/` |
| 2026-08-19 | `DispensePreviewPanelComponent`: debajo de Profesional se agrega la sección Organización (`getOrganization()`), mostrando `organizacion.nombre` de Andes o local. | `pharmacists/` |
| 2026-08-19 | `DispensePreviewPanelComponent`: limpieza de estilos ad-hoc. Los nombres (`strong`) usan la utility `text-base` (14px) en vez del default 16px bold, labels y meta usan `text-xs`, y se eliminan overrides de `.mat-icon` (32px/13px) y font-sizes hardcodeados (11px/12px). | `pharmacists/` |
| 2026-08-19 | `DispensePreviewPanelComponent`: el indicador de origen (dot + label "RecetAR/Andes") se reemplaza por un badge de estado en el header del detalle. Usa `getStatusVariant`/`getStatusLabel` de `shared/utils/status.utils` (mismo patrón que `dispense-item`) y un punto de color (`currentColor`) antes del texto. Se elimina `getSourceLabel()`. | `pharmacists/` |
| 2026-08-19 | `DispensePreviewPanelComponent`: se agregan botones Imprimir y Dispensar (en fila, arriba del badge de estado y la fecha). Emite `print`/`dispense`; `DispenseHomeComponent` los conecta a `onPrint`/`onDispense`. El botón Dispensar solo aparece si `isPending()` (pendiente/vigente). | `pharmacists/` |
| 2026-08-19 | Los botones Imprimir/Dispensar pasan de la cabecera del preview a un **footer fijo del drawer**. `UiDrawerComponent` gana un slot `[drawerFooter]` (`.ui-drawer-footer`, flex-shrink 0, border-top). `DispenseHomeComponent` proyecta las acciones y agrega `isPendingSelected()`; el scroll queda solo en el contenido (`.preview-scroll`). | `shared/ui/`, `pharmacists/` |
| 2026-08-19 | `DispenseItemComponent`: los ítems ocupan menos espacio vertical. La fecha de emisión se mueve al header como badge neutro junto al badge de estado, y el vencimiento (emisión + 30 días, `get expirationDate()`) se muestra como badge al lado, con variante warning cuando está próximo a vencer. Se elimina la cantidad de envases y el `mat-divider`/`.di-meta`. El título del medicamento queda en una sola línea con ellipsis. | `pharmacists/` |
| 2026-08-20 | Nuevo componente standalone `UiUndoCountdownComponent` (`ui-undo-countdown`, `shared/ui/`): muestra la **ventana de deshacer** (gracia de 2 h desde `dispensedAt`) como una fila compacta con icono reloj + tiempo restante (`mm:ss`) y una barrita fina (40×3px) a la derecha que se consume en tiempo real (timer de 1 s, `percent = restante/2h*100`), todo alineado verticalmente. Se usa en `DispenseItemComponent` junto a los badges (`.di-tags`, `*ngIf="canCancelDispense"`) y en `DispensePreviewPanelComponent` junto al badge de estado del drawer (`.top-left`, `*ngIf="isDispensed()"`). Se eliminó el `.di-countdown` estático de la columna derecha del item. | `shared/ui/`, `pharmacists/` |
| 2026-08-20 | Botón **Dispensar** en `DispenseItemComponent` y en el footer del drawer de `DispenseHomeComponent`: ahora es **siempre visible** y cambia de apariencia según se pueda dispensar. Cuando el status es `pendiente`/`vigente` (`isPending` / `isPendingSelected()`) se ve `filled` (operativo); cuando no, es un **botón fantasma**: apariencia `outlined` y `[disabled]`, sin disparar la operación de dispensa (se quitó el `*ngIf` que lo ocultaba). En los items, si está dispensada (hay botón Deshacer) el Dispensar no se muestra (`*ngIf="!isDispensed"`). El botón **Deshacer** (solo si `isDispensed`) usa `outlined` + `color="warn"` y también aparece en el drawer reemplazando al Dispensar (`isDispensedSelected()`). | `pharmacists/` |
| 2026-08-20 | `DispensePreviewPanelComponent`: cuando la receta está vencida (`isExpired()`, status `vencida`) se muestra una sección **Vencimiento** debajo del medicamento, con el mismo patrón que la sección Dispensación (`.dispense-section`): icono `event_busy` variante `error` y la fecha de vencimiento (`getExpirationDate()`, fecha base + 30 días, igual que `DispenseItemComponent`) en `text-sm`. | `pharmacists/` |
| 2026-08-20 | `UiDrawerComponent`: el header de canvas quedaba tapado por el contenido (p. ej. el listado de items de dispensa). Causa: `.ui-drawer-container.mat-drawer-container` tenía `z-index: 1400` (por encima del header `1100`), por lo que todo el contenido pintaba sobre el header. Fix: el contenedor pasa a `z-index: auto` (deja de crear stacking context, el contenido queda en z-index 1, debajo del header `1100`). Al abrir, el drawer actúa como modal a pantalla completa: backdrop `z-index: 1200` (oscurece header `1100` y sidebar `1000`) y panel `position: fixed; top: 0; bottom: 0; z-index: 1300` (ocupa toda la altura, por encima del backdrop). | `shared/ui/` |
| 2026-08-20 | `DispensePreviewPanelComponent`: la sección Dispensación se mueve de abajo del detalle a **debajo del bloque del medicamento** (`.dispense-section` con padding alineado). La fecha usa `text-sm` (mismo tamaño que el nombre del profesional) y el nombre de quien dispensó ahora se muestra con `| titlecase`. | `pharmacists/` |
| 2026-08-20 | Nuevo pipe standalone `CapitalizePipe` (`capitalize`) en `shared/pipes/`, registrado en `SharedModule`. En `DispensePreviewPanelComponent` la descripción del medicamento (`getMedicationDetail()`), el diagnóstico y las indicaciones se muestran con la primera letra en mayúscula (`| capitalize`) sin alterar el resto del texto. | `pharmacists/`, `shared/pipes/` |
| 2026-08-20 | `DispenseHomeComponent`: la sombra de hover/selected de los items se veía recortada en los bordes laterales. Causa raíz: `mat-drawer-content` es un selector de **elemento** de Material y el template del drawer usaba `<div mat-drawer-content>`, que no matchea; el contenedor auto-creaba un `<mat-drawer-content>` extra (con `overflow: auto`) que recortaba la sombra, y las reglas CSS apuntaban al div interno. Fix: el template ahora usa `<mat-drawer-content class="ui-drawer-content">`; se fuerza `overflow: visible !important` en `.ui-drawer-content` y en `.ui-drawer-container.mat-drawer-container`; la página escrolea en el body. Al abrir el drawer se bloquea el scroll (`html/body.ui-drawer-open { overflow: hidden }`) y se compensa el layout shift por la desaparición de la barra de scroll aplicando `padding-right` al body igual al ancho de scrollbar medido en JS (`window.innerWidth - documentElement.clientWidth`). | `shared/ui/`, `pharmacists/` |
| 2026-08-20 | `DispenseItemComponent`: los títulos (y nombres de paciente) largos estiraban el item horizontalmente. Causa: bug clásico de `min-width: auto` en flex — el `h3` ya truncaba con ellipsis, pero los hosts `app-dispense-item` y `ui-card` (clase `.dispense-item`) no tenían `min-width: 0`, así que el min-content se calculaba con el texto completo y el item no podía encogerse. Fix: `min-width: 0` en `:host` y `.dispense-item`, y `flex: 1` + `min-width: 0` en el `strong` del paciente. | `pharmacists/` |
| 2026-08-20 | Búsqueda/paginación de la pantalla dispensar-nuevo. **Frontend** (`DispenseHomeComponent`): `_total` nunca se actualizaba, así que el rango de resultados quedaba fijo en "0–0" (aunque `total$` mostraba el total); ahora se sincroniza `_total` suscribiéndose a `total$` en `ngOnInit` (unsubscribe en `ngOnDestroy`). **API** (`prescriptions`): el endpoint `GET /prescriptions` ignoraba `offset` (leía solo `skip`), `status`, `dateFrom`, `dateTo` y `searchTerm`, por lo que la paginación y el selector de items por página no hacían nada y el total era `countDocuments({})` (todas las recetas, sin filtros). Fix: `index` del controller acepta `offset` (fallback `skip`) y los filtros; el service llama `expireOldPrescriptions()` y delega en `findWithFilters` del repository (regex case-insensitive de status, rango de fechas sobre `date`, `$or` por nombre del paciente/DNI/`prescriptionId`/medicamento/profesional) con `total = countDocuments(filter)`. `findByPatient` también acepta `offset` (fallback `skip`) y `dateFrom`/`dateTo` (alias de `startDate`/`endDate`). | `pharmacists/` |
| 2026-08-20 | Búsqueda automática + filtro de sexo en la pantalla dispensar-nuevo. **Frontend** (`DispenseHomeComponent`): se elimina el botón "Filtrar"; cualquier cambio de filtro dispara el request automáticamente — el texto del search con `debounceTime(500)` + `distinctUntilChanged` (espera a que dejes de escribir) y los filtros (estado, sexo, fechas) de inmediato. Todo pasa por un único `buildFilters()` (`{ status, sexo, dateFrom, dateTo, searchTerm }`), se resetea `pageIndex = 0` en cada cambio (vuelve a contar desde el principio) y se agrega `destroy$` + `takeUntil` para limpiar suscripciones. El estado por defecto es "Pendiente / Vigente" (`statusControl` arranca en `pendiente`; "Todos los estados" ahora sí muestra todos) y el badge de filtros activos no cuenta el default. Se agrega el select **Sexo** (`m`/`f`/Todos) al panel de filtros. **Service** (`DispenseService`): refactor de `load()` a `switchMap` sobre `queryTrigger$` — cada `load()` cancela el request en vuelo y emite el nuevo (evita que resultados viejos pisen a los nuevos); `DispenseFilters` gana `sexo` y se envía como param en `loadByDni` y `loadGeneric`. **API** (`prescriptions`): `findByPatient` acepta `sexo` y lo usa en la consulta a ANDES (`getPrescriptionsByDni`, reemplaza el `sexo: ''` hardcodeado — ANDES requiere documento + sexo) y filtra las locales por `patient.sex` (regex de prefijo, matchea `M`/`Masculino`/`m`); `index`/`findWithFilters` también filtran por `patient.sex`. `GetPrescriptionsByDniParams.sexo` pasa a opcional. OpenAPI sincronizado (`sexo`/`offset`/filtros en `/prescriptions` y `/prescriptions/find/{patientId}`). | `pharmacists/` |
| 2026-08-20 | `DispenseHomeComponent`: el **estado por defecto** pasa a ser "Todos los estados" (`statusControl` arranca en `''`, `loadInitial()` y `onClear()` cargan sin filtro de estado; el badge de filtros activos cuenta el estado solo cuando está seteado). El `ui-paginator` de la pantalla ahora incluye el valor por defecto **20** en `pageSizeOptions` (`[5, 10, 20, 25]`), para que el select de cantidad de items muestre la selección por defecto. | `pharmacists/` |
| 2026-08-20 | `DispenseHomeComponent`: el panel de filtros (`.filter-fields`) es responsive — los 4 filtros (fecha desde, fecha hasta, estado, sexo) van en **una sola fila** en pantallas grandes (≥992px, `repeat(4, 1fr)`), en **2×2** en pantallas medianas (≥769px, `repeat(2, 1fr)`) y **uno por línea** en mobile (default, `1fr`). | `pharmacists/` |
| 2026-08-20 | La **búsqueda** de la pantalla dispensar-nuevo queda limitada a **50 resultados** (tope fijo, independiente del tamaño de página). **API** (`prescriptions`): nueva constante `PRESCRIPTION_SEARCH_LIMIT = 50` en `prescription.types.ts`; `index` y `findByPatient` del controller aplican `Math.min(limit, PRESCRIPTION_SEARCH_LIMIT)` (default 50); el **`total` de la respuesta se limita a 50** (`Math.min(total, PRESCRIPTION_SEARCH_LIMIT)`) y el query se clamp a `PRESCRIPTION_SEARCH_LIMIT - skip` (la última página devuelve solo lo que resta del tope), así el contador muestra "de 50" sin importar el page-size. `findByPatient` recorta el merge de ANDES (`andesResult.slice(0, remaining)`) dentro del clamp. **Frontend**: `DEFAULT_LIMIT = 15`, `pageSize = 15` (por defecto) y `pageSizeOptions = [5, 15, 30]`; el paginador usa `offset = pageIndex * pageSize` y `limit = pageSize` (paginación offset real); el contador muestra el rango de la página sobre el total limitado a 50. | `pharmacists/` |
| 2026-08-20 | El botón **Deshacer dispensa** se **deshabilita** cuando ya pasó la ventana de 2 horas (o no hay `dispensedAt`) y muestra tooltip "Ya no se puede deshacer la dispensa". Aplicado en `dispense-item` (tarjeta del listado) y en `dispense-home` (panel lateral) con nuevos getters `undoDisabled` / `undoDisabledSelected`; el tooltip se coloca en un `span` que envuelve el botón (los tooltips no aparecen en botones deshabilitados) y el wrapper conserva el layout (`display: block` / `flex: 1`). | `pharmacists/` |
| 2026-08-21 | Se elimina la **actualización automática** (timer cada 5 min) que recuperaba nuevas recetas en la pantalla dispensar-nuevo. `DispenseService` pierde `autoRefresh$` (timer(0, 5min)), su suscripción en el constructor y la constante `REFRESH_INTERVAL_MS`; se quita el import de `timer` de `rxjs`. Se conserva la recarga manual por `refreshTrigger$` (botón refresh y tras dispensar/deshacer). | `pharmacists/` |
| 2026-08-21 | La barra de búsqueda de dispensar-nuevo gana un botón de **limpiar** (icono `close`) en el slot `searchAction` de `ui-search-bar`, visible solo cuando hay texto (`.searchControl.value`). Al presionarlo, `onClearSearch()` vacía `searchControl` sin emitir (para no disparar el debounce), resetea `pageIndex = 0` y recarga con los filtros actuales. | `pharmacists/` |
| 2026-08-21 | `DispenseItemComponent`: en la fila de badges (`.di-tags`) se agrega, **antes** del badge de estado, la **fecha de creación** de la receta (`creationDate`) con icono `event` y formato `d MMM yyyy` (locale `es-AR`, p.ej. "12 ago 2026"). El badge de **vencimiento** pasa de mostrar la fecha (`Vence dd/MM/yyyy`) a **contar los días restantes** ("Vence en X días" / "Vence en 1 día", icono `schedule`), visible cuando la receta está pendiente y quedan días (`daysToExpire = ceil(diff/1d)`). Se elimina el getter `isNearExpiry` (sin uso). | `pharmacists/` |
| 2026-08-21 | `DispenseItemComponent`: se indica si el medicamento es **duplicado/triplicado** debajo del nombre del medicamento. `rx-head` pasa a contener una columna `.rx-title` (h3 + `<strong class="rx-type-indicator">`). Usa el getter existente `medicineType`; el label se ve en tamaño small y peso `strong`, coloreado según convención: `duplicado` = `--warning-fill` (amarillo), `triplicado` = `--error-fill` (rojo). | `pharmacists/` |
| 2026-08-21 | `DispensePreviewPanelComponent` (drawer de detalle de dispensar-nuevo): también se muestra el tipo **duplicado/triplicado** bajo el nombre del medicamento, con el mismo `.rx-type-indicator` (small + strong, `--warning-fill`/`--error-fill`). Nuevo método `getMedicineType()` (replica la lógica de `DispenseItemComponent`). | `pharmacists/` |
| 2026-08-21 | `DispenseConfirmDialogComponent`: se rediseña el contenido del modo confirmar para seguir el estilo del drawer de detalle. El bloque del medicamento (`.med`) va en una tarjeta `--receta-bg` con label + `app-medication-item` + cantidad (`med-qty`). El resumen (`summary-box` de filas) se reemplaza por `sections` con `section`/`entity`/`entity-info` (icono + strong/small) para Paciente, Profesional y Dispensación, igual que el preview panel. | `pharmacists/` |
| 2026-08-21 | `DispenseConfirmDialogComponent`: diseño **minimalista** del modo confirmar. Se elimina la info de paciente/profesional/dispensación y los getters asociados (`patientName`, `patientDni`, `professionalName`, `today`, `displayMedication`, y los helpers `isAndes`/`local`/`andes`); se quitan los imports de `AndesPrescriptions`/`Prescriptions`. Queda un `hero` con `app-medication-item` (medicamento original) + cantidad de envases (`.qty`), el botón de cambiar, y si hay reemplazo un bloque `.replacement` (dashed + `--success-bg`) que muestra el medicamento original y el reemplazo. Nuevo getter `replacementMedication`. | `pharmacists/` |
| 2026-08-21 | `DispenseConfirmDialogComponent`: en el modo **Reemplazar medicamento** el botón principal del footer pasa a ser **Seleccionar** (en lugar de "Dispensar" deshabilitado) y desaparece el botón **Cancelar**. El botón llama a `medSearch.confirmMedication()` (el search se referencia con `#medSearch` y `@ViewChild`). En `MedicationSearchComponent` se quitan los botones internos "Seleccionar"/"Cancelar" del modo `simplified` (detalle: solo queda el campo cantidad). Al confirmar el reemplazo (`medicationAdded` → `onReplacementConfirmed`) el modo vuelve a `confirm` y reaparece "Dispensar". | `pharmacists/`, `shared/components/medication-search/` |
| 2026-08-21 | `DispenseConfirmDialogComponent`: el bloque **Reemplazo seleccionado** ahora también muestra la **cantidad** (`replacement.quantity`) igual que el medicamento inicial — `.replacement-main` en fila con `app-medication-item` + `.qty` (número + unidad). Además, cuando hay reemplazo el medicamento inicial (`.hero`) se muestra **tachado** (`text-decoration: line-through` + `--text-disabled` en `.med-name`/`.med-detail` del `app-medication-item`, clase `.struck`). | `pharmacists/` |
| 2026-08-21 | `DispenseConfirmDialogComponent`: debajo del botón de cambiar/buscar medicamento se muestra **para quién es la entrega** — `.delivery-for` centrado con icono `person` y el nombre del paciente en `strong` (getter `patientName` reincorporado). | `pharmacists/` |
| 2026-08-21 | `DispenseHomeComponent`: se agregan **notificaciones** al dispensar y al deshacer una dispensa, tanto en éxito como en error (inyecta `NotificationService`). Éxito: "Dispensa realizada correctamente" / "Dispensa deshecha correctamente"; error: usa `errorMessage` del `DispenseResult` (o mensaje genérico). | `pharmacists/` |
| 2026-08-24 | Perfil unificado: `ProfileHomeComponent` deja de ser un formulario y pasa a ser una **vista de solo lectura + índice de secciones** (identidad + información según rol + configuración), rol-aware (profesional muestra datos personales, matrículas y organizaciones; farmacia muestra datos del establecimiento). El menú del header se reduce a "Mi cuenta" + "Salir". Se crean `AccountSettingsComponent` (`/perfil/cuenta`) y `PasswordSettingsComponent` (`/perfil/password`). Se elimina `shared/components/edit-user-info/` (y sus rutas legacy). Se agrega `RoleProfessionalGuard` a `/perfil/seguridad` y `/perfil/organizaciones`. | `profile/`, `shared/layouts/header/` |
| 2026-08-25 | Perfil consolidado en una sola ruta `/perfil` (split menú lateral + panel de edición). `ProfileHomeComponent` pasa a ser el shell (banda de identidad con avatar/nombre/rol/matrículas + menú de secciones). Se extraen paneles standalone: `AccountPanelComponent`, `PasswordPanelComponent`, `PinPanelComponent` y `OrganizationsPanelComponent` (reusan la lógica de las páginas viejas). Se eliminan las rutas/páginas `/perfil/cuenta`, `/perfil/password`, `/perfil/seguridad`, `/perfil/biometria` y `/perfil/organizaciones` (biometría y cambio de ámbito quedan fuera de alcance). `OrganizationsDialogComponent` migra a standalone. Los links "Agregar organización" de nueva-receta apuntan a `/perfil?seccion=organizaciones`. | `profile/`, `prescription/create/` |
| 2026-08-26 | Rediseño visual de `ProfileHomeComponent` siguiendo la maqueta `profile-redesign.html`: hero de identidad sin avatar (chip de rol violeta + "Identidad verificada" en verde + CUIL/email), columna "Resumen" (Organizaciones + PIN destacado, con estado vía `SecurityPinService.getStatus()`), matrículas como cards con vigencia ("Vigencia hasta MM/YYYY · vence en X") y menú lateral con descripciones por sección. El hint del nombre en `AccountPanelComponent` ahora indica que ese nombre sale en recetas/documentos (solo profesional). `UserAdapter`/interfaz `User` ganan `vencimiento?` en `profesionGrado` (backed por nuevo campo en API + mapeo ANDES en `auth.service` y `user-create` de audit). | `profile/`, `audit/user-create`, `interfaces/users` |
| 2026-08-26 | Limpieza de tipografía hardcodeada en el pantallón de perfil: se eliminan `font-size`/`font-weight`/`line-height`/`letter-spacing`/`text-transform` de los `.sass` de `profile-home`, `account-panel`, `pin-panel` y `security-pin-dialog`, reemplazados por utilities del design system (`text-xs/sm/base/lg/xl/caption`, `text-secondary`, `mono`, `.badge`, `mat-icon.sm/xs`). El SASS queda solo con layout y colores por token. | `profile/` |
| 2026-08-26 | `ProfileHomeComponent` alineado a `shared/ui` (skill `recetar-app-ui-ux`): el hero, las cards de matrícula, la card de habilitación y el contenedor de configuración pasan a `<ui-card [bordered]>` (con overrides scoped `::ng-deep .ui-card-body` para layout, mismo patrón que `dispense-item`); los contenedores de ícono custom (`.mc-icon`/`.hc-icon`/`.menu-icon`/`.pin-icon`) se reemplazan por `<ui-icon>` (variantes primary/secondary/neutral dinámicas) o `mat-icon` plano; los pills de estado usan `.badge badge-success` (no existía `ui-badge-chip` en `shared/ui`, solo documentado en el skill). `ProfileModule` importa `UiCardComponent` y `UiIconComponent`. Se exporta `UiAlertComponent` del barrel `@shared/ui` y se importa en `AccountPanelComponent` (hint del nombre usa `<ui-alert>`, cambio manual del usuario preservado). | `profile/`, `shared/ui/` |

---

> **Siguientes pasos prioritarios según arquitectura target:**
> 1. Completar feature `auth` (register, forgot, reset, new-user)
> 2. Migrar `header` y `footer` a `shared/components/layout/`
> 3. Iniciar feature `professionals`
> 4. ~~Implementar seguridad en `profile/` (PIN + biometría WebAuthn)~~ ✅ Completado
