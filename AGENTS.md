# AGENTS.md

## 1. Mission

You are working on Cali Ayuda, a community emergency coordination platform.

Your job is to implement the requested functionality while preserving:

- safety;
- privacy;
- correctness;
- deployment compatibility with Vercel;
- maintainability;
- accessibility;
- source provenance;
- deterministic behavior for critical workflows.

Read `ARCHITECTURE.md` before making architectural changes.

Do not silently override architectural constraints.

## 2. Core Rule

AI is not a source of truth for emergency information.

Never write code or UI that implies otherwise.

## 3. Safety Rules

The application must never:

- predict earthquakes;
- diagnose medical conditions;
- determine whether a building is structurally safe;
- issue evacuation orders;
- fabricate official alerts;
- claim a community report is official;
- present AI-generated information as verified fact;
- autonomously make irreversible emergency decisions.

When implementing AI features, treat model output as untrusted input.

## 4. Official vs Community Information

The distinction between these categories is mandatory:

- `unverified`
- `community_verified`
- `official`
- `rejected`

Never promote a report to `official` merely because:

- multiple users confirmed it;
- an LLM believes it is true;
- it resembles an official statement;
- it contains a government organization name.

Only explicitly trusted ingestion or moderation logic may set `official`.

## 5. Privacy

Do not expose exact residential coordinates by default.

Use:

- exact coordinates internally;
- privacy-safe coordinates publicly.

Never expose:

- service-role keys;
- private user data;
- unnecessary phone numbers;
- internal moderation metadata;
- hidden exact coordinates through public endpoints.

Public APIs must use privacy-safe projections or views.

## 6. Vercel Compatibility

The application must remain compatible with Vercel.

Avoid introducing infrastructure that requires:

- persistent local filesystem;
- long-running stateful processes;
- unmanaged background daemons;
- local Redis as a hard dependency;
- Python services unless explicitly approved;
- separate containers unless explicitly approved.

Prefer:

- Next.js Route Handlers;
- Server Actions;
- Vercel-compatible background mechanisms;
- Supabase;
- external managed services.

## 7. Next.js Rules

Use App Router.

Prefer Server Components by default.

Use Client Components only when required.

MapLibre must not execute during SSR.

Correct pattern:

```tsx
'use client';

import dynamic from 'next/dynamic';

const EmergencyMap = dynamic(
  () => import('./emergency-map'),
  { ssr: false }
);
```

Do not access `window`, `document`, geolocation APIs, or WebGL from Server Components.

## 8. TypeScript

Use strict TypeScript.

Do not introduce `any` unless there is a documented exceptional reason.

Prefer:

- discriminated unions;
- Zod schemas;
- typed database models;
- explicit return types for domain services.

Example:

```ts
type ReportType =
  | 'need'
  | 'offer'
  | 'service_point';
```

## 9. Validation

Every write path must validate input server-side.

Browser validation is not sufficient.

Use shared schemas where practical.

AI-produced objects must pass the same validation as user-generated objects.

Never persist raw LLM output directly.

## 10. Database

Supabase PostgreSQL is the primary database.

Database migrations are the source of truth for schema changes.

Do not manually depend on dashboard-only schema changes.

Store migrations under:

```text
supabase/migrations/
```

Use foreign keys and constraints where appropriate.

Prefer database-enforced invariants for critical state.

## 11. Row Level Security

Enable RLS where appropriate.

Never assume the UI is a security boundary.

Service-role access must remain server-side only.

Review RLS impact before exposing tables directly through Supabase clients.

## 12. Report Types

Do not collapse these entities conceptually:

- need;
- offer;
- service_point.

They may share a table but must remain explicit in the domain model.

## 13. Matching

Matching must be deterministic.

LLMs may assist with normalization, but the final match logic must use application/database rules.

Primary factors:

- compatible category;
- distance;
- capacity;
- availability;
- urgency;
- verification state;
- report freshness.

Do not implement:

```text
send reports to LLM
ask which ones match
persist its answer
```

as the primary matching mechanism.

## 14. AI Usage

AI may be used for:

- natural-language extraction;
- classification;
- summarization;
- follow-up questions;
- duplicate suggestions;
- place-name normalization;
- semantic normalization.

Use structured output.

Validate it.

Log failure safely.

Provide a non-AI fallback.

## 15. AI Failure Behavior

The application must remain functional if:

- AI provider is down;
- rate limits are exceeded;
- output is malformed;
- latency is excessive;
- model rejects the request.

Fallback behavior must allow manual report creation.

AI is an enhancement, not a hard dependency for v0.1.

## 16. Location

User GPS data is sensitive.

Do not log raw GPS coordinates unnecessarily.

Do not expose exact residential coordinates publicly.

Map display data must use public-safe coordinates.

Public service points may retain precise public coordinates.

## 17. Realtime

Realtime subscriptions must not leak sensitive fields.

Subscribe to public-safe views or payloads.

Avoid broadcasting:

- exact private coordinates;
- private contact details;
- internal moderation data.

## 18. Report Expiration

Reports must not remain active indefinitely.

Implement configurable expiration/reconfirmation.

Use states:

- active;
- stale;
- expired;
- resolved.

Do not permanently delete ordinary stale reports unless a retention policy explicitly requires it.

## 19. Verification

Community confirmation is evidence, not proof.

Display counts and status accurately.

Never label something simply `Verified` without context.

Prefer user-facing labels such as:

- Sin verificar.
- Confirmado por la comunidad.
- Fuente oficial.
- Rechazado.

## 20. Contact Information

Expose contact information only when operationally necessary.

Prefer mediated connection workflows later.

For MVP direct contact display, include explicit consent and minimize exposure.

Never index private contact data in public search APIs.

## 21. Logging

Do not log:

- access tokens;
- service-role keys;
- full phone numbers unless absolutely required;
- raw GPS coordinates unless needed for debugging and protected;
- complete AI prompts containing private information.

Use structured logs.

Redact sensitive fields.

## 22. Testing

Every material feature must include appropriate tests.

At minimum:

- schema validation;
- report creation;
- privacy coordinate transformation;
- report lifecycle;
- matching rules;
- verification transitions;
- public response projections.

AI integration tests must mock providers unless explicitly running an integration test suite.

## 23. Accessibility

Do not regress accessibility.

Map-only functionality is prohibited.

Every core map action must have a list or form equivalent.

Do not use color as the only indicator.

## 24. Mobile Performance

This is a mobile-first emergency application.

Avoid:

- oversized JS bundles;
- unnecessary libraries;
- decorative animation;
- large images;
- autoplay media.

Lazy-load the map when practical.

Prefer fast list rendering.

## 25. Dependency Policy

Before adding a dependency, determine whether the functionality already exists in:

- Next.js;
- TypeScript;
- Supabase;
- shadcn/ui;
- current project libraries.

Avoid unnecessary dependencies.

Do not introduce a framework solely to solve a small utility problem.

## 26. Code Organization

Domain logic belongs in `lib/`, not inside UI components.

Suggested boundaries:

```text
lib/
  ai/
  db/
  geo/
  matching/
  privacy/
  verification/
```

UI components should not contain database-specific business logic.

## 27. API Design

Use clear resource-oriented APIs.

Examples:

```text
POST /api/reports
GET  /api/reports
GET  /api/reports/:id
PATCH /api/reports/:id
POST /api/reports/:id/confirm
POST /api/reports/:id/resolve
GET  /api/matches
```

Do not expose internal database rows directly.

Return explicit DTOs.

## 28. Public DTOs

Public report responses must intentionally omit internal fields.

Example:

```ts
type PublicReport = {
  id: string;
  reportType: 'need' | 'offer' | 'service_point';
  category: string;
  title: string;
  description?: string;
  city: string;
  neighborhood?: string;
  publicLat?: number;
  publicLng?: number;
  status: string;
  verificationStatus: string;
  urgency: string;
  createdAt: string;
};
```

Do not serialize entire ORM/database objects to clients.

## 29. State Changes

Critical state changes must be explicit.

Avoid magic side effects.

Example:

```text
active -> matched -> in_progress -> resolved
```

Transitions should be implemented in domain services and validated.

## 30. Repository Hygiene

Before changing code:

1. Read the relevant file.
2. Check existing patterns.
3. Avoid duplicating functionality.
4. Keep diffs focused.
5. Update tests.
6. Update documentation if behavior changes.

Do not rewrite unrelated files.

## 31. Commits

Prefer focused commits.

Examples:

```text
feat(reports): add need and offer creation flow
feat(map): add privacy-safe report markers
feat(matching): add distance-based matching
fix(realtime): prevent private coordinates from leaking
```

## 32. Architectural Changes

If a request requires changing one of these, call it out explicitly:

- database provider;
- hosting model;
- framework;
- map engine;
- privacy model;
- report-type model;
- verification model;
- matching strategy;
- AI trust boundary.

Do not silently make those changes.

## 33. Security Review Checklist

Before considering a feature complete, verify:

- Are writes validated server-side?
- Can this leak exact coordinates?
- Can this leak contact information?
- Does RLS still protect data?
- Can a user spoof official status?
- Can AI output bypass validation?
- Can stale data appear current?
- Can an unauthenticated user perform privileged actions?
- Are secrets server-side?

## 34. Emergency UX Rule

Prefer clarity over cleverness.

A user under stress should understand the next action immediately.

Avoid jargon in public UI.

Use large, clear actions:

- Necesito ayuda.
- Puedo ayudar.
- Ver mapa.
- Ver lista.
- Marcar como resuelto.

## 35. Definition of Good Work

A change is good when it:

- solves the requested problem;
- preserves architecture;
- reduces risk;
- remains deployable on Vercel;
- keeps AI optional;
- protects private information;
- is understandable by the next developer or coding agent;
- includes tests where behavior matters.
