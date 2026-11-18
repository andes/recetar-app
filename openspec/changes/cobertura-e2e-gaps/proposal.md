# Proposal

## Why

La suite E2E de Playwright quedó operativa sobre `refactor-mati` (91 escenarios, Chromium + Firefox), pero el relevamiento mostró gaps importantes frente a los specs del frontend: `public-documents` no tiene cobertura, el ciclo de sesión y la auditoría de usuarios están casi sin tests, y dispensación/perfil/documentos cubren sólo una parte de sus requisitos. Además, 8 escenarios se saltean por falta de flags/ambiente (RENAPER, PIN, organizaciones) y no hay cobertura mobile.

Como la suite es la red de seguridad de los flujos críticos del circuito de recetas, estos huecos dejan regresiones sin detectar justo en las áreas donde el frontend cambió más.

## What Changes

- Incorporar cobertura E2E para los requisitos sin tests de `public-documents` (acceso público, resolución de identificador, visualización de certificado y práctica).
- Cubrir el ciclo de sesión: restauración de sesión, refresh de token, logout, recuperación y cambio de contraseña, y registros de profesional/farmacia.
- Completar auditoría: alta, edición, roles y baja de usuarios (hoy sólo se lista).
- Completar dispensación: filtros, paginación, reemplazo de medicamento e impresión.
- Completar documentos (impresión) y perfil (cambio de contraseña, gestión de PIN y organizaciones).
- Agregar un project mobile de Playwright y escenarios de experiencia mobile en gestión de pacientes.
- Agregar escenarios específicos de rol `admin` (hoy sólo se prueba el login).
- Reducir skips sin infraestructura nueva: que los 3 escenarios de RENAPER que ya mockean o validan localmente corran siempre; dejar sólo 2 RENAPER reales, PIN y magistral por organización como `env-gated` visibles y reportados.
- Endurecer la estabilidad de la suite: datos de prueba portables, limpieza determinista y ejecución completa en Firefox.
- **No** cambia comportamiento de producto: el change agrega y ajusta tests, fixtures, configuración de Playwright y CI.

## Capabilities

### New Capabilities

Ninguna. El change no introduce comportamiento de producto ni modifica requisitos existentes; es trabajo de tooling y calidad de tests. Se marca `skip_specs: true` en el metadata del change.

### Modified Capabilities

Ninguna.

## Impact

- `recetar-app/e2e/`: nuevos specs, pages, fixtures y soporte de ambiente.
- `e2e/playwright.config.ts`: project mobile y configuración de ejecución.
- `.github/workflows/e2e.yml`: matriz de browsers, instalación y variables necesarias.
- `.env.e2e.example`: flags y datos de prueba documentados.
- Sin cambios en `src/` ni en contratos de `recetar-api`.
- Dependencias: Playwright, servicios locales (recetar-api, ANDES, vademécum) y flags/credenciales de RENAPER/PIN/organizaciones.
- Los bugs de producto detectados por la suite (por ejemplo `CERT-002`, `cantDias` como string) se tratan como follow-ups separados; no forman parte de este change de cobertura.
