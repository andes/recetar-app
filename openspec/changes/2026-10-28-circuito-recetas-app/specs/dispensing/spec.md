# Spec Delta

## Purpose

Restringir la dispensa de recetas no publicadas electrónicamente según el ámbito.

## ADDED Requirements

### Requirement: Restricción por publicación electrónica

El frontend SHALL bloquear la dispensa en ámbito privado de recetas cuyo `estadoPublicacion` sea `pendiente`, `error` o `no_aplicable`, mostrando un aviso. En ámbito público SHALL permitirla. Las recetas con `estadoPublicacion` `ok` o `desconocido` no SHALL bloquearse.

#### Scenario: Receta no publicada en privado

- **WHEN** el usuario intenta dispensar en ámbito privado una receta no publicada
- **THEN** el frontend deshabilita la dispensa y muestra el aviso

#### Scenario: Receta no publicada en público

- **WHEN** el usuario dispensa en ámbito público una receta no publicada
- **THEN** el frontend permite la dispensa

#### Scenario: Receta publicada

- **WHEN** la receta está publicada
- **THEN** el frontend permite la dispensa en cualquier ámbito
