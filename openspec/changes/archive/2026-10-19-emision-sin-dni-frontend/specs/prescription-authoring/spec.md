# Spec Delta

## MODIFIED Requirements

### Requirement: Busqueda de paciente
El frontend SHALL buscar pacientes por un termino de al menos 3 caracteres con retardo de 300 ms y SHALL mostrar los resultados con nombre, DNI o “Sin DNI”, sexo y edad. Cuando no hay resultados SHALL indicarlo. Tambien SHALL mostrar pacientes frecuentes y destacar hasta 2 como favoritos. Los pacientes sin DNI SHALL ser buscables y seleccionables.

#### Scenario: Busqueda con resultados
- **WHEN** el usuario escribe al menos 3 caracteres
- **THEN** el frontend consulta los pacientes y muestra la lista de resultados

#### Scenario: Busqueda sin resultados
- **WHEN** la busqueda no devuelve pacientes
- **THEN** el frontend indica que no se encontro el paciente

#### Scenario: Pacientes frecuentes
- **WHEN** el usuario no busca ni selecciono un paciente
- **THEN** el frontend muestra los pacientes mas usados y los 2 primeros como favoritos

#### Scenario: Paciente sin DNI en resultados
- **WHEN** un resultado corresponde a un paciente sin DNI
- **THEN** el frontend lo muestra con la leyenda “Sin DNI” y permite seleccionarlo

### Requirement: Seleccion de paciente
El frontend SHALL permitir seleccionar un paciente desde los resultados o desde los frecuentes. Al seleccionarlo SHALL cargar sus coberturas por DNI y sexo cuando tenga DNI, y SHALL omitir esa consulta cuando no tenga DNI. SHALL registrar su uso como frecuente y mostrar su estado de validacion (validado o temporal), incluyendo la leyenda “Sin DNI” cuando corresponda.

#### Scenario: Seleccion desde resultados
- **WHEN** el usuario selecciona un paciente de los resultados
- **THEN** el frontend lo establece como paciente del documento y carga sus coberturas cuando tiene DNI

#### Scenario: Paciente frecuente sin datos locales
- **WHEN** el usuario selecciona un paciente frecuente que no existe en el backend
- **THEN** el frontend carga los datos disponibles del frecuente y consulta sus coberturas cuando tiene DNI

#### Scenario: Estado de validacion
- **WHEN** el paciente tiene estado validado o temporal
- **THEN** el frontend muestra el indicador correspondiente (RENAPER o paciente temporal)

#### Scenario: Paciente sin DNI seleccionado
- **WHEN** el usuario selecciona un paciente sin DNI
- **THEN** el frontend lo establece como paciente del documento, muestra “Sin DNI” y no consulta coberturas por DNI

### Requirement: Alta y edicion de paciente
El frontend SHALL permitir crear y editar pacientes con DNI numerico de 6 a 8 digitos, o sin DNI cuando se informen apellido, nombre y sexo. SHALL solicitar fecha de nacimiento valida no futura. Ante un DNI existente SHALL preguntar si se reemplazan los datos. SHALL permitir validar al paciente contra RENAPER solo cuando tenga DNI. Un paciente creado sin DNI SHALL quedar como no validado y SHALL poder completarse con DNI y validarse mas adelante.

#### Scenario: Alta valida
- **WHEN** el usuario completa los datos validos
- **THEN** el frontend crea el paciente y lo establece en el documento

#### Scenario: DNI duplicado
- **WHEN** se intenta crear un paciente con un DNI ya registrado
- **THEN** el frontend pregunta si se reemplazan los datos existentes y actua segun la respuesta

#### Scenario: Datos invalidos
- **WHEN** los datos obligatorios del paciente no son validos
- **THEN** el frontend no guarda y marca los campos observados

#### Scenario: Alta sin DNI
- **WHEN** el usuario elige “Sin DNI” y completa nombre, apellido y sexo
- **THEN** el frontend crea el paciente como no validado y lo establece en el documento

#### Scenario: Validacion sin DNI
- **WHEN** el paciente no tiene DNI
- **THEN** el frontend no ofrece la accion de validar con RENAPER

#### Scenario: Agregar DNI despues
- **WHEN** el usuario edita un paciente sin DNI y completa un DNI
- **THEN** el frontend permite guardar el DNI y luego validar al paciente con RENAPER

### Requirement: Historial reciente y reutilizacion
Al seleccionar un paciente, el frontend SHALL cargar sus documentos recientes (recetas, certificados y practicas) usando el DNI cuando exista o el identificador de MPI cuando no haya DNI. SHALL permitir reutilizar una receta, un certificado o una practica en el borrador. Los tratamientos prolongados SHALL agruparse mostrando recetas dispensadas sobre el total.

#### Scenario: Carga de historial
- **WHEN** el frontend establece un paciente con DNI o identificador de MPI
- **THEN** carga y muestra sus recetas, certificados y practicas recientes

#### Scenario: Reutilizacion de receta
- **WHEN** el usuario reutiliza una receta previa
- **THEN** el frontend carga sus medicamentos en el borrador respetando el limite

#### Scenario: Grupo de tratamiento prolongado
- **WHEN** un tratamiento prolongado tiene varias recetas
- **THEN** el frontend las agrupa y muestra cuantas estan dispensadas

#### Scenario: Historial de paciente sin DNI
- **WHEN** el paciente no tiene DNI pero tiene identificador de MPI
- **THEN** el frontend carga su historial usando el identificador de MPI
