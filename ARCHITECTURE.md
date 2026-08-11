# Cali Ayuda — Architecture

## 1. Purpose

Cali Ayuda is a community emergency coordination platform designed to connect people who need help with people or organizations that can provide it.

The initial use case is the August 2026 earthquake response in Cali and surrounding municipalities, but the architecture must remain generic enough to support future emergencies such as floods, fires, landslides, infrastructure outages, and other community crises.

The platform is not an emergency authority and must never present community-generated information as official information.

## 2. Product Principles

1. Mobile-first.
2. Extremely low friction.
3. Fast to deploy and operate on Vercel.
4. Community reports and official information must be clearly separated.
5. AI helps interpret, structure, classify, summarize, and correlate information.
6. AI must not be the source of truth for emergency facts.
7. Matching should be deterministic wherever possible.
8. Privacy takes precedence over map precision.
9. Old reports must expire automatically.
10. The system must remain useful even when AI functionality is unavailable.

## 3. MVP Scope

### Version 0.1

The first production version must support:

- Map view.
- List view.
- "Necesito ayuda" workflow.
- "Puedo ayudar" workflow.
- Service/help point reporting.
- GPS-based location capture.
- Manual neighborhood/address entry.
- Categories.
- Filtering.
- Report status.
- Community verification.
- Realtime report updates.
- Report expiration.
- Public privacy-safe coordinates.

### Version 0.2

Add:

- Natural-language report intake.
- AI classification.
- AI extraction of structured fields.
- AI-generated follow-up questions.
- Duplicate detection assistance.
- AI summaries.

### Version 0.3

Add:

- Need-to-offer matching.
- Distance calculation.
- Quantity/capacity matching.
- Availability checks.
- Match workflow.
- Notifications.

### Version 0.4

Add:

- WhatsApp integration.
- Official-source ingestion.
- Shelters.
- Hospitals.
- Road closures.
- Operational dashboard.
- Additional cities and emergency events.

## 4. Recommended Stack

| Layer | Technology |
|---|---|
| Hosting | Vercel |
| Framework | Next.js App Router |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Components | shadcn/ui |
| Mapping | MapLibre GL |
| Database | Supabase PostgreSQL |
| Realtime | Supabase Realtime |
| Authentication | Supabase Auth, when required |
| AI | Vercel AI SDK |
| Model Providers | OpenAI and/or Anthropic |
| File Storage | Supabase Storage or Vercel Blob |
| Source Control | GitHub |
| CI/CD | GitHub + Vercel |

## 5. High-Level Architecture

```text
                         USERS
                           |
              +------------+------------+
              |            |            |
              v            v            v
             Web          GPS       WhatsApp*
              |                         |
              +------------+------------+
                           |
                           v
                    NEXT.JS / VERCEL
                           |
          +----------------+----------------+
          |                |                |
          v                v                v
       Map/List        Report UI       AI Intake
          |                |                |
          +----------------+----------------+
                           |
                           v
                       SUPABASE
                 PostgreSQL + Realtime
                           |
             +-------------+-------------+
             |             |             |
             v             v             v
           Needs         Offers      Service Points
             |             |             |
             +-------> Matching <---------+
                           |
                           v
                     Notifications*
```

`*` Not required in v0.1.

## 6. Core Domain Model

The application must distinguish between three report types.

### NEED

A person or community requires something.

Examples:

- Water.
- Food.
- Medication.
- Transport.
- Shelter.
- Medical assistance.
- Tools.
- Rescue support.

### OFFER

A person, volunteer, business, or organization can provide something.

Examples:

- Drinking water.
- Vehicle transportation.
- Food.
- Temporary accommodation.
- Tools.
- Medical supplies.
- Volunteer labor.

### SERVICE_POINT

A persistent physical point providing a service.

Examples:

- Shelter.
- Hospital.
- Blood donation location.
- Collection center.
- Distribution point.
- Emergency support center.

These concepts must not be stored as an undifferentiated `puntos_ayuda` entity.

## 7. Initial Data Model

### reports

```sql
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    event_id UUID,

    report_type TEXT NOT NULL
      CHECK (report_type IN ('need', 'offer', 'service_point')),

    category TEXT NOT NULL,

    title TEXT NOT NULL,
    description TEXT,

    city TEXT NOT NULL DEFAULT 'Cali',
    neighborhood TEXT,
    address_text TEXT,

    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,

    public_lat DOUBLE PRECISION,
    public_lng DOUBLE PRECISION,

    contact_name TEXT,
    contact_phone TEXT,

    status TEXT NOT NULL DEFAULT 'active'
      CHECK (status IN (
        'active',
        'matched',
        'in_progress',
        'resolved',
        'stale',
        'expired',
        'rejected'
      )),

    verification_status TEXT NOT NULL DEFAULT 'unverified'
      CHECK (verification_status IN (
        'unverified',
        'community_verified',
        'official',
        'rejected'
      )),

    urgency TEXT NOT NULL DEFAULT 'medium'
      CHECK (urgency IN ('low', 'medium', 'high', 'critical')),

    quantity NUMERIC,
    quantity_unit TEXT,

    people_affected INTEGER,
    vulnerable_people INTEGER DEFAULT 0,

    confirmation_count INTEGER NOT NULL DEFAULT 0,

    expires_at TIMESTAMPTZ,

    source_type TEXT NOT NULL DEFAULT 'community'
      CHECK (source_type IN ('community', 'official', 'system')),

    source_url TEXT
);
```

### matches

```sql
CREATE TABLE matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    need_report_id UUID NOT NULL REFERENCES reports(id),
    offer_report_id UUID NOT NULL REFERENCES reports(id),

    distance_meters INTEGER,
    match_score NUMERIC,

    status TEXT NOT NULL DEFAULT 'proposed'
      CHECK (status IN (
        'proposed',
        'accepted',
        'in_progress',
        'completed',
        'cancelled',
        'rejected'
      ))
);
```

### report_confirmations

```sql
CREATE TABLE report_confirmations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    report_id UUID NOT NULL REFERENCES reports(id),
    actor_id UUID,
    confirmation_type TEXT NOT NULL
      CHECK (confirmation_type IN (
        'confirm',
        'deny',
        'resolved'
      ))
);
```

### emergency_events

```sql
CREATE TABLE emergency_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    event_type TEXT NOT NULL,
    city TEXT,
    region TEXT,
    country TEXT NOT NULL DEFAULT 'Colombia',

    status TEXT NOT NULL DEFAULT 'active'
      CHECK (status IN ('active', 'monitoring', 'closed'))
);
```

## 8. Location and Privacy

Exact residential coordinates must not automatically be published.

The system should maintain two coordinate sets when appropriate:

- `lat` / `lng`: exact internal coordinates.
- `public_lat` / `public_lng`: privacy-safe displayed coordinates.

For private residences, the public coordinate should be intentionally reduced in precision or displaced within a safe radius.

Exact coordinates may be shown only when:

- the reporter explicitly marks the location as a public service point;
- the location is already public;
- exact location is operationally necessary and privacy risk is acceptable.

Never expose a private person's precise address by default.

## 9. Map Architecture

Use MapLibre GL.

The map component must be client-only.

Recommended structure:

```text
app/
  page.tsx
components/
  emergency-map-client.tsx
  emergency-map.tsx
```

Example pattern:

```tsx
// emergency-map-client.tsx
'use client';

import dynamic from 'next/dynamic';

const EmergencyMap = dynamic(
  () => import('./emergency-map'),
  { ssr: false }
);

export function EmergencyMapClient() {
  return <EmergencyMap />;
}
```

The Server Component should render `EmergencyMapClient`, not dynamically import the map directly.

## 10. Map Semantics

Markers must distinguish report type and category.

Primary semantic distinction:

- Need.
- Offer.
- Service point.

Secondary distinction:

- Category.
- Urgency.
- Verification status.

Do not overload color with too many meanings.

Recommended UI:

- Marker shape/icon: report type.
- Marker color: category.
- Badge/ring/status indicator: verification or urgency.

## 11. Primary User Flows

### Need Help

1. User selects `Necesito ayuda`.
2. User provides natural language or structured form input.
3. User shares GPS or approximate location.
4. System validates required fields.
5. Report is stored.
6. Public-safe coordinates are generated.
7. Realtime map/list updates.
8. Matching may run if enabled.
9. Reporter periodically receives reconfirmation requests.
10. Report transitions to resolved, stale, or expired.

### Can Help

1. User selects `Puedo ayudar`.
2. User specifies resource/service.
3. User specifies quantity/capacity when applicable.
4. User shares location or service coverage.
5. Offer is stored.
6. Matching system searches nearby compatible needs.
7. User may accept a proposed connection.

### Service Point

1. User selects `Reportar punto de ayuda`.
2. User selects category.
3. User provides public location.
4. System stores operating details.
5. Service point appears on map/list.

## 12. Matching

Matching must not be delegated entirely to an LLM.

Use deterministic rules:

1. Compatible category.
2. Active status.
3. Geographic distance.
4. Quantity/capacity.
5. Availability.
6. Urgency.
7. Verification status.
8. Age of report.

AI may help normalize the semantic category, but SQL/application logic owns the final match.

Example conceptual score:

```text
match_score =
  category_match
  + distance_score
  + capacity_score
  + urgency_priority
  + verification_weight
  - staleness_penalty
```

A proposed match is not an automatic assignment.

## 13. Report Lifecycle

Recommended lifecycle:

```text
active
  |
  +--> matched
  |      |
  |      +--> in_progress
  |              |
  |              +--> resolved
  |
  +--> stale
          |
          +--> active
          |
          +--> expired
```

Critical reports should require more frequent reconfirmation.

Suggested defaults:

- Critical: 2 hours.
- High: 4 hours.
- Medium: 12 hours.
- Low: 24 hours.

These values must remain configurable.

## 14. Verification

Verification levels must remain explicit.

### Unverified

A community-generated report with no independent confirmation.

### Community Verified

A report confirmed by one or more independent users or moderators.

### Official

Information directly sourced from an authorized public institution or verified organization.

### Rejected

False, malicious, duplicate, invalid, or obsolete information.

Never promote a community report to `official`.

## 15. AI Responsibilities

AI may:

- classify report type;
- classify category;
- extract structured fields;
- summarize descriptions;
- identify missing fields;
- ask follow-up questions;
- flag potential duplicates;
- normalize place names;
- suggest urgency for human/system review;
- summarize operational patterns.

AI must not:

- invent emergency facts;
- predict earthquakes;
- diagnose medical conditions;
- determine structural safety;
- issue evacuation orders;
- classify a building as safe;
- fabricate official information;
- replace emergency services;
- make irreversible decisions without deterministic validation.

## 16. AI Intake Architecture

Conceptual flow:

```text
User Message
     |
     v
Structured Extraction
     |
     +--> report_type
     +--> category
     +--> location text
     +--> quantity
     +--> people affected
     +--> urgency suggestion
     |
     v
Schema Validation
     |
     v
Missing Field Detection
     |
     v
Follow-up Question
```

All AI output must pass schema validation before persistence.

## 17. Official Sources

Official information must retain provenance.

Every official record should contain:

- source institution;
- original source URL;
- publication timestamp when available;
- ingestion timestamp;
- raw source reference where feasible.

The UI must visually distinguish official and community information.

## 18. Realtime

Use Supabase Realtime for active report updates.

Initial MVP:

- new reports;
- status changes;
- resolution changes;
- verification changes.

Do not stream every internal field to every client.

Use a public-safe view or RPC for exposed data.

## 19. Security

Required protections:

- Row Level Security where appropriate.
- Server-side validation.
- Input length limits.
- Rate limiting.
- Abuse controls.
- Sanitization.
- No direct trust in browser-provided fields.
- No public database service-role credentials.
- No secrets in `NEXT_PUBLIC_*`.
- Contact information must not be exposed unnecessarily.
- Public read APIs should return privacy-safe fields only.

## 20. Authentication

Anonymous reporting may be permitted in v0.1.

However, anonymous reports should have lower verification trust.

Authentication can be introduced for:

- volunteers;
- moderators;
- organizations;
- official sources;
- high-risk actions;
- report ownership.

## 21. UI

Primary homepage:

```text
CALI AYUDA

[ Necesito ayuda ]

[ Puedo ayudar ]

127 necesidades activas
83 recursos disponibles
246 casos resueltos

[ Ver mapa ]
[ Ver lista ]
```

The interface must remain usable on low-end mobile devices.

Avoid unnecessary animation.

Dark mode can be the default, but light mode should remain available.

## 22. Accessibility

Minimum requirements:

- Semantic HTML.
- Keyboard navigation.
- High contrast.
- Accessible dialog focus handling.
- Meaning must not depend on color only.
- Touch targets suitable for mobile.
- Screen-reader labels for map/list controls.

## 23. Repository Structure

Recommended structure:

```text
cali-ayuda/
  AGENTS.md
  ARCHITECTURE.md
  README.md

  app/
    api/
    reports/
    map/
    page.tsx

  components/
    ui/
    map/
    reports/

  lib/
    ai/
    db/
    geo/
    matching/
    privacy/
    verification/

  types/
  schemas/
  tests/

  supabase/
    migrations/
    seed.sql
```

## 24. Environment Variables

Example:

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

AI_GATEWAY_API_KEY=

APP_BASE_URL=
```

Server secrets must never use the `NEXT_PUBLIC_` prefix.

## 25. Development Priorities

The implementation order should be:

1. Domain model.
2. Database migrations.
3. Public-safe database view.
4. Report creation API.
5. Need/help/service-point UI.
6. Map/list UI.
7. Realtime.
8. Verification.
9. Expiration.
10. AI intake.
11. Matching.
12. Notifications.
13. Official-source ingestion.

Do not implement later roadmap features before the v0.1 foundation is stable.

## 26. Definition of Done for v0.1

v0.1 is complete when:

- a user can create a need;
- a user can create an offer;
- a user can create a service point;
- reports appear on map and list;
- reports can be filtered;
- location can come from GPS or manual entry;
- exact private coordinates are not publicly exposed;
- reports have status and verification state;
- reports can be marked resolved;
- stale/expired behavior exists;
- realtime updates function;
- the application deploys successfully to Vercel;
- core flows have automated tests;
- no AI dependency is required for baseline operation.
