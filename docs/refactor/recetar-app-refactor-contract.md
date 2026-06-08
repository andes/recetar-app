# Plan y Contrato de Refactor - recetar-app

## Alcance

- Este documento aplica solo a `recetar-app` (frontend Angular + server estático `server.js`).
- Queda fuera de alcance cualquier cambio en `recetar-api`, salvo pedido explícito del usuario.
- El objetivo es guiar refactors incrementales, con bajo riesgo y con validación continua.

## Estado Actual (Mayo 2026)

### Stack y ejecución

- Angular `20.x`.
- RxJS `~6.5.4` (todavía no migrado a 7).
- Node `24.x` requerido por `package.json`.
- `npm start` sirve build compilada desde `dist/preinscriptions-control` usando `server.js`.
- Desarrollo local con `npx ng serve`.

### Arquitectura de frontend

- Arquitectura principal basada en `NgModule`:
  - `src/app/app.module.ts`
  - `src/app/auth/auth.module.ts`
  - `src/app/professionals/professionals.module.ts`
  - `src/app/pharmacists/pharmacists.module.ts`
  - `src/app/audit/audit.module.ts`
- La aplicación ahora combina componentes `standalone: true` con la arquitectura `NgModule` existente, en transición gradual hacia standalone.
- El bootstrap de autenticación depende de `APP_INITIALIZER` en `src/app/app.module.ts` llamando `servicesOnRun()` de `src/app/auth/token-initializer.ts`.

### Datos, mapeo y servicios

- El proyecto mantiene `src/app/interfaces/` como ubicación principal de modelos y adapters.
- Existen adapters implementados para algunos dominios (por ejemplo pacientes/profesionales/farmacias), pero no de forma uniforme para todos los modelos.
- Hay lógica async manual en servicios (ejemplo notable: `searchByTerm` en `src/app/services/prescriptions.service.ts` con `setTimeout`, cancelaciones manuales y `any`).

### Manejo de errores HTTP

- El manejo central de auth/request existe en `src/app/auth/token-interceptor.service.ts`.
- El parseo de error aún contempla formatos heterogéneos (`mensaje`, `message`, string).
- Se debe preservar el flujo de refresh/token expirado (406/417) durante refactors.

## Contrato Operativo de Refactor

### Principios obligatorios

- Hacer cambios chicos, trazables y reversibles.
- Evitar mezclar en una misma tarea:
  - migración a standalone,
  - reorganización estructural amplia,
  - cambio de contrato de errores.
- Antes de editar, reconciliar este plan con el estado real del código (el repo siempre manda sobre el documento).
- Preservar convenciones del repo:
  - path aliases de `tsconfig.json`,
  - carpeta `src/app/utils/custome-validators/` sin renombrar,
  - estilos `.sass`.

### Restricciones de alcance

- No cambiar comportamiento funcional no relacionado con la tarea pedida.
- No romper rutas existentes salvo pedido explícito.
- No retirar `SharedModule` hasta que sus consumidores estén migrados.
- No romper `APP_INITIALIZER` ni el bootstrap de auth.

### Definición de terminado por cambio

- Compila o mantiene consistencia de tipos en la zona afectada.
- Mantiene paridad funcional observable para el usuario final.
- Reduce deuda técnica concreta (acoplamiento, tipado débil, duplicación, flujo RxJS manual, etc.).
- Incluye validación mínima acorde al alcance.

## Orden Recomendado de Trabajo

1. **Estabilizar baseline por feature**
   - leer módulo/routing/servicios/componentes de la zona a tocar;
   - acotar el cambio a una sola preocupación.
2. **Centralizar y normalizar errores HTTP en frontend**
   - priorizar interceptor(es) y utilidades de error reutilizables;
   - mantener el comportamiento actual de refresh/expiración de credenciales.
3. **Refactor RxJS en servicios críticos**
   - reemplazar `setTimeout` + `subscribe` manual por operadores (`debounceTime`, `distinctUntilChanged`, `switchMap`, `catchError`, `takeUntil` según corresponda);
   - eliminar `any` usados para tracking de timeout/suscripciones.
4. **Consolidar models/dto/adapters**
   - extender patrón `Adapter<T>` de forma incremental;
   - mover transformación fuera de componentes.
5. **Migración gradual a standalone**
   - iniciar por piezas de bajo riesgo y compartidas;
   - avanzar por feature sin big-bang.

## Criterios Específicos por Eje

### Error handling

- Unificar interpretación de errores en un único flujo para la app.
- Mantener soporte de respuestas legacy mientras backend no entregue un contrato homogéneo.
- Asegurar tratamiento explícito de `422` para feedback de formularios.

### RxJS

- Evitar `new Observable(...)` manual cuando sea reemplazable por operadores.
- Evitar estado mutable para cancelar peticiones cuando `switchMap` resuelve el caso.
- Preferir streams declarativos y limpieza por ciclo de vida.

### Standalone y estructura

- Migrar por etapas, con imports explícitos por componente standalone.
- No hacer mudanzas masivas de carpetas en la misma tarea que cambia comportamiento.
- Conservar compatibilidad con módulos existentes mientras coexistan.

## Verificación Recomendada

Elegir la verificación más chica que cubra el cambio:

- `npm run lint`
- `npm test -- --watch=false --browsers=ChromeHeadless`
- Test dirigido cuando aplique:
  - `npm test -- --watch=false --include='**/path/to/file.spec.ts' --browsers=ChromeHeadless`

## Uso por AGENTS y Skill

- `AGENTS.md` y la skill `recetar-app-refactor` deben referenciar este archivo como fuente local.
- Si el estado del repo cambia de forma relevante, actualizar primero este contrato y luego la skill.

## Avances

### 2026-05-29

- **Refactor RxJS en `PrescriptionsService.searchByTerm`**:
  - Se elimino el flujo manual basado en `setTimeout`, `new Observable(...)` y cancelacion por `unsubscribe` manual.
  - Se reemplazo por un flujo declarativo con `timer(500)`, `takeUntil` y `switchMap`.
  - Se mantuvo el comportamiento funcional existente: minimo de 3 caracteres, debounce de 500ms y actualizacion de estado interno con `setPrescriptions`.
  - Este cambio cubre el objetivo incremental de reemplazar control async manual por operadores RxJS en un servicio critico, sin mezclar migracion standalone ni reorganizacion estructural.

- **Refactor RxJS en `CertificatesService.searchByTerm` y `PracticesService.searchByTerm`**:
  - Se elimino en ambos servicios el flujo manual con `setTimeout`, `new Observable(...)` y cancelacion manual por suscripcion.
  - Se adopto el mismo patron declarativo aplicado en prescripciones: `timer(500)` + `takeUntil` + `switchMap`.
  - Se preservo la paridad funcional existente en ambos casos:
    - validacion de longitud minima del termino de busqueda;
    - debounce de 500ms;
    - actualizacion de estado interno mediante `setCertificates` y `setPractices`.
  - Con esto queda cubierto de forma incremental el eje de refactor RxJS en los tres servicios principales usados por el listado profesional (`prescriptions`, `certificates`, `practices`).

- **Primer incremento de normalizacion de errores HTTP en interceptor**:
  - En `TokenInterceptorService` se introdujo una normalizacion central (`normalizeError`) para respuestas no-422, contemplando formatos mixtos (`mensaje`, `message`, string) y devolviendo un objeto consistente con `status`, `message` y `raw`.
  - Se preservo la excepcion de `422` devolviendo el `HttpErrorResponse` original para no romper feedback de validaciones de formularios.
  - Se mantuvo el flujo de refresh/token expirado (`406`) y de cierre de sesion (`417`), reemplazando en `417` el throw de string crudo por error normalizado.
  - Se ajustaron consumidores de auth que renderizan errores directos (`login`, `forgot`, `recovery-password`) para leer de forma segura `err.message` y mantener mensajes legibles tras la normalizacion.

- **Extraccion de normalizacion a utilidad compartida en `shared`**:
  - Se creo `src/app/shared/utils/http-error.util.ts` con `normalizeHttpError` y `getHttpErrorMessage` para centralizar el contrato de error de frontend.
  - `TokenInterceptorService` ahora reutiliza `normalizeHttpError`, evitando duplicar logica de parseo de mensajes.
  - Se migro consumo ad hoc en componentes auth y shared para usar la utilidad compartida:
    - `login`, `forgot`, `recovery-password`, `reset-password`;
    - `shared/components/edit-user-info`.
  - Se mantiene compatibilidad backward con errores string y formatos legacy (`mensaje`/`message`), manteniendo fallback consistente `Server Error`.

- **Extension transversal de consumidores prioritarios**:
  - Se migro `auth/components/confirm-update` para resolver mensajes de error con `getHttpErrorMessage`.
  - Se migro `pharmacists/components/prescription-list` en los flujos de dispensacion/cancelacion (local y Andes) para eliminar fallback ad hoc `error.message || ...`.
  - Se verifico que no queden parseos legacy (`err.error?.mensaje`, `error.message || ...`) en `src/app` fuera de la utilidad compartida.

- **Limpieza incremental de warnings Sass por `@import` deprecado**:
  - Se migraron a `@use` los dos archivos reportados por build:
    - `auth/components/confirm-update/confirm-update.component.sass`;
    - `professionals/components/stock/list/stock-list.component.sass`.
  - Se ajusto el acceso a variables compartidas con namespace (`vars.$x-small-devices`, `vars.$small-devices`).
  - `npm run build:dev` ya no reporta warnings de deprecacion Sass en esos archivos.
  - Se realizo barrido en `src/app` y `src` para detectar directivas `@import` restantes en archivos `.sass`, sin encontrar ocurrencias.
  - Con esto queda cerrado el eje puntual de limpieza de warnings Sass por `@import` en el frontend actual.

- **Primer incremento de adapters/models en dominio `certificate`**:
  - Se incorporo `CertificateAdapter` en `interfaces/certificate.ts`, siguiendo el contrato `Adapter<T>` existente.
  - El adapter centraliza el mapeo de DTO a modelo de frontend, normalizando campos de fecha (`startDate`, `createdAt`, `updatedAt`, `anulateDate`) y manteniendo la forma del modelo usada por UI.
  - `CertificatesService` ahora aplica el adapter en:
    - `getByUserId`;
    - `searchByTerm`;
    - `getById`.
  - Se mantiene paridad funcional y se evita mover estructura de carpetas en este incremento, enfocando solo en consolidacion de mapeo.

- **Segundo incremento de adapters/models en dominio `practice`**:
  - Se incorporo `PracticeAdapter` en `interfaces/practices.ts`, respetando `Adapter<T>`.
  - Se centralizo el mapeo de DTO a modelo `Practice`, normalizando campos de fecha (`date`, `createdAt`, `updatedAt`) sin cambiar contrato observable de UI.
  - `PracticesService` integra el adapter en las principales lecturas/escrituras de API:
    - `getPractices`, `getById`, `getFromDniAndDate`;
    - `getByUserId`, `searchByTerm`;
    - `newPractice`, `editPractice`, `completePractice`, `cancelPractice`.
  - Se mantiene enfoque incremental: no se movieron carpetas ni se mezclo con migracion standalone.

- **Tercer incremento de adapters/models en dominio `prescriptions`**:
  - Se incorporo `PrescriptionsAdapter` en `interfaces/prescriptions.ts`, bajo el contrato `Adapter<T>`.
  - El adapter normaliza principalmente campos de fecha (`date`, `createdAt`, `updatedAt`, `dispensedAt`) y mantiene el shape actual consumido por pantallas.
  - `PrescriptionsService` integra el adapter en lecturas y escrituras principales (`get*`, `searchByTerm`, `new/edit`, `dispense/cancelDispense`).
  - Para endpoints mixtos (local + Andes), se aplica adaptacion condicional: solo se mapean recetas locales y se preservan objetos Andes sin transformacion.
  - Se mantiene paridad funcional del flujo mixto existente, evitando cambios de routing o reorganizacion estructural en esta etapa.

- **Cuarto incremento de adapters/models en dominio `user`**:
  - Se incorporo `UserAdapter` en `interfaces/users.ts`, respetando el contrato `Adapter<T>`.
  - El adapter centraliza normalizacion de fechas de usuario (`authorizationExpiration`, `lastLogin`, `createdAt`, `updatedAt`) y mantiene la forma actual de modelo.
  - `UserService` integra el adapter en operaciones de lectura/escritura principales:
    - `getUserById`, `getUsers`, `searchUsers`;
    - `createUser`, `updateUser`, `updateUserOrganizaciones`.
  - Se mantiene enfoque incremental y de bajo riesgo: sin cambios de rutas, sin mudanzas de estructura y con paridad funcional de respuestas.

- **Quinto incremento de adapters/models en dominio `supply`**:
  - Se incorporo `SupplyAdapter` en `interfaces/supplies.ts`, alineado al contrato `Adapter<T>`.
  - El adapter normaliza shape y compatibilidad entre fuentes de datos de insumos/supplies (por ejemplo `type/tipo`, `requiresSpecification/requiereEspecificacion`, y nombre mostrado).
  - `SuppliesService` integra el adapter en:
    - `get`, `getSupplyByTerm`;
    - `newSupply`, `editSupply`.
  - Se tiparon internamente los arrays/sujetos del servicio con `Supplies[]` y se ordenaron nombres de helpers internos (`addSupply`, `updateSupply`) para reflejar mejor su responsabilidad.

- **Hallazgos de consolidacion (reutilizacion de adapters) y backlog sugerido**:
  - **`StockService`** (`services/stock.service.ts`): mantiene `Insumo` paralelo a `Supplies` y no reutiliza `SupplyAdapter` en `getAll/create/search`; es el candidato de mayor impacto para unificar mapping de insumos.
  - **`StockComponent`** (`professionals/components/stock/stock.component.ts`): contiene transformaciones inline repetidas (`nombre/insumo/supply/name/term`, `tipo` -> label, `requiereEspecificacion` -> `requiresSpecification`) que pueden delegarse a un mapper reutilizable basado en `SupplyAdapter`.
  - **`PatientsService`** (`services/patients.service.ts`): sigue con respuestas sin adaptacion (`getPatients`, `getPatientByDni`) pese a existir `PatientAdapter`; requiere definir criterio de mapeo para DTOs mixtos antes de aplicar.
  - **`SnomedSuppliesService`** (`services/snomedSupplies.service.ts`): usa `any[]` en `BehaviorSubject` y `get`; falta tipado/mapeo consistente para converger con `SnomedConcept` y/o `SupplyAdapter`.
  - **`AndesPrescriptionsService`** (`services/andesPrescription.service.ts`): replica flujos de `PrescriptionsService` sin capa adapter; conviene planificar adapter especifico de Andes para homogeneizar fechas/shape y reducir logica duplicada.
  - **Orden recomendado para siguientes incrementos**:
    1) consolidar `StockService` + `StockComponent` con `SupplyAdapter`;
    2) tipar y normalizar `SnomedSuppliesService`;
    3) definir estrategia de `PatientAdapter` para endpoints mixtos;
    4) evaluar `AndesPrescriptionsAdapter` como etapa separada.

- **Ejecucion del punto 1 (consolidacion `stock` + `supply`)**:
  - `StockService` ahora reutiliza `SupplyAdapter` para normalizar respuestas de `getAll`, `create` y `search`.
  - Se agrego normalizacion interna de `Insumo` para alinear claves heterogeneas de backend (`type/tipo`, `requiresSpecification/requiereEspecificacion`, `name/term/insumo/supply`, `code/codigo`, `status/estado`).
  - `StockComponent` redujo mapeos inline repetidos mediante helpers de normalizacion local (`displayName`, tipo y requerimiento de especificacion), delegando en campos ya normalizados por servicio.
  - El objetivo de este incremento fue bajar duplicacion de mapeo entre servicio y componente sin cambiar comportamiento funcional de la carga/seleccion de insumos.

- **Ejecucion del punto 2 (tipado/normalizacion de `SnomedSuppliesService`)**:
  - `SnomedSuppliesService` elimino `any[]` en `BehaviorSubject` y en el contrato de `get`, pasando a `SnomedConcept[]`.
  - Se incorporo normalizacion explicita de conceptos SNOMED (`conceptId`, `term`, `fsn`, `semanticTag`) para robustecer respuestas heterogeneas del endpoint.
  - La respuesta de `get` ahora actualiza estado interno tipado (`mySupplies`) y retorna valores ya normalizados.
  - `ProfessionalFormComponent` se ajusto para consumir tipado fuerte en `filteredSupplies` y en `onSupplySelected`, manteniendo paridad funcional del autocomplete.

- **Ejecucion del punto 3 (estrategia `PatientAdapter` para endpoints mixtos)**:
  - Se reforzo `PatientAdapter` para soportar formatos mixtos de backend sin romper consumidores actuales:
    - mapeo dual de claves (`apellido/lastName`, `nombre/firstName`, `sexo/sex`, `documento/dni`, `estado/status`, `fechaNacimiento/fechaNac`);
    - normalizacion de `sex` y parseo seguro de fechas.
  - `PatientsService` integra adapter en operaciones clave:
    - `getPatients`, `getPatientByDni`, `getPatientById`, `newPatient`.
  - Se reduce acoplamiento al formato raw del backend en componentes que consumen pacientes (patient-form, stock, listados) manteniendo paridad funcional.

- **Ejecucion del punto 4 (adapter incremental para Andes prescriptions)**:
  - Se incorporo `AndesPrescriptionsAdapter` en `interfaces/andesPrescriptions.ts`, manteniendo enfoque incremental y sin alterar contratos de UI.
  - El adapter normaliza fechas relevantes del dominio Andes (`fechaRegistro`, `fechaPrestacion`, `createdAt`, `updatedAt`) y nested dates de estados/dispensa/notificaciones/paciente.
  - `AndesPrescriptionsService` integra el adapter en sus operaciones principales (`get*`, `new/edit`, `dispense/cancel/suspend`) para reducir duplicacion de parseo y homogeneizar shape temporal.
  - Se mantuvo paridad funcional de flujos actuales; no se mezclo este cambio con cambios de rutas ni reorganizacion estructural.

- **Pasada adicional de limpieza tecnica (tipado debil en servicios de bajo riesgo)**:
  - `UserService` reemplazo `Observable<any>` en flujos de confirmacion/solicitud de actualizacion de usuario por una interfaz tipada local (`UserUpdateRequestResponse`).
  - `StockService` redujo tipado debil en su contrato publico:
    - `create` tipado con `Partial<Insumo>`;
    - `delete` tipado como `Observable<void>`;
    - campos internos de `Insumo` antes en `any` pasaron a formas tipadas (codigo/code, conceptos SNOMED y `createdBy`).
  - Se mantuvo el comportamiento funcional y el alcance acotado a cambios de tipos/contratos, sin alterar flujos de negocio.

- **Mini-pasada extra de limpieza tecnica (servicios + componentes)**:
  - En servicios:
    - `PatientsService`: `handleError` paso de `any` a `unknown` y `getPatientInsurance` tipa respuesta como `Observable<unknown>`.
    - `AndesPrescriptionsService`: `verificarRecetaExistente` reemplazo `any[]` por interfaz tipada local (`AndesVerificationResult[]`).
  - En componentes de bajo riesgo:
    - `stock.component`: se tiparon estructuras locales usadas en obra social y armado de insumos (`CoverageOption`, `SupplyCode`, `NewInsumoItem`), reduciendo casts `any`.
    - `professional-form.component`: se tiparon firmas puntuales de obra social y mapeo de insumos en submit para reducir `any` sin cambiar logica de formulario.
  - Esta pasada mantiene el objetivo de limpieza incremental: menos tipado debil, sin introducir cambios funcionales ni estructurales.

- **Mini-pasada focalizada en `stock` y `professional-form` (validators/UI)**:
  - Se eliminaron `any` residuales en ambos componentes para validadores y estructuras de UI.
  - `stock.component`:
    - validators tipados con interfaces de error dedicadas;
    - tipado explicito de estructuras de cobertura e insumo usadas en UI/payload;
    - se removio el cast `as any` en el envio de prescripcion.
  - `professional-form.component`:
    - validators tipados con interfaz de errores de formulario;
    - tipado de `devices` y `professionalData` para reducir dinamismo innecesario;
    - tipado de `newPrescription` conservando compatibilidad con la limpieza de `insumos` antes de persistir.
  - Se mantiene paridad funcional, con foco en robustez de tipos y sin cambios de comportamiento de negocio.

- **Pasada de tipado en servicios de lookup (`professionals` / `pharmacists`)**:
  - `ProfessionalsService`:
    - se tiparon parametros de consulta (`ProfessionalLookupParams`);
    - se tiparon respuestas de lookup Andes (`ProfessionalLookupResult[]`);
    - se tiparon profesiones autorizadas (`AuthorizedProfession[]`).
  - `PharmacistsService`:
    - se tiparon parametros de lookup (`PharmacistLookupParams`);
    - se tiparon respuestas (`PharmacistLookupResult[]`) usadas en validaciones de alta de farmacia.
  - Se ajustaron consumidores directos en componentes auth (`new-user`, `new-user-pharmacist`) para reutilizar estos tipos y evitar `any` innecesario.

- **Micro-pasada final en `SnomedSuppliesService` (tipado de entrada raw)**:
  - Se elimino `any` en normalizacion de conceptos SNOMED mediante interfaz local `RawSnomedConcept`.
  - `http.get` de `get(searchTerm)` ahora usa `RawSnomedConcept[]` en lugar de `any[]`.
  - Se mantiene la salida tipada a `SnomedConcept[]`, consolidando el contrato del servicio sin cambiar comportamiento.

- **Ejecucion del punto 1 de Deuda Tecnica Remanente (`token-interceptor`)**:
  - `TokenInterceptorService` elimino `any` en estado y contratos principales:
    - `refreshTokenSubject` paso de `BehaviorSubject<any>` a `BehaviorSubject<string | null>`;
    - `intercept`, `addToken` y `handle406Error` pasaron de `HttpRequest<any>` / `HttpEvent<any>` a `unknown`.
  - Se agrego tipo explicito para refresh (`RefreshTokenResponse`) y se aplico narrowing en el flujo de reintento (`filter((token): token is string => token !== null)`).
  - `errorHandler` paso de `HttpErrorResponse | any` a `HttpErrorResponse | unknown` con guard (`hasStatus422`) para mantener el comportamiento previo sin `any`.
  - Se removio import no utilizado de `environment` del interceptor.

- **Ejecucion del punto 2 de Deuda Tecnica Remanente (adapters `adapt(item: any)`)**:
  - Se actualizo el contrato base `Adapter<T>` en `src/app/interfaces/adapter.ts`:
    - `adapt(item: any)` -> `adapt(item: unknown)`;
    - se agrego helper compartido `asRecord(value: unknown): Record<string, unknown>` para narrowing incremental.
  - Se migro el set actual de adapters en `src/app/interfaces/*` a `adapt(item: unknown)`:
    - `certificate`, `practices`, `prescriptions`, `users`, `supplies`, `patients`, `professionals`, `pharmacists`, `andesPrescriptions`.
  - En adapters con parseo de fecha se reforzo `parseDate` con guard de tipo (`string | number | Date`) para evitar coerciones inseguras.
  - Se mantuvo paridad funcional: cambios acotados a tipado/narrowing y lectura segura de propiedades, sin modificar contratos externos de servicios ni componentes consumidores.

- **Ejecucion del punto 3 de Deuda Tecnica Remanente (`prescriptions-list`)**:
  - `src/app/professionals/components/prescriptions-list/prescriptions-list.component.ts` elimino `any` en eventos/paginacion/colecciones auxiliares:
    - `@Input() tipo` paso de `any` a `string | null`;
    - handlers de paginacion (`onPrescriptionsPageChange`, `onCertificatesPageChange`, `onPracticesPageChange`) ahora usan `PageEvent`.
  - Se tiparon auxiliares de carga de pacientes en recetas:
    - `patientDnis` paso a `Record<string, string>`;
    - `requests` y resultados de `forkJoin` pasaron a `Patient[]`/`Patient[][]` con `catchError(() => of([] as Patient[]))`.
  - Se redujo dinamismo en dialogos/expansion:
    - `openDialog` ahora usa union tipada (`DialogItem`);
    - `expandedElement` se tipa como union de filas posibles y se agrego guard (`isPrescriptionItem`) antes de comparar IDs de receta.
  - Se eliminaron casts `as any` en helpers de nombre/estado de receta, reemplazados por type guards y un cast acotado solo para compatibilidad de `status` en recetas Andes legacy.
  - Se mantiene comportamiento funcional, incluyendo soporte mixto local/Andes y paginacion existente.

- **Ejecucion de prioridad media (export CSV tipado en servicios)**:
  - `src/app/services/prescriptions.service.ts`:
    - `getCsv` paso de `dateFilter: Object` a `dateFilter: Record<string, unknown>`;
    - se elimino `as any` en `http.post(..., { responseType: 'blob' })`;
    - `tap` ahora tipa `csv` como `Blob`.
  - `src/app/services/practices.service.ts`:
    - mismo ajuste de contrato para `getCsv` (`Record<string, unknown>`);
    - eliminacion de `as any` en `responseType: 'blob'`;
    - `tap` tipado con `Blob`.
  - Se mantiene la logica existente de descarga (`saveAs`) y el formato de nombre de archivo, con cambio acotado a tipado/overloads de `HttpClient`.

- **Ejecucion de prioridad media (stock-list y supply-list tipados)**:
  - `src/app/professionals/components/stock/list/stock-list.component.ts`:
    - `MatTableDataSource<any>` -> `MatTableDataSource<StockListItem>`;
    - `expandedElement`, helpers (`getPatientName`, `getPatientDni`, `getDate`, `getStatus`, `isExpanded`, `toggleExpand`, `printStock`) y `subscribe` de carga tipados;
    - `onStockPageChange` ahora usa `PageEvent`.
  - `src/app/professionals/components/supply-list/supply-list.component.ts`:
    - `EventEmitter` de edicion tipado (`EventEmitter<Supplies>`);
    - `MatTableDataSource<any>` -> `MatTableDataSource<Supplies>`;
    - `expandedElement` y `searchSupplies` tipados con `Supplies[]`;
    - `openDialog` y handlers asociados tipados sin `any`.
  - Se conservaron los mismos flujos UI (filtro, paginacion, dialogos y acciones), limitando el cambio a tipado de datasource/eventos/data de dialog.

- **Ejecucion de prioridad media (`patient-form` tipado de CVA + OS + errores)**:
  - `src/app/shared/components/patient-form/patient-form.component.ts`:
    - `validDateValidator` ahora retorna `ValidationErrors | null` (sin `any`);
    - `@ViewChild('dni')` tipado como `ElementRef<HTMLInputElement>`;
    - se agregaron tipos dedicados para obra social y raw value de formulario (`ObraSocialOption`, `PatientOsFormValue`, `PatientFormRawValue`).
  - `ControlValueAccessor` tipado:
    - `writeValue(value: Partial<PatientFormRawValue> | null)`;
    - `registerOnChange(fn: (value: PatientFormRawValue) => void)`;
    - `registerOnTouched(fn: () => void)`;
    - `getFormValue(): PatientFormRawValue`.
  - Arrays/flujo de obra social tipados:
    - `obraSocial`, `obrasSociales`, `filteredObrasSociales` migrados a tipos concretos;
    - narrowing de respuestas `unknown` en `loadPatientOS` y `loadObrasSociales` con guard `isObraSocialOption`.
  - Propagacion de cambios al parent consolidada via `getRawFormValue()` tipado para evitar `getRawValue()` dinamico en puntos dispersos.
  - Se mantiene paridad funcional en autocompletado, selección de cobertura social, validación de fecha y callbacks del formulario.

- **Ejecucion de prioridad baja (`unified-printer` tipado auxiliar)**:
  - `src/app/shared/components/unified-printer/unified-printer.component.ts`:
    - se elimino import no usado (`Component`);
    - `getOrganizacionDireccion` paso de `any` a `unknown` con narrowing seguro para direccion string/objeto `{ valor }`;
    - se tiparon parametros de `addProfessionalSignature` (professional + stack auxiliar) sin `any`;
    - se extrajo helper `formatProfessionalEnrollment(...)` para centralizar el mapeo de `profesionGrado` y remover `map((g: any) => ...)` repetidos.
  - Se mantiene salida PDF y comportamiento existente; cambios acotados a robustez de tipos y reutilizacion de formato en firmas/matriculas.

- **Ejecucion de prioridad baja (`array.validators` sin `ValidatorFn | any`)**:
  - `src/app/utils/custome-validators/array.validators.ts`:
    - se reemplazaron retornos `ValidatorFn | any` por `ValidatorFn` en todos los validadores;
    - las funciones internas ahora retornan `ValidationErrors | null` y usan `AbstractControl` con guard `instanceof FormArray`.
  - Se incorporaron tipos auxiliares para errores y elementos (`MinLengthFilledError`, `FormArrayItem`) y se tiparon los accesos dinámicos de claves con narrowing seguro.
  - Se mantuvo la semántica original de validación (max/min/between/equals/key-exists) con cleanup de tipos y sin cambios funcionales de reglas.

- **Ejecucion de prioridad baja (`insurance.service` cleanup final)**:
  - `src/app/services/insurance.service.ts`:
    - `handleError` paso de `(error: any)` a `(_error: unknown)`;
    - se removieron imports no usados (`HttpHeaders`, `map`, `throwError`) para mantener el servicio limpio.
  - Se conserva comportamiento de fallback (`of(result as T)`) sin cambios funcionales.

- **Cierre de etapa - Inventario final de `any` en `src/app`**:
  - Resultado de barrido final (`rg -n "\bany\b" src/app --glob "*.ts" --stats`):
    - `85` matches en `22` archivos (`84` lineas efectivas, incluyendo comentarios legacy).
  - Remanente principal por riesgo/impacto:
    - **Alta**: `src/app/audit/components/user-create/user-create.component.ts` (concentracion mayor de `any` en alta/lookup/autocomplete/mapeos de profesiones).
    - **Alta**: `src/app/auth/services/auth.service.ts` (`http.*<any>`, payload JWT `any`, contratos de auth legacy).
    - **Media**: `src/app/pharmacists/components/prescription-list/prescription-list.component.ts` (datasource/filtros/seleccion con `any`).
    - **Media**: `src/app/professionals/components/stock/printer/stock-printer.component.ts` (payload/loops/mapeos de matricula con `any`).
    - **Media**: `src/app/professionals/supply.component.ts` y `src/app/professionals/components/certificate-form/certificate-form.component.ts` (estado/diálogos/validators con `any`).
    - **Baja**: utilidades y tipos legacy puntuales (`shared/utils/http-error.util.ts`, `shared/ngx-turnstile/*`, `shared/pipes/patient-name.pipe.ts`, `interfaces/organizaciones.ts`, `interfaces/andesPrescriptions.ts`, `interfaces/supplies.ts`, `services/andes-search.service.ts`, `services/roles.service.ts`, `profesionals/services/organizacion-form-session.service.ts`, `organizacion-dialog.component.ts`).
  - Observacion: `src/app/services/professionals.service.ts` conserva apariciones en lineas comentadas (no ejecutables), de prioridad baja para limpieza cosmetica.
  - Estado de cierre: se completaron todos los items del backlog incremental definido en esta etapa; el remanente queda explicitado para siguiente ciclo de refactor.

- **Post-cierre - Tanda 1 en `audit/user-create` (tipado incremental sin cambio funcional)**:
  - `src/app/audit/components/user-create/user-create.component.ts`:
    - se eliminaron `any` del componente en datos de Andes, eventos y mapeos de profesiones/matriculas;
    - `foundProfessionalData`/`foundPharmacyData` ahora usan tipos de `AndesSearchService` (`AndesProfessionalData`, `AndesPharmacyData`);
    - `onRoleSelectionChange` se tipa con `MatSelectChange`, y `onUsernameChange`/`onCuilChange` con `Event` + `HTMLInputElement`.
  - Se tiparon resultados de búsqueda con uniones explícitas (`CuilSearchResult`, `SearchErrorResult`) y guards (`isSearchErrorResult`, `isCuilSearchResult`) para mantener robustez en flujos `forkJoin`/`catchError`.
  - En armado de payload de alta se agregó contrato local (`CreateUserPayload`) y se eliminaron casts `(userData as any)` para `idAndes`/`profesionGrado`.
  - Se preserva el comportamiento existente de autocompletado Andes, validaciones de UI y creación de usuario; el cambio es acotado a tipado fuerte.

- **Ajuste de tipos de soporte en AndesSearchService**:
  - `src/app/services/andes-search.service.ts`:
    - `AndesProfessionalData` suma `_id?: string` para compatibilidad con payload mixto de backend.
    - `AndesPharmacyData` suma `telefono?: string` y `email?: string` usados por templates audit.
    - normalización de matrícula a string en `autocompleteProfessional` (`matriculaNumero?.toString()`).

- **Post-cierre - Tanda 2 en `auth.service` (contratos HTTP + claims JWT)**:
  - `src/app/auth/services/auth.service.ts`:
    - se eliminaron `any` en llamadas HTTP de auth (`jwt-login`, `login`, `logout`, `reset`, `recover`, `register`, `refresh`, `setValidationTokenAndNotify`) usando contratos tipados mínimos por endpoint;
    - se tipó el payload decodificado de JWT con `JwtPayload` (`usrn`, `sub`, `bsname`, `email`, `rl`) y `getDecodeJwt()` ahora retorna `JwtPayload | null`.
  - Se incorporaron interfaces de respuesta específicas para compatibilidad con consumidores existentes:
    - `ForgotPasswordResponse` (`status`, `msg`),
    - `ResetPasswordResponse` (`message`, `mensaje`),
    - `RegisterResponse` (`newUser.businessName`).
  - Se eliminó tipado dinámico en getters de sesión (`getLoggedUsername`, `getLoggedUserId`, `getLoggedBusinessName`, `getLoggedRole`) manteniendo fallback seguro cuando no hay token.
  - Se mantiene paridad funcional; el ajuste se enfocó en tipos y contratos sin alterar flujo de login/refresh/logout.

- **Post-cierre - Tanda 3 en `pharmacists/prescription-list` (tipado de datasource/filtros/seleccion)**:
  - `src/app/pharmacists/components/prescription-list/prescription-list.component.ts`:
    - `MatTableDataSource<any>` -> `MatTableDataSource<MixedPrescription>` (`Prescriptions | AndesPrescriptions`);
    - `expandedElement` y `selectedPatient` tipados con uniones explícitas;
    - eliminación de `any` en `filterPredicate` y `findSelectedPatient`, con helpers tipados para paciente/estado/fecha/medicamento.
  - Se añadieron guards y helpers para evitar acceso dinámico inseguro:
    - `isAndesPrescription`, `isAndesSelectedPatient`,
    - `getPatientDni`, `getPatientSex`, `getPrescriptionDate`, `getMedicationName`, `getPrescriptionStatusForFilter`.
  - Se ajustó template para evitar acceso directo a propiedades de unión:
    - `selectedPatient.lastName/apellido` y `dni/documento` pasan por getters tipados (`selectedPatientLastName`, `selectedPatientDocument`).
  - Se mantiene comportamiento funcional de filtros, selección de paciente, acciones de dispensa/impresión y renderizado mixto local+Andes.

- **Post-cierre - Tanda 4 en `stock-printer` (payload de impresión tipado)**:
  - `src/app/professionals/components/stock/printer/stock-printer.component.ts`:
    - se eliminaron `any` en `print`, `addPage`, loop de insumos y mapeos de firma/profesion;
    - se agregaron interfaces explícitas para el payload de impresión (`StockPrintData`, `StockPrinterPatient`, `StockPrinterSupplyItem`, `StockPrinterProfessional`).
  - Se extrajo helper `formatProfessionalEnrollment(...)` para centralizar el formato de matrícula/profesión y remover duplicación de mapeos inline.
  - Integración de tipos con consumidor directo:
    - `src/app/professionals/components/stock/list/stock-list.component.ts` importa `StockPrintData` y mantiene compatibilidad de runtime mediante cast de borde controlado al invocar `stockPrinter.print(...)`.
  - Se mantiene salida PDF y comportamiento funcional actual; cambio acotado a robustez de tipado.

- **Post-cierre - Tanda 5 en `supply.component` + `certificate-form` (estado UI y validators)**:
  - `src/app/professionals/supply.component.ts`:
    - `BehaviorSubject<any[]>`/`Observable<any[]>` migrados a `Supplies[]`;
    - estado UI tipado (`supply`, `isSubmit`, `isFormShown`, `isEdit`) con valores iniciales explícitos;
    - `openDialog` y `editSupply` tipados con `Supplies` en lugar de `any`.
  - `src/app/professionals/components/certificate-form/certificate-form.component.ts`:
    - `professionalData` paso a `string`;
    - `noWhitespaceValidator` ahora retorna mapa de error tipado (`CertificateFieldErrorMap | null`) en lugar de índice con `any`.
  - Se mantuvo paridad funcional: sin cambios de comportamiento en alta/edición de producto ni en flujo de creación/anulación de certificados.

- **Foto de inventario `any` actualizada (post-cierre completo)**:
  - Resultado de barrido actualizado (`rg -n "\bany\b" src/app --glob "*.ts" --stats`):
    - `34` matches en `16` archivos.
  - Variación respecto a foto anterior:
    - de `85` -> `34` matches (`-51`, reduccion aproximada del `60%`).
  - Remanente vigente por foco:
    - **Alta**: `src/app/shared/utils/http-error.util.ts` (contrato público todavía con `any` en `raw`/signatures), `src/app/professionals/services/organizacion-form-session.service.ts` (payloads `Observable<any>` y builders con `any`).
    - **Media**: `src/app/audit/components/user-list/users-list.component.ts`, `src/app/professionals/components/professional-dialog/professional-dialog.component.ts`, `src/app/services/prescriptions.service.ts` (`isAndesPrescription(item: any)`), `src/app/shared/ngx-turnstile/ngx-turnstile-value-accessor.directive.ts` (CVA con `any`).
    - **Baja / modelos legacy**: `interfaces/organizaciones.ts`, `interfaces/andesPrescriptions.ts`, `interfaces/supplies.ts`, `services/roles.service.ts`, `services/andes-search.service.ts`, `shared/pipes/patient-name.pipe.ts`, `shared/components/public-certificate/public-certificate.component.ts`, `profesionales/components/organizacion-dialog.component.ts`.
    - **Cosmético (comentado)**: `src/app/services/professionals.service.ts` mantiene apariciones solo en líneas comentadas.
  - Conclusión de etapa: se completó el bloque post-cierre planificado y queda una base acotada para una siguiente tanda enfocada en utilidades/transversales y capas legacy.

- **Etapa 01 - Paso 6 (`http-error.util` sin `any`)**:
  - `src/app/shared/utils/http-error.util.ts`:
    - `NormalizedHttpError.raw` migró de `any` a `unknown`;
    - `normalizeHttpError` y `getHttpErrorMessage` pasaron de `HttpErrorResponse | any` a `HttpErrorResponse | unknown`.
  - Se agregaron helpers de narrowing (`asRecord`, `readString`, `readNumber`) para lectura segura de `status/message/mensaje` sin indexación dinámica insegura.
  - Se mantiene compatibilidad funcional del parser de errores mixtos (`HttpErrorResponse`, string, objetos arbitrarios) con mismo fallback (`Server Error`).

- **Etapa 01 - Paso 7 (`organizacion-form-session` sin `Observable<any>`)**:
  - `src/app/professionals/services/organizacion-form-session.service.ts`:
    - `commitChanges()` pasó de `Observable<any>` a `Observable<SubOrganizacion[] | null>`;
    - se agregó tipo explícito para payload de servidor (`ServerSubOrganizacionPayload`) y `prepareOrganizacionForServer()` dejó de retornar `any`.
  - Se ajustó el flujo de commit para mapear respuesta de `updateUserOrganizaciones` a `SubOrganizacion[]`, actualizar snapshot/working state y devolver una copia clonada tipada.
  - Se mantiene paridad funcional de la sesión (initialize/mark/add/commit/rollback), con mayor precisión de contrato y sin cambios de comportamiento UI.

- **Etapa 01 - Paso 8 (`turnstile` CVA + `patient-name` pipe tipados)**:
  - `src/app/shared/ngx-turnstile/ngx-turnstile-value-accessor.directive.ts`:
    - `writeValue(value: any)` -> `writeValue(_value: string | null)`;
    - `registerOnChange(fn: any)` -> `registerOnChange(fn: (value: string) => void)`;
    - `registerOnTouched(fn: any)` -> `registerOnTouched(fn: () => void)`.
  - `src/app/shared/pipes/patient-name.pipe.ts`:
    - `transform(p: any)` -> `transform(p: unknown)`;
    - se agregó narrowing seguro (`isRecord`, `asString`) para lectura robusta de `firstName/nombre` y `nombreAutopercibido/alias`.
  - Se mantiene salida funcional del pipe y comportamiento de value accessor; cambio acotado a contratos de tipos.

- **Cierre final de `any` en `src/app`**:
  - Se ejecutó una pasada integral sobre remanentes y se eliminaron apariciones en componentes/servicios/interfaces legacy de bajo y medio riesgo, incluyendo:
    - `audit/users-list` (eventos tipados con `MatSelectChange`/`PageEvent`),
    - `professional-dialog` y `organizacion-dialog` (dialog data y type guards),
    - `prescriptions.service` (`isAndesPrescription` tipado sin `any`),
    - `roles.service` (index signature a `unknown`),
    - `andes-search.service` (`geoReferencia: unknown[]`),
    - `practices-form` (`professionalData` tipado),
    - `public-certificate` (parámetro tipado),
    - `interfaces/andesPrescriptions`, `interfaces/supplies`, `interfaces/organizaciones` (sustitución de `any` por `unknown`/`unknown[]`).
  - Se limpiaron además apariciones residuales en comentarios legacy de `professionals.service` para cerrar el inventario al 100%.
  - Resultado final de barrido (`rg -n "\bany\b" src/app --glob "*.ts" --stats`):
    - `0 matches` en `src/app`.
  - Validación final de cierre:
    - `npm run lint` OK
    - `npm run build:dev` OK

- **Etapa 02 - Paso 1 (`andes-search` declarativo + fallback reactivo en `patient-form`)**:
  - `src/app/services/andes-search.service.ts`:
    - se eliminó la construcción manual con `new Observable(...)` en `validatePharmacy`, `autocompleteProfessional` y `autocompletePharmacy`;
    - se migró a flujo declarativo con `pipe(map(...), catchError(...))` y fallback tipado con `of(false)`/`of({})`;
    - se corrigió el acceso al payload de profesionales para usar `response.data[0]`.
  - `src/app/shared/components/patient-form/patient-form.component.ts`:
    - se eliminó fallback manual `new Observable()` en `filteredObrasSociales`;
    - se reemplazó por fallback explícito y seguro `of([])`.
  - Se mantiene paridad funcional en búsquedas Andes/autocompletado y en el flujo reactivo del formulario de paciente.

- **Etapa 02 - Paso 2 (`listados` sin timers de sincronización y cleanup de subscripciones)**:
  - `src/app/audit/components/user-list/users-list.component.ts`:
    - se reemplazó `setTimeout` de scroll horizontal por `requestAnimationFrame` cancelable (`scheduleTableScrollToEnd`);
    - se agregó cleanup explícito del frame en `ngOnDestroy`.
  - `src/app/professionals/components/prescriptions-list/prescriptions-list.component.ts`:
    - se eliminaron `setTimeout(..., 100)` para setup de paginadores y se migró a `requestAnimationFrame` cancelable;
    - `forkJoin(requests)` ahora respeta ciclo de vida con `takeUntil(this.destroy$)`;
    - `afterClosed()` del dialog principal pasa a `take(1)` para cierre automático de suscripción.
  - `src/app/pharmacists/components/prescription-list/prescription-list.component.ts`:
    - se eliminó `setTimeout` en asignación de paginator;
    - `afterClosed()` de dialogs pasa a `take(1)` para evitar subscripciones abiertas.
  - Se mantiene comportamiento funcional en edición/listados y paginación, reduciendo sincronizaciones por timer y mejorando limpieza reactiva.

- **Etapa 02 - Paso 3 (piloto standalone en piezas shared)**:
  - `src/app/shared/pipes/patient-name.pipe.ts`:
    - se migró a `standalone: true` para habilitar uso híbrido (módulos + standalone) sin romper el consumo actual.
  - `src/app/shared/ngx-turnstile/ngx-turnstile-value-accessor.directive.ts`:
    - se migró a `standalone: true` manteniendo el contrato de `ControlValueAccessor` existente.
  - `src/app/shared/shared.module.ts`:
    - `PatientNamePipe` dejó de declararse y pasó a importarse como dependencia standalone, manteniéndose exportado para consumidores basados en `NgModule`.
  - `src/app/shared/ngx-turnstile/ngx-turnstile-forms.module.ts`:
    - la directiva standalone pasó de `declarations` a `imports`, preservando `exports` del módulo puente.
  - Ajustes de compatibilidad en módulos consumidores:
    - `src/app/audit/audit.module.ts` ahora importa `SharedModule` para exponer `patientName` en templates de auditoría;
    - se limpiaron providers redundantes de `PatientNamePipe` en módulos donde no eran necesarios.
  - Se mantuvo paridad funcional y convivencia con `NgModule`; no hubo cambios de rutas ni de bootstrap.

- **Etapa 03 - Paso 1 (eliminación de timers residuales en UI/auth)**:
  - `src/app/professionals/components/stock/list/stock-list.component.ts`:
    - se reemplazó `setTimeout(..., 100)` del setup de paginador por `requestAnimationFrame` cancelable (`scheduleStockPaginatorSetup`).
  - `src/app/professionals/components/organizaciones-selector/organizaciones-selector.component.ts`:
    - se eliminó `setTimeout` para fin de carga inicial y se migró a `requestAnimationFrame` cancelable;
    - se consolidó cleanup reactivo con `takeUntil(this.destroy$)` en `initialize`, `valueChanges` y `refresh`.
  - `src/app/auth/components/confirm-update/confirm-update.component.ts`, `src/app/auth/components/reset-password/reset-password.component.ts`, `src/app/auth/components/recovery-password/recovery-password.component.ts`:
    - se reemplazaron timers de redirección (`setTimeout`) por `timer(...).pipe(takeUntil(this.destroy$))`;
    - se agregó `OnDestroy` para cleanup explícito.
  - Resultado de control: barrido `setTimeout(` en `src/app` sin ocurrencias.

- **Etapa 03 - Paso 2 (cierre de suscripciones de diálogos)**:
  - Se migraron cierres de diálogo de `afterClosed().subscribe(...)` a `afterClosed().pipe(take(1)).subscribe(...)` en:
    - `src/app/professionals/supply.component.ts`
    - `src/app/professionals/components/supply-list/supply-list.component.ts`
    - `src/app/auth/components/login/login.component.ts`
    - `src/app/pharmacists/components/pharmacists-form/pharmacists-form.component.ts`
    - `src/app/audit/components/prescription-list/prescription-list.component.ts`
    - `src/app/audit/components/audit-form/audit-form.component.ts`
    - `src/app/professionals/components/organizaciones-selector/organizaciones-selector.component.ts`.
  - Resultado de control: barrido `afterClosed().subscribe` en `src/app` sin ocurrencias.

- **Etapa 03 - Paso 3 (consolidación de cleanup en componentes audit)**:
  - `src/app/audit/components/audit-form/audit-form.component.ts`:
    - se agregó `OnDestroy` con `destroy$` y `takeUntil` en `valueChanges`;
    - se eliminó la suscripción anidada manual y se migró a `switchMap` con cancelación reactiva automática.
  - `src/app/audit/components/prescription-list/prescription-list.component.ts`:
    - se agregó `OnDestroy` con `destroy$` y `takeUntil` en la suscripción a `prescriptions` (BehaviorSubject del servicio).
  - Resultado de control: todos los componentes audit implementan `OnDestroy` y cleanup de streams largos.

## Deuda Tecnica Remanente

### Prioridad Alta

- [x] `src/app/auth/token-interceptor.service.ts`: tipar `BehaviorSubject<any>`, `HttpRequest<any>` y `errorHandler(...|any)` con un contrato de error/request mas preciso.
- [x] `src/app/interfaces/*` (adapters): migrar `adapt(item: any)` a `unknown` + type guards incrementales para evitar propagacion de `any` en la capa de mapeo.
- [x] `src/app/professionals/components/prescriptions-list/prescriptions-list.component.ts`: reducir `any` en eventos/paginacion/colecciones auxiliares del listado principal.

### Prioridad Media

- [x] `src/app/services/prescriptions.service.ts` y `src/app/services/practices.service.ts`: reemplazar `as any` de export CSV por sobrecargas tipadas de `HttpClient` para `responseType: 'blob'`.
- [x] `src/app/professionals/components/stock/list/stock-list.component.ts` y `src/app/professionals/components/supply-list/supply-list.component.ts`: tipar datasource/eventos/dialog data.
- [x] `src/app/shared/components/patient-form/patient-form.component.ts`: tipar callbacks de `ControlValueAccessor`, arrays de obra social y validator error maps.

### Prioridad Baja

- [x] `src/app/shared/components/unified-printer/unified-printer.component.ts`: tipar parametros auxiliares (`professional`, `direccion`, mapeos internos) para quitar `any` de utilidades de impresion.
- [x] `src/app/utils/custome-validators/array.validators.ts`: reemplazar retornos `ValidatorFn | any` por tipos de error de validacion explicitos.
- [x] `src/app/services/insurance.service.ts` y piezas legacy similares: unificar `handleError(error: any)` a `unknown`.

### Etapa 01 - Cierre de Tipado Debil (`any`) [Completada]

- [x] `src/app/audit/components/user-create/user-create.component.ts`: tipado incremental de `found*Data`, eventos, requests y mapeos de profesiones/matriculas.
- [x] `src/app/auth/services/auth.service.ts`: reemplazar `http.<any>` y payload JWT `any` por contratos tipados (`tokens`, `jwt-login`, `refresh`, `claims`).
- [x] `src/app/pharmacists/components/prescription-list/prescription-list.component.ts`: tipar datasource/filtro/seleccion de paciente y helpers de búsqueda.
- [x] `src/app/professionals/components/stock/printer/stock-printer.component.ts`: tipar payload de impresión y mapeos auxiliares de firma/profesion.
- [x] `src/app/professionals/supply.component.ts` + `src/app/professionals/components/certificate-form/certificate-form.component.ts`: reducir `any` en estado de UI, dialog data y validators.

### Etapa 02 - RxJS Declarativo y Limpieza de Ciclo de Vida [Completada]

- [x] Paso 1 - `src/app/services/andes-search.service.ts`: reemplazar `new Observable(...)` manual por `pipe(map, catchError)` en flujos de validación/autocomplete.
- [x] Paso 1 - `src/app/shared/components/patient-form/patient-form.component.ts`: reemplazar fallback reactivo manual por `of([])`.
- [x] Paso 2 - `src/app/audit/components/user-list/users-list.component.ts`: limpiar `setTimeout` y fortalecer gestión de subscripciones/eventos UI.
- [x] Paso 2 - `src/app/professionals/components/prescriptions-list/prescriptions-list.component.ts` y `src/app/pharmacists/components/prescription-list/prescription-list.component.ts`: reducir timers de sincronización y homogeneizar cleanup de streams.
- [x] Paso 3 - Piloto standalone de bajo riesgo en piezas shared seleccionadas, manteniendo compatibilidad con `NgModule`.

### Etapa 03 - Estabilización Reactiva en Flujos de UI y Diálogos [Completada]

- [x] Paso 1 - eliminar timers residuales (`setTimeout`) en listados/UI auth y reemplazar por scheduling/reactividad cancelable.
- [x] Paso 2 - cerrar suscripciones de diálogos con `take(1)` para evitar subscripciones abiertas.
- [x] Paso 3 - consolidar cleanup de suscripciones largas en componentes audit y documentar cierre final de etapa.

- **Etapa 04 - Paso 1 (shared de bajo riesgo a standalone + lazy loading)**:
  - `src/app/shared/not-found/not-found.component.ts`: migrado a `standalone: true`; ruta `/404` ahora con `loadComponent` lazy.
  - `src/app/shared/layouts/footer/footer.component.ts`: migrado a `standalone: true` con `FlexLayoutModule` en imports.
  - `src/app/shared/layouts/header/header.component.ts`: migrado a `standalone: true` con dependencias Material/Router/FlexLayout en imports.
  - `src/app/shared/components/public-certificate/public-certificate.component.ts`: migrado a `standalone: true` + lazy loading vía `loadComponent`; imports incluyen `CommonModule`, `MatProgressSpinnerModule`, `MatIconModule`, `MatChipsModule`, `MatButtonModule`, `PatientNamePipe`.
  - `src/app/shared/components/public-practice/public-practice.component.ts`: migrado a `standalone: true` + lazy loading vía `loadComponent`; imports incluyen `CommonModule`, `PatientNamePipe`, Material modules.
  - `src/app/app-routing.module.ts`: se eliminó `routingComponents` y las rutas públicas se migraron a lazy loading con `loadComponent`.
  - `src/app/app.module.ts`: se limpiaron `HeaderComponent`, `FooterComponent` y `routingComponents` de `declarations`; ahora se importan como standalone en `imports`.
  - Resultado: 5 piezas shared menos en el bundle inicial, cargadas bajo demanda solo cuando se navega a las rutas públicas.
  - Validación: `npm run lint` OK, `npm run build:dev` OK.

### Etapa 04 - Migración Standalone de Shared + Feature Auth [Completada]

- [x] Paso 1 - shared de bajo riesgo: `not-found`, `header`, `footer`, `public-certificate`, `public-practice` a standalone + lazy loading.
- [x] Paso 2 - shared de riesgo medio: `edit-user-info`, `ngx-turnstile.component`, `patient-form` a standalone.
- [x] Paso 3 - feature completo `auth` a standalone con convivencia de módulos.

- **Etapa 04 - Paso 2 (shared de riesgo medio a standalone)**:
  - `src/app/shared/components/edit-user-info/edit-user-info.component.ts`: migrado a `standalone: true` con imports de Material/FlexLayout/ReactiveFormsModule; ruta `/editar-usuario` migrada a `loadComponent` lazy en `professionals-routing.module.ts` y `pharmacists-routing.module.ts`.
  - `src/app/shared/components/edit-user-info/edit-user-info.module.ts`: pasó de `declarations` a `imports` del componente standalone.
  - `src/app/shared/ngx-turnstile/ngx-turnstile.component.ts`: migrado a `standalone: true` (template vacío, sin imports de módulo necesarios).
  - `src/app/shared/ngx-turnstile/ngx-turnstile.module.ts`: pasó de `declarations` a `imports` del componente standalone.
  - `src/app/shared/components/patient-form/patient-form.component.ts`: migrado a `standalone: true` con imports de CommonModule, ReactiveFormsModule, FlexLayoutModule, Material (FormField/Input/Autocomplete/Select/Checkbox/Datepicker/NativeDate/ProgressSpinner) y `PatientNamePipe`.
  - `src/app/shared/shared.module.ts`: `PatientFormComponent` pasó de `declarations` a `imports`, preservando `exports`.
  - Resultado: 3 piezas shared adicionales migradas a standalone. `edit-user-info` ahora se carga bajo demanda.
  - Validación: `npm run lint` OK, `npm run build:dev` OK.

- **Etapa 04 - Paso 3 (feature auth completo a standalone + lazy loading)**:
  - 9 componentes auth migrados a `standalone: true` con imports explícitos por componente:
    - `auth.component`: shell con `<router-outlet>`, imports `RouterModule`.
    - `login.component`: imports `ReactiveFormsModule`, `FormsModule`, `RouterModule`, `FlexLayoutModule`, Material (Card/FormField/Input/Icon/Button/ProgressSpinner) y `MatDialogModule`.
    - `reset-password.component`: imports `ReactiveFormsModule`, `FormsModule`, `RouterModule`, `FlexLayoutModule`, Material (Card/Icon/FormField/Input/Button/ProgressSpinner).
    - `forgot.component`: imports `ReactiveFormsModule`, `FormsModule`, `RouterModule`, `FlexLayoutModule`, Material (Card/FormField/Input/Button/ProgressSpinner). Se eliminó dependencia muerta de `MatDialog`/`DialogComponent`.
    - `recovery-password.component`: imports similares a reset-password.
    - `dialog.component`: imports `MatDialogModule`, `MatIconModule`, `MatButtonModule`, `FlexLayoutModule`.
    - `new-user.component`: imports `ReactiveFormsModule`, `FormsModule`, `RouterModule`, `FlexLayoutModule`, Material (Card/Icon/FormField/Input/Select/Datepicker/NativeDate/Button/Tooltip/SnackBar), `NgxTurnstileModule` + `NgxTurnstileFormsModule`.
    - `new-user-pharmacist.component`: imports `ReactiveFormsModule`, `FormsModule`, `RouterModule`, `FlexLayoutModule`, Material (Card/Icon/FormField/Input/Datepicker/NativeDate/Button/SnackBar), `NgxTurnstileModule` + `NgxTurnstileFormsModule`.
    - `confirm-update.component`: imports `CommonModule`, `RouterModule`, Material (Card/ProgressSpinner/Icon/Button/SnackBar).
  - `auth-routing.module.ts`: todas las rutas migradas a `loadComponent` lazy loading; se eliminó `routingComponents` export y todos los imports de componentes.
  - `auth.module.ts`: simplificado a solo `AuthRoutingModule` en imports + `AuthService`/`httpInterceptorProvider` como providers; se eliminaron `declarations` y todos los imports de Material/Módulos auxiliares.
  - `login.component.spec.ts`, `auth.component.spec.ts`, `dialog.component.spec.ts`, `reset-password.component.spec.ts`: specs migrados de `declarations` a `imports` del componente standalone.
  - Resultado: 9 lazy chunks generados para auth (login ~43 kB, new-user ~30 kB, new-user-pharmacist ~22 kB, etc.), reduciendo bundle inicial de ~10.67 MB a ~10.53 MB.
  - Validación: `npm run lint` OK, `npm run build:dev` OK, `npm test -- --include='**/auth/**/*.spec.ts'` 10/10 SUCCESS.

### Corrección de colisiones de selectores (NG0912)

Se corrigieron 4 colisiones de `selector` entre componentes de audit y pharmacists que causaban el error `NG0912: Component ID generation collision detected` en Angular 20:

| Archivo | Selector anterior → nuevo | Motivo |
|---------|--------------------------|--------|
| `src/app/audit/audit.component.ts` | `app-pharmacists` → `app-audit` | Bug de copia, `AuditComponent` usaba selector de pharmacists |
| `src/app/pharmacists/components/andes-prescription-printer` | `app-prescription-printer` → `app-andes-prescription-printer` | Coincidía con `PrescriptionPrinterComponent` de audit |
| `src/app/audit/components/dialog-report` | `app-dialog-report` → `app-audit-dialog-report` | Coincidía con `DialogReportComponent` de pharmacists |
| `src/app/pharmacists/components/dialog-report` | `app-dialog-report` → `app-pharmacist-dialog-report` | Coincidía con `DialogReportComponent` de audit |
| `src/app/audit/components/audit-form` | `app-pharmacists-form` → `app-audit-form` | Bug de copia, `AuditFormComponent` usaba selector de pharmacists |

Ninguno de estos selectores se usaba en templates HTML, solo como identificadores internos de Angular. Cambio sin side effects.
Validación: `npm run lint` OK, `npm run build:dev` OK.

### Corrección de advertencias `[disabled]` en reactive forms

Se corrigieron 2 advertencias de Angular sobre uso de `[disabled]` en controles de reactive forms:

| Archivo | Cambio |
|---------|--------|
| `src/app/professionals/components/organizaciones-selector/organizaciones-selector.component.ts` | `@Input() disabled` migrado a setter que llama `organizacionControl.disable({emitEvent: false})`/`enable(...)`; se eliminó `[disabled]="disabled"` del template |
| `src/app/shared/components/patient-form/patient-form.component.html` | Se eliminó `[disabled]="!patientForm.get('os.nombre')?.value"` del input `numeroAfiliado`; el estado disabled ya se gestionaba programáticamente en la clase |

Validación: `npm run lint` OK, `npm run build:dev` OK.

- [x] Inventario de `any` en `src/app` reducido a cero (`0 matches`).
- [x] Refactor incremental validado en cada tanda con `lint` y `build:dev`.
- [x] Deuda técnica principal de tipado débil cerrada para el alcance actual de frontend.
