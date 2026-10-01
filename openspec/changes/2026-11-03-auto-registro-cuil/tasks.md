# Tasks

## 1. Auto-registro

- [x] 1.1 DTOs `register.dto` (profesional y farmacia)
- [x] 1.2 Página `register-professional` (UI nueva + CUIL editable/autocompletado)
- [x] 1.3 Página `register-pharmacist` (UI nueva + validación ANDES)
- [x] 1.4 Rutas `/auth/new-user` y `/auth/new-user-pharmacist` a los componentes nuevos
- [x] 1.5 Eliminar `auth/components/new-user*`

## 2. Autogestión

- [x] 2.1 Campo CUIL en el panel de cuenta (profesional)
- [x] 2.2 `ProfileService.updateProfile` y `UserService.updateCurrentUser` aceptan `cuil`
- [x] 2.3 Manejo de CUIL legacy inválido (no se precarga) y feedback al guardar con errores

## 3. Verificación

- [x] 3.1 `npm run lint`
- [x] 3.2 `npm run build`
- [x] 3.3 `npm test`
- [x] 3.4 Tracker de migración actualizado
