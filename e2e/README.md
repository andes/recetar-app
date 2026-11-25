# E2E con Playwright

Suite de integración del frontend de RecetAR. Corre contra la app Angular y la API reales,
con datos de prueba descartables y limpieza por API.

## Requisitos

- Node `24.x`.
- App Angular en `http://localhost:4200`.
- API en `http://localhost:4000/api`.
- ANDES disponible (para pacientes y profesionales).
- Vademecum disponible en `http://localhost:4001` (tests de medicamentos; requiere `npm run seed` en `vademecum-ms`).
- `.env.e2e` completo (copiar de `.env.e2e.example`).
- Navegadores instalados: `npx playwright install chromium firefox`.

## Preparación

```bash
cd recetar-app
npm install
cp .env.e2e.example .env.e2e
# completar usuarios y flags en .env.e2e
npx playwright install chromium firefox
npm run e2e:typecheck
```

`.env.e2e` está gitignoreado. No commitear credenciales.

## Comandos

```bash
npm run e2e                # suite desktop (Chromium + Firefox)
npm run e2e -- --project=chromium
npm run e2e -- --project=firefox
npm run e2e -- --project=mobile-chrome
npm run e2e:headed         # navegador visible
npm run e2e:ui             # Playwright UI
npm run e2e -- --grep "REC-003"
npm run e2e:report         # abrir el último reporte HTML
npm run e2e:typecheck      # tsc del proyecto e2e
```

Para levantar la app desde Playwright: `E2E_START_APP=1`. La API se levanta aparte.

## Roles y variables

| Variable | Uso |
|---|---|
| `E2E_USER_PROFESSIONAL` / `E2E_PASS_PROFESSIONAL` | profesional que emite recetas |
| `E2E_PROFESSIONAL_PIN` | PIN correcto del profesional, **sólo si tiene PIN activo** |
| `E2E_USER_PHARMACIST` / `E2E_PASS_PHARMACIST` | farmacéutico para dispensar |
| `E2E_USER_AUDITOR` / `E2E_PASS_AUDITOR` | auditoría de recetas y usuarios |
| `E2E_USER_ADMIN` / `E2E_PASS_ADMIN` | CRUD de usuarios |
| `E2E_USER_PIN` / `E2E_PASS_PIN` | usuario con PIN activo para `REC-020` |
| `E2E_PIN_REQUIRED=1` | habilita el describe de PIN |
| `E2E_PIN_VALUE` / `E2E_WRONG_PIN_VALUE` | PIN correcto/incorrecto del caso PIN |
| `E2E_PATIENT_DNI` / `E2E_PATIENT_SEX` | paciente base de la suite |
| `E2E_PHARMACY_CUIL` | CUIL de la farmacia para auditoría |
| `E2E_DEFAULT_AMBITO` | `publico` o `privado` |
| `E2E_RENAPER_ENABLED=1` | habilita los 2 tests que usan RENAPER real |
| `E2E_RENAPER_POSITIVE_DNI/SEX`, `E2E_RENAPER_NEGATIVE_DNI/SEX` | datos RENAPER |
| `E2E_ORG_PUBLIC_NAME` / `E2E_ORG_PRIVATE_NAME` | organizaciones asociadas al profesional |
| `E2E_SKIP_MUTATIONS=1` | no ejecuta tests que crean/modifican datos |
| `E2E_STRICT_ENV=1` | falla el preflight si faltan roles/servicios base |
| `E2E_SMOKE=1` | ejecuta el smoke de fixtures descartables |
| `E2E_START_APP=1` | Playwright levanta `ng serve` |
| `E2E_BASE_URL` / `E2E_API_URL` | URLs de la app y la API |
| `E2E_PATIENT_TEMP_FIRST_NAME` / `E2E_PATIENT_TEMP_LAST_NAME` / `E2E_PATIENT_TEMP_SEX` | paciente descartable |
| `E2E_CERTIFICATE_TEXT` | texto del certificado descartable |
| `E2E_CERTIFICATE_SECRET_KEY` | clave de cifrado de IDs públicos (vacío = clave local) |
| `E2E_PRACTICE_NAME` / `E2E_PRACTICE_DIAGNOSTIC` | práctica descartable |
| `E2E_DIAGNOSTIC` / `E2E_INDICATION` | diagnóstico e indicación de recetas |
| `E2E_MEDICATION_QUERY` / `E2E_MEDICATION_QUERY_ALT` / `E2E_MEDICATION_QUERY_EMPTY` | términos de búsqueda de medicamentos |
| `E2E_RENAPER_POSITIVE_SEX` / `E2E_RENAPER_NEGATIVE_SEX` | sexo de los DNIs RENAPER |

## Tests env-gated

El preflight imprime qué falta y cuántos tests quedan salteados:

- **RENAPER real:** 2 tests (`PAT-012`, `PAC-010`). Los otros 3 de RENAPER corren siempre porque mockean la validación o prueban datos faltantes.
- **PIN:** 1 test (`REC-020`), requiere `E2E_USER_PIN`/`E2E_PASS_PIN` y `E2E_PIN_REQUIRED=1`.
- **Organizaciones:** 2 tests (`MED-010`, `MED-011`), requieren una organización privada y una pública asociadas al profesional.

Si la app o la API no responden, el preflight **falla siempre** y la suite no se ejecuta. Con `E2E_STRICT_ENV=1` además falla si falta un rol base (professional/pharmacist/auditor/admin). RENAPER, PIN y organizaciones siguen siendo opcionales y visibles.

## Datos y limpieza

- La suite crea pacientes, recetas, certificados, prácticas y usuarios descartables con `uniqueSuffix()`.
- `ApiClient` trackea cada recurso y lo elimina en `cleanup()` al terminar el test.
- No se depende de filas mutables del ambiente: los tests de password/PIN usan usuarios descartables.
- `E2E_SMOKE=1` valida el ciclo crear/leer/eliminar de un usuario descartable.

## Cobertura

La matriz requisito -> tests vive en [`COVERAGE.md`](./COVERAGE.md).

## Limitaciones conocidas

- Los tests de medicamentos necesitan vademecum con datos (`npm run seed`).
- `CERT-002` falla por un bug de producto: `cantDias` llega como string a la API.
- `AUTH-002` está marcado como fallo esperado hasta corregir el render del error de login.
- No hay cobertura de accesibilidad ni visual regression (follow-up).
