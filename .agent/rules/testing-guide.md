---
trigger: always_on
---

# Test Guide: Automatización de Capa de Testing

Este documento establece las reglas y directrices para la generación automática de pruebas en el proyecto **recetar-app**, utilizando **Jest**.

## Objetivo
Automatizar la creación y mantenimiento de una capa de testing robusta que permita la verificación continua de la aplicación, minimizando el esfuerzo manual y asegurando la coherencia con la base de código actual.

## Alcance y Tipos de Pruebas

### 1. Pruebas Unitarias (Unit Tests)
-   **Objetivo**: Validar la lógica y comportamiento aislado de los componentes de la interfaz de usuario.
-   **Ámbito**: Exclusivamente para **Componentes** (`*.component.ts`).
-   **Herramientas**: Jest.
-   **Extensión de Archivo**: `*.component.test.ts`.

### 2. Pruebas de Integración (Integration Tests)
-   **Prioridad**: Estos tests son **PRIORITARIOS**.
-   **Objetivo**: Validar la comunicación con la API externa y el flujo de datos.
-   **Ámbito**: Exclusivamente para **Servicios** (`*.service.ts`).
-   **Herramientas**: Jest.
-   **Extensión de Archivo**: `*.service.test.ts`.
-   **Dependencias**: API **recetar-api** en ejecución. Los tests se hacen sobre la **misma URL** (por ejemplo, `localhost:4000`).

## Flujo de Trabajo y Reglas de Generación

El asistente de IA seguirá el siguiente flujo al analizar archivos del proyecto:

### Migración y Detección de Archivos
Al examinar un componente o servicio:

1.  **Detección de `.spec.ts`**: Si existe un archivo `*.spec.ts` (Jasmine/Karma), **DEBE SER ELIMINADO**.
2.  **Verificación de `.test.ts`**: Se verificará la existencia del archivo `*.test.ts`.

#### Caso A: El archivo `.test.ts` NO existe
1.  **Acción**: Preguntar al usuario si desea crear el archivo de test correspondiente.
2.  **Análisis Profundo**: Antes de generar el test, **LEER Y COMPRENDER** la lógica del archivo fuente. Identificar:
    -   Métodos públicos y sus responsabilidades.
    -   Condiciones de borde (if/else, loops).
    -   Manejo de errores.
    -   Interacciones con dependencias (servicios, dialogs).
3.  **Contexto**: Informar que se trata de un componente nuevo o sin cobertura de pruebas (o que se eliminó el spec antiguo) y listar los casos de prueba propuestos basados en el análisis.

#### Caso B: El archivo `.test.ts` YA existe
1.  **Acción**: Analizar el contenido actual del archivo `.test.ts` y compararlo con la última versión del archivo fuente (`ts`).
2.  **Análisis de Cobertura**: Verificar si los métodos o lógicas críticas agregadas recientemente tienen cobertura en el test existente.
3.  **Decisión**: Preguntar al usuario si desea actualizar el test para reflejar los cambios recientes en el código fuente.
3.  **Preservación**: Intentar mantener correcciones manuales previas si son identificables.

## Manejo de Datos (Data Policy)

**REGLA CRÍTICA: NO USAR MOCKS PARA INTEGRACIÓN (SERVICIOS).**

-   **Fuente de Datos**: Los tests de integración (servicios) deben consumir datos reales obtenidos mediante la interacción directa con la API externa.
-   **Requisito**: La API **recetar-api** debe estar en ejecución. Estos tests de integración prioritaria se deben realizar sobre la **misma URL** de la API (por ejemplo, `localhost:4000`).
-   **Justificación**: Asegurar que los tests reflejen el estado real del sistema y la integridad de los datos sin intermediarios.

## Prohibiciones y Restricciones

**REGLA CRÍTICA: NO USAR MONGOOSE NI DEPENDENCIAS DE BASE DE DATOS EN EL FRONTEND.**

1.  **Intermediario Único**: El proyecto `recetar-app` (frontend) debe utilizar exclusivamente la API (`recetar-api`) como medio para interactuar con los datos.
2.  **Scripts de Soporte**: Cualquier script de utilidad para los tests (ej: sembrado de datos) debe realizarse mediante peticiones HTTP a la API, nunca mediante conexión directa a la base de datos (Mongoose, MongoDB Driver, etc.).
3.  **Mantenimiento**: No se deben instalar ni mantener dependencias relacionadas con la persistencia de datos en el `package.json` del frontend.

## Integridad del Código Fuente

**REGLA CRÍTICA: NO MODIFICAR EL CÓDIGO FUENTE (COMPONENTES/SERVICIOS) PARA HACER PASAR LOS TESTS.**

1.  **Preservación**: El código del componente o servicio bajo prueba debe considerarse inmutable durante la fase de generación de tests.
2.  **Manejo de Errores de Diseño/Lógica**:
    -   Si un test falla debido a un error en la lógica del componente o una dificultad en el diseño para ser testeado (ej: uso de `private`, dependencias no inyectadas, lógica en ciclo de vida incorrecto), **NO CORREGIR EL COMPONENTE AUTOMÁTICAMENTE**.
    -   **Acción Requerida**: Dejar el test fallando (o comentado) y agregar un comentario explicativo detallando:
        -   Por qué falla el test.
        -   Qué cambio específico se requiere en el componente/servicio para solucionar el problema (ej: "Mover lógica de `ngAfterContentInit` a `ngAfterViewInit` para garantizar disponibilidad de ViewChild").
3.  **Excepción**: Solo se permite modificar el código fuente si el usuario lo solicita explícitamente tras recibir la explicación del error.

## Estructura Esperada de los Tests (Jest)

### Tests Unitarios (Componentes)
-   **Configuración**: `TestBed.configureTestingModule({...})` declarando el componente, adaptado para Jest (si se usa `jest-preset-angular`).
-   **Sintaxis**: Uso de `describe`, `it`, `expect` (compatibles con Jasmine pero ejecutados por Jest).
-   **Snapshots**: Opcional, usar con precaución para evitar fragilidad en UI.

### Tests de Integración (Servicios)
-   **Configuración**: Inyección de `HttpClient` real.
-   **Ejecución**: Llamadas asíncronas a la API.
-   **Verificación**: `await expect(service.metodo()).resolves.toEqual(...)` o comprobaciones directas sobre la respuesta.

## Nomenclatura y Documentación

### Idioma
-   **Regla**: Todos los nombres de los tests (`describe`, `it`) y los comentarios deben estar en **ESPAÑOL**.
-   **Excepción**: Los nombres de las clases o métodos del código fuente se mantienen en inglés (ej: `PrescriptionListComponent`, `ngOnInit`).

### Documentación JSDoc
-   **Regla**: Cada caso de prueba (`it`) debe estar precedido por un bloque JSDoc `/** ... */` que explique brevemente qué valida el test.
-   **Formato**:
    ```typescript
    /**
     * Valida que el componente se inicie correctamente
     * y cargue los datos iniciales.
     */
    it('debe crearse correctamente', () => { ... });
    ```

## Ejecución Limpia
-   **Regla**: Al ejecutar tests, **NO** redireccionar la salida a archivos de texto persistentes en el directorio de trabajo (ej: `test_output.txt`).
-   **Manejo de Logs**: Utilizar la salida estándar del terminal o archivos temporales que sean eliminados inmediatamente después de su análisis.

## Comandos de Ejecución
-   Ejecutar todos los tests: `npm test` (o comando configurado para Jest)
-   Ejecutar test específico: `npx jest ruta/al/archivo.test.ts`
