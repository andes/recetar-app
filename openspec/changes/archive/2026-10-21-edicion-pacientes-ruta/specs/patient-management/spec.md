# Spec Delta

## MODIFIED Requirements

### Requirement: Acceso a la pantalla de pacientes
El frontend SHALL exponer `/pacientes`, `/pacientes/nuevo` y `/pacientes/:id/editar` solo a usuarios autenticados con rol profesional o auditor. El menú lateral SHALL mostrar la sección Pacientes a esos roles y no a farmacéuticos.

#### Scenario: Profesional accede
- **WHEN** un profesional navega a `/pacientes`
- **THEN** el frontend muestra la pantalla de pacientes

#### Scenario: Auditor accede
- **WHEN** un auditor navega a `/pacientes`
- **THEN** el frontend muestra la pantalla de pacientes

#### Scenario: Profesional accede al alta
- **WHEN** un profesional navega a `/pacientes/nuevo`
- **THEN** el frontend muestra la vista de alta de paciente

#### Scenario: Auditor accede a la edición
- **WHEN** un auditor navega a `/pacientes/:id/editar`
- **THEN** el frontend muestra la vista de edición del paciente

#### Scenario: Farmacéutico intenta acceder
- **WHEN** un farmacéutico navega a `/pacientes`, `/pacientes/nuevo` o `/pacientes/:id/editar`
- **THEN** el frontend lo redirige a la sección de dispensación

#### Scenario: Menú de pacientes
- **WHEN** un profesional o auditor inicia sesión
- **THEN** el menú lateral muestra la sección Pacientes

### Requirement: Listado de pacientes
El frontend SHALL mostrar cada paciente en un item con nombre, alias cuando exista, DNI o “Sin DNI”, sexo, edad, estado de validación, contacto disponible y localidad/provincia cuando existan. Cada item SHALL ofrecer las acciones Ver detalle y Editar. Al seleccionar el item SHALL abrir el drawer de detalle. La acción Editar SHALL navegar a `/pacientes/:id/editar`.

#### Scenario: Paciente validado
- **WHEN** el resultado corresponde a un paciente validado
- **THEN** el frontend muestra su DNI y el estado validado

#### Scenario: Paciente sin DNI
- **WHEN** el resultado corresponde a un paciente sin DNI
- **THEN** el frontend muestra “Sin DNI” y el estado no validado

#### Scenario: Acciones del item
- **WHEN** el usuario visualiza un paciente en el listado
- **THEN** el item muestra las acciones Ver detalle y Editar

#### Scenario: Selección de paciente
- **WHEN** el usuario selecciona un paciente del listado o su acción Ver detalle
- **THEN** el frontend abre el drawer de detalle

#### Scenario: Editar desde el listado
- **WHEN** el usuario presiona Editar en un item del listado
- **THEN** el frontend navega a `/pacientes/:id/editar`

### Requirement: Detalle del paciente
El frontend SHALL mostrar el detalle del paciente en un drawer con secciones de identidad, contacto y dirección. SHALL mostrar las acciones Editar, Validar o Volver a validar, y Eliminar según corresponda. La acción Editar SHALL navegar a `/pacientes/:id/editar`.

#### Scenario: Detalle de identidad
- **WHEN** el usuario abre un paciente
- **THEN** el frontend muestra nombre, alias, DNI o “Sin DNI”, CUIL, sexo, género, fecha de nacimiento y estado

#### Scenario: Detalle de contacto y dirección
- **WHEN** el paciente tiene contacto o dirección
- **THEN** el frontend muestra email, celular, teléfono fijo, calle, código postal, barrio, localidad, provincia y país disponibles

#### Scenario: Acciones del detalle
- **WHEN** el usuario abre un paciente
- **THEN** el frontend muestra las acciones Editar, Validar o Volver a validar, y Eliminar según corresponda

#### Scenario: Editar desde el detalle
- **WHEN** el usuario selecciona Editar en el drawer
- **THEN** el frontend navega a `/pacientes/:id/editar`

### Requirement: Edición con tabs
El frontend SHALL permitir crear y editar pacientes en rutas dedicadas: `/pacientes/nuevo` para el alta y `/pacientes/:id/editar` para la edición. La vista SHALL mostrar arriba un bloque con DNI, Sexo y la acción Validar, y debajo dos tabs: “Datos básicos” y “Contacto”, con “Datos básicos” activa por defecto. El formulario SHALL NOT mostrar un badge de estado: el botón Validar SHALL reflejar el estado, tonal con icono `check` cuando el paciente no está validado y outlined verde con icono `done_all` cuando está validado. “Datos básicos” SHALL contener nombre, apellido, nombre autopercibido, género autopercibido, CUIL y fecha de nacimiento. “Contacto” SHALL contener email, celular, teléfono fijo, calle, código postal, barrio, localidad, provincia y país. Las tabs SHALL usar el mismo patrón visual del Paso 2: Documento de Nueva prescripción. SHALL haber un único botón Guardar para todo el paciente y una acción Cancelar. Al guardar SHALL volver al listado conservando la búsqueda. Cancelar y el botón atrás del navegador SHALL pedir confirmación cuando haya cambios sin guardar. La vista SHALL NOT mostrar un botón Volver en el header.

#### Scenario: Abrir alta
- **WHEN** el usuario elige crear un paciente
- **THEN** el frontend navega a `/pacientes/nuevo` y muestra el formulario vacío con el bloque DNI/Sexo/Validar y las tabs

#### Scenario: Abrir edición
- **WHEN** el usuario elige Editar un paciente
- **THEN** el frontend navega a `/pacientes/:id/editar` y muestra el formulario con los datos del paciente

#### Scenario: Orden del formulario
- **WHEN** el usuario abre la edición o el alta
- **THEN** el frontend muestra primero DNI, Sexo y Validar, y debajo las tabs con Datos básicos activa

#### Scenario: Datos básicos
- **WHEN** el usuario abre la tab Datos básicos
- **THEN** el frontend muestra nombre, apellido, nombre autopercibido, género autopercibido, CUIL y fecha de nacimiento

#### Scenario: Contacto
- **WHEN** el usuario abre la tab Contacto
- **THEN** el frontend muestra los campos de contacto y dirección del paciente

#### Scenario: Guardar
- **WHEN** el usuario completa datos válidos y presiona Guardar
- **THEN** el frontend guarda todo el paciente, vuelve al listado y refresca los resultados conservando la búsqueda

#### Scenario: Cancelar
- **WHEN** el usuario presiona Cancelar
- **THEN** el frontend descarta los cambios si corresponde y vuelve al listado conservando la búsqueda

#### Scenario: Cambios sin guardar
- **WHEN** el usuario intenta Cancelar con cambios sin guardar
- **THEN** el frontend pide confirmación antes de descartarlos

#### Scenario: Cambios sin guardar al usar el navegador
- **WHEN** el usuario intenta salir de la edición con el botón atrás del navegador y hay cambios sin guardar
- **THEN** el frontend pide confirmación antes de descartarlos

#### Scenario: Paciente validado
- **WHEN** el paciente está validado
- **THEN** el frontend muestra el DNI como dato no editable, sin badge de estado y con el botón Volver a validar en verde outlined con icono done_all

#### Scenario: Paciente sin validar
- **WHEN** el paciente no está validado
- **THEN** el frontend muestra el botón Validar tonal con icono check y sin badge de estado

#### Scenario: Paciente sin DNI
- **WHEN** el paciente no tiene DNI
- **THEN** el frontend permite editar sus datos y lo mantiene como no validado hasta que se agregue y valide un DNI

#### Scenario: Datos adicionales
- **WHEN** el paciente tiene más de un contacto o dirección
- **THEN** el frontend no elimina los datos adicionales que no fueron editados

### Requirement: Experiencia mobile
La pantalla de pacientes SHALL ser usable en mobile, con listado en items, drawer de detalle a pantalla completa y edición en una ruta dedicada, en una columna con tabs.

#### Scenario: Listado en mobile
- **WHEN** el usuario accede desde un celular
- **THEN** el frontend muestra el listado en items y permite abrir el detalle o editar

#### Scenario: Edición en mobile
- **WHEN** el usuario edita un paciente desde un celular
- **THEN** el frontend muestra la ruta de edición con las tabs y los campos en una columna, con las acciones principales accesibles

## ADDED Requirements

### Requirement: Navegación y estado de búsqueda
El frontend SHALL reflejar el término de búsqueda y los filtros del listado de pacientes en query params (`q`, `estado`, `sexo`, `email`, `telefono`). Al navegar al alta o a la edición SHALL conservar esos query params, y al volver al listado SHALL restaurar la búsqueda y los filtros desde la URL.

#### Scenario: Búsqueda reflejada en la URL
- **WHEN** el usuario busca o aplica filtros en el listado
- **THEN** el frontend actualiza los query params de `/pacientes`

#### Scenario: Navegación a la edición con búsqueda
- **WHEN** el usuario navega a `/pacientes/nuevo` o `/pacientes/:id/editar` desde un listado con búsqueda activa
- **THEN** el frontend conserva los query params de búsqueda

#### Scenario: Volver al listado
- **WHEN** el usuario vuelve al listado desde el alta o la edición
- **THEN** el frontend restaura el término y los filtros desde los query params y vuelve a buscar

#### Scenario: Refresh del listado
- **WHEN** el usuario recarga `/pacientes` con query params de búsqueda
- **THEN** el frontend inicializa la búsqueda y los filtros con esos valores

### Requirement: Carga de la edición
Al entrar a `/pacientes/:id/editar` el frontend SHALL cargar el paciente por su identificador. Mientras carga SHALL mostrar un estado de carga; si el paciente no existe o la carga falla SHALL mostrar un error y permitir volver al listado. Al entrar a `/pacientes/nuevo` SHALL mostrar el formulario de alta sin datos precargados.

#### Scenario: Carga exitosa
- **WHEN** el usuario navega a `/pacientes/:id/editar` con un identificador válido
- **THEN** el frontend muestra el formulario con los datos del paciente

#### Scenario: Deep link o refresh de la edición
- **WHEN** el usuario recarga `/pacientes/:id/editar`
- **THEN** el frontend vuelve a cargar el paciente y muestra el formulario

#### Scenario: Paciente inexistente o error de carga
- **WHEN** el usuario navega a `/pacientes/:id/editar` y el paciente no existe o la carga falla
- **THEN** el frontend muestra un mensaje de error y una acción para volver al listado

#### Scenario: Alta sin identificador
- **WHEN** el usuario navega a `/pacientes/nuevo`
- **THEN** el frontend muestra el formulario de alta sin datos precargados

### Requirement: Validación desde el formulario
El frontend SHALL permitir validar al paciente desde la edición y desde el alta. En edición SHALL validar al paciente existente contra RENAPER/ANDES; en alta SHALL validar DNI y Sexo y precargar nombre, apellido, sexo, fecha de nacimiento y CUIL. Mientras valida SHALL mostrar un estado de carga y deshabilitar la acción. Al finalizar correctamente SHALL actualizar los datos del formulario, el estado mostrado y bloquear el DNI si queda validado. SHALL NOT modificar el género autopercibido. SHALL reemplazar la dirección principal con la que devuelve RENAPER y conservar las direcciones adicionales. SHALL NOT modificar email, celular ni teléfono fijo cuando RENAPER no los devuelve.

#### Scenario: Validar en edición
- **WHEN** el usuario presiona Validar en la edición de un paciente con DNI
- **THEN** el frontend valida al paciente, actualiza sus datos y muestra el estado validado

#### Scenario: Validar en alta
- **WHEN** el usuario completa DNI y Sexo en el alta y presiona Validar
- **THEN** el frontend consulta RENAPER y precarga los datos validados en el formulario

#### Scenario: Validación sin DNI o Sexo
- **WHEN** falta DNI o Sexo
- **THEN** el frontend deshabilita la acción Validar

#### Scenario: Validación fallida
- **WHEN** la validación no encuentra a la persona o falla
- **THEN** el frontend muestra un error y conserva los datos ingresados

#### Scenario: Validación conserva el género autopercibido
- **WHEN** el usuario valida un paciente con género autopercibido cargado
- **THEN** el género autopercibido no cambia con el sexo devuelto por RENAPER

#### Scenario: Validación actualiza la dirección
- **WHEN** RENAPER devuelve una dirección
- **THEN** el frontend y el backend reemplazan la dirección principal con esos datos y conservan las direcciones adicionales

#### Scenario: Validación sin contactos
- **WHEN** RENAPER no devuelve email, celular ni teléfono fijo
- **THEN** esos contactos permanecen sin cambios

### Requirement: Género autopercibido
El frontend SHALL usar el catálogo de género autopercibido `mujer`, `mujer trans`, `varon`, `varon trans`, `no binario`, `travesti` y `masculinidad trans`, independiente del sexo. SHALL mostrar el valor de género que devuelve ANDES aunque no pertenezca al catálogo, agregándolo como opción legacy. Al crear, actualizar o validar, el backend SHALL NOT reemplazar el género autopercibido con el sexo.

#### Scenario: Catálogo de género
- **WHEN** el usuario abre el select de género autopercibido
- **THEN** el frontend muestra los siete valores del catálogo

#### Scenario: Valor legacy
- **WHEN** el paciente tiene un género fuera del catálogo
- **THEN** el frontend lo muestra como opción adicional sin perderlo

#### Scenario: Guardar género
- **WHEN** el usuario selecciona un género y guarda
- **THEN** el backend persiste ese género sin reemplazarlo por el sexo

#### Scenario: Validar sin pisar género
- **WHEN** el usuario valida un paciente con género autopercibido cargado
- **THEN** el backend conserva el género autopercibido

### Requirement: Codificación de nombres y tildes
El backend SHALL decodificar las respuestas de ANDES respetando la codificación real (UTF-8 o Windows-1252), SHALL reparar los nombres doblemente codificados (Latin-1 interpretado como UTF-8) y SHALL NOT propagar el carácter de reemplazo `U+FFFD`. El frontend SHALL mostrar nombres y datos de texto con tildes en formato título, con partículas en minúscula, en el listado, el detalle, la edición y la validación.

#### Scenario: Nombre doblemente codificado de RENAPER
- **WHEN** RENAPER devuelve un nombre con bytes UTF-8 interpretados como Latin-1
- **THEN** el backend lo repara igual que ANDES y devuelve el nombre con la tilde correcta

#### Scenario: Nombre en mayúsculas
- **WHEN** RENAPER/ANDES devuelve `MATIAS NICOLÁS` o `JUAN DE LA CRUZ`
- **THEN** el frontend muestra `Matias Nicolás` y `Juan de la Cruz`, sin `�`

#### Scenario: Validación con tilde
- **WHEN** RENAPER/ANDES devuelve un nombre como `NICOLÁS`
- **THEN** el frontend muestra `Nicolás` sin `�` en el formulario y en el resto de las vistas

#### Scenario: Paciente existente con tilde
- **WHEN** el usuario abre un paciente cuyo nombre tiene tildes
- **THEN** el nombre se muestra completo y correcto en el campo, el listado y el detalle

#### Scenario: Guardar nombre con tilde
- **WHEN** el usuario guarda un paciente con tildes en el nombre
- **THEN** el nombre se conserva correctamente al reabrirlo
