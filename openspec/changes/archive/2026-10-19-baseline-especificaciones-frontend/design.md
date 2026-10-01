# Design

## Context

Ver `proposal.md` - Why. El frontend no tenía specs OpenSpec. Este change es documental: describe el comportamiento actual sin tocar código. El schema `spec-driven` exige `design.md` antes de `tasks.md`, aunque el change no implemente nada.

## Goals / Non-Goals

**Goals:**

- Dejar una línea base de comportamiento por capability en `openspec/specs/`, derivada del código real.
- Registrar las inconsistencias detectadas para tratarlas en changes posteriores.

**Non-Goals:**

- Corregir bugs, refactorizar ni cambiar comportamiento.
- Especificar los flujos legacy en retiro.

## Decisions

### Decisión 1: Un solo change baseline con siete capabilities

Se agrupa todo el estado actual en un change documental `baseline-especificaciones-frontend` con una spec por capability. Alternativa considerada: un change por capability; se descartó para no fragmentar la línea base inicial, manteniendo la revisión por tandas.

### Decisión 2: La fuente de verdad es el código actual

Las specs describen el comportamiento observable implementado, no el deseado. Cuando el código contradice el tracker o la intención aparente (por ejemplo, la redirección de auditores o el uso de `'biometric'` como PIN), se especifica el comportamiento real y se registra la inconsistencia como observación en `proposal.md`.

### Decisión 3: Alcance del frontend, dependencias solo referenciadas

Las specs cubren la UI y sus contratos observables. Los contratos REST y el comportamiento del backend viven en `recetar-api`; ANDES queda como dependencia externa. No se duplican requisitos del backend.

### Decisión 4: Sin `MODIFIED Requirements`

Todas las capabilities son nuevas para este repo, por lo que las specs usan solo `## ADDED Requirements` y `## Purpose`.

## Risks / Trade-offs

- [Vida útil corta de specs legacy] → Se excluyeron los flujos legacy para evitar especificar código en retiro.
- [Baseline que consolida bugs] → Cada inconsistencia se marca como observación explícita para que no se confunda con el comportamiento deseado.
- [Deriva si cambia el código] → Los próximos cambios deben expresarse como deltas sobre estas specs.
