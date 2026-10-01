# Spec Delta

## Purpose

`prescription-authoring` define el alta de recetas, certificados y practicas en el frontend, incluyendo seleccion de paciente, busqueda y detalle de medicamentos, organizacion y ambito, historial reciente, borrador, finalizacion y PIN de seguridad.

## ADDED Requirements

### Requirement: Busqueda de paciente
El frontend SHALL buscar pacientes por un termino de al menos 3 caracteres con retardo de 300 ms y SHALL mostrar los resultados con nombre, DNI, sexo y edad. Cuando no hay resultados SHALL indicarlo. Tambien SHALL mostrar pacientes frecuentes y destacar hasta 2 como favoritos.

#### Scenario: Busqueda con resultados
- **WHEN** el usuario escribe al menos 3 caracteres
- **THEN** el frontend consulta los pacientes y muestra la lista de resultados

#### Scenario: Busqueda sin resultados
- **WHEN** la busqueda no devuelve pacientes
- **THEN** el frontend indica que no se encontro el paciente

#### Scenario: Pacientes frecuentes
- **WHEN** el usuario no busca ni selecciono un paciente
- **THEN** el frontend muestra los pacientes mas usados y los 2 primeros como favoritos

### Requirement: Seleccion de paciente
El frontend SHALL permitir seleccionar un paciente desde los resultados o desde los frecuentes. Al seleccionarlo SHALL cargar sus coberturas por DNI y sexo, registrar su uso como frecuente y mostrar su estado de validacion (validado o temporal).

#### Scenario: Seleccion desde resultados
- **WHEN** el usuario selecciona un paciente de los resultados
- **THEN** el frontend lo establece como paciente del documento y carga sus coberturas

#### Scenario: Paciente frecuente sin datos locales
- **WHEN** el usuario selecciona un paciente frecuente que no existe en el backend
- **THEN** el frontend carga los datos disponibles del frecuente y consulta sus coberturas

#### Scenario: Estado de validacion
- **WHEN** el paciente tiene estado validado o temporal
- **THEN** el frontend muestra el indicador correspondiente (RENAPER o paciente temporal)

### Requirement: Alta y edicion de paciente
El frontend SHALL permitir crear y editar pacientes con DNI numerico de 6 a 8 digitos, apellido, nombre, sexo y fecha de nacimiento valida no futura. Ante un DNI existente SHALL preguntar si se reemplazan los datos. SHALL permitir validar al paciente contra RENAPER.

#### Scenario: Alta valida
- **WHEN** el usuario completa los datos validos
- **THEN** el frontend crea el paciente y lo establece en el documento

#### Scenario: DNI duplicado
- **WHEN** se intenta crear un paciente con un DNI ya registrado
- **THEN** el frontend pregunta si se reemplazan los datos existentes y actua segun la respuesta

#### Scenario: Datos invalidos
- **WHEN** el DNI, el nombre, el apellido, el sexo o la fecha de nacimiento no son validos
- **THEN** el frontend no guarda y marca los campos observados

### Requirement: Tipo de documento
El frontend SHALL permitir elaborar una receta, un certificado o una practica, y SHALL cambiar el formulario de creacion y las secciones del borrador segun el tipo seleccionado.

#### Scenario: Cambio de tipo
- **WHEN** el usuario selecciona receta, certificado o practica
- **THEN** el frontend habilita la creacion y las secciones correspondientes a ese tipo

### Requirement: Busqueda de medicamento comercial
El frontend SHALL buscar medicamentos comerciales por un termino de al menos 3 caracteres con retardo de 300 ms, con resultados paginados de 10 por pagina. Cuando no hay resultados SHALL indicarlo. Tambien SHALL ofrecer los medicamentos comerciales frecuentes.

#### Scenario: Busqueda con resultados
- **WHEN** el usuario escribe al menos 3 caracteres en modo comercial
- **THEN** el frontend muestra los medicamentos encontrados paginados

#### Scenario: Busqueda sin resultados
- **WHEN** la busqueda comercial no devuelve resultados
- **THEN** el frontend indica que no se encontro el medicamento

#### Scenario: Medicamento frecuente
- **WHEN** el usuario selecciona un medicamento frecuente
- **THEN** el frontend abre su detalle para completar la carga

### Requirement: Carga de medicamento magistral
El frontend SHALL permitir cargar medicamentos magistrales. Con una organizacion de ambito publico SHALL buscar insumos magistrales en ANDES y, si no hay resultados, ofrecer la carga manual. Con una organizacion privada o sin organizacion SHALL permitir solo la carga manual del nombre.

#### Scenario: Busqueda magistral en organizacion publica
- **WHEN** el usuario activa el modo magistral con una organizacion publica y escribe un termino
- **THEN** el frontend busca insumos magistrales en ANDES

#### Scenario: Sin resultados en ANDES
- **WHEN** la busqueda de insumos magistrales no devuelve resultados
- **THEN** el frontend ofrece agregar el medicamento manualmente

#### Scenario: Carga manual
- **WHEN** el usuario carga manualmente un nombre de medicamento magistral
- **THEN** el frontend abre el detalle del medicamento

### Requirement: Detalle del medicamento
El frontend SHALL solicitar cantidad de envases de al menos 1, diagnostico obligatorio, indicacion opcional, tratamiento prolongado, marca de duplicado o triplicado y cobertura del medicamento cuando corresponda.

#### Scenario: Detalle valido
- **WHEN** el usuario completa cantidad y diagnostico validos
- **THEN** el frontend agrega el medicamento al borrador

#### Scenario: Diagnostico faltante
- **WHEN** el usuario intenta confirmar sin diagnostico
- **THEN** el frontend marca el campo y no agrega el medicamento

#### Scenario: Cobertura por medicamento
- **WHEN** el medicamento usa una cobertura distinta a la del paciente
- **THEN** el frontend registra y muestra la cobertura propia del medicamento

### Requirement: Tratamiento prolongado
El frontend SHALL permitir indicar un tratamiento prolongado de 3, 6 o 12 meses, o personalizado entre 2 y 12 meses. La receta resultante SHALL conservar la cantidad de meses indicada.

#### Scenario: Tratamiento predefinido
- **WHEN** el usuario selecciona 3, 6 o 12 meses
- **THEN** el frontend registra esa cantidad de meses en el medicamento

#### Scenario: Tratamiento personalizado
- **WHEN** el usuario elige personalizado e ingresa entre 2 y 12 meses
- **THEN** el frontend registra la cantidad ingresada

#### Scenario: Personalizado fuera de rango
- **WHEN** el usuario ingresa menos de 2 o mas de 12 meses
- **THEN** el frontend marca el campo como invalido

### Requirement: Marca de duplicado o triplicado
El frontend SHALL permitir marcar un medicamento como duplicado o triplicado, de forma mutuamente excluyente. Al marcar triplicado SHALL exigir una serie de una letra y un numero.

#### Scenario: Medicamento duplicado
- **WHEN** el usuario marca el medicamento como duplicado
- **THEN** el frontend desmarca triplicado y no pide serie ni numero

#### Scenario: Medicamento triplicado
- **WHEN** el usuario marca el medicamento como triplicado
- **THEN** el frontend habilita y exige la serie y el numero

#### Scenario: Triplicado incompleto
- **WHEN** el usuario confirma un medicamento triplicado sin serie o numero validos
- **THEN** el frontend no agrega el medicamento y marca los campos

### Requirement: Limite de medicamentos
El frontend SHALL impedir agregar mas de 3 medicamentos a una receta y SHALL avisar cuando se alcanza el limite. Al reutilizar una receta previa SHALL agregar solo hasta completar el limite.

#### Scenario: Limite alcanzado
- **WHEN** el usuario intenta agregar un cuarto medicamento
- **THEN** el frontend avisa que el maximo es 3 y no lo agrega

#### Scenario: Reutilizacion con receta completa
- **WHEN** el usuario reutiliza una receta previa con el limite ya alcanzado
- **THEN** el frontend avisa el maximo y no agrega medicamentos

### Requirement: Datos del certificado
El frontend SHALL solicitar el texto del certificado, la fecha de inicio y la cantidad de dias (minimo 1). La fecha de fin SHALL calcularse como la fecha de inicio mas los dias menos uno.

#### Scenario: Certificado valido
- **WHEN** el usuario completa texto, fecha de inicio y dias validos
- **THEN** el frontend guarda el certificado en el borrador y muestra la fecha de fin calculada

#### Scenario: Certificado incompleto
- **WHEN** falta el texto o la fecha, o los dias son menores a 1
- **THEN** el frontend no guarda el certificado y marca los campos

### Requirement: Datos de la practica
El frontend SHALL solicitar la practica y el diagnostico, y SHALL aceptar indicaciones opcionales.

#### Scenario: Practica valida
- **WHEN** el usuario completa practica y diagnostico
- **THEN** el frontend guarda la practica en el borrador

#### Scenario: Practica incompleta
- **WHEN** falta la practica o el diagnostico
- **THEN** el frontend no guarda la practica y marca los campos

### Requirement: Organizacion y ambito
El frontend SHALL cargar las organizaciones del usuario y preseleccionar la ultima usada o la unica disponible, recordando la seleccion. Para una receta SHALL exigir una organizacion seleccionada. SHALL mostrar el ambito publico o privado de la organizacion.

#### Scenario: Preseleccion de organizacion
- **WHEN** el usuario ya uso una organizacion o tiene una sola
- **THEN** el frontend la preselecciona

#### Scenario: Receta sin organizacion
- **WHEN** el usuario intenta finalizar una receta sin organizacion
- **THEN** el frontend no habilita la finalizacion

#### Scenario: Indicador de ambito
- **WHEN** el usuario selecciona una organizacion
- **THEN** el frontend muestra si es publica o privada

### Requirement: Historial reciente y reutilizacion
Al seleccionar un paciente, el frontend SHALL cargar sus documentos recientes (recetas, certificados y practicas) y SHALL permitir reutilizar una receta, un certificado o una practica en el borrador. Los tratamientos prolongados SHALL agruparse mostrando recetas dispensadas sobre el total.

#### Scenario: Carga de historial
- **WHEN** el frontend establece un paciente con DNI
- **THEN** carga y muestra sus recetas, certificados y practicas recientes

#### Scenario: Reutilizacion de receta
- **WHEN** el usuario reutiliza una receta previa
- **THEN** el frontend carga sus medicamentos en el borrador respetando el limite

#### Scenario: Grupo de tratamiento prolongado
- **WHEN** un tratamiento prolongado tiene varias recetas
- **THEN** el frontend las agrupa y muestra cuantas estan dispensadas

### Requirement: Borrador y finalizacion
El frontend SHALL mantener el documento en un borrador en memoria que SHALL estar listo para finalizar solo con paciente y, para recetas, organizacion y al menos un medicamento. Al finalizar SHALL guardar un pendiente con expiracion de 24 horas y crear la receta, el certificado o la practica segun el tipo.

#### Scenario: Finalizacion de receta
- **WHEN** el borrador tiene paciente, organizacion y al menos un medicamento
- **THEN** el frontend guarda el pendiente y crea la receta

#### Scenario: Finalizacion de certificado o practica
- **WHEN** el borrador tiene paciente y los datos del certificado o la practica
- **THEN** el frontend crea el documento correspondiente

#### Scenario: Borrador incompleto
- **WHEN** faltan el paciente, la organizacion o los datos del documento
- **THEN** el frontend no habilita la finalizacion

#### Scenario: Reintento tras error
- **WHEN** falla la creacion del documento
- **THEN** el pendiente queda guardado y el frontend permite reintentar desde el panel

### Requirement: PIN de seguridad
Cuando el usuario tiene un PIN activo, al finalizar una receta el frontend SHALL solicitar el PIN antes de enviarla. Un PIN incorrecto SHALL incrementar los intentos y volver a solicitar el PIN. El PIN SHALL aplicar solo a recetas.

#### Scenario: Receta con PIN activo
- **WHEN** el usuario finaliza una receta y tiene PIN activo
- **THEN** el frontend solicita el PIN antes de crearla

#### Scenario: PIN incorrecto
- **WHEN** la API rechaza el PIN con 401
- **THEN** el frontend incrementa los intentos, avisa el error y vuelve a solicitar el PIN

#### Scenario: Certificado o practica
- **WHEN** el usuario finaliza un certificado o una practica con PIN activo
- **THEN** el frontend no solicita el PIN

### Requirement: Pendiente de receta al reanudar
Al entrar a la creacion, si existe un pendiente vigente el frontend SHALL ofrecer reanudarlo o descartarlo. Al reanudar SHALL restaurar paciente, medicamentos, organizacion y tipo de documento.

#### Scenario: Pendiente vigente
- **WHEN** existe un pendiente de menos de 24 horas
- **THEN** el frontend muestra el aviso para reanudar o descartar

#### Scenario: Reanudacion
- **WHEN** el usuario decide reanudar
- **THEN** el frontend restaura el contenido del pendiente en el borrador

#### Scenario: Pendiente expirado
- **WHEN** el pendiente supera las 24 horas
- **THEN** el frontend lo descarta y no ofrece reanudarlo
