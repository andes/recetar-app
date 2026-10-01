# dispensing Specification

## Purpose
`dispensing` define la pantalla de dispensacion del farmaceutico: busqueda y filtrado de recetas locales y de ANDES, vista previa, dispensa, reemplazo de medicamento y deshacer dentro de la ventana de gracia.

## Requirements

### Requirement: Acceso a la dispensacion
El frontend SHALL exponer `/dispensar-nuevo` solo a usuarios autenticados con rol farmaceutico (privado o publico). El menu lateral SHALL mostrar la seccion Dispensar a esos roles.

#### Scenario: Acceso autorizado
- **WHEN** un usuario con rol farmaceutico navega a `/dispensar-nuevo`
- **THEN** el frontend muestra la pantalla de dispensacion

#### Scenario: Acceso no autorizado
- **WHEN** un usuario sin rol farmaceutico navega a `/dispensar-nuevo`
- **THEN** el frontend lo redirige a la seccion de su rol

### Requirement: Listado inicial de recetas
Al entrar, el frontend SHALL cargar las recetas sin filtros y SHALL combinar las recetas locales de RecetAR con las de ANDES, informando el total y la cantidad de cada fuente.

#### Scenario: Carga inicial
- **WHEN** el usuario entra a la pantalla
- **THEN** el frontend solicita las recetas sin filtros y las muestra combinadas

#### Scenario: Conteo por fuente
- **WHEN** el listado contiene recetas locales y de ANDES
- **THEN** el frontend informa cuantas provienen de cada fuente

### Requirement: Busqueda de recetas
El frontend SHALL buscar con un retardo de 500 ms. Un termino de 6 a 8 digitos SHALL buscar por DNI; cualquier otro termino SHALL buscar por nombre de paciente, codigo de receta o texto. Las recetas de pacientes sin DNI SHALL poder encontrarse por nombre y SHALL mostrarse con la leyenda “Sin DNI”. SHALL ofrecer limpiar la busqueda.

#### Scenario: Busqueda por DNI
- **WHEN** el usuario escribe un termino de 6 a 8 digitos
- **THEN** el frontend busca las recetas del paciente con ese DNI

#### Scenario: Busqueda general
- **WHEN** el usuario escribe un termino que no es un DNI
- **THEN** el frontend busca por nombre, codigo o texto

#### Scenario: Paciente sin DNI
- **WHEN** el usuario busca por el nombre de un paciente sin DNI
- **THEN** el frontend muestra sus recetas con la leyenda “Sin DNI”

#### Scenario: Limpiar busqueda
- **WHEN** el usuario limpia el texto de busqueda
- **THEN** el frontend recarga el listado con los filtros actuales y vuelve a la primera pagina

### Requirement: Filtros de recetas
El frontend SHALL permitir filtrar por estado, sexo y rango de fechas. Al cambiar cualquier filtro SHALL recargar el listado desde la primera pagina. SHALL permitir limpiar todos los filtros y SHALL informar la cantidad de filtros activos.

#### Scenario: Filtro por estado
- **WHEN** el usuario selecciona un estado
- **THEN** el frontend recarga el listado con ese estado y vuelve a la primera pagina

#### Scenario: Filtro por sexo
- **WHEN** el usuario selecciona un sexo
- **THEN** el frontend recarga el listado filtrando por ese sexo

#### Scenario: Rango de fechas
- **WHEN** el usuario indica fecha desde y/o hasta
- **THEN** el frontend recarga el listado con ese rango

#### Scenario: Limpiar filtros
- **WHEN** el usuario limpia los filtros
- **THEN** el frontend quita todos los filtros y recarga el listado

### Requirement: Paginacion de recetas
El frontend SHALL paginar contra el backend con desplazamiento y tamano de pagina, ofreciendo tamanos de 5, 15 y 30, y SHALL usar 15 por defecto. El total SHALL provenir de la respuesta del backend.

#### Scenario: Cambio de pagina
- **WHEN** el usuario cambia de pagina
- **THEN** el frontend solicita el desplazamiento correspondiente y muestra esos resultados

#### Scenario: Cambio de tamano de pagina
- **WHEN** el usuario cambia la cantidad de items por pagina
- **THEN** el frontend recarga el listado con el nuevo tamano

### Requirement: Vista previa de receta
El frontend SHALL mostrar cada receta con origen, medicamento, paciente, fecha y estado. Cuando el paciente no tenga DNI SHALL mostrar “Sin DNI” en lugar del documento. Al seleccionar una receta SHALL abrir un panel de detalle con paciente, DNI o “Sin DNI”, sexo, cobertura, profesional, matricula, organizacion, medicamento, unidades, diagnostico, indicaciones, estado, fechas y datos de dispensacion o reemplazo. Al recibir resultados SHALL seleccionar la primera receta como referencia.

#### Scenario: Seleccion de receta
- **WHEN** el usuario selecciona una receta del listado
- **THEN** el frontend abre el panel de detalle con sus datos

#### Scenario: Primera receta preseleccionada
- **WHEN** el listado se carga y no hay una receta seleccionada valida
- **THEN** el frontend toma la primera receta como referencia

#### Scenario: Origen de la receta
- **WHEN** la receta proviene de ANDES o es local
- **THEN** el frontend identifica la fuente y adapta los datos mostrados

#### Scenario: Paciente sin DNI en la vista previa
- **WHEN** la receta pertenece a un paciente sin DNI
- **THEN** el frontend muestra “Sin DNI” en el listado y en el panel de detalle

### Requirement: Dispensa de receta
El frontend SHALL habilitar la dispensa solo para recetas pendientes o vigentes. Al confirmar SHALL abrir un dialogo con el medicamento y la cantidad, y SHALL llamar a la dispensa local o de ANDES segun la fuente. SHALL notificar exito o error y recargar el listado.

#### Scenario: Dispensa exitosa
- **WHEN** el usuario dispensa una receta pendiente y confirma el dialogo
- **THEN** el frontend registra la dispensa, notifica el exito y recarga el listado

#### Scenario: Dispensa no habilitada
- **WHEN** la receta no esta pendiente ni vigente
- **THEN** el boton de dispensar aparece deshabilitado

#### Scenario: Error de dispensa
- **WHEN** la API rechaza la dispensa
- **THEN** el frontend notifica el mensaje de error devuelto

### Requirement: Reemplazo de medicamento en la dispensa
El dialogo de dispensa SHALL permitir reemplazar el medicamento por otro comercial, buscandolo y definiendo su cantidad. Al confirmar el reemplazo SHALL volver al modo de confirmacion y despues dispensar con el reemplazo registrado.

#### Scenario: Buscar reemplazo
- **WHEN** el usuario elige reemplazar el medicamento
- **THEN** el frontend habilita la busqueda de un medicamento comercial

#### Scenario: Confirmar reemplazo
- **WHEN** el usuario selecciona un reemplazo y confirma
- **THEN** el dialogo vuelve al modo de confirmacion y muestra el medicamento reemplazado

#### Scenario: Dispensa con reemplazo
- **WHEN** el usuario dispensa con un reemplazo seleccionado
- **THEN** el frontend envia la dispensa indicando el medicamento y la cantidad de reemplazo

### Requirement: Deshacer dispensa
El frontend SHALL permitir deshacer una dispensa solo dentro de las 2 horas posteriores. Fuera de esa ventana SHALL mostrar el boton deshabilitado con una leyenda. Al deshacer SHALL notificar el resultado y recargar el listado.

#### Scenario: Deshacer dentro de la ventana
- **WHEN** la receta esta dispensada hace menos de 2 horas
- **THEN** el boton de deshacer esta habilitado y la operacion se envía

#### Scenario: Deshacer fuera de la ventana
- **WHEN** la receta fue dispensada hace 2 horas o mas
- **THEN** el boton de deshacer esta deshabilitado y muestra la leyenda

#### Scenario: Resultado de deshacer
- **WHEN** el usuario deshace una dispensa
- **THEN** el frontend notifica exito o error y recarga el listado

### Requirement: Impresion de receta
El frontend SHALL permitir imprimir una receta desde el listado o desde el panel de detalle, usando la impresion local o la de ANDES segun la fuente.

#### Scenario: Imprimir receta local
- **WHEN** el usuario imprime una receta local
- **THEN** el frontend genera la impresion de la receta local

#### Scenario: Imprimir receta de ANDES
- **WHEN** el usuario imprime una receta de ANDES
- **THEN** el frontend genera la impresion de la receta de ANDES
