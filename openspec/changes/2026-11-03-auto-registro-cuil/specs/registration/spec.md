# Spec Delta

## Purpose

Definir el auto-registro de profesionales y farmacias en la UI nueva, con captura y edición del CUIT/CUIL.

## ADDED Requirements

### Requirement: Auto-registro en la UI nueva

La app SHALL ofrecer el alta de profesional y farmacia en páginas de `features/auth/pages`, usando los componentes de la UI nueva y `NotificationService` para los mensajes.

#### Scenario: Alta de profesional

- **WHEN** el usuario completa DNI, CUIL, matrícula, profesión, fechas, email, contraseña y captcha
- **THEN** la app envía el alta a `POST /auth/register` y, si es exitosa, vuelve al login

#### Scenario: Alta de farmacia

- **WHEN** el usuario completa CUIT, disposición, matrícula del director técnico, vencimiento, email, contraseña y captcha
- **THEN** la app valida los datos contra ANDES y envía el alta a `POST /auth/register`

### Requirement: CUIL del profesional editable

La app SHALL permitir informar el CUIL del profesional cuando ANDES no lo devuelve.

#### Scenario: ANDES trae CUIL

- **WHEN** se ingresa el DNI y ANDES devuelve `cuit`
- **THEN** el campo CUIL se autocompleta

#### Scenario: ANDES no trae CUIL

- **WHEN** ANDES no devuelve `cuit` para el DNI
- **THEN** el campo CUIL queda editable y es obligatorio completarlo con 11 dígitos válidos

### Requirement: Edición del CUIL en el perfil

La app SHALL permitir que el profesional edite su CUIL desde el panel de cuenta.

#### Scenario: Guardar CUIL

- **WHEN** el profesional modifica su CUIL y guarda
- **THEN** la app lo envía a `PATCH /users/me` con validación de 11 dígitos y verificador

#### Scenario: CUIL legacy inválido

- **WHEN** el profesional tiene guardado un CUIL inválido (por ejemplo, el DNI)
- **THEN** el campo se muestra vacío con un aviso y puede guardar el resto de sus datos; al ingresar un CUIL válido se persiste

#### Scenario: Guardar con errores

- **WHEN** el profesional intenta guardar con campos inválidos
- **THEN** la app marca los campos y muestra un aviso, sin fallar en silencio
