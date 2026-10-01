# Spec Delta

## Purpose

Permite a profesionales y auditores buscar, consultar, editar, validar y eliminar pacientes desde una pantalla dedicada, usando ANDES como fuente de verdad y mostrando identidad, contacto y dirección.

## ADDED Requirements

### Requirement: Acceso a la pantalla de pacientes
El frontend SHALL exponer `/pacientes` solo a usuarios autenticados con rol profesional o auditor. El menú lateral SHALL mostrar la sección Pacientes a esos roles y no a farmacéuticos.

#### Scenario: Profesional accede
- **WHEN** un profesional navega a `/pacientes`
- **THEN** el frontend muestra la pantalla de pacientes

#### Scenario: Auditor accede
- **WHEN** un auditor navega a `/pacientes`
- **THEN** el frontend muestra la pantalla de pacientes

#### Scenario: Farmacéutico intenta acceder
- **WHEN** un farmacéutico navega a `/pacientes`
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
El frontend SHALL mostrar cada paciente en un item con nombre, alias cuando exista, DNI o “Sin DNI”, sexo, edad, estado de validación, contacto disponible y localidad/provincia cuando existan. Cada item SHALL ofrecer las acciones Ver detalle y Editar. Al seleccionar el item SHALL abrir el drawer de detalle.

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

### Requirement: Detalle del paciente
El frontend SHALL mostrar el detalle del paciente en un drawer con secciones de identidad, contacto y dirección. SHALL mostrar las acciones Editar, Validar o Volver a validar, y Eliminar según corresponda.

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
- **THEN** el frontend abre la vista de edición con tabs

### Requirement: Edición con tabs
El frontend SHALL permitir crear y editar pacientes en una vista que reemplaza la búsqueda y el listado, conservando el estado de búsqueda para volver. La vista SHALL tener dos tabs: “Datos básicos” y “Contacto”. “Datos básicos” SHALL contener nombre, apellido, alias, DNI, CUIL, sexo, género, fecha de nacimiento y estado. “Contacto” SHALL contener email, celular, teléfono fijo, calle, código postal, barrio, localidad, provincia y país. SHALL haber un único botón Guardar para todo el paciente, y acciones Volver atrás y Cancelar.

#### Scenario: Abrir edición
- **WHEN** el usuario elige Editar o crear un paciente
- **THEN** el frontend oculta la búsqueda y el listado y muestra la vista de edición con tabs

#### Scenario: Datos básicos
- **WHEN** el usuario abre la tab Datos básicos
- **THEN** el frontend muestra los campos de identidad del paciente

#### Scenario: Contacto
- **WHEN** el usuario abre la tab Contacto
- **THEN** el frontend muestra los campos de contacto y dirección del paciente

#### Scenario: Guardar
- **WHEN** el usuario completa datos válidos y presiona Guardar
- **THEN** el frontend guarda todo el paciente, refresca el listado y vuelve a la búsqueda

#### Scenario: Volver atrás
- **WHEN** el usuario presiona Volver atrás
- **THEN** el frontend descarta los cambios si corresponde y vuelve al listado conservando la búsqueda

#### Scenario: Cancelar
- **WHEN** el usuario presiona Cancelar
- **THEN** el frontend descarta los cambios si corresponde y vuelve al listado conservando la búsqueda

#### Scenario: Cambios sin guardar
- **WHEN** el usuario intenta Volver atrás o Cancelar con cambios sin guardar
- **THEN** el frontend pide confirmación antes de descartarlos

#### Scenario: Paciente validado
- **WHEN** el paciente está validado
- **THEN** el frontend muestra el DNI como dato no editable

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
El frontend SHALL permitir validar un paciente con DNI y volver a validar uno ya validado. La validación SHALL actualizar sus datos y estado en ANDES. Sin DNI SHALL mostrar la acción deshabilitada con una explicación.

#### Scenario: Validar paciente temporal
- **WHEN** el usuario valida un paciente temporal con DNI
- **THEN** el frontend lo valida contra RENAPER, actualiza sus datos y lo muestra como validado

#### Scenario: Volver a validar
- **WHEN** el paciente ya está validado
- **THEN** el frontend muestra la acción “Volver a validar” y actualiza sus datos al finalizar

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
La pantalla de pacientes SHALL ser usable en mobile, con listado en items, drawer de detalle a pantalla completa y edición en una columna con tabs.

#### Scenario: Listado en mobile
- **WHEN** el usuario accede desde un celular
- **THEN** el frontend muestra el listado en items y permite abrir el detalle o editar

#### Scenario: Edición en mobile
- **WHEN** el usuario edita un paciente desde un celular
- **THEN** el frontend muestra las tabs y los campos en una columna, con las acciones principales accesibles
