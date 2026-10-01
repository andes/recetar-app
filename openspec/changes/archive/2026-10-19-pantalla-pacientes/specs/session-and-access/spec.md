# Spec Delta

## MODIFIED Requirements

### Requirement: Navegacion segun rol
El frontend SHALL mostrar en el menu lateral las secciones habilitadas para el rol: Inicio y Prescribir para todos; Documentos y Pacientes para profesional; Dispensar para farmaceutico; Pacientes, Auditar recetas y Usuarios para auditor.

#### Scenario: Menu de profesional
- **WHEN** un usuario profesional inicia sesion
- **THEN** el menu muestra Inicio, Prescribir, Documentos y Pacientes

#### Scenario: Menu de farmaceutico
- **WHEN** un usuario farmaceutico inicia sesion
- **THEN** el menu muestra Inicio, Prescribir y Dispensar

#### Scenario: Menu de auditor
- **WHEN** un usuario auditor inicia sesion
- **THEN** el menu muestra Inicio, Prescribir, Pacientes, Auditar recetas y Usuarios
