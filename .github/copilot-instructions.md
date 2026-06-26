# Copilot instructions

## Build, test, and lint commands

- Use npm from the repo root.
- `npm start` runs the app's local server entry (`server.js`).
- `npm run build` creates the production Angular build. `npm run build:dev` creates the development build used by the Heroku postbuild flow.
- `npm test` runs the Karma/Jasmine suite.
- Run a single spec file with `npm test -- --watch=false --include='**/path/to/file.spec.ts'`.
- `npm run e2e` runs the Protractor suite.
- `npm run lint` runs ESLint. `npm run lint:fix` applies autofixes.

## High-level architecture

- This repo is an Angular app with a small Node server wrapper. `src/main.ts` bootstraps `AppModule`, while `server.js` serves the built app from `dist/preinscriptions-control`.
- The front end is organized by role-based feature areas:
  - `auth/` for login, reset, and token lifecycle,
  - `professionals/` for prescription creation,
  - `pharmacists/` for dispensing flows,
  - `audit/` for review/auditing flows,
  - `shared/` for reusable UI, layout, pipes, and helpers.
- Runtime auth is centralized: `AuthService`, `APP_INITIALIZER`, and `TokenInterceptorService` work together so tokens are validated on startup and attached to HTTP requests automatically.
- Most domain access lives under `src/app/services/` and `src/app/interfaces/`. Features usually combine those shared services with adapters and reactive forms rather than embedding raw API calls in components.
- Environment-specific API endpoints and keys live under `src/environments/`, so endpoint changes should start there instead of scattered component edits.

## Key conventions

- Prefer the path aliases from `tsconfig.json` such as `@auth`, `@services`, `@interfaces`, and `@shared`.
- Feature modules follow a consistent Angular layout: `{feature}.module.ts`, `{feature}-routing.module.ts`, plus `components/`, `services/`, and `guards/` folders.
- The app is built around reactive forms, custom validators, and Material/Flex Layout. Reuse the existing validator and shared form patterns before adding one-off form logic.
- The custom validator directory name is intentionally misspelled as `src/app/utils/custome-validators/`; match the existing path instead of "fixing" imports opportunistically.
- Styling uses `.sass`, not `.scss`.
- Lint/style expectations are enforced and consistent: 4-space indentation, single quotes, semicolons, no casual `console.log`, and standard Angular suffix rules.
