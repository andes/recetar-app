# Tasks

## 1. Base de cobertura, preflight y datos descartables

- [x] 1.1 Destapar los RENAPER que no requieren servicio real (`PAT-013`, `PAC-012`, `PAC-011`) y etiquetar sólo `PAT-012` y `PAC-010` con `@env:renaper`; etiquetar PIN y organizaciones con `@env:pin` y `@env:org`. Verificar que con `E2E_RENAPER_ENABLED=0` corran los 3 destapados y que `npx playwright test --list --grep "@env:renaper"` liste sólo 2.
- [x] 1.2 Implementar el preflight de ambiente (roles, servicios y flags) y conectarlo al project `setup`; verificar que imprima la tabla de faltantes y el conteo de `env-gated`, y que con `E2E_STRICT_ENV=1` falle cuando falta un rol base.
- [x] 1.3 Crear `e2e/COVERAGE.md` con las 8 capabilities y sus 83 requisitos, marcando el estado inicial (`cubierto`, `parcial`, `gap`, `env-gated`); verificar que no quede ningún requisito sin fila.
- [x] 1.4 Agregar helpers de datos descartables y cleanup en `e2e/fixtures/api-client.ts` (usuario, certificado, práctica, receta); verificar con `npm run e2e:typecheck` y un smoke test que cree y elimine un registro.
- [x] 1.5 Documentar prerequisitos, flags y datos de prueba en `e2e/README.md` y `.env.e2e.example`; verificar que cada variable usada en `e2e/` esté documentada.

## 2. Documentos públicos

- [x] 2.1 Implementar un fixture que cifre IDs públicos con la misma `CERTIFICATE_SECRET_KEY` que `certificates.service.encryptId` y `practices.service.encryptId`; verificar ida y vuelta contra el componente público con un caso smoke.
- [x] 2.2 Cubrir `PUB-001`: acceso sin sesión a `/certificate/:id` y `/practice/:id`, y ruta desconocida redirige a 404; verificar que los tests pasen sin `storageState`.
- [ ] 2.3 Cubrir `PUB-002`: identificador válido, ausente, inválido, documento inexistente y estado de carga; verificar cada escenario con su mensaje esperado.
- [ ] 2.4 Cubrir `PUB-003`: certificado activo, expirado, anulado y error de consulta; verificar que se muestren fechas, días, profesional y motivo de anulación cuando corresponda.
- [ ] 2.5 Cubrir `PUB-004`: práctica visible, estados activo/completado/cancelado, secciones opcionales y error de consulta; verificar que las secciones ausentes no se rendericen.
- [ ] 2.6 Actualizar `e2e/COVERAGE.md` para `public-documents`; verificar que los 4 requisitos queden en `cubierto`.

## 3. Ciclo de sesión

- [x] 3.1 Cubrir `SES-001` restauración de sesión: sembrar `JWT_TOKEN` y `REFRESH_TOKEN` en `localStorage`, recargar y verificar que la app abre autenticada.
- [x] 3.2 Cubrir `SES-002` refresh automático de token usando un token de corta vida o interceptando `/auth/refresh`; verificar que la sesión siga válida sin volver al login.
- [x] 3.3 Cubrir `SES-003` logout: verificar limpieza de tokens, redirección al login y que una ruta protegida vuelva a pedir sesión.
- [x] 3.4 Cubrir `SES-004` recuperación y cambio de contraseña con un usuario descartable; verificar que la clave nueva permita login y que la vieja falle.
- [ ] 3.5 Cubrir `SES-005` registro de profesional y farmacia, y confirmación de actualización de datos, mockeando Turnstile; verificar los flujos felices y los errores de validación.
- [ ] 3.6 Actualizar `e2e/COVERAGE.md` para `session-and-access`; verificar que los 13 requisitos queden cubiertos o marcados como `env-gated` con motivo.

## 4. Auditoría de usuarios

- [ ] 4.1 Ampliar `USR-001` para listado, búsqueda y detalle de usuarios; verificar paginación y estado vacío.
- [ ] 4.2 Cubrir `USR-002` alta de usuario con datos descartables; verificar que el usuario aparezca en el listado y se limpie al final.
- [ ] 4.3 Cubrir `USR-003` edición de datos y asignación de roles; verificar que los cambios persistan al reabrir el detalle.
- [ ] 4.4 Cubrir `USR-004` baja/desactivación de usuario; verificar que el usuario desaparezca del listado activo y que el cleanup no falle.
- [ ] 4.5 Cubrir `USR-005` control de permisos: admin puede mutar usuarios y auditor no; verificar los códigos de error o la UI de denegación.
- [ ] 4.6 Actualizar `e2e/COVERAGE.md` para `audit`; verificar que los 7 requisitos queden cubiertos o justificados.

## 5. Dispensación y documentos

- [ ] 5.1 Cubrir `DSP-001` filtros de recetas en dispensación; verificar combinaciones de estado/ámbito y limpieza de filtros.
- [ ] 5.2 Cubrir `DSP-002` paginación; verificar cambio de página y cantidad de ítems por página.
- [ ] 5.3 Cubrir `DSP-003` reemplazo de medicamento en la dispensa; verificar que se registre el reemplazo y se actualice el estado.
- [ ] 5.4 Cubrir `DSP-004` impresión de receta con un helper que espere el popup de pdfmake y valide URL `blob:` y tamaño del PDF, con fallback a descarga `.pdf`; verificar que se abra una sola vez con el documento correcto.
- [ ] 5.5 Cubrir la impresión de documentos (`DOC-004`) con el mismo helper popup/blob o descarga; verificar receta, certificado, práctica y el caso duplicado de dos páginas.
- [ ] 5.6 Actualizar `e2e/COVERAGE.md` para `dispensing` y `documents`; verificar que los requisitos restantes queden cubiertos o marcados como gap justificado.

## 6. Perfil

- [ ] 6.1 Cubrir `PRF-001` cambio de contraseña desde perfil con usuario descartable; verificar login con la nueva clave y error con la anterior.
- [ ] 6.2 Cubrir `PRF-002` estado y gestión del PIN de seguridad, gateado por `E2E_USER_PIN`; verificar alta, cambio y baja del PIN.
- [ ] 6.3 Cubrir `PRF-003` gestión de organizaciones: alta, baja y persistencia; verificar que la organización quede asociada al usuario.
- [ ] 6.4 Actualizar `e2e/COVERAGE.md` para `profile`; verificar que los 9 requisitos queden cubiertos o `env-gated` con motivo.

## 7. Experiencia mobile

- [ ] 7.1 Agregar el project `mobile-chrome` con `devices['Pixel 7']` y `grep: /@mobile/`; verificar que no ejecute tests sin la etiqueta.
- [ ] 7.2 Etiquetar `@mobile` los escenarios de gestión de pacientes y nueva receta que deban correr en viewport reducido; verificar `npx playwright test --project=mobile-chrome --list`.
- [ ] 7.3 Agregar `MOB-001..003` para navegación, menú y formularios en mobile; verificar que la suite mobile pase en Chromium mobile.
- [ ] 7.4 Actualizar `e2e/COVERAGE.md` para el requisito “Experiencia mobile”; verificar que quede `cubierto`.

## 8. CI y verificación de integración

- [ ] 8.1 Actualizar el workflow E2E para instalar Chromium + Firefox y correr la suite desktop completa en ambos; verificar el job en un PR de prueba.
- [ ] 8.2 Agregar un paso/job separado para `--project=mobile-chrome`; verificar que el reporte mobile quede adjunto como artefacto.
- [ ] 8.3 Ejecutar la suite completa en Chromium y Firefox y triar fallos; verificar que no queden fallos sin issue o skip justificado.
- [ ] 8.4 Revisar `e2e/COVERAGE.md` final y listar los `env-gated`: 2 RENAPER reales, PIN y magistral por organización; verificar que cada uno tenga motivo y que los 3 RENAPER sin servicio real figuren como cubiertos.

## Workflow follow-up

- Archivar el change cuando la revisión del equipo esté aprobada.
- Abrir changes/bugfixes separados para los bugs de producto detectados (`CERT-002`, `AUTH-002`) y para accesibilidad/visual regression.
