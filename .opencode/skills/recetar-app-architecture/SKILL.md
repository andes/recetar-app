---
name: recetar-app-architecture
description: Define la estructura de archivos target y las reglas de ubicacion para recetar-app (frontend). Consulta este skill antes de crear archivos nuevos o mover existentes.
---

# RecetAR -- Architecture & Structure Skill

Este skill documenta la estructura de carpetas objetivo y las reglas de ubicacion del frontend `recetar-app`, basadas en el plan de renovacion (`RECETAR Plan de renovacion.md`).

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
├── features/                      # Modulos por funcionalidad (TODO lo nuevo aqui)
│   ├── auth/                      # (migrar del raiz existente)
│   ├── professionals/             # (migrar del raiz existente)
│   ├── pharmacists/               # (migrar del raiz existente)
│   ├── audit/                     # (migrar del raiz existente)
│   └── dashboard/                 # Ya en features/
├── shared/                        # Componentes reutilizables, pipes, directivas
│   ├── components/
│   │   ├── layout/                # Componentes de layout (Canvas, Header*, Footer*)
│   │   │   └── canvas/
│   │   ├── patient-form/
│   │   ├── search-input/
│   │   └── ...
│   ├── ui/                        # Componentes UI single-file, standalone
│   │   ├── icon.component.ts      #   Icono con contenedor de fondo opcional
│   │   ├── item-card.component.ts #   Card clickeable (icon + title + meta + chevron)
│   │   ├── card.component.ts     # Card con header opcional (icon + title + subtitle + actions) y cuerpo
│   │   ├── avatar.component.ts    #   Avatar circular (iniciales o icono)
│   │   ├── badge-chip.component.ts#   Chip de estado semantico
│   │   └── index.ts               #   Barrel export
│   ├── pipes/
│   ├── directives/
│   ├── services/
│   └── styles/
│       └── _variables.sass
├── models/                        # Definiciones de datos
│   ├── entities/                  # Clases de dominio (Patient, Prescription)
│   ├── dto/                       # DTOs de request/response
│   └── adapters/                  # Patron adapter (PatientAdapter, etc.)
├── utils/                         # Validadores, helpers
│   └── custome-validators/
└── animations/
```

## Reglas De Ubicacion

### Codigo Nuevo

| Tipo de archivo | Ubicacion |
|---|---|
| Feature module nuevo | `features/{feature-name}/` |
| Pagina (ruteable) | `features/{feature-name}/pages/{page-name}/` |
| Componente interno de feature | `features/{feature-name}/components/{comp-name}/` |
| Componente compartido | `shared/components/{group}/{comp-name}/` |
| Pipe compartido | `shared/pipes/` |
| Directiva compartida | `shared/directives/` |
| Entity/DTO/Adapter | `models/entities/`, `models/dto/`, `models/adapters/` |
| Utilidad | `utils/` |
| Guard/Interceptor global | `core/guards/`, `core/interceptors/` |
| Servicio core (auth, logger) | `core/services/` |

### Codigo Existente

- **No se mueve big-bang.** Se migra incrementalmente, feature por feature.
- Los modulos existentes en `src/app/auth/`, `src/app/professionals/`, `src/app/pharmacists/`, `src/app/audit/` se mantienen donde estan hasta su migracion planificada a `features/`.
- Los componentes existentes en `src/app/shared/layouts/` (Header, Footer) se migraran a `shared/components/layout/` cuando se refactoricen a standalone.

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
├── services/                      # Servicios especificos del feature
├── guards/                        # Guards especificos del feature
└── models/                        # DTOs especificos del feature
```

## Componentes De Layout

### Canvas

- **Ubicacion:** `shared/components/layout/canvas/`
- **Selector:** `app-canvas`
- **Proposito:** Shell de pagina que controla header, sidebar y footer.
- **Inputs:** `showHeader`, `showSidebar`, `showFooter` (boolean, default `true`)
- **Uso tipico:**
  ```html
  <app-canvas [showSidebar]="true">
    <div sidebar>...navegacion...</div>
    ...contenido principal...
  </app-canvas>
  ```

### Header y Footer (existente)

- **Ubicacion actual:** `shared/layouts/header/` y `shared/layouts/footer/`
- **Ubicacion target:** `shared/components/layout/header/` y `shared/components/layout/footer/`
- Se migraran cuando se refactoricen a standalone components.

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
| `@models/*` | `app/models/*` |
| `@shared/ui` | `app/shared/ui` |

Agregar nuevos aliases en `tsconfig.json` cuando se cree una nueva feature en `features/`.

## Convenciones De DTO (Data Transfer Objects)

Los DTOs convierten datos entre el modelo interno de la app y el formato que espera la API.

### Reglas

- **Archivos DTO:** `models/dto/{entidad}.dto.ts`
- **Interfaz del payload:** `export interface {Entidad}Payload { ... }` -- define exactamente los campos que van en el body del request HTTP (POST/PATCH/PUT).
- **Funcion conversora:** `export function to{Entidad}Payload(data: ...): {Entidad}Payload` -- toma los datos del formulario/modelo y devuelve el payload limpio para la API.
- **Siempre usar el DTO al enviar datos** a la API, nunca construir el body a mano con `Partial<Modelo>`.
- **Ejemplo:** `toPatientPayload(formValue)` -> `PatientPayload` se pasa a `patientsService.createPatient(payload)` o `patientsService.updatePatient(id, payload)`.
- Los servicios HTTP aceptan `{Entidad}Payload` (o `Partial<{Entidad}Payload>` para PATCH), no el modelo de dominio (`Patient`, `Prescriptions`, etc.).
- La conversion inversa (API -> modelo interno) la hacen los Adapters (`src/app/interfaces/`).

### Ejemplo

```typescript
// models/dto/patients.dto.ts
export function toPatientPayload(data: {...}): PatientPayload {
    const payload: PatientPayload = {
        dni: data.dni || '',
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        sex: data.sex || '',
    };
    if (data.fechaNac) {
        payload.fechaNac = data.fechaNac instanceof Date
            ? data.fechaNac.toISOString()
            : String(data.fechaNac);
    }
    // ...campos opcionales...
    return payload;
}
```

## Convenciones De UI (Angular Material)

- **Cada feature module importa solo los Material modules que necesita**, no todo `MatXxxModule` indiscriminadamente.
- **Para layout**, preferir `MatToolbar` (headers), `MatSidenav`/`MatSidenavContainer` (sidebar), `MatCard` (contenedores).
- **Para navegacion en sidebar**, usar `MatNavList` con `MatListItem`.
- **Para formularios**, usar `MatFormField` + `MatInput`/`MatSelect`/etc.
- **Tokens de diseno** estan en `shared/styles/_variables.sass`; importarlos con `@use 'styles/variables' as *`.
- **No hardcodear colores, borders, shadows ni radius** -- usar siempre las variables de diseno.

### Libreria de Componentes UI (`shared/ui/`)

**Regla de prioridad:** antes de crear un nuevo componente o escribir CSS custom para patrones de UI comunes, verifica si el componente correspondiente ya existe en `shared/ui/`. Si existe, usalo. Si no cubre el caso exacto, extendelo (no lo dupliques).

- **Convencion para `shared/ui/`:** un unico archivo `.component.ts` por componente, con `template` y `styles` inline. **No usar la estructura de 3 archivos** (`.ts` / `.html` / `.sass`) para componentes de `ui/`.
- **Standalone:** todos los componentes son `standalone: true`, importan solo los modulos Material que necesitan.
- **Content projection:** la API principal es `ng-content` con slots nombrados via selectores de atributo (ej: `[cardIcon]`, `[cardTitle]`).
- **Import:** usar `import { UiIconComponent } from '@shared/ui'` gracias al barrel `index.ts`. El alias `@shared/ui` se agrega en `tsconfig.json`.

## Convenciones De Archivos De Componentes

- **Feature components** (`features/`, paginas y sub-componentes): usar 3 archivos separados -- `.component.ts` con `templateUrl` + `styleUrls`, `.component.html`, `.component.sass`. **Nunca usar `template:` ni `styles:` inline.**
- **UI library** (`shared/ui/`): archivo unico `.component.ts` con `template` y `styles` inline.
- **Standalone:** todo componente nuevo debe ser `standalone: true` con `imports` explicitos. No declararlos en NgModules.

## Convenciones De Nomenclatura

- **Directorios:** kebab-case (`dashboard-home`, `patient-form`, `edit-user-info`)
- **Clases/Interfaces:** PascalCase (`DashboardHomeComponent`, `AuthService`)
- **Archivos:** kebab-case con punto separador de tipo (`dashboard-home.component.ts`, `auth.service.ts`)
- **Selectores:** prefijo `app-` (`app-canvas`, `app-dashboard-home`)
- **Modulos Angular:** `{Feature}Module`, `{Feature}RoutingModule`

## Orden De Implementacion

1. Skill de UI/UX (`recetar-ui-ux.md`)
2. Canvas component (`shared/components/layout/canvas/`)
3. Dashboard feature (`features/dashboard/`)
4. Header refactor (mover a `shared/components/layout/header/`)
5. Footer refactor (mover a `shared/components/layout/footer/`)
6. Auth pages -> aplicar Canvas
7. Professionals module -> migrar a `features/`
8. Pharmacists module -> migrar a `features/`
9. Audit module -> migrar a `features/`
10. Libreria UI (`shared/ui/`) -- icon, item-card, card, avatar, badge-chip
11. Migrar vistas existentes a componentes UI (reemplazar clases CSS por `<ui-*>`)
