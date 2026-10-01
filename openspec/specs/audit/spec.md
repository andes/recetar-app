# audit Specification

## Purpose
`audit` define las herramientas de auditoria del frontend: consulta de recetas dispensadas por farmacia y gestion de usuarios (alta, edicion, roles y baja).

## Requirements

### Requirement: Acceso a auditoria
El frontend SHALL exponer las rutas de auditoria solo a usuarios autenticados con rol auditor y SHALL mostrar en el menu lateral las secciones Auditar recetas y Usuarios.

#### Scenario: Acceso autorizado
- **WHEN** un usuario auditor navega a `/audit/users` o `/audit/recetas/auditar`
- **THEN** el frontend muestra la seccion solicitada

#### Scenario: Acceso no autorizado
- **WHEN** un usuario sin rol auditor navega a una ruta de auditoria
- **THEN** el frontend lo redirige a la seccion de su rol

#### Scenario: Menu de auditoria
- **WHEN** un usuario auditor inicia sesion
- **THEN** el menu lateral muestra Auditar recetas y Usuarios

### Requirement: Listado de usuarios
El frontend SHALL listar los usuarios paginados con tamanos de 10, 20 o 30, usando 10 por defecto. SHALL buscar por un termino con retardo de 500 ms y SHALL informar el total y el rango visible.

#### Scenario: Listado inicial
- **WHEN** el usuario entra a la seccion Usuarios
- **THEN** el frontend carga la primera pagina de usuarios

#### Scenario: Busqueda de usuarios
- **WHEN** el usuario escribe un termino de busqueda
- **THEN** el frontend busca usuarios y vuelve a la primera pagina

#### Scenario: Cambio de pagina o tamano
- **WHEN** el usuario cambia la pagina o la cantidad por pagina
- **THEN** el frontend recarga el listado con esos valores

### Requirement: Edicion de usuario
El frontend SHALL permitir editar nombre, nombre de usuario, email, roles y estado activo de un usuario en un panel de detalle. SHALL habilitar Guardar solo si el formulario es valido y hubo cambios, y SHALL mostrar los errores de validacion del servidor por campo.

#### Scenario: Guardar cambios
- **WHEN** el usuario modifica datos validos y guarda
- **THEN** el frontend actualiza el usuario, cierra el panel y notifica el exito

#### Scenario: Sin cambios
- **WHEN** el formulario es valido pero no tiene cambios respecto del original
- **THEN** el frontend mantiene Guardar deshabilitado

#### Scenario: Errores del servidor
- **WHEN** la API rechaza la actualizacion con errores por campo
- **THEN** el frontend marca los campos y muestra los mensajes

#### Scenario: Cambio de estado
- **WHEN** el usuario cambia el estado entre activo e inactivo
- **THEN** el frontend registra el nuevo estado del usuario

### Requirement: Roles de usuario
El frontend SHALL cargar los roles disponibles excluyendo el rol `pharmacist-public`, mostrando su nombre y color, y SHALL impedir seleccionar roles profesionales y farmaceuticos de forma simultanea.

#### Scenario: Roles disponibles
- **WHEN** el usuario abre el selector de roles
- **THEN** el frontend muestra los roles con su nombre traducido y color

#### Scenario: Conflicto de roles
- **WHEN** el usuario intenta combinar un rol profesional con uno farmaceutico
- **THEN** el frontend avisa que los roles son incompatibles y no aplica la seleccion

### Requirement: Baja de usuario
El frontend SHALL permitir eliminar un usuario previa confirmacion. Tras eliminarlo SHALL quitarlo del listado, actualizar el total y notificar el resultado.

#### Scenario: Eliminacion confirmada
- **WHEN** el usuario confirma la eliminacion
- **THEN** el frontend elimina el usuario, lo quita del listado y notifica el exito

#### Scenario: Eliminacion cancelada
- **WHEN** el usuario cancela la confirmacion
- **THEN** el frontend no elimina el usuario

### Requirement: Alta de usuario
El frontend SHALL permitir crear usuarios con nombre, nombre de usuario, email, contrasena y roles. Segun el rol SHALL validar los datos contra los padrones provinciales: farmacia por CUIL y profesional por documento. SHALL autocompletar y bloquear los campos validados y SHALL mostrar los errores por campo.

#### Scenario: Alta de profesional
- **WHEN** el usuario elige un rol profesional e ingresa un documento valido
- **THEN** el frontend busca al profesional en el padron, autocompleta sus datos y habilita el alta

#### Scenario: Alta de farmacia
- **WHEN** el usuario elige un rol de farmacia e ingresa un CUIL valido
- **THEN** el frontend busca la farmacia en el padron, autocompleta sus datos y habilita el alta

#### Scenario: Datos no encontrados
- **WHEN** el padron no devuelve resultados para el documento o CUIL
- **THEN** el frontend informa que no encontro el dato y no habilita el alta

#### Scenario: Rol auditor
- **WHEN** el usuario crea un usuario solo auditor
- **THEN** el frontend toma el nombre de usuario como nombre y no requiere datos de padron

#### Scenario: Formulario invalido
- **WHEN** faltan campos obligatorios o son invalidos
- **THEN** el frontend no crea el usuario y marca los campos

#### Scenario: Errores del servidor
- **WHEN** la API rechaza el alta con errores por campo
- **THEN** el frontend marca los campos y muestra los mensajes

### Requirement: Auditoria de recetas por farmacia
El frontend SHALL buscar recetas dispensadas por CUIT de farmacia. El CUIT SHALL ser numerico de 10 u 11 digitos y la busqueda SHALL ejecutarse con retardo de 500 ms. SHALL mostrar los datos de la farmacia dispensadora, el listado paginado y el detalle de cada receta. SHALL permitir imprimir solo recetas dispensadas.

#### Scenario: Busqueda por CUIT
- **WHEN** el usuario ingresa un CUIT valido de 10 u 11 digitos
- **THEN** el frontend busca y muestra las recetas dispensadas de esa farmacia

#### Scenario: CUIT invalido
- **WHEN** el CUIT contiene letras o no tiene el largo requerido
- **THEN** el frontend no busca y muestra el error de validacion

#### Scenario: Farmacia sin recetas
- **WHEN** la farmacia existe pero no tiene recetas dispensadas
- **THEN** el frontend muestra el estado vacio correspondiente

#### Scenario: Farmacia inexistente
- **WHEN** no existe una farmacia con ese CUIT
- **THEN** el frontend muestra que no encontro la farmacia

#### Scenario: Datos de la farmacia
- **WHEN** la busqueda devuelve resultados
- **THEN** el frontend muestra el nombre, CUIL/CUIT y email de la farmacia dispensadora

#### Scenario: Detalle e impresion
- **WHEN** el usuario abre una receta dispensada
- **THEN** el frontend muestra el detalle y permite imprimirla

#### Scenario: Receta no dispensada
- **WHEN** la receta seleccionada no esta dispensada
- **THEN** el frontend no ofrece impresion

#### Scenario: Limpiar busqueda
- **WHEN** el usuario limpia el CUIT
- **THEN** el frontend borra los resultados y vuelve al estado inicial
