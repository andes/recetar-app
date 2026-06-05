---
name: recetar-app-refactor
description: Usá esta skill al refactorizar código Angular de recetar-app siguiendo docs/refactor/recetar-app-refactor-contract.md. Aplica solo al frontend de recetar-app y excluye cambios en recetar-api salvo pedido explícito.
---

# Refactor De Recetar App

Usá esta skill cuando la tarea sea refactorizar `recetar-app` usando el contrato local `docs/refactor/recetar-app-refactor-contract.md`.

## Límites

- Esta skill aplica solo al frontend de `recetar-app`.
- El contrato local de refactor aplica solo a `recetar-app`; no usa ni depende de planes fuera del repo.
- No mezcles refactors de frontend y backend en el mismo cambio salvo que el usuario lo pida explícitamente.

## Fuente De Verdad

- Usá `docs/refactor/recetar-app-refactor-contract.md` como plan y contrato principal de refactor.
- Conciliá siempre ese contrato con el estado actual del repo antes de editar. El contrato marca dirección; la base de código es la fuente de verdad para los detalles de implementación.

## Hechos Actuales Del Repo

- La app usa Angular 20 pero todavía depende de `rxjs ~6.5.4` en `package.json`.
- La app sigue organizada alrededor de `NgModule`s como `src/app/app.module.ts`, `src/app/auth/auth.module.ts`, `src/app/professionals/professionals.module.ts`, `src/app/pharmacists/pharmacists.module.ts` y `src/app/audit/audit.module.ts`.
- No hay componentes `standalone: true` en `src/app` al momento de este documento.
- El arranque de auth depende de `APP_INITIALIZER` en `src/app/app.module.ts`, que ejecuta `servicesOnRun()` desde `src/app/auth/token-initializer.ts`.
- El comportamiento de requests autenticados está centralizado en `src/app/auth/token-interceptor.service.ts`; preferí hacer ahí los arreglos centrales antes que duplicar manejo de errores servicio por servicio.
- El patrón actual de adapter existe en `src/app/interfaces/adapter.ts` y lo usan `patients.ts`, `professionals.ts` y `pharmacists.ts`.
- `src/app/services/prescriptions.service.ts` contiene un flujo de búsqueda conocido con `setTimeout`, seguimiento manual de suscripciones y tipado `any` que debería refactorizarse de forma incremental.
- La carpeta `src/app/utils/custome-validators/` está mal escrita a propósito; no la renombres de forma oportunista.
- Los estilos de componentes usan `.sass`.
- Todos los iconos de Material Design deben usar `<mat-icon>` en lugar de `<span class="material-icons">` para mejor accesibilidad, tamaño consistente (`1.125rem`) e integración con Angular Material.

## Objetivos Del Refactor

- Reducir el acoplamiento entre UI, transporte y mapeo de datos.
- Avanzar hacia la estructura objetivo de frontend propuesta en el plan sin hacer una reescritura big-bang.
- Estandarizar el mapeo de models y DTOs mediante adapters.
- Centralizar el manejo de errores HTTP.
- Reemplazar flujos async manuales por operadores de RxJS.
- Mantener la app funcionando en cada paso.

## Consideraciones Clave Del Proceso

- Priorizá paridad funcional: cada refactor debe mantener comportamiento observable para usuario final.
- Reducí deuda por eje: acoplamiento, duplicación de transformación, manejo de errores ad hoc y flujos RxJS manuales.
- Mantené cambios pequeños y trazables por feature o preocupación transversal; evitá cambios masivos en una sola tarea.
- Preservá compatibilidad durante transiciones: módulos y standalone pueden convivir temporalmente.
- Si hay tensión entre contrato y código existente, manda el código; luego actualizá contrato si detectás desvío real.

## Principios Del Refactor

- Preferí cambios chicos y reversibles.
- No mezcles movimientos estructurales con cambios de comportamiento no relacionados.
- Mantené funcionando los aliases de path de TS existentes. Agregá aliases nuevos solo cuando el código movido los necesite.
- Reutilizá piezas de formularios compartidas y validadores existentes antes de crear nuevas.
- Mantené auth y el comportamiento de requests centralizados en interceptors y servicios core en lugar de duplicar lógica en servicios de features.
- Preservá las rutas públicas existentes salvo que la tarea incluya cambios de routing explícitamente.
- Conservá el bootstrap actual de auth (`APP_INITIALIZER`) salvo pedido explícito de rediseño.

## Orden Recomendado

1. Estabilizá la línea base antes de mover archivos.
2. Centralizá y normalizá el manejo de errores HTTP.
3. Refactorizá los servicios más cargados de RxJS.
4. Extendé los adapters y la organización de models.
5. Introducí límites de frontend más claros de forma incremental.
6. Migrá gradualmente a componentes standalone.

## Checklist De Ejecución

### 1. Línea Base

- Leé el feature module, route module, servicio y piezas compartidas afectadas antes de editar.
- Mantené los cambios acotados a una feature o a una preocupación transversal por vez.
- Si el refactor cambia imports de forma amplia, preferí aliases de path antes que paths relativos profundos.
- Si una tarea requiere varios ejes, dividila en etapas para facilitar rollback y revisión.

### 2. Refactor De Carpetas Y Límites

Estructura objetivo del plan:

```text
src/app/
├── core/
├── features/
├── shared/
├── models/
└── utils/
```

Usala como dirección, no como un movimiento big-bang obligatorio.

- Empezá moviendo preocupaciones tipo singleton hacia `core/`: coordinación de auth, interceptors, guards y futuros servicios de logger/error.
- Mantené juntas por feature las páginas y componentes específicos.
- Mové gradualmente las definiciones de forma de datos fuera del layout mixto de `interfaces/` hacia `models/entities`, `models/dto` y `models/adapters`.
- No reescribas todos los imports y carpetas en una sola pasada salvo que la tarea sea explícitamente una reorganización de todo el repo.
- No combines en el mismo cambio una mudanza estructural grande y un ajuste de lógica de negocio.

### 3. Adapters Y Models

- Preservá el contrato existente `Adapter<T>` y extendelo a los models de frontend que faltan.
- Preferí un adapter por familia de models.
- Mantené la lógica de transformación fuera de los componentes.
- Cuando toques el mapeo de respuestas de un servicio, usá `pipe(map(...))` con adapters en lugar de código de transformación inline.
- Cuando muevas archivos existentes desde `interfaces/`, separá entities, DTOs y adapters de forma incremental en lugar de renombrar todo de una sola vez.
- Antes de crear adapters nuevos, verificá si el servicio ya devuelve el tipo final para evitar capas redundantes.

Gaps prioritarios de adapters según el plan:

- Prescriptions
- Certificate
- Practice
- Supply
- User

### 4. HTTP Error Handling

- Preferí un enfoque centralizado basado en interceptors para errores de API.
- Usá `src/app/auth/token-interceptor.service.ts` como punto actual de integración salvo que la tarea cree explícitamente un error interceptor separado y lo conecte de forma central.
- Reemplazá parseos ad hoc como `mensaje`, `message` o ramificación basada en strings crudos por una única forma de error normalizada de cara a la aplicación cuando el contrato del backend lo permita.
- Preservá el comportamiento actual de refresh de auth mientras refactorizás el manejo de errores.
- Si un refactor toca el comportamiento de validación `422`, asegurate de que los formularios sigan recibiendo feedback de validación accionable.
- Mantener compatibilidad backward de errores es obligatorio mientras backend entregue formatos mixtos.

### 5. Refactors De RxJS

- Reemplazá `setTimeout` manual, `subscribe` manual y el bookkeeping manual de instancias de suscripción por operadores de RxJS.
- Preferí `Subject`/`BehaviorSubject` junto con `debounceTime`, `distinctUntilChanged`, `switchMap`, `catchError` y `takeUntil` según corresponda.
- Evitá crear instancias de `Observable` manualmente cuando los operadores resuelven el problema.
- Eliminá tipos `any` introducidos solo para seguir timeouts o suscripciones.
- Asegurá cancelación limpia de requests anteriores en búsquedas y autocompletes.

Objetivo concreto del repo:

- `src/app/services/prescriptions.service.ts#searchByTerm` debería dejar atrás el timeout y la cancelación manual para pasar a un flujo de búsqueda guiado por streams.

### 6. Migración A Standalone

- Migrá gradualmente, feature por feature.
- Preferí primero componentes compartidos y de bajo riesgo, y después `auth`, `audit`, `pharmacists` y `professionals`.
- No elimines `SharedModule` hasta que todos los consumidores que todavía lo necesiten estén migrados.
- Mantené estable el comportamiento de las rutas mientras convertís declarations/imports.
- Evitá migrar todos los componentes de una feature en un solo PR salvo pedido explícito.

### 7. Documentación Durante El Refactor

- Agregá comentarios cortos solo donde el refactor introduzca una estructura no obvia.
- Preferí nombres autoexplicativos antes que comentarios explicativos.
- Si durante el refactor se introduce una convención nueva, reflejala en la documentación del repo cuando se pida o cuando la tarea incluya actualización de documentación.

## Restricciones

- No renombres `custome-validators` a `custom-validators` como parte de trabajo de refactor no relacionado.
- No cambies archivos `.sass` a `.scss`.
- No cambies el comportamiento de `npm start`; sirve la app compilada a través de `server.js` y no es el servidor de desarrollo de Angular.
- No asumas que el contrato de errores del backend ya fue modernizado.
- No combines migración a standalone, reorganización de models y reescritura del contrato de errores en un único cambio grande sin verificar.
- No referencies documentación de refactor fuera del repo para decidir alcance o prioridades.

## Verificación

Ejecutá la verificación útil más chica que coincida con el alcance del refactor.

- `npm run lint`
- `npm test -- --watch=false --browsers=ChromeHeadless`
- Para cambios acotados, preferí una ejecución dirigida de Karma con `--include='**/path/to/file.spec.ts'` cuando el repo ya tenga cobertura en esa área.

## Tareas Típicas Que Deberían Activar Esta Skill

- Migrar una feature basada en módulos hacia componentes standalone.
- Reorganizar `interfaces/` en límites más claros entre models, DTOs y adapters.
- Refactorizar flujos de servicios que usan control async manual en lugar de operadores de RxJS.
- Introducir manejo centralizado de errores HTTP para la app Angular.
- Extender el patrón adapter a más models respaldados por API.
