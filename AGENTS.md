## Comandos

- Usá `npm` en la raíz del repo. El lockfile es `package-lock.json` y `package.json` requiere Node `24.x`.
- `npm start` ejecuta `node server.js`, que sirve la app ya compilada desde `dist/preinscriptions-control` en `PORT` o `8080`. No es el servidor de desarrollo de Angular.
- Usá `npx ng serve` para desarrollo local de Angular. Usá `npx ng serve --configuration=dev` para cargar `src/environments/environment.dev.ts`.
- `npm run build` compila el target Angular por defecto. `npm run build:dev` compila con el reemplazo de archivo `dev`. `heroku-postbuild` también usa esa build `dev`.
- `npm test` ejecuta Karma en modo watch con Chrome. Para ejecuciones estilo CI usá `npm test -- --watch=false --browsers=ChromeHeadless`.
- Ejecutá un spec individual con `npm test -- --watch=false --include='**/path/to/file.spec.ts' --browsers=ChromeHeadless`.
- `npm run lint` usa `eslint -c .eslintrc.js --ext .ts .`. `npm run lint:fix` aplica autofixes.

## Arquitectura

- Esta es una única app Angular más un servidor estático chico en Express. Angular arranca desde `src/main.ts`; la entrada del servidor es `server.js`.
- El nombre del proyecto Angular y la ruta de salida de la build son `preinscriptions-control`; los assets de producción quedan en `dist/preinscriptions-control`.
- El arranque de la app depende de `APP_INITIALIZER` en `src/app/app.module.ts`, que llama a `servicesOnRun()` en `src/app/auth/token-initializer.ts` para ejecutar `AuthService.load()` antes de que la app esté lista.
- El comportamiento HTTP autenticado está centralizado en `src/app/auth/token-interceptor.service.ts` mediante `httpInterceptorProvider`; preferí cambiar ahí el comportamiento de auth/request en lugar de parchear servicio por servicio.
- Los límites principales de features son módulos por rol bajo `src/app/`: `auth`, `professionals`, `pharmacists`, `audit`, además de código reutilizable en `shared`, servicios de dominio en `services` y DTO/interfaces en `interfaces`.
- Las rutas públicas viven en `src/app/app-routing.module.ts`; los flujos específicos por rol están montados bajo `/auth`, `/profesionales`, `/farmacias` y `/audit` en el routing module de cada feature.

## Convenciones

- Preferí los aliases de path de TS definidos en `tsconfig.json`, como `@auth/*`, `@services/*`, `@shared/*`, `@interfaces/*`, `@professionals/*`, `@pharmacists/*` y `@audit/*`.
- La carpeta de validadores custom está escrita con un typo a propósito: `src/app/utils/custome-validators/`. Respetá el path existente en lugar de renombrar imports oportunistamente.
- Los estilos de componentes usan `.sass`, no `.scss`. Los schematics de Angular están configurados para generar componentes con `style: sass`.
- Los include paths de SASS compartidos están configurados en `angular.json` (`src/app/shared/` y `src` para tests), así que preferí esos imports antes que paths relativos largos.
- La app depende mucho de reactive forms y de piezas de formulario compartidas como `PatientFormComponent`; reutilizá validadores y controles compartidos existentes antes de agregar lógica puntual de formularios.

## Entorno Y Secretos

- El cambio de entorno se hace mediante file replacements de Angular en `angular.json`, no con env vars en runtime dentro de la build del navegador.
- `src/environments/api.key.ts` está versionado y lo importan todos los archivos de entorno. Mantené `api.key.example.ts` sincronizado si cambian los nombres de claves o los objetos exportados.

## Notas De Testing

- `src/test.ts` hace monkey-patch de `TestBed.configureTestingModule` para inyectar Angular Material común, router, HTTP testing, `PatientNamePipe`, mocks de dialogs y un mock value accessor para `app-patient-form`. Los tests pueden mantenerse mínimos si se apoyan en esa configuración compartida.
- `src/test.ts` también instala un mock global de `window.turnstile`; los specs relacionados con auth deberían usarlo en lugar de redefinir el widget, salvo que haga falta.
- La salida de coverage de Karma va a `coverage/preinscriptions-control/`.

## Instrucciones Existentes

- `.github/copilot-instructions.md` contiene notas del repo mayormente correctas, pero menciona incorrectamente `npm run e2e`; no existe un script `e2e` en `package.json`.

## Skill De Refactor

- Usá la skill del proyecto `recetar-app-refactor` para refactors guiados por `docs/refactor/recetar-app-refactor-contract.md`.
- Ese contrato es la referencia local vigente para alcance, orden y criterios del proceso de refactorización de `recetar-app`.
- Activala para migraciones de Angular de módulos a standalone, limpieza de servicios y RxJS, reorganización de adapters/models y manejo centralizado de errores HTTP.
- Mantené los refactors incrementales y no mezcles refactors de frontend y backend en el mismo cambio salvo que se pida explícitamente.

## Features Migration Tracker

- Al crear, modificar o eliminar cualquier cosa en `src/app/features/`, actualizá `docs/features-migration-tracker.md`.
- Ese tracker mantiene 3 tablas: estado de features nuevas, matriz de uso de `shared/`, y checklist de código legacy a eliminar.
- Consultalo antes de cada cambio para saber qué shared components ya están en uso y qué código viejo va quedando obsoleto.

## Respetar cambios manuales del usuario al revertir

- Cuando el usuario pida revertir un cambio mío, **nunca debo reemplazar archivos completos ni bloques grandes**. Debo leer el estado actual del archivo y revertir **solo las líneas que yo introduje**, preservando cualquier modificación manual que el usuario haya hecho después.
- Antes de cualquier revert, leer el archivo con `Read` para ver si el usuario lo modificó. Si detecto cambios que no hice yo, no sobreescribirlos.
- Aplicar reversiones con `Edit` oldString/newString apuntando exactamente al contenido que yo introduje, no a bloques enteros del archivo.
