# Tasks

## 1. Adapter y contrato

- [x] 1.1 Adaptar `Prescriptions`/`PrescriptionsAdapter` al nuevo contrato (incluye `estadoPublicacion`) sin exponer campos de Praxis
- [x] 1.2 Tolerar tanto documentos por insumo como recetas legacy con múltiples `supplies`

## 2. Emisión

- [x] 2.1 Ajustar `PrescriptionsService.newPrescription` para no romper con la respuesta nueva
- [x] 2.2 Notificar "receta creada" (201) / "error al crear" (fallo) vía `NotificationService`
- [x] 2.3 Enviar `enrollment` y `cuil` del profesional en el payload de creación

## 3. Suspensión/Anulación

- [x] 3.1 Agregar el método de suspensión al servicio de recetas
- [x] 3.2 Agregar la acción "Suspender/Anular" en `features/documents` y en el listado legacy de profesionales
- [x] 3.3 Restringir "Eliminar" a recetas Pendiente no emitidas; mostrar el mensaje neutral ante 409

## 4. Muestra y publicación electrónica

- [x] 4.1 Reflejar el modelo por insumo/mes en el listado, agrupando por tratamiento
- [x] 4.2 Reflejar los estados vigentes en el detalle
- [x] 4.3 Aviso de publicación electrónica en detalle e ítem de dispensa (`publication.util.ts`)
- [x] 4.4 Bloquear la dispensa en ámbito privado de recetas no publicadas

## 5. Reglas de ámbito

- [x] 5.1 Magistrales: solo organizaciones públicas (cartel + bloqueo de finalización)
- [x] 5.2 Pacientes sin DNI: solo organizaciones públicas (cartel + bloqueo de finalización)
- [x] 5.3 Leer `formacionGrado` de ANDES (con fallback a `profesiones`) en los consumidores de `/auth/professionals-andes`

## 7. Profesional desde ANDES

- [x] 7.1 `User` sin `profesionGrado`/`enrollment`; nuevo `ProfessionalProfile` desde `/professionals/me`
- [x] 7.2 Perfil y header muestran matrículas desde el perfil de profesional
- [x] 7.3 Nueva receta/stock no envían formación; muestran el error 422 del backend

## 6. Verificación

- [x] 6.1 Tests: adapter, notificación de creación, suspensión, util de publicación
- [x] 6.2 Ejecutar `npm run lint`, `npm test -- --watch=false --browsers=ChromeHeadless` y `npm run build`
- [x] 6.3 Actualizar `docs/features-migration-tracker.md`

> Nota: la suite completa reporta 5 fallos preexistentes y no relacionados (`AppComponent`, `FooterComponent`, `HeaderComponent`, `NgxTurnstileComponent`, `NotFoundComponent`).

## Workflow follow-up

- Archivar el change cuando se cumplan los requisitos de revisión del proyecto.
- Verificar el resultado archivado.
