# profile Specification

## Purpose
`profile` define la gestion del perfil del usuario autenticado: identidad y matriculas segun rol, datos de cuenta, contrasena, PIN de seguridad y organizaciones.

## Requirements

### Requirement: Acceso al perfil
El frontend SHALL exponer `/perfil` a usuarios autenticados y SHALL cargar los datos del usuario y, para profesionales, el estado del PIN.

#### Scenario: Acceso autorizado
- **WHEN** un usuario autenticado navega a `/perfil`
- **THEN** el frontend carga el perfil del usuario

#### Scenario: Error de carga
- **WHEN** falla la carga de los datos del usuario
- **THEN** el frontend muestra el mensaje de error

### Requirement: Secciones segun rol
El frontend SHALL mostrar siempre las secciones Datos de cuenta y Contrasena, y SHALL agregar PIN de seguridad y Organizaciones solo a usuarios profesionales. SHALL permitir abrir una seccion mediante el parametro `seccion`.

#### Scenario: Secciones de farmaceutico
- **WHEN** un usuario farmaceutico abre el perfil
- **THEN** el frontend muestra Datos de cuenta y Contrasena

#### Scenario: Secciones de profesional
- **WHEN** un usuario profesional abre el perfil
- **THEN** el frontend muestra Datos de cuenta, Contrasena, PIN de seguridad y Organizaciones

#### Scenario: Seccion por parametro
- **WHEN** la ruta incluye `seccion` con una seccion valida
- **THEN** el frontend abre esa seccion

### Requirement: Identidad y matriculas
El frontend SHALL mostrar el rol del usuario, sus matriculas con numero, vencimiento, estado y tiempo restante, y el resumen de organizaciones y PIN. Un vencimiento a menos de 12 meses SHALL marcarse como proximo.

#### Scenario: Profesional con matriculas
- **WHEN** el usuario profesional tiene matriculas cargadas
- **THEN** el frontend muestra cada matricula con su estado y vigencia

#### Scenario: Vencimiento proximo
- **WHEN** una matricula vence en menos de 12 meses
- **THEN** el frontend la marca como proxima a vencer

#### Scenario: Estado de matricula
- **WHEN** la matricula esta vencida, suspendida, inhabilitada o dada de baja
- **THEN** el frontend muestra el estado correspondiente

### Requirement: Estado de habilitacion de farmacia
El frontend SHALL mostrar la habilitacion de la farmacia como vigente o vencida segun su fecha de vencimiento. Si no hay fecha, SHALL considerarla vigente.

#### Scenario: Habilitacion vigente
- **WHEN** la fecha de habilitacion es futura o no existe
- **THEN** el frontend muestra la habilitacion como vigente

#### Scenario: Habilitacion vencida
- **WHEN** la fecha de habilitacion es anterior a hoy
- **THEN** el frontend muestra la habilitacion como vencida

### Requirement: Datos de cuenta
El frontend SHALL permitir editar email, nombre y nombre de usuario. El email SHALL ser valido y el nombre y el usuario SHALL tener al menos 3 caracteres. Para profesionales y administradores SHALL actualizar los datos directamente; para farmacias SHALL solicitar la actualizacion por correo de confirmacion.

#### Scenario: Actualizacion directa
- **WHEN** un usuario profesional o administrador guarda datos validos
- **THEN** el frontend actualiza su cuenta y notifica el exito

#### Scenario: Actualizacion de farmacia
- **WHEN** un usuario farmaceutico guarda datos validos
- **THEN** el frontend solicita la confirmacion por correo y avisa al usuario

#### Scenario: Datos invalidos
- **WHEN** el email es invalido o el nombre o usuario tienen menos de 3 caracteres
- **THEN** el frontend no guarda y marca los campos

### Requirement: Cambio de contrasena
El frontend SHALL permitir cambiar la contrasena indicando la actual, una nueva de al menos 8 caracteres y su confirmacion. La confirmacion SHALL coincidir con la nueva contrasena.

#### Scenario: Cambio valido
- **WHEN** el usuario completa la contrasena actual y una nueva valida confirmada
- **THEN** el frontend cambia la contrasena y notifica el exito

#### Scenario: Confirmacion distinta
- **WHEN** la confirmacion no coincide con la nueva contrasena
- **THEN** el frontend marca el campo y no envia el cambio

### Requirement: Estado del PIN de seguridad
El frontend SHALL mostrar si el PIN esta activado o desactivado y SHALL actualizar ese estado al activarlo, cambiarlo o desactivarlo.

#### Scenario: PIN activo
- **WHEN** el usuario tiene el PIN activado
- **THEN** el frontend muestra el estado activado

#### Scenario: Actualizacion de estado
- **WHEN** el usuario activa, cambia o desactiva el PIN
- **THEN** el frontend vuelve a consultar y muestra el nuevo estado

### Requirement: Gestion del PIN de seguridad
El frontend SHALL permitir activar el PIN con la contrasena actual y un PIN de 4 digitos confirmado, cambiarlo con el PIN actual y uno nuevo confirmado, y desactivarlo con la contrasena. El PIN SHALL tener exactamente 4 digitos y su confirmacion SHALL coincidir.

#### Scenario: Activar PIN
- **WHEN** el usuario ingresa su contrasena y un PIN de 4 digitos confirmado
- **THEN** el frontend activa el PIN y notifica el exito

#### Scenario: Cambiar PIN
- **WHEN** el usuario ingresa su PIN actual y uno nuevo confirmado
- **THEN** el frontend cambia el PIN y notifica el exito

#### Scenario: Desactivar PIN
- **WHEN** el usuario ingresa su contrasena
- **THEN** el frontend desactiva el PIN y notifica el exito

#### Scenario: PIN invalido
- **WHEN** el PIN no tiene 4 digitos o no coincide con su confirmacion
- **THEN** el frontend no envia la operacion y marca el campo

#### Scenario: Error del servidor
- **WHEN** la API rechaza la operacion del PIN
- **THEN** el frontend muestra el mensaje de error

### Requirement: Organizaciones del profesional
El frontend SHALL listar las organizaciones del profesional. SHALL permitir agregar una organizacion buscando por nombre (al menos 3 caracteres, con retardo de 300 ms) en el padron SISA, excluyendo las ya asociadas, y SHALL permitir quitar una organizacion. Cada organizacion SHALL mostrar su ambito publico o privado.

#### Scenario: Listado de organizaciones
- **WHEN** el usuario profesional abre Organizaciones
- **THEN** el frontend muestra sus organizaciones asociadas o el estado vacio

#### Scenario: Buscar y agregar
- **WHEN** el usuario busca una organizacion por nombre con al menos 3 caracteres
- **THEN** el frontend muestra las coincidencias del padron SISA y permite agregar una

#### Scenario: Organizacion ya asociada
- **WHEN** una organizacion del padron ya esta asociada al usuario
- **THEN** el frontend no la incluye en los resultados

#### Scenario: Quitar organizacion
- **WHEN** el usuario quita una organizacion
- **THEN** el frontend persiste la lista sin esa organizacion y notifica el exito

#### Scenario: Ambito de la organizacion
- **WHEN** el frontend muestra una organizacion
- **THEN** indica si su ambito es publico o privado

#### Scenario: Error al guardar
- **WHEN** falla el guardado de organizaciones
- **THEN** el frontend muestra el error y recarga la lista
