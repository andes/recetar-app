# patient-management Specification

## Purpose
Permite a profesionales y auditores buscar, consultar, editar, validar y eliminar pacientes desde una pantalla dedicada, usando ANDES como fuente de verdad y mostrando identidad, contacto y dirección.

## Requirements

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

### Requirement: Búsqueda y filtros de pacientes
El frontend SHALL buscar pacientes por un término de al menos 3 caracteres con retardo de 300 ms y SHALL permitir filtrar por estado, sexo, email y teléfono. SHALL mostrar estados de carga, sin resultados y error, y SHALL permitir cargar más resultados.

#### Scenario: Búsqueda con resultados
- **WHEN** el usuario escribe al menos 3 caracteres
- **THEN** el frontend consulta los pacientes y muestra los resultados

#### Scenario: Filtros
- **WHEN** el usuario aplica filtros de estado, sexo, email o teléfono
- **THEN** el frontend recarga la búsqueda con esos filtros

#### Scenario: Cargar más
- **WHEN** hay más resultados disponibles
- **THEN** el frontend muestra la acción “Cargar más” y agrega la siguiente página sin perder los resultados anteriores

#### Scenario: Sin resultados
- **WHEN** la búsqueda no devuelve pacientes
- **THEN** el frontend muestra un estado vacío claro

### Requirement: Listado de pacientes
El frontend SHALL mostrar cada paciente en un item con avatar de sexo, nombre principal, DNI o “Sin DNI”, sexo, edad y estado de validación. El nombre principal SHALL ser el nombre autopercibido + apellido real cuando exista nombre autopercibido; caso contrario, el nombre real. El avatar SHALL usar ícono y fondo femenino, masculino u otros según corresponda; SHALL usar otros cuando el sexo sea Otro (o vacío/desconocido) o cuando el género difiera del derivado del sexo. Cada item SHALL ofrecer la acción Editar. Al seleccionar el item SHALL abrir el drawer de detalle. La acción Editar SHALL navegar a `/pacientes/:id/editar`.

#### Scenario: Paciente validado
- **WHEN** el resultado corresponde a un paciente validado
- **THEN** el frontend muestra su DNI y el estado validado

#### Scenario: Paciente sin DNI
- **WHEN** el resultado corresponde a un paciente sin DNI
- **THEN** el frontend muestra “Sin DNI” y el estado no validado

#### Scenario: Nombre autopercibido
- **WHEN** el paciente tiene nombre autopercibido
- **THEN** el item lo muestra en lugar del nombre, conservando el apellido real

#### Scenario: Avatar por sexo
- **WHEN** el usuario visualiza un paciente en el listado
- **THEN** el avatar usa el ícono y fondo femenino, masculino u otros según su sexo y género, y usa otros cuando el género difiere del derivado del sexo o el sexo es Otro

#### Scenario: Acciones del item
- **WHEN** el usuario visualiza un paciente en el listado
- **THEN** el item muestra la acción Editar

#### Scenario: Selección de paciente
- **WHEN** el usuario selecciona un paciente del listado
- **THEN** el frontend abre el drawer de detalle

#### Scenario: Editar desde el listado
- **WHEN** el usuario presiona Editar en un item del listado
- **THEN** el frontend navega a `/pacientes/:id/editar`

### Requirement: Detalle del paciente
El frontend SHALL mostrar el detalle del paciente en un drawer con secciones de identidad, datos autopercibidos, contacto y dirección. El header SHALL mostrar el nombre principal (autopercibido si existe), el DNI debajo del nombre y el badge de estado con su ícono. La sección Datos autopercibidos SHALL tener fondo destacado y mostrar nombre autopercibido, nombre real y género autopercibido; el género SHALL NOT mostrarse en Identidad. SHALL mostrar las acciones Editar, Validar (solo si el paciente no está validado) y Eliminar según corresponda. La acción Editar SHALL navegar a `/pacientes/:id/editar`.

#### Scenario: Detalle de identidad
- **WHEN** el usuario abre un paciente
- **THEN** el frontend muestra fecha de nacimiento, edad, sexo y CUIL, en ese orden, sin repetir el DNI

#### Scenario: Datos autopercibidos
- **WHEN** el usuario abre un paciente
- **THEN** el frontend muestra una sección destacada con nombre autopercibido, nombre real y género autopercibido

#### Scenario: Header del detalle
- **WHEN** el usuario abre un paciente
- **THEN** el frontend muestra el DNI debajo del nombre y el badge de estado con su ícono

#### Scenario: Detalle de contacto y dirección
- **WHEN** el paciente tiene contacto o dirección
- **THEN** el frontend muestra email, celular, teléfono fijo, calle, código postal, barrio, localidad, provincia y país disponibles

#### Scenario: Acciones del detalle
- **WHEN** el usuario abre un paciente
- **THEN** el frontend muestra las acciones Editar, Validar (solo si no está validado) y Eliminar según corresponda

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

### Requirement: Errores de validación en tabs
Al presionar Guardar, el frontend SHALL validar todos los campos de ambas tabs. Cada tab con errores SHALL mostrar un icono de error en su etiqueta y cada campo inválido SHALL mostrar su error inline. El frontend SHALL cambiar automáticamente a la primera tab con error.

#### Scenario: Error en Datos básicos
- **WHEN** el usuario presiona Guardar y hay un error en Datos básicos
- **THEN** la tab Datos básicos muestra el icono de error, el campo muestra su error y la vista cambia a esa tab

#### Scenario: Error en Contacto
- **WHEN** el usuario presiona Guardar y hay un error en Contacto
- **THEN** la tab Contacto muestra el icono de error, el campo muestra su error y la vista cambia a esa tab

#### Scenario: Errores en ambas tabs
- **WHEN** el usuario presiona Guardar y hay errores en ambas tabs
- **THEN** ambas tabs muestran el icono de error y la vista cambia a la primera tab con error

### Requirement: Validación de paciente
El frontend SHALL permitir validar un paciente con DNI y volver a validar uno ya validado. La validación SHALL actualizar sus datos y estado en ANDES. La validación desde el drawer SHALL estar disponible solo para pacientes no validados; la revalidación SHALL realizarse desde la edición. Sin DNI SHALL mostrar la acción deshabilitada con una explicación.

#### Scenario: Validar paciente temporal
- **WHEN** el usuario valida un paciente temporal con DNI
- **THEN** el frontend lo valida contra RENAPER, actualiza sus datos y lo muestra como validado

#### Scenario: Volver a validar
- **WHEN** el paciente ya está validado
- **THEN** el frontend permite volver a validarlo desde la edición y actualiza sus datos al finalizar

#### Scenario: Paciente sin DNI
- **WHEN** el paciente no tiene DNI
- **THEN** el frontend deshabilita la validación y explica que requiere DNI

### Requirement: Eliminación de paciente
El frontend SHALL permitir eliminar un paciente con una confirmación explícita y una segunda confirmación adicional. SHALL advertir que la eliminación es definitiva en ANDES y que los documentos emitidos conservan sus datos. Al confirmar SHALL eliminar el paciente, cerrar el detalle y refrescar el listado.

#### Scenario: Confirmación de eliminación
- **WHEN** el usuario elige eliminar un paciente
- **THEN** el frontend muestra la advertencia y exige una confirmación adicional antes de continuar

#### Scenario: Eliminación confirmada
- **WHEN** el usuario completa ambas confirmaciones
- **THEN** el frontend elimina el paciente en ANDES, cierra el detalle y actualiza el listado

#### Scenario: Cancelar eliminación
- **WHEN** el usuario cancela la eliminación
- **THEN** el paciente no se modifica y el detalle permanece abierto

### Requirement: Consistencia con ANDES
Después de editar, validar o eliminar un paciente, el frontend SHALL refrescar el detalle y el listado con los datos vigentes de ANDES.

#### Scenario: Refresco después de editar
- **WHEN** el usuario guarda cambios de un paciente
- **THEN** el frontend muestra los datos actualizados en el listado

#### Scenario: Refresco después de validar
- **WHEN** el usuario valida un paciente
- **THEN** el frontend muestra el nuevo estado y los datos validados

#### Scenario: Refresco después de eliminar
- **WHEN** el usuario elimina un paciente
- **THEN** el frontend lo quita del listado y cierra el detalle

### Requirement: Experiencia mobile
La pantalla de pacientes SHALL ser usable en mobile, con listado en items, drawer de detalle a pantalla completa y edición en una ruta dedicada, en una columna con tabs.

#### Scenario: Listado en mobile
- **WHEN** el usuario accede desde un celular
- **THEN** el frontend muestra el listado en items y permite abrir el detalle o editar

#### Scenario: Edición en mobile
- **WHEN** el usuario edita un paciente desde un celular
- **THEN** el frontend muestra la ruta de edición con las tabs y los campos en una columna, con las acciones principales accesibles

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
El frontend SHALL usar el catálogo de género autopercibido `mujer`, `mujer trans`, `varon`, `varon trans`, `no binario`, `travesti` y `masculinidad trans`, independiente del sexo. El campo SHALL NOT tener una opción “Ninguno” ni seleccionar un género por defecto: solo SHALL mostrar un valor cuando el paciente ya lo tenga en ANDES o cuando el usuario lo elija manualmente. El campo SHALL poder limpiarse con una acción de borrar; al limpiarse, el control queda en `null` y el frontend SHALL NOT enviar `genero` en el payload. El backend SHALL ignorar `genero` vacío o `Ninguno` y SHALL NOT enviarlo a ANDES; ANDES conserva el valor previamente guardado. SHALL mostrar el valor de género que devuelve ANDES aunque no pertenezca al catálogo, agregándolo como opción legacy, y SHALL mostrar los valores con las etiquetas del catálogo (primera letra en mayúscula). Al crear, actualizar o validar, el backend SHALL NOT reemplazar el género autopercibido con el sexo.

#### Scenario: Catálogo de género
- **WHEN** el usuario abre el select de género autopercibido
- **THEN** el frontend muestra los siete valores del catálogo, sin una opción vacía

#### Scenario: Sin selección por defecto
- **WHEN** el paciente no tiene género en ANDES o se está creando un paciente
- **THEN** el select no tiene ningún género seleccionado

#### Scenario: Valor existente en ANDES
- **WHEN** el paciente tiene un género guardado en ANDES
- **THEN** el select muestra ese valor

#### Scenario: Limpiar género
- **WHEN** el usuario borra el género de un paciente y guarda
- **THEN** el control queda en `null`, el frontend no envía `genero`, el backend no lo envía a ANDES y el paciente se guarda

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
