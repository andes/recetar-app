---
name: recetar-app-architecture
description: Define la estructura de archivos target y las reglas de ubicación para recetar-app (frontend). Consultá este skill antes de crear archivos nuevos o mover existentes.
---

# RecetAR — Architecture & Structure Skill

Este skill documenta la estructura de carpetas objetivo y las reglas de ubicación del frontend `recetar-app`, basadas en el plan de renovación (`RECETAR Plan de renovación.md`).

## Target Structure

```
src/app/
├── core/                          # Servicios singleton, guards, interceptors
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── logger.service.ts
│   │   └── token-interceptor.service.ts
│   ├── guards/
│   │   ├── auth.guard.ts
│   │   ├── role-professional.guard.ts
│   │   └── ...
│   └── interceptors/
│       └── error.interceptor.ts
├── features/                      # Módulos por funcionalidad (TODO lo nuevo aquí)
│   ├── auth/                      # (migrar del raíz existente)
│   ├── professionals/             # (migrar del raíz existente)
│   ├── pharmacists/               # (migrar del raíz existente)
│   ├── audit/                     # (migrar del raíz existente)
│   └── dashboard/                 # ✅ Ya en features/
├── shared/                        # Componentes reutilizables, pipes, directivas
│   ├── components/
│   │   ├── layout/                # Componentes de layout (Canvas, Header*, Footer*)
│   │   │   └── canvas/
│   │   ├── patient-form/
│   │   └── ...
│   ├── pipes/
│   ├── directives/
│   ├── services/
│   └── styles/
│       └── _variables.sass
├── models/                        # Definiciones de datos
│   ├── entities/                  # Clases de dominio (Patient, Prescription)
│   ├── dto/                       # DTOs de request/response
│   └── adapters/                  # Patrón adapter (PatientAdapter, etc.)
├── utils/                         # Validadores, helpers
│   └── custome-validators/
└── animations/
```

## Reglas De Ubicación

### Código Nuevo

| Tipo de archivo | Ubicación |
|---|---|
| Feature module nuevo | `features/{feature-name}/` |
| Página (ruteable) | `features/{feature-name}/pages/{page-name}/` |
| Componente interno de feature | `features/{feature-name}/components/{comp-name}/` |
| Componente compartido | `shared/components/{group}/{comp-name}/` |
| Pipe compartido | `shared/pipes/` |
| Directiva compartida | `shared/directives/` |
| Entity/DTO/Adapter | `models/entities/`, `models/dto/`, `models/adapters/` |
| Utilidad | `utils/` |
| Guard/Interceptor global | `core/guards/`, `core/interceptors/` |
| Servicio core (auth, logger) | `core/services/` |

### Código Existente

- **No se mueve big-bang.** Se migra incrementalmente, feature por feature.
- Los módulos existentes en `src/app/auth/`, `src/app/professionals/`, `src/app/pharmacists/`, `src/app/audit/` se mantienen donde están hasta su migración planificada a `features/`.
- Los componentes existentes en `src/app/shared/layouts/` (Header, Footer) se migrarán a `shared/components/layout/` cuando se refactoricen a standalone.

### Estructura Interna De Un Feature Module

```
features/{feature}/
├── {feature}.module.ts            # NgModule (o standalone routing)
├── {feature}-routing.module.ts    # RouterModule.forChild(routes)
├── pages/                         # Componentes ruteables (uno por ruta)
│   └── {page-name}/
│       ├── {page-name}.component.ts
│       ├── {page-name}.component.html
│       └── {page-name}.component.sass
├── components/                    # Sub-componentes no ruteables
│   └── {component-name}/
│       ├── {component-name}.component.ts
│       ├── {component-name}.component.html
│       └── {component-name}.component.sass
├── services/                      # Servicios específicos del feature
├── guards/                        # Guards específicos del feature
└── models/                        # DTOs específicos del feature
```

## Componentes De Layout

### Canvas

- **Ubicación:** `shared/components/layout/canvas/`
- **Selector:** `app-canvas`
- **Propósito:** Shell de página que controla header, sidebar y footer.
- **Inputs:** `showHeader`, `showSidebar`, `showFooter` (boolean, default `true`)
- **Uso típico:**
  ```html
  <app-canvas [showSidebar]="true">
    <div sidebar>...navegación...</div>
    ...contenido principal...
  </app-canvas>
  ```

### Header y Footer (existente)

- **Ubicación actual:** `shared/layouts/header/` y `shared/layouts/footer/`
- **Ubicación target:** `shared/components/layout/header/` y `shared/components/layout/footer/`
- Se migrarán cuando se refactoricen a standalone components.

## Path Aliases

Definidos en `tsconfig.json`. Usar siempre que sea posible:

| Alias | Resuelve |
|---|---|
| `@auth/*` | `app/auth/*` |
| `@services/*` | `app/services/*` |
| `@interfaces/*` | `app/interfaces/*` |
| `@shared/*` | `app/shared/*` |
| `@utils/*` | `app/utils/*` |
| `@professionals/*` | `app/professionals/*` |
| `@pharmacists/*` | `app/pharmacists/*` |
| `@audit/*` | `app/audit/*` |
| `@animations/*` | `app/animations/*` |
| `@root/*` | `src/*` |
| `@dashboard/*` | `app/features/dashboard/*` |

Agregar nuevos aliases en `tsconfig.json` cuando se cree una nueva feature en `features/`.

## Convenciones De UI (Angular Material)

- **Cada feature module importa solo los Material modules que necesita**, no todo `MatXxxModule` indiscriminadamente.
- **Para layout**, preferir `MatToolbar` (headers), `MatSidenav`/`MatSidenavContainer` (sidebar), `MatCard` (contenedores).
- **Para navegación en sidebar**, usar `MatNavList` con `MatListItem`.
- **Para formularios**, usar `MatFormField` + `MatInput`/`MatSelect`/etc.
- **Tokens de diseño** están en `shared/styles/_variables.sass`; importarlos con `@use 'styles/variables' as *`.
- **No hardcodear colores, borders, shadows ni radius** — usar siempre las variables de diseño.

## Convenciones De Nomenclatura

- **Directorios:** kebab-case (`dashboard-home`, `patient-form`, `edit-user-info`)
- **Clases/Interfaces:** PascalCase (`DashboardHomeComponent`, `AuthService`)
- **Archivos:** kebab-case con punto separador de tipo (`dashboard-home.component.ts`, `auth.service.ts`)
- **Selectores:** prefijo `app-` (`app-canvas`, `app-dashboard-home`)
- **Módulos Angular:** `{Feature}Module`, `{Feature}RoutingModule`

## Orden De Implementación

1. ✅ Skill de UI/UX (`recetar-app-ui-ux.md`)
2. ✅ Canvas component (`shared/components/layout/canvas/`)
3. 🔄 Dashboard feature (`features/dashboard/`)
4. ⬜ Header refactor (mover a `shared/components/layout/header/`)
5. ⬜ Footer refactor (mover a `shared/components/layout/footer/`)
6. ⬜ Auth pages → aplicar Canvas
7. ⬜ Professionals module → migrar a `features/`
8. ⬜ Pharmacists module → migrar a `features/`
9. ⬜ Audit module → migrar a `features/`
