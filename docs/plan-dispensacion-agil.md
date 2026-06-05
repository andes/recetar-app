# Plan de desarrollo - Pantalla ágil de dispensación

## 1. Análisis de lo existente

La pantalla de **revisión de documentos** (`documents-home`) sigue este patrón:
- Toggle de tipo de documento (recetas / certificados / prácticas / insumos) con contadores de _stats_
- Barra de búsqueda por texto libre + panel de filtros colapsable (fecha desde/hasta + estado)
- Tabla genérica con columnas fijas y detalle en _drawer_ lateral

La pantalla de **dispensación legacy** sigue este patrón:
- Formulario de búsqueda obligatorio (DNI + sexo + fecha) antes de ver cualquier receta
- Tabla con filtros de estado y rango de fechas, acciones en menú contextual (imprimir, dispensar) y countdown de deshacer

Ambas usan `MatTable`, y la nueva pantalla debe **diferenciarse claramente** de `documents-home`, tanto visual como funcionalmente.

---

## 2. Visión de la nueva pantalla

La pantalla de dispensación debe ser un **panel de trabajo centrado en la acción rápida**, no en la revisión de documentos propios. El flujo actual obliga a hacer una búsqueda antes de ver cualquier receta; la nueva pantalla debe **mostrar recetas pendientes de entrada** y permitir buscar y dispensar con la menor cantidad de pasos posible.

El diseño se organiza en tres zonas:
1. **Zona superior**: barra de búsqueda (DNI, nombre del paciente o código de receta) y barra de filtros (rango de fechas desde/hasta, estado, botones limpiar/filtrar), con su propio botón de actualización manual.
2. **Zona central**: tabla plana de recetas con columnas medicamento, paciente, profesional, envases, estado y acciones (ver detalle, imprimir, dispensar).
3. **Panel lateral derecho**: listado de medicamentos **agrupados** con contadores, obtenido mediante un request independiente. Cada medicamento es cliqueable, lo que expande su detalle mostrando los últimos 10 códigos de receta en los que fue pedido. Al hacer clic en un código se abre el drawer con el detalle completo de esa receta.

Tanto la lista de recetas como el panel de medicamentos se actualizan **automáticamente cada 5 minutos** y cada uno tiene su propio **botón de actualización manual**.

---

## 3. Estructura propuesta

### 3.1. Barra superior de búsqueda
Es el primer elemento visible de la pantalla, ubicado debajo del título. Acepta:
- **DNI del paciente** (prioritario)
- Nombre del paciente
- Código de receta

No usa debounce automático: requiere que el usuario presione "Filtrar" o Enter para ejecutar la búsqueda. Esto evita llamadas innecesarias al servidor mientras se escribe y permite búsquedas combinadas con los filtros de fecha y estado.

### 3.2. Barra de filtros
Ubicada debajo de la barra de búsqueda, en una sola línea horizontal con:
- **Fecha desde** (datepicker, opcional)
- **Fecha hasta** (datepicker, opcional)
- **Estado** (select desplegable con: todos los estados, vigente/pendiente, dispensada, vencida, finalizada, suspendida, rechazada)
- **Botón "Limpiar"** — resetea todos los filtros y la búsqueda a sus valores por defecto
- **Botón "Filtrar"** — aplica los filtros actuales y ejecuta la consulta
- **Botón de actualizar** — recarga los datos de la tabla sin modificar los filtros activos

La barra de filtros y la búsqueda están vinculadas: al presionar "Filtrar" se combinan el término de búsqueda, las fechas y el estado en una única consulta al backend.

### 3.3. Tabla de recetas
Listado en formato tabla con las siguientes columnas:

| Columna | Contenido |
|---|---|
| Medicamento | Nombre del medicamento + badge de origen (RecetAR/Andes) |
| Paciente | Apellido, nombre + DNI en tamaño reducido |
| Profesional | Nombre del médico prescriptor |
| Envases | Cantidad de envases (centrado) |
| Estado | Badges de estado (Vence en 24h, Triplicado, Duplicado, Vencida) y countdown de deshacer si está dispensada dentro de la ventana |
| Acciones | Botones: ver detalle (ícono ojo), imprimir (ícono impresora), dispensar (botón azul principal) |

Al hacer clic en una fila de la tabla, se abre un **drawer lateral derecho** con el detalle completo de la receta (ver 3.5).

Las filas tienen estados visuales diferenciados:
- **Normal**: fondo blanco
- **Seleccionada**: fondo azul claro con borde azul (cuando está abierto el drawer para esa receta)
- **Dispensada**: fondo verde claro, con countdown de deshacer en la columna de estado
- **Vencida**: opacidad reducida, texto tachado en medicamento

Encima de la tabla se muestra un contador con el total de resultados (ej. "12 recetas encontradas · 4 Andes · 8 RecetAR").

### 3.4. Panel lateral de medicamentos agrupados
Ubicado a la derecha de la tabla, en un panel de ancho fijo (~320px). Muestra los medicamentos **agrupados por nombre**, con un contador de cuántas recetas lo contienen.

**Origen de datos**: este panel se alimenta de un **request independiente** al de la tabla. El endpoint retorna la lista de medicamentos únicos con su conteo y las fuentes (RecetAR/Andes). No se ve afectado por los filtros de la tabla — siempre muestra el resumen del día completo.

Cada fila del panel muestra:
- **Nombre del medicamento**
- **Subtítulo**: fuentes (ej. "2× RecetAR · 1× Andes") y estado si aplica (ej. "Dispensada", "Vencida")
- **Contador**: número grande con la cantidad de recetas

**Al hacer clic** en un medicamento del panel:
1. El medicamento se resalta en el panel (fondo azul claro).
2. La fila se expande mostrando una **minitabla con los últimos 10 códigos de receta** en los que aparece ese medicamento, con columnas: código de receta, paciente, fecha y cantidad de envases.
3. Si se hace clic en un código de esa minitabla, se abre el drawer con el detalle de esa receta y se resalta la fila correspondiente en la tabla central.

Los medicamentos dispensados o vencidos se muestran con opacidad reducida y su contador en color verde (dispensado) o rojo (vencido).

**Actualización**: el panel tiene su propio botón de actualizar en el encabezado. También se refresca automáticamente cada 5 minutos, independientemente de la tabla.

### 3.5. Drawer de detalle de receta
Al hacer clic en una fila de la tabla o en un código del panel de medicamentos, se despliega un **drawer lateral** que se superpone desde la derecha con un fondo semitransparente (_overlay_). Muestra:

- **Cabecera**: título "Detalle de receta" y botón cerrar
- **Badge de origen**: RecetAR (verde) o Andes (azul)
- **Código de receta**
- **Sección Paciente**: nombre completo y DNI
- **Sección Profesional**: nombre del médico, matrícula, fecha de prescripción
- **Sección Medicación**: recuadro azul claro con el nombre del medicamento y detalle de envases
- **Sección Diagnóstico**: recuadro gris claro con el texto del diagnóstico
- **Sección Indicaciones**: recuadro gris claro con las indicaciones de administración
- **Barra inferior de acciones**: botón "Imprimir" (borde) y botón "Dispensar" (azul sólido). Si la receta ya fue dispensada, el botón "Dispensar" se reemplaza por el countdown de deshacer.

### 3.6. Dispensación y deshacer
Al presionar "Dispensar" en una fila de la tabla o en el drawer:
1. Se muestra un spinner en el botón de dispensar mientras se procesa.
2. Al confirmarse, la receta cambia de estado visual en la tabla (fondo verde, aparece el countdown de deshacer).
3. El panel de medicamentos se actualiza para reflejar el nuevo estado.
4. Si falla, se muestra un mensaje de error con `NotificationService`.
5. El countdown de deshacer aparece como una barra de progreso + temporizador + botón "Deshacer" en la misma celda de estado de la tabla.

### 3.7. Indicadores visuales
- **Origen de la receta**: badge "R" (azul) para RecetAR, badge "A" (rosa) para Andes, visible junto al nombre del medicamento.
- **Vencimiento próximo**: badge naranja "Vence en 24h" o "Vence en 48h" cuando la receta está por vencer.
- **Tipo de receta**: badge azul "Duplicado" o "Triplicado" cuando corresponde.
- **Vencida**: fila atenuada con texto tachado y badge rojo "Vencida".
- **Dispensada**: fila con fondo verde sutil, countdown de deshacer visible.

### 3.8. Actualización automática y manual
- **Cada 5 minutos**, ambos conjuntos de datos (tabla y panel de medicamentos) se refrescan automáticamente mediante un ` timer` reactivo que emite en intervalos de 5 minutos. Si el usuario tiene el drawer abierto, la actualización no lo cierra — solo actualiza los datos subyacentes.
- **Botones de actualización independientes**: la tabla tiene un botón de actualizar en la barra de filtros. El panel de medicamentos tiene su propio botón de actualizar en su encabezado. Accionar uno no dispara la recarga del otro.
- Al dispensar o deshacer una dispensación, ambos paneles se actualizan inmediatamente sin esperar al ciclo de 5 minutos.

---

## 4. Componentes nuevos a crear (en `features/pharmacists/`)

| Componente | Responsabilidad |
|---|---|
| `DispenseHomeComponent` | Pantalla principal: orquesta búsqueda, filtros, tabla, panel lateral, drawer y timers de actualización |
| `DispenseFiltersBarComponent` | Barra de filtros con datepickers desde/hasta, select de estado y botones limpiar/filtrar/actualizar |
| `DispenseTableComponent` | Tabla de recetas con columnas, estados visuales, acciones (dispensar/imprimir/ver) y selección de fila |
| `DispenseMedicationsPanelComponent` | Panel lateral: lista de medicamentos agrupados, contadores, expansión con últimos 10 códigos de receta y su propio botón de actualizar |
| `DispenseDrawerComponent` | Drawer lateral con detalle completo de la receta (paciente, profesional, medicación, diagnóstico, indicaciones, acciones) |
| `DispenseCountdownComponent` | Barra de progreso + temporizador + botón "Deshacer" para dispensaciones dentro de la ventana de cancelación |

## 5. Servicios nuevos

| Servicio | Responsabilidad |
|---|---|
| `DispenseService` | Fachada que unifica búsqueda de recetas local + Andes (filtros, búsqueda, paginación), operaciones de dispensa/cancel y estado reactivo de la tabla |
| `DispenseMedicationsService` | Servicio independiente para el panel de medicamentos agrupados: obtiene la lista de medicamentos únicos con conteos, fuentes y últimos 10 códigos de receta por medicamento |

## 6. Datos y API

**Endpoints ya existentes** (backend, sin cambios):
- `GET /prescriptions/find/:dni?status=&startDate=&endDate=&sexo=` → búsqueda por paciente con filtros
- `GET /prescriptions/user/:userId?...` → listado paginado con filtros para la tabla central
- `PATCH /prescriptions/:id/dispense` → dispensar receta local
- `PATCH /prescriptions/:id/cancel-dispense` → cancelar dispensación local
- `PATCH /prescriptions/andes/dispense` → dispensar receta Andes
- `PATCH /prescriptions/andes/cancel-dispense` → cancelar dispensación Andes

**Endpoints nuevos requeridos** (backend):
- `GET /prescriptions/medications-summary?dateFrom=&dateTo=&pharmacyId=` → retorna la lista de medicamentos únicos agrupados con conteo de recetas (total, por fuente RecetAR/Andes, por estado) y los últimos 10 códigos de receta para cada medicamento.
  - Respuesta sugerida: `{ medications: [{ name: string, count: number, sources: { recetar: number, andes: number }, status: string, lastPrescriptions: [{ code: string, patient: string, date: string, quantity: number }] }] }`
  - Este endpoint es **independiente** del de recetas: se consume por separado y tiene su propio ciclo de actualización.

---

## 7. Flujo de usuario (paso a paso)

1. El farmacéutico ingresa a "Dispensar" desde el menú lateral.
2. **Vista inicial**: la tabla carga las recetas pendientes por defecto, el panel lateral carga los medicamentos agrupados del día. Ambos inician su timer de actualización de 5 minutos.
3. **Buscar**: escribe un DNI o nombre en la barra de búsqueda, ajusta los filtros si lo desea, y presiona "Filtrar" o Enter. La tabla se actualiza con los resultados. El panel de medicamentos no se ve afectado por los filtros de la tabla.
4. **Explorar por medicamento**: en el panel lateral, hace clic en "Ibuprofeno 600 mg (3 recetas)". El panel expande la fila mostrando los últimos 10 códigos de receta con ese medicamento.
5. **Ver detalle**: hace clic en un código de receta del panel expandido (o en una fila de la tabla). Se abre el drawer derecho con todos los datos de la receta: paciente, profesional, medicación, diagnóstico, indicaciones.
6. **Dispensar desde el drawer**: presiona "Dispensar" en el drawer → la receta cambia a estado dispensada en la tabla, aparece el countdown de deshacer, el panel de medicamentos se actualiza.
7. **Dispensar desde la tabla**: presiona el botón "Dispensar" directamente en una fila → mismo efecto sin necesidad de abrir el drawer.
8. **Deshacer**: presiona "Deshacer" en el countdown de una fila dispensada → la receta vuelve a estado pendiente y ambos paneles se actualizan.
9. **Actualizar manualmente**: presiona el botón de actualizar de la tabla o del panel de medicamentos según necesite.

---

## 8. Estimación y orden de implementación

| Fase | Alcance | Esfuerzo |
|---|---|---|
| F1 | `DispenseService` + `DispenseMedicationsService` (fachadas reactivas para los dos conjuntos de datos, con timers de actualización de 5 minutos) | L |
| F2 | `DispenseTableComponent` (tabla plana con columnas, badges de estado/origen, acciones inline, selección de fila) | L |
| F3 | `DispenseFiltersBarComponent` + `DispenseHomeComponent` (búsqueda, filtros, orquestador, layout canvas + sidebar, integración de tabla) | M |
| F4 | `DispenseMedicationsPanelComponent` (panel lateral con lista agrupada, contadores, expansión con últimos 10 códigos, botón de actualizar propio) | M |
| F5 | `DispenseDrawerComponent` (drawer con overlay, secciones de detalle, botones de acción) | M |
| F6 | Acción de dispensar + countdown de deshacer (`DispenseCountdownComponent`) integrados en tabla y drawer | L |
| F7 | Actualización automática cada 5 minutos + botones de actualización independientes por conjunto de datos | S |
| F8 | Ajustes visuales, animaciones, badges, estados vacíos, responsive | S |

**Total estimado:** ~12-14 días de desarrollo (F1-F3 en paralelo, luego F4-F5 en paralelo, F6-F8 secuenciales).

---

## 9. Diferenciación con `documents-home`

| Aspecto | `documents-home` (revisión) | `dispense-home` (dispensación) |
|---|---|---|
| Propósito | Revisar documentos propios | Dispensar recetas de pacientes |
| Vista inicial | Toggle de tipo + tabla paginada | Tabla plana de recetas pendientes + panel de medicamentos agrupados |
| Búsqueda | Texto libre con debounce automático | DNI/nombre/código, búsqueda manual al presionar Filtrar |
| Filtros | Panel colapsable (fecha desde/hasta + select de estado) | Barra horizontal siempre visible (desde/hasta/estado + limpiar/filtrar/actualizar) |
| Panel lateral | No tiene | Medicamentos agrupados con contadores y detalle expandible (request independiente) |
| Detalle | Drawer lateral con datos del documento | Drawer lateral con datos completos de la receta + acciones de dispensación |
| Acciones | Ver detalle / Imprimir / Eliminar / Anular | Dispensar (principal) / Imprimir / Ver detalle / Deshacer |
| Diseño | Tabla estándar con MatTable | Tabla propia con badges, estados visuales por fila y countdown inline |
| Feedback | Diálogos modales | Drawer + notificaciones + countdown inline |
| Actualización | Manual al cambiar de pestaña o aplicar filtros | Automática cada 5 min + botones de actualización independientes por conjunto de datos |
| Rol | Profesional | Farmacéutico |
