# Spec Delta

## MODIFIED Requirements

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
