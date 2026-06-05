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
| `profile/` | `ProfileHomeComponent` | Built | `ProfileModule` + routing | `CanvasComponent`, `FormFieldComponent`, `SidebarService`, `ProfileService`, `SharedModule` |
| `profile/security` | `SecuritySettingsComponent` | Built | `ProfileModule` + routing | `CanvasComponent`, `FormFieldComponent`, `SidebarService`, `SecurityPinService`, `SharedModule` |
| `profile/security-dialog` | `SecurityPinDialogComponent` | Built | — | `SecurityPinService`, `PendingPrescriptionService`, `WebAuthnService` |
| `profile/biometric` | `BiometricSettingsComponent` | Built | `ProfileModule` + routing | `CanvasComponent`, `SidebarService`, `WebAuthnService`, `SharedModule` |
| `documents/` | `DocumentsHomeComponent` | Built | `DocumentsModule` + routing | `SidebarService`, `SharedModule`, `UnifiedPrinterComponent`, `PrescriptionsService`, `CertificatesService`, `PracticesService`, `StockService`, `AndesPrescriptionsService` |
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
| `edit-user-info/` | — | — | — | — | x (professionals, pharmacists) | Sí, reemplazado por `features/profile/` |
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
| `spanish-paginator-intl.service.ts` | — | x | Evaluar |

### `features/profile/services/`

| Servicio | Usado por features | Legacy | ¿Se elimina? |
|---|---|---|---|
| `security-pin.service.ts` | x (prescription/create, profile/security) | — | No (nuevo) |
| `pending-prescription.service.ts` | x (prescription/create) | — | No (nuevo) |
| `profile.service.ts` | x (profile) | — | No (nuevo) |
| `webauthn.service.ts` | x (profile/biometric, profile/security-dialog) | — | No (nuevo) |

### `shared/ui/`

| Componente | Usado por features | Legacy | ¿Se elimina? |
|---|---|---|---|
| Todos (`icon`, `card`, `avatar`, `badge-chip`, `item-card`, `search-bar`) | — | — | No — son nuevos, se usarán en features |

### `shared/` restante

| Pieza | Usado por features | Legacy | Notas |
|---|---|---|---|
| `pipes/patient-name.pipe.ts` | — (vía SharedModule) | x | Migrado a standalone, se hereda |
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
| 2026-07-13 | Creación de `features/documents/` con `DocumentsHomeComponent`. Sección "Documentos" en sidebar para profesionales. Visualización de recetas, certificados, prácticas e insumos con búsqueda, paginación, impresión PDF y acciones de borrado/anulación. No modifica código legacy | `documents/` |

---

> **Siguientes pasos prioritarios según arquitectura target:**
> 1. Completar feature `auth` (register, forgot, reset, new-user)
> 2. Migrar `header` y `footer` a `shared/components/layout/`
> 3. Iniciar feature `professionals`
> 4. ~~Implementar seguridad en `profile/` (PIN + biometría WebAuthn)~~ ✅ Completado
