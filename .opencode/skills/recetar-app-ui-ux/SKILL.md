---
name: recetar-ui-ux
description: Usá esta skill al rediseñar la UI/UX de recetar-app. Define lineamientos de diseño, paleta, sistema de espaciado y reglas de estilo generales.
---

# RecetAR — UI/UX Design Guidelines

Lineamientos de diseño visual y de experiencia de usuario para `recetar-app`.

## UI Framework

La app usa **Angular Material** como librería de componentes UI. Cada feature module importa solo los módulos Material que necesita. Preferir componentes Material sobre HTML/CSS custom:

- Layout: `MatSidenavContainer`, `MatSidenav`, `MatToolbar`
- Formularios: `MatFormField`, `MatInput`, `MatSelect`, `MatAutocomplete`, `MatCheckbox`, `MatDatepicker`
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
| `size` | `'sm'`\|`'md'`\|`'lg'` | `'md'` | 32/36/44px |
| `variant` | `'neutral'`\|`'primary'`\|`'secondary'` | `'neutral'` | Paleta de color de fondo |

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

Chip de estado semántico, wrapper de `<mat-chip disableRipple>`.

| Input | Tipo | Default | Descripción |
|---|---|---|---|
| `variant` | `'success'`\|`'info'`\|`'warning'`\|`'error'` | `'success'` | Color del chip |
| `size` | `'sm'`\|`'md'` | `'sm'` | Compacto o normal |

```html
<ui-badge-chip variant="success" size="sm">
  <mat-icon matChipAvatar>check_circle</mat-icon>
  Validado
</ui-badge-chip>
```

**Cuándo usar:** cualquier indicador de estado o categoría que use los tokens semánticos
del sistema de diseño (success, info, warning, error). Genérico. **No usar**
`<mat-chip class="success sm">` manualmente.

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

- Usar `MatTable` con `MatSort` y `MatPaginator`.
- `SpanishPaginatorIntlService` ya existe en `shared/services/`.
- Tarjetas (`MatCard`) para vistas de detalle.

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
