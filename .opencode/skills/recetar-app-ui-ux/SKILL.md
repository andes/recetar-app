---
name: recetar-ui-ux
description: Usá esta skill al rediseñar la UI/UX de recetar-app. Define lineamientos de diseño, paleta, sistema de espaciado y reglas de estilo generales.
---

# RecetAR — UI/UX Design Guidelines

Lineamientos de diseño visual y de experiencia de usuario para `recetar-app`.

## UI Framework

La app usa **Angular Material** como librería de componentes UI. Cada feature module importa solo los módulos Material que necesita. Preferir componentes Material sobre HTML/CSS custom:

**Excepción — Formularios (inputs, selects, autocomplete):** `MatFormField`, `MatInput`, `MatSelect`, `MatAutocomplete`, `MatDatepicker` **NO deben usarse** porque no se pueden estilizar adecuadamente según los tokens de diseño del proyecto. Para estos campos, usar elementos HTML nativos (`<input>`, `<select>`, `<textarea>`) con estilos basados en los tokens CSS definidos en `src/styles.sass`. El resto de componentes Material (Layout, Botones, Datos, Feedback, Navegación) se siguen usando normalmente.

- Layout: `MatSidenavContainer`, `MatSidenav`, `MatToolbar`
- Formularios: ~~`MatFormField`, `MatInput`, `MatSelect`, `MatAutocomplete`, `MatDatepicker`~~ → **usar inputs nativos con tokens CSS del proyecto**
- Botones: `MatButton`, `MatIconButton`, `MatMenu`
- Datos: `MatTable`, `MatSort`, `MatPaginator`, `MatCard`
- Feedback: `MatDialog`, `MatSnackBar`, `MatProgressSpinner`
- Navegación: `MatMenu`, `MatList`, `MatTabs`

**Importante:** Angular Material v20.x usa M3 (Material Design 3). Los tokens CSS de state layer usan prefijo `--mat-*`, no `--mdc-*` (ej: `--mat-list-list-item-hover-state-layer-color`, no `--mdc-list-list-item-hover-state-layer-color`).

Antes de estilizar cualquier componente Material, consultá la documentación oficial en `https://v20.material.angular.dev/`. Cada página de componente tiene una pestaña **Styling** que lista los tokens CSS disponibles para ese componente. En caso de duda sobre el nombre de un token o la API de un componente, buscá en `node_modules/@angular/material/*/_m3-*.scss`. Nunca uses `!important` para sobreescribir estilos de Material; usá el token correcto.

## Librería de Componentes UI (`shared/ui/`)

> **Regla de prioridad:** los componentes de `shared/ui/` tienen precedencia sobre cualquier
> implementación nueva de estilos custom o CSS global. Antes de escribir una clase CSS para
> patrones como ícono con contenedor, card clickeable, header de sección, avatar o badge de
> estado, verificá si el componente correspondiente ya existe. Si existe, usalo. Si no cubre
> exactamente el caso, extendelo (no lo dupliques).

Estos componentes son wrappers ligeros de Angular Material en un solo archivo
(`.component.ts` con `template` y `styles` inline), **standalone**, con **content projection**
como API principal. Selectores con prefijo `ui-`. Se importan desde `@shared/ui`.

### `ui-icon`

Ícono con contenedor de fondo opcional.

| Input | Tipo | Default | Descripción |
|---|---|---|---|
| `icon` | `string` | `undefined` | Nombre del ícono Material. Si se pasa, renderiza `<mat-icon>` internamente. |
| `container` | `boolean` | `true` | Muestra el fondo contenedor |
| `transparent` | `boolean` | `false` | Mantiene el contenedor (tamaño) pero sin fondo ni borde |
| `size` | `'sm'`\|`'md'`\|`'lg'` | `'md'` | 32/36/44px |
| `variant` | `'neutral'`\|`'primary'`\|`'secondary'`\|`'success'`\|`'warning'`\|`'error'`\|`'info'`\|`'commercial'`\|`'generic'`\|`'transparent'` | `'neutral'` | Paleta de color de fondo |

Content projection: si no se pasa `icon`, el contenido proyectado se usa como fallback.

```html
<!-- Forma recomendada: pasar el icono como input -->
<ui-icon icon="medication_liquid" variant="primary" size="md" />

<!-- Sin contenedor -->
<ui-icon icon="chevron_right" [container]="false" />

<!-- Content projection (fallback para SVG o contenido custom) -->
<ui-icon variant="primary">
    <mat-icon>medication_liquid</mat-icon>
</ui-icon>
```

**Cuándo usar:** cualquier ícono Material que requiera un contenedor decorativo
con fondo. Preferir la forma `icon="..."` como input. Usar content projection solo
cuando se necesite contenido no estándar (SVG, texto, etc.).
ni redefinir `.section-icon` localmente.

### `ui-item-card`

Card clickeable con estructura predefinida: slot de ícono/avatar, título, subtítulo
y chevron a la derecha renderizado automáticamente.

| Slot | Selector | Descripción |
|---|---|---|
| icon | `[cardIcon]` | Ícono o avatar izquierdo |
| title | `[cardTitle]` | Texto principal |
| meta | `[cardMeta]` | Texto secundario |

| Output | Tipo | Descripción |
|---|---|---|
| `selected` | `void` | Emite al hacer clic en el card |

```html
<ui-item-card (selected)="selectItem()">
  <mat-icon cardIcon>medication</mat-icon>
  <span cardTitle>Ibuprofeno 400 mg</span>
  <span cardMeta>Caja x 20 comp. · $2,450</span>
</ui-item-card>
```

También acepta `[mat-card-avatar]` en el slot `cardIcon` para avatares de paciente:

```html
<ui-item-card (selected)="selectPatient(fp)">
  <span mat-card-avatar cardIcon>{{ fp.initials }}</span>
  <span cardTitle>{{ fp.firstName }} {{ fp.lastName }}</span>
  <span cardMeta>
    <mat-icon class="xs">local_hospital</mat-icon>
    {{ fp.insurance }}
  </span>
</ui-item-card>
```

**Cuándo usar:** cualquier card clickeable con estructura de ícono + título + subtítulo
+ indicador de navegación. Genérico para listas, grids o resultados de cualquier entidad.
**No usar** `<div class="item-card">` manualmente.

### `ui-card`

Card contenedor con header opcional (si se define `icon`, se renderiza la cabecera con
ícono + título + subtítulo + acciones). Soporta estados `disabled` y `hidden`.

| Input | Tipo | Default | Descripción |
|---|---|---|---|
| `icon` | `string` | `undefined` | Ícono Material del header. Si no se pasa, no hay header. |
| `title` | `string` | `''` | Título del header |
| `subtitle` | `string` | `''` | Subtítulo opcional |
| `disabled` | `boolean` | `false` | Reduce opacidad y bloquea interacción |
| `hidden` | `boolean` | `false` | Oculta el card con `display: none` |

| Slot | Selector | Cuándo se renderiza |
|---|---|---|
| Actions | `[cardAction]` | Solo si hay header (`icon` definido) |
| Body | default | Siempre |

```html
<!-- Con header -->
<ui-card icon="medication_liquid"
  title="Seleccionar medicamento"
  subtitle="Buscá por nombre genérico o comercial">
  <app-search-input ...></app-search-input>
</ui-card>

<!-- Sin header (solo cuerpo) -->
<ui-card [disabled]="isLoading">
  <p>Contenido del card sin cabecera</p>
</ui-card>
```

**Cuándo usar:** cualquier card con o sin header que necesite estructura de ícono +
título + subtítulo + acciones + cuerpo. Reemplaza tanto a `mat-card` + header manual
como a `ui-section-header` independiente. **No usar** `<mat-card>` con `.section-header`
custom.

### `ui-avatar`

Avatar circular. Content projection: acepta texto (iniciales) o `<mat-icon>`.

| Input | Tipo | Default | Descripción |
|---|---|---|---|
| `size` | `'sm'`\|`'md'`\|`'lg'` | `'md'` | 36/44/60px |
| `variant` | `'neutral'`\|`'primary'`\|`'colored'` | `'neutral'` | Estilo de fondo |

```html
<ui-avatar size="md" variant="neutral">MC</ui-avatar>

<ui-avatar size="md" variant="neutral">
  <mat-icon>person</mat-icon>
</ui-avatar>
```

**Cuándo usar:** representación visual compacta de cualquier entidad mediante iniciales
o ícono. Genérico. **No usar** `<span mat-card-avatar>` con estilos de color y tamaño
custom para
avatares de UI (el de Material queda para fotos de perfil).

### `ui-badge-chip`

Chip de estado semántico, wrapper de `<mat-chip disableRipple>` que encapsula
las clases de variante/tamaño del design system.

| Input | Tipo | Default | Descripción |
|---|---|---|---|
| `variant` | `'neutral'`\|`'success'`\|`'info'`\|`'warning'`\|`'error'`\|`'primary'`\|`'secondary'` | `'neutral'` | Color del chip. `neutral` usa el fondo por defecto (`--bg-over-body`) |
| `status` | `string` | `''` | Si se pasa, resuelve `variant` + label con `shared/utils/status.utils` (tiene prioridad sobre `variant`) |
| `size` | `'sm'`\|`'md'` | `'sm'` | Compacto o normal |
| `icon` | `string` | `undefined` | Ícono Material opcional a la izquierda |
| `dot` | `boolean` | `false` | Muestra un punto de color (`currentColor`) antes del texto |

```html
<!-- Estado: variante + label resueltos del status -->
<ui-badge-chip [status]="status"></ui-badge-chip>

<!-- Con punto de color -->
<ui-badge-chip [status]="getStatus()" [dot]="true"></ui-badge-chip>

<!-- Variante explícita con contenido custom -->
<ui-badge-chip variant="warning" icon="schedule">
  Vence en {{ daysToExpire }} días
</ui-badge-chip>

<!-- Chip neutro para metadata (fecha, código) -->
<ui-badge-chip variant="info">
  <strong class="mono text-sm">{{ date | date:"dd MMM yyyy" }}</strong>
</ui-badge-chip>
```

**Cuándo usar:** cualquier indicador de estado, categoría o metadata que use los tokens
semánticos del sistema de diseño. Genérico. **No usar** `<mat-chip class="success sm">`
manualmente.

### `ui-table`

Tabla de datos estándar, wrapper de `MatTable` con estilo propio y fila expandible opcional.

| Input | Tipo | Default | Descripción |
|---|---|---|---|
| `dataSource` | `T[]` | `[]` | Filas de la tabla |
| `columns` | `ColumnDef[]` | `[]` | Definición de columnas |
| `dense` | `boolean` | `false` | Versión compacta |
| `expandable` | `boolean` | `true` | Muestra la columna de expansión y permite fila expandible |
| `frameless` | `boolean` | `false` | Quita borde, fondo y radio de la tabla (para usar dentro de `ui-card`) |

| Output | Tipo | Descripción |
|---|---|---|
| `rowClick` | `EventEmitter<T>` | Emite la fila clickeada. Si `expandable` es `true`, también expande/colapsa la fila. |

`ColumnDef`:

| Campo | Tipo | Descripción |
|---|---|---|
| `name` | `string` | Identificador de la columna |
| `header` | `string` | Texto del encabezado |
| `cell` | `TemplateRef<any>` | Template de la celda (recibe la fila como `$implicit`) |
| `headerClass` | `string` | `'col-centered'` para centrar encabezado |
| `cellClass` | `string` | `'col-centered'` para centrar celdas |
| `stopPropagation` | `boolean` | Evita que el clic en la celda expanda la fila |

```html
<ui-table [dataSource]="items" [columns]="columns" [expandable]="false" (rowClick)="onRowClick($event)">
    <ng-template uiTableDetail let-item>
        <!-- contenido del detalle expandible (solo cuando expandable = true) -->
    </ng-template>
</ui-table>
```

```typescript
columns: ColumnDef[] = [
    { name: 'paciente', header: 'Paciente', cell: this.patientCell },
    { name: 'estado', header: 'Estado', cell: this.statusCell },
];
```

**Cuándo usar:** cualquier listado tabular de la app. Es el componente canónico; **no usar** `<table mat-table>` directamente salvo que `ui-table` no cubra el caso (por ejemplo, filas con estructura muy custom o columnas dinámicas complejas). Si una pantalla legacy aún usa `<table mat-table>`, debe migrarse a `ui-table`.

Si una tabla no necesita detalle expandible, usar `[expandable]="false"`. El clic en fila emite `rowClick` y no expande nada.

## Principios De Diseño

- **Claridad ante todo:** cada pantalla comunica una sola acción principal. Sin ruido visual.
- **Consistencia:** mismos patrones de espaciado, tipografía, color e interacción en toda la app.
- **Accesibilidad:** contraste suficiente, navegación por teclado, soporte de lectores de pantalla.
- **Rendimiento perceptible:** transiciones suaves, feedback inmediato a las acciones del usuario.
- **Mobile First obligatorio:** toda modificación de UI comienza desde la experiencia mobile (base styles) y se potencia para desktop con `@media (min-width)`. No usar `@media (max-width)` para definir comportamientos mobile. Esto asegura que mobile sea siempre funcional aunque falten o se rompan las media queries.

  ```sass
  // ✅ Mobile First
  .mi-componente
      padding: 12px                          // mobile base
      @media (min-width: $small-devices + 1px)
          padding: 24px                      // desktop enhancement

  // ❌ Desktop First — no usar
  .mi-componente
      padding: 24px
      @media (max-width: $small-devices)
          padding: 12px
  ```

## Arquitectura Cromática y Fundamentos Visuales

### 1.1 Paleta Primaria: Carbon

Seleccionada como el color base estructural de la aplicación. Escala de grises oscuros con matiz carbón para superficies, texto y contenedores principales.

| Token SASS | Valor HEX | Uso |
|---|---|---|
| `$primary` | `#1F2937` | Color institucional base. Header, sidebar, texto principal. |
| `$primary-dark` | `#111827` | Estados hover y fondos oscuros intensos. |
| `$primary-light` | `#374151` | Variantes claras para bordes, separadores, iconografía secundaria. |

Escala completa: `$primary-50` (`#F9FAFB`) a `$primary-700` (`#374151`).

### 1.2 Paleta Secundaria: Indigo

Acento de acción. Uso exclusivo en botones, links, toggles, focus rings y elementos interactivos. No compite con la paleta primaria.

| Token SASS | Valor HEX | Uso |
|---|---|---|
| `$secondary` | `#4F46E5` | Botones primarios, links, focus rings. |
| `$secondary-dark` | `#3730A3` | Estados hover de botones. |
| `$secondary-light` | `#6366F1` | Variante clara para badges y chips. |

Escala completa: `$secondary-50` (`#EEF2FF`) a `$secondary-600` (`#4F46E5`).

### 1.3 Neutros y Superficies de Sistema

Escala para estructurar la interfaz garantizando contrastes nítidos.

| Token Semántico | Valor HEX | Uso Recomendado |
|---|---|---|
| `color-surface-base` | `#F8F9FB` | Fondo base de la aplicación (Modo Claro). |
| `color-surface-card` | `#FFFFFF` | Contenedores estructurados, tarjetas, diálogos y panel de propiedades. |
| `color-surface-raised` | `#EEF0F4` | Fondos para campos de entrada (inputs) y cabeceras de tablas. |
| `color-border-default` | `#D6DAE3` | Delimitación general de componentes. |
| `color-border-strong` | `#B0B8C6` | Bordes que requieren mayor contraste o énfasis. |
| `color-text-primary` | `#111821` | Tipografía principal (gris oscuro para disminuir fatiga visual del negro puro). |
| `color-text-secondary` | `#556070` | Etiquetas de formularios, placeholders y datos secundarios. |
| `color-text-disabled` | `#B0B8C6` | Texto e iconos deshabilitados. |

| Token SASS | Variable CSS | Valor (Claro) | Valor (Oscuro) |
|---|---|---|---|
| `$bg-body` | `--surface-base` | `#F8F9FB` | `#1A1D23` |
| `$bg-card` | `--surface-card` | `#FFFFFF` | `#23272E` |
| `$text-primary` | `--text-primary` | `#111821` | `#E4E7EB` |
| `$text-secondary` | `--text-secondary` | `#556070` | `#9BA3B1` |
| `$border-color` | `--border-default` | `#D6DAE3` | `#363B44` |
| `$hover-bg` | `--hover-bg` | `rgba(11,79,130,0.10)` | `rgba(11,79,130,0.20)` |

## Lógica de Estados UI

Todos los estados utilizan tonos desaturados que conviven con la paleta principal, evitando los rojos y verdes sobresaturados nativos de material tradicional.

| Estado | Token Semántico Base | Light BG | Light Text | Contraste / Uso |
|---|---|---|---|---|
| **Error** | `color-error-main` | `#FEECEB` | `#C0392B` | 5.8:1 (AA) — Validaciones incorrectas y alertas. |
| **Warning** | `color-warning-main` | `#FEF5E7` | `#B85C00` | 4.7:1 (AA) — Indicadores de precaución o pasos pendientes. |
| **Success** | `color-success-main` | `#E8F6EF` | `#1A7A4A` | 5.2:1 (AAA) — Confirmación de recetas emitidas o procesos válidos. |
| **Info** | `color-info-main` | `#E8F3FA` | `#1D6F9E` | 5.5:1 (AA) — Banners de ayuda y notas contextuales. |

**Nota:** El token de estado **Info** migra a la familia cromática del azul primario (`#1D6F9E`). Esto elimina el impacto semántico con el **rol farmacéutico** y con el teal secundario de acción.

## Estrategia de Identidad Visual por Rol

### 3.1 Regla de Aplicación (Ley de Prägnanz)

El color de rol actúa como **un acento, no como un tema global**. La estructura visual base (grillas, layouts, cabeceras, espaciados) es idéntica para los 3 roles. Garantiza que el sistema se perciba como un todo coherente.

### 3.2 Definición de Identidades

| Rol | Color | HEX | Contraste | Notas |
|---|---|---|---|---|
| **Profesional Médico** (Rol Central) | Azul Petróleo | `#0B4F82` | — | Utiliza la paleta institucional base. Refuerza la identidad principal del producto. |
| **Farmacéutico** | Verde Oliva Institucional | `#4E6B1A` | 4.9:1 (AA) sobre blanco | Se desmarca del verde esmeralda de los estados de éxito. Acento Lima `#A6C257` para micro-indicadores sobre fondos oscuros (10.5:1 AAA). |
| **Auditor** | Violeta | `#3E1D90` | 11.9:1 (AAA) | Sin uso clínico previo en la interfaz — diferenciación semántica limpia. |

### 3.3 Matriz de Comportamiento en Componentes UI

| Sí adoptan color de rol | No adoptan color de rol |
|---|---|
| Fondo de ítems activos en la barra de navegación lateral (Sidebar), anillo perimetral del avatar de usuario, y etiqueta contextual en la cabecera. | Botones primarios (acción con lenguaje del sistema, no del rol), tablas, listas de datos y alertas críticas de riesgo clínico. |

## Sistema Tipográfico

La tipografía está gestionada por Angular Material. No se deben definir propiedades tipográficas (`font-size`, `font-weight`, `line-height`, `letter-spacing`, `font-family`) en los `.sass` de componentes. Los elementos HTML semánticos (`<h1>`–`<h6>`, `<p>`, `<label>`, `<span>`) heredan sus estilos de la configuración global de Material Typography.

### 4.1 Fuentes Oficiales

| Fuente | Uso |
|---|---|
| **Inter** | Tipografía principal. Configurada como `font-family` global por Material. |
| **JetBrains Mono** | Tipografía de datos (códigos, CUIL, matrículas). Se aplica con `font-family: var(--font-mono)` solo donde sea necesario. |

### 4.2 Jerarquía semántica

Usar los elementos HTML naturales. Material ya asigna tamaños, pesos y espaciado correctos:

| Elemento | Cuándo usarlo |
|---|---|
| `<h1>` | Título de pantalla |
| `<h2>` | Encabezado de sección |
| `<h3>` | Subtítulo o cabecera de card |
| `<p>` | Texto narrativo |
| `<label>` | Etiqueta de formulario |
| `<span>` | Texto inline sin semántica |

## Espaciado, Geometría y Estructura de Layout

### 5.1 Escala de Espacio (Base 4px)

Alineación pixel-perfect compatible con la grilla de 8px Angular Material. Todos los tokens son múltiplos de 4px.

| Token | px | Uso típico |
|---|---|---|
| `space-1` | 4px | Íconos, badges, micro-espaciado |
| `space-2` | 8px | Padding interno compacto |
| `space-3` | 12px | Gap entre elementos relacionados |
| `space-4` | 16px | Padding estándar de tarjetas |
| `space-5` | 20px | Gap entre secciones internas |
| `space-6` | 24px | Separación entre secciones, padding de contenido |
| `space-8` | 32px | Margen de página, separación de layouts |
| `space-10` | 40px | Separación de grupos de componentes |
| `space-12` | 48px | Separación de pantallas completas |
| `space-16` | 64px | Separación de secciones mayores |
| `space-20` | 80px | Separación de landing / empty states |
| `space-24` | 96px | Separación de secciones de página completa |

### 5.2 Geometría y Radios de Borde (Shapes)

| Token | Valor | Uso |
|---|---|---|
| `radius-none` | 0px | Divisores de tablas y líneas de entrada inferiores. |
| `radius-xs` | 2px | Etiquetas inline rígidas y micro-badges. |
| `radius-sm` | 4px | Tooltips informativos independientes. |
| `radius-md` | 8px | Inputs de texto, selectores y botones estándar. |
| `radius-lg` | 12px | Tarjetas contenedoras (cards) y paneles de expansión. |
| `radius-xl` | 16px | Ventanas de diálogo modales y hojas flotantes inferiores. |
| `radius-2xl` | 24px | Paneles de navegación laterales (drawers) y snack bars de notificación. |
| `radius-full` | 9999px | FABs, componentes de avatar y chips tipo píldora. |

El estándar para componentes generales es `$radius-md` (8px). Solo usar radios mayores para contenedores grandes o propósitos específicos.

### 5.3 Sombras Estructurales (Elevación)

Basadas en el Azul Petróleo primario (`#0B4F82`) con opacidad gradual.

| Token | Sombra | Uso |
|---|---|---|
| `elevation-0` | `none` | Superficie base del Canvas. |
| `elevation-1` | `0 1px 3px rgba(11,79,130,0.08)` | Componentes y tarjetas en estado de reposo. |
| `elevation-2` | `0 2px 8px rgba(11,79,130,0.12)` | Menús desplegables y estados hover de tarjetas. |
| `elevation-3` | `0 4px 16px rgba(11,79,130,0.16)` | Diálogos modales y drawers laterales estables. |
| `elevation-4` | `0 8px 24px rgba(11,79,130,0.20)` | Botones de acción flotante (FABs) y alertas superpuestas. |

### 5.4 Dimensiones del Layout Principal

| Token | Valor | Descripción |
|---|---|---|
| `size-toolbar-height` | 64px | Altura fija de la cabecera principal (Header). |
| `size-nav-width` | 256px | Ancho estandarizado de la barra lateral (Sidebar) expandida. |
| `size-nav-collapsed` | 72px | Ancho de la barra lateral colapsada (modo solo iconos). |
| `size-input-height` | 48px | Altura por defecto de los campos de formulario (M3 Standard). |
| `size-btn-height` | 40px | Altura de los botones de acción estándar. |
| `size-touch-min` | 44px | Área mínima táctil requerida para cumplimiento de accesibilidad WCAG 2.5.5. |

## Tokens SASS Compartidos

Definidos en `shared/styles/_variables.sass`. Importar con `@use 'styles/variables' as *`.

```sass
// Colores primarios
$primary: #1F2937
$primary-dark: #111827
$primary-light: #374151

// Colores secundarios
$secondary: #4F46E5
$secondary-dark: #3730A3
$secondary-light: #6366F1

// Neutros y superficies
$bg-body: #f5f7fb
$bg-card: #FFFFFF
$text-primary: #212026
$text-secondary: #64748b
$border-color: #e0e0e0

// Hover
$hover-bg: #e8e9eb

// Sombras
$shadow-sm: $elevation-1
$shadow-lg: $elevation-3

// Radios
$radius-sm: 8px
$radius-md: 12px

// Roles
$role-pharmacist: #4E6B1A
$role-pharmacist-accent: #A6C257
$role-auditor: #3E1D90
```

## Breakpoints Compartidos

Usar `BreakpointService` (`shared/services/breakpoint.service.ts`) para chequear mobile/desktop desde TypeScript, en vez de duplicar `window.innerWidth`:

```typescript
import { BreakpointService } from '@shared/services/breakpoint.service';

class MiComponente {
    constructor(private breakpointService: BreakpointService) {}

    algunMetodo(): void {
        if (this.breakpointService.isMobile()) {
            // mobile (≤768px)
        } else {
            // desktop (≥769px)
        }
    }
}
```

El servicio expone:
- `isMobile(): boolean` — síncrono, para usar en métodos de interacción (click, toggle, etc.)
- `isMobile$: Observable<boolean>` — reactivo, para bindear en templates con `| async`

En SASS el breakpoint equivalente es `$small-devices: 768px` definido en `_variables.sass`. Usar `@media (min-width: $small-devices + 1px)` para estilos desktop (mobile-first).

## Modo Oscuro (Dark Mode)

`ThemeService` (`shared/services/theme.service.ts`, `providedIn: 'root'`) maneja el toggle y persistencia:

- **Persistencia:** Guarda preferencia en `localStorage` con clave `'dark_mode'`.
- **CSS:** Agrega/remueve clase `.dark-mode` en `<body>`. Las variables CSS cambian automáticamente (ver tabla en sección 1.3).
- **Material:** Switchea dinámicamente el `<link>` de Material CSS entre `indigo-pink.css` (light) y `purple-green.css` (dark).
- **APIs:** `isDark(): boolean`, `toggle()`, `isDarkMode$: Observable<boolean>`.

El toggle está en el `SidebarComponent` al fondo, antes del footer. Usa íconos `dark_mode` / `light_mode`. Cuando el sidebar está colapsado, solo se ve el ícono con tooltip.

### Agregar colores dark a nuevos componentes

1. Definir la variable CSS en `styles.sass` dentro de `:root` (light) y `.dark-mode` (dark).
2. En el componente, referenciar con `var(--mi-variable)` en lugar de `$mi-variable`.

No usar valores fijos de color; siempre referenciar variables CSS que tengan definición dark correspondiente.

**Ojo con `--primary`:** es el color institucional (casi negro en claro) y se usa como fondo del header/sidebar. **No** usarlo como color de texto ni como fondo de componentes chicos (label de botón tonal, toggle activo, link) porque en dark queda oscuro sobre oscuro. Para texto usar `--text-primary`; para acento/interactivo usar `--secondary`. Tampoco usar `--bg-card` como color de texto (en dark es oscuro).

### Panel con fondo oscuro

Para superficies con fondo oscuro que necesitan texto claro (ej: panel institucional del login), aplicar `class="dark-mode"` al contenedor. Esto hace que `--text-primary`, `--text-secondary` y `--text-disabled` hereden los valores de modo oscuro dentro de ese scope, sin necesidad de crear variables nuevas ni reglas de `color` en el componente.

```html
<div class="inst-panel dark-mode">
  <h2>Título en blanco</h2>
  <p>Texto secundario en gris claro</p>
</div>
```

El componente solo define `background: var(--primary)` en su SASS. Los colores de texto los resuelve `dark-mode`.

### Material overrides globales

`styles.sass` tiene un bloque `.dark-mode` con overrides para componentes Material comunes usando `var(--xxx)`. Cubre: `mat-card`, `mat-menu`, `mat-dialog`, `mat-table`, `mat-paginator`, `mat-form-field`, `mat-chip`. Si un componente Material no se adapta en dark mode, agregar su selector al bloque.

## Patrones De Componente

### Formularios

- Usar `app-patient-form` existente para datos de paciente.
- Usar `ReactiveFormsModule` con validadores de `src/app/utils/custome-validators/`.
- Mostrar errores inline (`mat-error`) con mensajes claros.

### Listas Y Tablas

- Usar `<ui-table>` de `@shared/ui` para cualquier tabla de resultados. Solo recurrir a `MatTable` directo si `ui-table` no cubre el caso.
- `<ui-table>` ya incluye borde, radio, hover y fila expandible; no envolver en un `<div class="table-container">` custom.
- Usar `<ui-paginator>` para paginación.
- `SpanishPaginatorIntlService` ya existe en `shared/services/`.
- Tarjetas (`ui-card`) para vistas de detalle y contenedores de listados.

### Cards Y Contenedores

- Usar `ui-card` para cualquier card con header (ícono + título + subtítulo + acciones) opcional y cuerpo.
- Usar `ui-item-card` para cards clickeables con estructura de ícono + título + subtítulo.
- Para contenedores generales que no encajan en los anteriores, usar `MatCard` con `$radius-md` (8px) y `elevation-1`.
- Padding estándar: 24px.
- Background: `$bg-card`.
- **No usar `<div>` con estilos custom de card** (background, border-radius, box-shadow, border) cuando `mat-card` o un componente UI de la librería están disponibles.

### Diálogos

- Usar `MatDialog` con config `{ disableClose: true }` para acciones críticas.
- Confirmaciones: diálogo con botón primario y cancelar.

## Reglas De Estilo Globales

1. **Usar los tokens de `_variables.sass`** en lugar de colores, sombras o radios hardcodeados.
2. **Border-radius estandarizado:** usar `$radius-md` (8px) para componentes visibles estándar (inputs, botones). Usar `$radius-lg` (12px) para contenedores grandes (cards, modales). Ver la escala completa en 5.2.
3. **Hover global:** usar `$hover-bg` para el fondo de hover de items interactivos, con color de texto e ícono cambiando a `$primary` (o `--primary-500`).
4. **Sombras:** usar `elevation-1` para estado de reposo, `elevation-2` para hover y menús, `elevation-3` para modales y drawers.
5. **Roles:** aplicar color de rol solo en sidebar activo, anillo de avatar y etiqueta de cabecera. No aplicar en botones primarios, tablas, listas de datos ni alertas críticas.
6. **Colores solo desde variables globales:** todos los colores en hojas de estilo de componentes deben usar exclusivamente `var(--xxx)` definidos en `src/styles.sass`. No se permite usar valores hexadecimales, `rgb()`, `hsl()` ni ninguna otra forma de color hardcodeado en archivos de componentes. Si se necesita un color que no existe en las variables globales, se debe agregar la SASS variable en `_variables.sass` y su correspondiente CSS custom property en `:root` y `.dark-mode` en `styles.sass`.
7. **Componentes Material primero:** nunca recrear un componente Material con HTML/CSS custom. Si se necesita un card → `mat-card`, un botón → `mat-button`/`mat-icon-button`, un input → `mat-form-field` + `input[matInput]`. Solo aplicar estilos custom para propiedades que Material no cubre (ej: layout interno, espaciado entre elementos). No aplicar background, border-radius, box-shadow ni border a un `<div>` para simular un `mat-card`.
8. **Librería UI primero:** antes de crear una clase CSS nueva para patrones de ícono con contenedor, card clickeable con estructura predefinida, header de sección, avatar o badge de estado, verificá si el componente correspondiente ya existe en `shared/ui/`. Si existe, usalo. Si no cubre exactamente el caso, considerá extender el componente existente en lugar de duplicar estilos con una clase custom. La librería UI es la fuente canónica para estos patrones visuales.
9. **CSS mínimo — solo layout.** Los archivos `.sass` de componentes deben contener exclusivamente reglas de layout y espaciado (`display`, `grid`, `flex`, `padding`, `margin`, `gap`, `width`, `height`, `overflow`, `position`, `align-items`, `justify-content`, `box-sizing`). La tipografía la definen los elementos HTML semánticos (`<h1>`–`<h6>`, `<p>`, `<label>`, `<span>`) cuyos estilos heredan de la configuración global de Material Typography. Los colores se aplican mediante `var(--xxx)` definidos en `:root`. No se deben definir `font-size`, `font-weight`, `line-height`, `letter-spacing`, `font-family`, `text-transform`, `color` ni `background` con valores hardcodeados (hex, `rgb()`, `rgba()`, `hsl()`) en ningún componente.
10. **Labels de formulario sin clases.** Para etiquetas de campos de formulario usar el elemento HTML nativo `<label>` sin ninguna clase CSS adicional. Los estilos del `<label>` están definidos globalmente en `src/styles.sass` y no deben redeclararse ni sobrescribirse en componentes. No usar `class="field-label"` ni otras clases en etiquetas `<label>`.
11. **Global solo para Material overrides y utilidades genéricas.** `src/styles.sass` solo debe contener overrides de componentes Angular Material (`.mat-mdc-*`, `.mdc-*`) y clases utilitarias verdaderamente genéricas (`.wrapper`, `.text-center`, `.mono`, `.dark-mode`). No crear clases globales con nombres específicos de feature o componente (ej: `.badge-count`, `.type-btn`). El estilo específico de un componente va en su propio `.sass`.

## 12. Patrón de tabla de resultados

Plantilla canónica para tablas de listado de entidades. Usar `<ui-table>` de `@shared/ui` para cualquier pantalla que liste recetas, certificados, prácticas u otras entidades con estructura de columnas + paginación.

> **Usar `ui-card` como contenedor.** Todo bloque visual con borde, `border-radius` y `background` debe usar `<ui-card>` (con o sin header). Nunca usar `<div class="results-card">` ni ningún `<div>` con estilos custom de card. El padding lo da el body del card.

> **Legacy:** `documents-home` todavía usa `<table mat-table>` directamente. Debe migrarse a `ui-table` cuando se toque esa pantalla.

Las clases de display de celdas como `medication-cell`, `medication-name`, `medication-type`, `patient-dni`, `status-badge` y `cell-text` pertenecen al `.sass` del componente que las usa. No deben estar en `styles.sass` porque son específicas de cada feature.

### Estructura HTML

```html
<div *ngIf="loading" class="loading-container">
    <mat-spinner diameter="40"></mat-spinner>
</div>

<ui-card *ngIf="!loading">
    <div class="results-count" *ngIf="total > 0">
        <span class="results-count-type">Recetas</span>
        <small class="results-count-range">
            Mostrando {{ resultsFrom }}&ndash;{{ resultsTo }} de {{ total }} resultados
        </small>
    </div>

    <ui-table [dataSource]="items" [columns]="columns">
        <ng-template uiTableDetail let-item>
            <!-- detalle expandible opcional -->
        </ng-template>
    </ui-table>

    <ui-paginator [length]="total" [pageSize]="pageSize" [pageIndex]="pageIndex"
        [pageSizeOptions]="[5, 10, 25]" (page)="onPageChange($event)">
    </ui-paginator>
</ui-card>
```

### Definición de columnas

```typescript
import { ColumnDef } from '@shared/ui/table.component';

patientCell = viewChild.required<TemplateRef<any>>('patientCell');
statusCell = viewChild.required<TemplateRef<any>>('statusCell');

columns: ColumnDef[] = [
    {
        name: 'paciente',
        header: 'Paciente',
        cell: this.patientCell,
    },
    {
        name: 'estado',
        header: 'Estado',
        cell: this.statusCell,
    },
];
```

```html
<ng-template #patientCell let-item>
    {{ item.fullName | titlecase }}<br>
    <small class="patient-dni">DNI: {{ item.dni }}</small>
</ng-template>

<ng-template #statusCell let-item>
    <mat-chip disableRipple [class]="getStatusVariant(item.status) + ' sm'" class="status-badge">
        {{ getStatusLabel(item.status) }}
    </mat-chip>
</ng-template>
```

### Reglas

- **Siempre usar `<ui-table>`** para tablas nuevas. No usar `<table mat-table>` directamente salvo migración pendiente.
- **Contenedor:** la tabla va dentro de `<ui-card>`. El card provee borde, radio, fondo y padding.
- **Fechas:** envolver en `<small>` con pipe `date:'dd/MM/yyyy'`.
- **Nombres propios (pacientes, medicamentos, profesionales):** pipe `| titlecase` (provisto por `TitleCasePipe` en `SharedModule`).
- **DNI:** `<small class="patient-dni">DNI: {{ value }}</small>` debajo del nombre, separado por `<br>`.
- **Chips de estado:** `<mat-chip disableRipple [class]="variant + ' sm'" class="status-badge">{{ label }}</mat-chip>`. Las variantes son `success`, `warning`, `info`, `error`. La clase `sm` reduce el tamaño.
- **Acciones:** en la celda de acciones, `<button mat-icon-button matTooltip="..."><mat-icon>...</mat-icon></button>`. Agregar `stopPropagation: true` en la `ColumnDef` si el clic no debe expandir la fila.
- **Tipo de medicamento (duplicado/triplicado):** dentro de un `<div class="medication-cell">`, el nombre en `<span class="medication-name">` y el tipo en `<small class="medication-type" [ngClass]="type">`. Las clases de display de celda (`medication-cell`, `medication-name`, `medication-type`, `patient-dni`, `status-badge`, `cell-text`) se definen en el `.sass` del componente que las usa.
- **Paginador:** `<ui-paginator>` con `pageSizeOptions="[5, 10, 25]"`.
- **Carga:** `<div class="loading-container"><mat-spinner diameter="40"></mat-spinner></div>`. La clase puede definirse en el componente si el contexto lo requiere.
- **CSS del componente.** En el `.sass` del componente van las clases específicas de la feature (display de celdas, layout, etc.). `styles.sass` solo contiene overrides de Material y utilidades verdaderamente genéricas (`.text-center`, `.mono`, `.wrapper`, etc.).

## 13. Patrones De Ítem Y Utilidades Globales

### Utilidades globales (`styles.sass`)

| Clase | Uso |
|---|---|
| `.text-subtitle` | Nombre de entidad (paciente/medicamento/profesional): negrita y algo mayor que body |
| `.text-label` / `.text-value` | Par etiqueta/valor de un dato |
| `.text-success` / `.text-error` / `.text-warning` | Color de texto por estado |
| `.data-field` | Contenedor en columna para label + valor |
| `.field-grid` (+ `.field-grid-full`) | Grid de datos etiquetados (1 col mobile / 2 col desktop) |
| `.form-actions` | Footer de acciones de formulario (stack mobile / fila a la derecha en desktop) |
| `.chip-row` | Fila de chips/badges (flex, `gap`, `flex-wrap`) |
| `.med-type` (+ `.duplicado` / `.triplicado` / `.anulado`) | Indicador de tipo de medicamento |
| `.truncate` | Truncado a una línea con ellipsis |
| `.selectable` | Borde activo/hover del `ui-card` de un ítem seleccionable |
| `.drawer-actions` | Fila de acciones del footer de un drawer (botones full-width) |

### `ui-list-item`

Contenedor canónico de ítem de listado. Encapsula el `ui-card`, el borde
seleccionable, el layout content/side y el apilado de acciones (columna en desktop,
fila en mobile). Slots `[itemContent]` y `[itemActions]`; output `(select)`.

```html
<ui-list-item [selected]="selected" (select)="onSelect()">
  <div itemContent> … contenido del ítem … </div>
  <div itemActions> … botones full-width … </div>
</ui-list-item>
```

Reglas:
- **No** redefinir `:host`, `*-content`, `*-side`, `*-actions` ni media queries en el
  componente del ítem: los aporta `ui-list-item`.
- Acciones: botones de texto full-width (`matButton` tonal/outlined/filled) con
  `class="block"`, apilados. **No** usar `mat-icon-button` sueltos para las acciones.
- Chips de estado: `<ui-badge-chip [status]="...">` o `[variant]`.
- Fila identidad: `<ui-entity icon="person" [container]="false">` con `[entityName]`
  (`text-subtitle`) y `[entityMeta]`.
- Fila de badges: `class="chip-row"`.
- Íconos: `mat-icon.sm` / `.xs` + `text-secondary` (sin tamaños inline).

### `ui-entity`

Ícono + nombre + meta. Con `container=false` (ítems) renderiza un `mat-icon` compacto;
con `container=true` (default, drawers) usa `ui-icon` con `variant`/`size`.

```html
<ui-entity icon="person" variant="primary">
  <span entityName class="text-subtitle">{{ name }}</span>
  <span entityMeta>DNI {{ dni }}</span>
</ui-entity>
```

### `ui-detail-panel`

Shell canónico de panel de detalle (drawer): header opcional (badge/fecha) + cuerpo con scroll.

```html
<ui-detail-panel>
  <div detailHeader> … badge + fecha … </div>
  <ui-detail-section label="Paciente"> … </ui-detail-section>
</ui-detail-panel>
```

### `ui-detail-section`

Sección etiquetada dentro de un panel. `variant`: `default` | `info` (fondo `--secondary-50`, ej. indicaciones) | `neutral` (fondo `--primary-50`, ej. diagnóstico/observaciones). La primera sección no lleva margen superior.

```html
<ui-detail-section label="Diagnóstico" variant="neutral">
  <p class="text-sm">{{ diagnostic | capitalize }}</p>
</ui-detail-section>
```

### `ui-results-list`

Listado de resultados: contador ("Mostrando X–Y de N"), carga/vacío, contenido y paginador. El vacío se puede customizar con el slot `[empty]`.

| Input | Tipo | Default |
|---|---|---|
| `loading` | boolean | false |
| `total` | number | 0 |
| `label` | string | '' |
| `emptyIcon` / `emptyMessage` | string | — |
| `pageSize` / `pageIndex` | number | 10 / 0 |
| `pageSizeOptions` | number[] | [5, 10, 25] |

Output `page`.

```html
<ui-results-list [loading]="loading" [total]="total" label="Recetas"
  [pageSize]="pageSize" [pageIndex]="pageIndex" [pageSizeOptions]="[5, 15, 30]"
  (page)="onPageChange($event)">
  <app-document-item *ngFor="let item of items" …></app-document-item>
</ui-results-list>
```

### `ui-results-toolbar`

Card de búsqueda + filtros de un listado: barra de búsqueda (con botón limpiar), toggle de filtros (con contador) y botón actualizar. El estado de apertura de filtros es interno.

| Input | Tipo | Default |
|---|---|---|
| `control` | `FormControl` | — (requerido) |
| `placeholder` | string | '' |
| `isLoading` | boolean | false |
| `showFilters` | boolean | false |
| `showRefresh` | boolean | true |
| `filterCount` | number | 0 |
| `hasActiveFilters` | boolean | false |

Outputs: `refresh`, `clearSearch`, `searchEnter`, `clearFilters`.
Slots: `[searchExtra]` (contenido dentro del card, debajo de la fila) y `[filters]` (los `.filter-group`).

```html
<ui-results-toolbar [control]="searchControl" placeholder="Buscar…"
  [isLoading]="loading" [showFilters]="true" [filterCount]="activeFilterCount"
  [hasActiveFilters]="hasActiveFilters" (refresh)="refresh()"
  (clearSearch)="onClearSearch()" (clearFilters)="onClear()">
  <div class="filter-group" filters>
    <label>Estado</label>
    <ui-field-input type="select" [control]="statusControl">…</ui-field-input>
  </div>
</ui-results-toolbar>
```

### `ui-field-input`

Input/select nativo con el estilo de campo unificado (mismo que `ui-date-field`). Usar en paneles de filtros y formularios en lugar de redefinir `.filter-input`.

```html
<ui-field-input type="select" [control]="statusControl">
  <option *ngFor="let o of statusOptions" [value]="o.value">{{ o.label }}</option>
</ui-field-input>
```

## 14. Botones: variantes de estado (error / warn)

**En Angular Material v20 (M3) el input `color` de los botones es inerte**
(`color="warn"` / `color="error"` no aplican ninguna clase). **No usar `color=`**;
aplicar la clase explícita del design system.

| Semántica | Clase | Variantes |
|---|---|---|
| **Destructivo** (Eliminar, Anular, Quitar, Suspender) | `class="mat-error"` | inline/lists: `matButton="outlined"`. Acción principal de un diálogo de confirmación: `matButton="filled"` |
| **Cautela** (Deshacer, Desactivar PIN) | `class="mat-warn"` | `matButton="outlined"` / `"tonal"` según contexto |
| **Confirmación / éxito** (Aceptar de un diálogo de operación exitosa) | `class="mat-success"` | `matButton="filled"` |
| **Neutral** (Cancelar, Continuar) | — | sin clase de estado (usar `outlined`/`tonal`/`filled` base) |

```html
<!-- Destructivo inline -->
<button matButton="outlined" class="mat-error">Eliminar</button>

<!-- Destructivo: CTA principal de un diálogo de confirmación -->
<button matButton="filled" class="mat-error">Confirmar</button>

<!-- Cautela -->
<button matButton="outlined" class="mat-warn">
  <mat-icon>undo</mat-icon> Deshacer
</button>
```

`styles.sass` define `.mat-error` / `.mat-warn` / `.mat-success` para `outlined`, `tonal`,
`filled`, `raised`, `text` e icon-buttons, de modo que la clase pinta el estado en reposo
(no solo en `:hover`). Para un confirm destructivo, la pantalla puede pasar un flag al
diálogo (ej. `ConfirmDialogComponent` acepta `data.danger`) en vez de duplicar el
componente. **Nunca** usar `style="background-color: green; color: white"` inline para
botones de éxito: usar `class="mat-success"`.
