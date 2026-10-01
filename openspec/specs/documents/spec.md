# documents Specification

## Purpose
`documents` define el historial y la consulta de recetas, certificados, practicas e insumos del profesional, con estadisticas, busqueda, filtros, detalle e impresion.

## Requirements

### Requirement: Acceso a documentos
El frontend SHALL exponer `/documentos` a usuarios autenticados y SHALL mostrar la seccion Documentos en el menu lateral del rol profesional.

#### Scenario: Acceso autorizado
- **WHEN** un usuario autenticado navega a `/documentos`
- **THEN** el frontend muestra el historial de documentos

#### Scenario: Menu de documentos
- **WHEN** un usuario profesional inicia sesion
- **THEN** el menu lateral muestra la seccion Documentos

### Requirement: Pestanas y estadisticas
El frontend SHALL mostrar las pestanas Recetas, Certificados y Practicas, y SHALL agregar Insumos solo cuando el ambito de trabajo sea publico. Cada pestana SHALL mostrar su cantidad total a partir de las estadisticas.

#### Scenario: Ambito privado
- **WHEN** el ambito de trabajo es privado
- **THEN** el frontend muestra solo Recetas, Certificados y Practicas

#### Scenario: Ambito publico
- **WHEN** el ambito de trabajo es publico
- **THEN** el frontend agrega la pestana Insumos

#### Scenario: Conteo por tipo
- **WHEN** el frontend carga las estadisticas
- **THEN** cada pestana muestra la cantidad de documentos de su tipo

### Requirement: Listado paginado
El frontend SHALL listar los documentos del tipo seleccionado con desplazamiento y tamano de pagina de 5, 15 o 30, usando 15 por defecto. SHALL informar el total y el rango de resultados visibles.

#### Scenario: Cambio de pagina
- **WHEN** el usuario cambia de pagina
- **THEN** el frontend solicita el desplazamiento correspondiente

#### Scenario: Cambio de tamano de pagina
- **WHEN** el usuario cambia la cantidad de items por pagina
- **THEN** el frontend recarga el listado con el nuevo tamano

### Requirement: Busqueda de documentos
El frontend SHALL buscar por un termino: las recetas por paciente, DNI o medicamento; los certificados y practicas por termino contra el backend; los insumos por nombre. SHALL permitir limpiar la busqueda. La busqueda no SHALL aplicarse mientras haya filtros activos en recetas.

#### Scenario: Busqueda de recetas
- **WHEN** el usuario busca una receta por paciente, DNI o medicamento
- **THEN** el frontend filtra y muestra las coincidencias

#### Scenario: Busqueda de certificados o practicas
- **WHEN** el usuario busca un certificado o una practica con al menos 3 caracteres
- **THEN** el frontend consulta el backend con ese termino

#### Scenario: Busqueda con filtros activos
- **WHEN** el usuario tiene filtros activos en recetas
- **THEN** el frontend ignora el texto de busqueda (observacion: el termino no se combina con los filtros)

#### Scenario: Busqueda de insumos
- **WHEN** el usuario busca un insumo por nombre
- **THEN** el frontend filtra los insumos por ese nombre

### Requirement: Filtros de documentos
El frontend SHALL permitir filtrar por rango de fechas y estado, informar la cantidad de filtros activos y permitir limpiarlos. Los filtros de fecha y estado SHALL aplicarse a recetas.

#### Scenario: Filtros en recetas
- **WHEN** el usuario selecciona rango de fechas o estado en Recetas
- **THEN** el frontend recarga el listado con esos filtros

#### Scenario: Limpiar filtros
- **WHEN** el usuario limpia los filtros
- **THEN** el frontend quita los filtros, la busqueda y vuelve a la primera pagina

#### Scenario: Filtros en certificados y practicas
- **WHEN** el usuario aplica filtros de fecha o estado en Certificados o Practicas
- **THEN** esos filtros no se envian al backend (observacion: solo aplican a recetas)

### Requirement: Detalle del documento
El frontend SHALL mostrar un panel de detalle con los datos del documento seleccionado: codigo, paciente, DNI, sexo, cobertura, profesional, matricula, organizacion, medicamento o texto, diagnostico, indicaciones, cantidad, unidades, estado y fechas. Para certificados SHALL mostrar las fechas de inicio, fin y emision, y la anulacion cuando exista.

#### Scenario: Detalle de receta
- **WHEN** el usuario selecciona una receta
- **THEN** el frontend muestra el detalle de la receta con sus datos y estado

#### Scenario: Detalle de certificado
- **WHEN** el usuario selecciona un certificado
- **THEN** el frontend muestra su detalle con las fechas y, si corresponde, la anulacion

#### Scenario: Detalle de practica
- **WHEN** el usuario selecciona una practica
- **THEN** el frontend muestra su detalle con diagnostico e indicaciones

#### Scenario: Detalle de insumo
- **WHEN** el usuario selecciona un insumo
- **THEN** el frontend muestra su detalle sin acciones de impresion ni eliminacion

### Requirement: Impresion de documentos
El frontend SHALL permitir imprimir recetas, certificados y practicas desde el listado y desde el panel de detalle, usando la impresion local o la de ANDES segun la fuente de la receta. Cuando el paciente no tenga DNI SHALL imprimir “Sin DNI” en lugar del documento.

#### Scenario: Imprimir receta local
- **WHEN** el usuario imprime una receta local
- **THEN** el frontend genera la impresion de la receta

#### Scenario: Imprimir receta de ANDES
- **WHEN** el usuario imprime una receta de ANDES
- **THEN** el frontend genera la impresion de la receta de ANDES

#### Scenario: Imprimir certificado o practica
- **WHEN** el usuario imprime un certificado o una practica
- **THEN** el frontend genera la impresion correspondiente

#### Scenario: Imprimir documento de paciente sin DNI
- **WHEN** el usuario imprime un documento de un paciente sin DNI
- **THEN** el frontend muestra “Sin DNI” en el lugar del documento

### Requirement: Eliminacion y anulacion de documentos
El frontend SHALL permitir eliminar recetas y practicas previa confirmacion, suspendiendo las recetas de ANDES y eliminando las locales o practicas. SHALL permitir anular certificados no anulados previa confirmacion. Tras la accion SHALL notificar y recargar el listado.

#### Scenario: Eliminar receta local
- **WHEN** el usuario confirma la eliminacion de una receta local
- **THEN** el frontend la elimina, notifica y recarga el listado

#### Scenario: Eliminar receta de ANDES
- **WHEN** el usuario confirma la eliminacion de una receta de ANDES
- **THEN** el frontend la suspende, notifica y recarga el listado

#### Scenario: Eliminar practica
- **WHEN** el usuario confirma la eliminacion de una practica
- **THEN** el frontend la elimina, notifica y recarga el listado

#### Scenario: Anular certificado
- **WHEN** el usuario confirma la anulacion de un certificado no anulado
- **THEN** el frontend lo anula, notifica y recarga el listado

#### Scenario: Certificado ya anulado
- **WHEN** el certificado ya tiene fecha de anulacion
- **THEN** el frontend no ofrece la accion de anular
