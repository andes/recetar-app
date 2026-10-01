# session-and-access Specification

## Purpose
`session-and-access` define como el frontend gestiona la sesion de usuario, la autenticacion, la recuperacion de acceso y el control de acceso a las secciones segun el rol.

## Requirements

### Requirement: Inicio de sesion
El frontend SHALL autenticar al usuario por identificador y contrasena. Ante exito SHALL guardar el JWT y el refresh token, resolver el rol desde el JWT y navegar a `/dashboard`. Ante error SHALL mostrar el mensaje de la API y limpiar el formulario.

#### Scenario: Login exitoso
- **WHEN** el usuario ingresa un identificador y una contrasena validos
- **THEN** el frontend guarda los tokens, resuelve el rol y navega a `/dashboard`

#### Scenario: Login con credenciales invalidas
- **WHEN** la API rechaza las credenciales
- **THEN** el frontend muestra el mensaje de error y limpia el formulario

### Requirement: Restauracion de sesion al iniciar
El frontend SHALL validar la sesion existente al arrancar. Si hay JWT y refresh token en el almacenamiento local, SHALL consultar la sesion contra la API. Si la validacion falla, SHALL limpiar la sesion y navegar a `/auth/login`.

#### Scenario: Sesion valida al iniciar
- **WHEN** la app arranca con un JWT y un refresh token validos
- **THEN** el frontend restaura la sesion y mantiene al usuario autenticado

#### Scenario: Sesion invalida al iniciar
- **WHEN** la app arranca con tokens invalidos o expirados
- **THEN** el frontend limpia la sesion y navega a `/auth/login`

### Requirement: Renovacion automatica de token
El frontend SHALL agregar el encabezado `Authorization: Bearer` a las peticiones no marcadas como publicas. Ante HTTP 406 SHALL renovar el access token con el refresh token y reintentar la peticion. Ante HTTP 417 SHALL cerrar la sesion y navegar a `/auth/login`.

#### Scenario: Access token expirado
- **WHEN** una peticion autenticada responde 406
- **THEN** el frontend renueva el access token y reintenta la peticion original

#### Scenario: Credenciales invalidas
- **WHEN** una peticion responde 417
- **THEN** el frontend cierra la sesion y navega a `/auth/login`

### Requirement: Cierre de sesion
El frontend SHALL revocar el refresh token, limpiar los tokens y el estado de sesion, y navegar a `/auth/login`.

#### Scenario: Cierre de sesion exitoso
- **WHEN** el usuario cierra la sesion
- **THEN** el frontend revoca el refresh token, limpia los tokens y navega a `/auth/login`

### Requirement: Recuperacion de contrasena
El frontend SHALL permitir solicitar la recuperacion indicando el usuario y SHALL mostrar el mensaje devuelto por la API. Con un token de recuperacion valido SHALL permitir definir una contrasena nueva de al menos 8 caracteres, confirmada por repeticion, y navegar al login.

#### Scenario: Solicitud de recuperacion
- **WHEN** el usuario solicita la recuperacion con un usuario valido
- **THEN** el frontend notifica el resultado devuelto por la API

#### Scenario: Definicion de nueva contrasena
- **WHEN** el usuario define una contrasena nueva de al menos 8 caracteres que coincide con su confirmacion
- **THEN** el frontend actualiza la contrasena y navega al login

#### Scenario: Contrasena invalida
- **WHEN** la contrasena nueva tiene menos de 8 caracteres o no coincide con la confirmacion
- **THEN** el frontend no envia la solicitud y marca el formulario como invalido

### Requirement: Cambio de contrasena autenticado
El frontend SHALL permitir cambiar la contrasena indicando la actual y una nueva de al menos 8 caracteres, SHALL mostrar el mensaje de la API y SHALL navegar a la ruta correspondiente al rol del usuario.

#### Scenario: Cambio exitoso
- **WHEN** el usuario autenticado cambia su contrasena con datos validos
- **THEN** el frontend muestra el mensaje de exito y navega a la ruta de su rol

#### Scenario: Error del servidor
- **WHEN** la API rechaza el cambio de contrasena
- **THEN** el frontend muestra el mensaje de error

### Requirement: Registro de profesional
El frontend SHALL registrar profesionales con DNI, CUIL, matricula, email, contrasena, profesion, fechas de egreso y vencimiento, y captcha. SHALL cargar las profesiones autorizadas y mostrar los datos de la cuenta creada.

#### Scenario: Alta exitosa
- **WHEN** el usuario completa los datos validos y el captcha
- **THEN** el frontend crea la cuenta y muestra el nombre, usuario, profesion y matricula

#### Scenario: Formulario invalido
- **WHEN** hay campos vacios o con formato invalido
- **THEN** el frontend no envia el registro y muestra un aviso

### Requirement: Registro de farmacia
El frontend SHALL registrar farmacias validando CUIL, disposicion de habilitacion, matricula y fecha de vencimiento contra el padron provincial antes de crear la cuenta. SHALL informar cada dato incorrecto o la ausencia de registro.

#### Scenario: Datos coincidentes con el padron
- **WHEN** los datos de la farmacia coinciden con el padron
- **THEN** el frontend crea la cuenta

#### Scenario: Datos que no coinciden
- **WHEN** la disposicion, la matricula o el vencimiento no coinciden con el padron
- **THEN** el frontend informa el dato incorrecto y no crea la cuenta

#### Scenario: Farmacia no registrada
- **WHEN** el CUIL no figura en el padron provincial
- **THEN** el frontend informa que la farmacia no esta registrada

### Requirement: Confirmacion de actualizacion de datos
El frontend SHALL confirmar la actualizacion de datos de un usuario a partir de un token y SHALL navegar al login al finalizar.

#### Scenario: Token valido
- **WHEN** el usuario accede al enlace de confirmacion con un token valido
- **THEN** el frontend confirma la actualizacion y navega al login

#### Scenario: Token invalido
- **WHEN** el token falta o es invalido
- **THEN** el frontend informa el error y no confirma la actualizacion

### Requirement: Proteccion de rutas
El frontend SHALL proteger las rutas privadas. Sin sesion activa SHALL redirigir a `/auth/login`. Con sesion activa SHALL impedir el acceso a `/auth/login` redirigiendo a `/dashboard`.

#### Scenario: Usuario no autenticado
- **WHEN** un usuario sin sesion intenta acceder a una ruta privada
- **THEN** el frontend lo redirige a `/auth/login`

#### Scenario: Usuario autenticado en el login
- **WHEN** un usuario autenticado navega a `/auth/login`
- **THEN** el frontend lo redirige a `/dashboard`

### Requirement: Control de acceso por rol
El frontend SHALL restringir las secciones de profesional, farmacia y auditoria con guards de rol que redirigen al usuario a la seccion que le corresponde.

#### Scenario: Farmaceutico en la seccion de profesional
- **WHEN** un usuario farmaceutico navega a la seccion de profesional
- **THEN** el frontend lo redirige a `/farmacias/recetas/dispensar`

#### Scenario: Profesional en la seccion de farmacia
- **WHEN** un usuario profesional navega a la seccion de farmacia
- **THEN** el frontend lo redirige a `/profesionales/recetas/nueva`

#### Scenario: Auditor en la seccion de farmacia
- **WHEN** un usuario auditor navega a la seccion de farmacia
- **THEN** el frontend lo redirige a `/audit/recetas/auditar`

#### Scenario: Auditor en la seccion de profesional
- **WHEN** un usuario solo auditor navega a la seccion de profesional
- **THEN** el guard permite el acceso (observacion: la redireccion esperada no ocurre en el estado actual)

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

### Requirement: Ambito de trabajo
Tras el login, el frontend SHALL definir y persistir el ambito de trabajo: publico para roles publicos, privado para roles privados, y seleccion manual para usuarios con ambos roles profesionales.

#### Scenario: Rol publico
- **WHEN** inicia sesion un usuario con rol publico
- **THEN** el frontend establece el ambito publico y lo persiste

#### Scenario: Rol privado
- **WHEN** inicia sesion un usuario con rol privado
- **THEN** el frontend establece el ambito privado y lo persiste

#### Scenario: Ambos roles profesionales
- **WHEN** inicia sesion un usuario con ambos roles profesionales
- **THEN** el frontend no fija el ambito y el usuario lo selecciona en el selector
