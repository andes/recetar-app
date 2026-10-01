# Spec Delta

## Purpose

Definir el resultado neutro de la creación de recetas y reflejar el histórico por insumo sin exponer servicios externos.

## ADDED Requirements

### Requirement: Resultado de la creación

Al crear una receta SHALL notificarse el resultado de forma neutral: éxito cuando la receta se creó y error con mensaje claro cuando no. La notificación no SHALL mencionar servicios externos ni estados de sincronización. Un fallo de publicación electrónica no SHALL interrumpir el flujo de creación local.

#### Scenario: Creación exitosa

- **WHEN** la creación de la receta responde con éxito
- **THEN** el frontend muestra "receta creada"

#### Scenario: Error de creación

- **WHEN** la creación de la receta falla
- **THEN** el frontend muestra un mensaje de error claro

#### Scenario: Publicación electrónica pendiente

- **WHEN** la receta se guarda localmente y la publicación electrónica queda pendiente
- **THEN** el frontend no muestra estados de sincronización y mantiene el resultado como creación exitosa

### Requirement: Ámbito para magistrales y pacientes sin DNI

El frontend SHALL permitir prescribir medicamentos magistrales y pacientes sin DNI únicamente con organizaciones de ámbito público. SHALL mostrar un aviso explicativo y SHALL impedir la finalización cuando la organización seleccionada sea privada.

#### Scenario: Magistral con organización privada

- **WHEN** el borrador tiene un medicamento magistral y la organización es privada
- **THEN** el frontend muestra el aviso y no habilita la finalización

#### Scenario: Paciente sin DNI con organización privada

- **WHEN** el paciente no tiene DNI y la organización es privada
- **THEN** el frontend muestra el aviso y no habilita la finalización

#### Scenario: Organización pública

- **WHEN** la organización es pública
- **THEN** el frontend permite finalizar aunque haya magistrales o el paciente no tenga DNI

## MODIFIED Requirements

### Requirement: Historial reciente y reutilizacion

Al seleccionar un paciente, el frontend SHALL cargar sus documentos recientes (recetas, certificados y practicas) usando el DNI cuando exista o el identificador de MPI cuando no haya DNI. SHALL permitir reutilizar una receta, un certificado o una practica en el borrador. Los tratamientos prolongados SHALL agruparse por tratamiento, considerando que cada insumo y cada mes puede ser un documento distinto, mostrando recetas dispensadas sobre el total.

#### Scenario: Carga de historial

- **WHEN** el frontend establece un paciente con DNI o identificador de MPI
- **THEN** carga y muestra sus recetas, certificados y practicas recientes

#### Scenario: Reutilizacion de receta

- **WHEN** el usuario reutiliza una receta previa
- **THEN** el frontend carga sus medicamentos en el borrador respetando el limite

#### Scenario: Grupo de tratamiento prolongado

- **WHEN** un tratamiento prolongado tiene varias recetas o documentos por insumo/mes
- **THEN** el frontend los agrupa por tratamiento y muestra cuantas estan dispensadas

#### Scenario: Historial de paciente sin DNI

- **WHEN** el paciente no tiene DNI pero tiene identificador de MPI
- **THEN** el frontend carga su historial usando el identificador de MPI
