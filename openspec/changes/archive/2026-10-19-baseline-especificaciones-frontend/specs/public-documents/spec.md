# Spec Delta

## Purpose

`public-documents` define la consulta publica de certificados y practicas mediante un identificador cifrado, sin requerir sesion, incluyendo estados y errores.

## ADDED Requirements

### Requirement: Acceso publico a documentos
El frontend SHALL exponer `/certificate/:id` y `/practice/:id` sin requerir sesion, y SHALL mostrar el documento correspondiente o su estado de error.

#### Scenario: Acceso sin sesion
- **WHEN** una persona abre un enlace publico de certificado o practica
- **THEN** el frontend muestra el documento sin pedir inicio de sesion

#### Scenario: Ruta desconocida
- **WHEN** la ruta no corresponde a un documento publico
- **THEN** el frontend redirige a la pagina no encontrada

### Requirement: Resolucion del identificador
El frontend SHALL descifrar el identificador recibido y SHALL consultar el documento como publico. Si el identificador falta o no puede descifrarse, SHALL mostrar que es invalido. Si el documento no se encuentra, SHALL mostrar que no existe o es invalido. Mientras carga SHALL mostrar un indicador.

#### Scenario: Identificador valido
- **WHEN** el identificador se descifra correctamente y el documento existe
- **THEN** el frontend muestra el documento

#### Scenario: Identificador ausente o invalido
- **WHEN** el identificador falta o no puede descifrarse
- **THEN** el frontend muestra el error de identificador invalido

#### Scenario: Documento inexistente
- **WHEN** la consulta publica no encuentra el documento
- **THEN** el frontend muestra que no se encontro o es invalido

#### Scenario: Estado de carga
- **WHEN** el documento esta siendo consultado
- **THEN** el frontend muestra un indicador de carga

### Requirement: Visualizacion del certificado
El frontend SHALL mostrar el certificado con los datos del paciente, las fechas de emision, inicio y fin, la cantidad de dias, la descripcion, el profesional y, si corresponde, la fecha y el motivo de anulacion. SHALL calcular el estado como activo, expirado o anulado.

#### Scenario: Certificado activo
- **WHEN** el certificado no tiene fecha de fin vencida ni fecha de anulacion
- **THEN** el frontend lo muestra como activo

#### Scenario: Certificado expirado
- **WHEN** la fecha de fin del certificado es anterior a hoy y no esta anulado
- **THEN** el frontend lo muestra como expirado

#### Scenario: Certificado anulado
- **WHEN** el certificado tiene fecha de anulacion
- **THEN** el frontend lo muestra como anulado con su fecha y motivo

#### Scenario: Error de consulta
- **WHEN** falla la consulta publica del certificado
- **THEN** el frontend muestra el error y una accion para volver al inicio

### Requirement: Visualizacion de la practica
El frontend SHALL mostrar la practica con los datos del paciente, cobertura y numero de afiliado, las fechas de emision y de la practica, la descripcion, el diagnostico, las indicaciones, las observaciones, el profesional y su matricula. SHALL calcular el estado como activo, completado o cancelado.

#### Scenario: Practica visible
- **WHEN** la practica se consulta correctamente
- **THEN** el frontend muestra sus datos, estado y el profesional responsable

#### Scenario: Estado de la practica
- **WHEN** la practica tiene estado activo, completado o cancelado
- **THEN** el frontend muestra la etiqueta correspondiente

#### Scenario: Secciones opcionales
- **WHEN** la practica no tiene diagnostico, indicaciones u observaciones
- **THEN** el frontend omite esas secciones

#### Scenario: Error de consulta
- **WHEN** falla la consulta publica de la practica
- **THEN** el frontend muestra el error y una accion para volver al inicio
