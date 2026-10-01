# Spec Delta

## Purpose

Reflejar el nuevo modelo de recetas por insumo/mes y agregar la suspensión/anulación de recetas locales, restringiendo la eliminación a recetas no emitidas.

## ADDED Requirements

### Requirement: Listado por insumo y tratamiento

El frontend SHALL mostrar las recetas según el modelo vigente: una entrada por insumo y una por mes en los tratamientos prolongados, agrupando y ordenando por tratamiento (`treatmentGroupId`, `ordenTratamiento`) y manteniendo el merge con recetas de ANDES.

#### Scenario: Receta con varios insumos

- **WHEN** una receta tiene varios insumos
- **THEN** el frontend muestra una entrada por cada insumo

#### Scenario: Tratamiento prolongado

- **WHEN** una receta es de tratamiento prolongado con varios meses
- **THEN** el frontend agrupa los documentos por tratamiento y los ordena por orden de tratamiento

#### Scenario: Merge con ANDES

- **WHEN** el listado contiene recetas locales y de ANDES
- **THEN** el frontend muestra ambas fuentes de forma consistente

### Requirement: Estado vigente en el detalle

El frontend SHALL mostrar en el detalle el estado vigente de la receta según el modelo de estados, usando los labels y variants existentes.

#### Scenario: Estado vigente

- **WHEN** el usuario abre el detalle de una receta
- **THEN** el frontend muestra su estado vigente con el label y variant correspondientes

### Requirement: Suspensión y anulación de receta local

El frontend SHALL permitir suspender/anular una receta local en estado suspendible, previa confirmación, notificando el resultado y recargando el listado. La operación SHALL realizarse mediante un endpoint neutral, sin mencionar servicios externos.

#### Scenario: Suspender receta local

- **WHEN** el usuario confirma la suspensión de una receta local suspendible
- **THEN** el frontend llama al endpoint de suspensión, notifica el resultado y recarga el listado

#### Scenario: Receta no suspendible

- **WHEN** la receta no está en un estado suspendible
- **THEN** el frontend no ofrece la acción de suspender

#### Scenario: Error al suspender

- **WHEN** la API rechaza la suspensión
- **THEN** el frontend notifica el mensaje de error devuelto

### Requirement: Aviso de publicación electrónica

El frontend SHALL mostrar un aviso en el detalle de la receta y en el ítem de dispensa cuando `estadoPublicacion` sea `pendiente`, `error` o `no_aplicable`, indicando que solo puede dispensarse en el ámbito público desde RecetAr. No SHALL mostrar el aviso para `ok` ni `desconocido`.

#### Scenario: Receta no publicada

- **WHEN** la receta tiene `estadoPublicacion` pendiente, error o no aplicable
- **THEN** el frontend muestra el aviso de publicación electrónica

#### Scenario: Receta publicada o sin estado

- **WHEN** la receta tiene `estadoPublicacion` ok o desconocido
- **THEN** el frontend no muestra el aviso

## MODIFIED Requirements

### Requirement: Eliminacion y anulacion de documentos

El frontend SHALL permitir eliminar recetas y practicas previa confirmacion, suspendiendo las recetas de ANDES y suspendiendo/anulando las recetas locales, y SHALL permitir eliminar una receta local solo cuando sea Pendiente y no haya sido emitida. SHALL permitir anular certificados no anulados previa confirmacion. Tras la accion SHALL notificar y recargar el listado.

#### Scenario: Suspender receta local

- **WHEN** el usuario confirma la suspensión de una receta local
- **THEN** el frontend la suspende, notifica y recarga el listado

#### Scenario: Eliminar receta local

- **WHEN** el usuario confirma la eliminación de una receta local Pendiente no emitida
- **THEN** el frontend la elimina, notifica y recarga el listado

#### Scenario: Eliminar receta local emitida

- **WHEN** el usuario intenta eliminar una receta local ya emitida
- **THEN** el frontend muestra el mensaje neutral devuelto y sugiere suspenderla

#### Scenario: Eliminar receta de ANDES

- **WHEN** el usuario confirma la eliminacion de una receta de ANDES
- **THEN** el frontend la suspende, notifica y recarga el listado

#### Scenario: Eliminar practica

- **WHEN** el usuario confirma la eliminacion de una practica
- **THEN** el frontend la elimina, notifica y recarga el listado

#### Scenario: Anular certificado

- **WHEN** el usuario confirma la anulacion de un certificado no anulado
- **THEN** el frontend lo anula, notifica y recarga el listado

#### Scenario: Certificado ya anulado

- **WHEN** el certificado ya tiene fecha de anulacion
- **THEN** el frontend no ofrece la accion de anular
