# Plan: Inicialización del Proyecto Cali Ayuda — v0.1 Foundation

## Resumen

Vamos a crear la base completa del proyecto usando **5 agentes en paralelo**, cada uno responsable de una capa diferente. Esto nos permite levantar todo el scaffolding de una vez.

## Agentes

### Agente 1: Project Scaffolding
**Responsabilidad:** Inicializar Next.js con App Router, TypeScript, Tailwind CSS, configurar ESLint, crear la estructura de carpetas base, `package.json`, `tsconfig.json`, `.env.example`, `.gitignore`.

Archivos clave:
- `package.json`
- `next.config.ts`
- `tsconfig.json`
- `tailwind.config.ts`
- `postcss.config.mjs`
- `.env.example`
- `.gitignore`
- `app/layout.tsx`
- `app/globals.css`

### Agente 2: Domain Types & Schemas
**Responsabilidad:** Crear los tipos TypeScript del dominio y los schemas Zod de validación, siguiendo exactamente el data model de ARCHITECTURE.md.

Archivos clave:
- `types/reports.ts`
- `types/matches.ts`
- `types/events.ts`
- `types/index.ts`
- `schemas/reports.ts`
- `schemas/matches.ts`
- `schemas/index.ts`
- `lib/constants.ts` (categorías, urgencias, etc.)

### Agente 3: Database Layer
**Responsabilidad:** Crear las migraciones de Supabase, la configuración del cliente, las funciones de DB, y la vista pública segura.

Archivos clave:
- `supabase/migrations/00001_initial_schema.sql`
- `lib/db/client.ts` (cliente Supabase server + browser)
- `lib/db/reports.ts` (queries de reports)
- `lib/db/types.ts` (tipos generados de DB)
- `lib/privacy/coordinates.ts` (transformación de coordenadas)

### Agente 4: API Routes
**Responsabilidad:** Crear los Route Handlers de Next.js para el CRUD de reports, confirmaciones, y la vista pública.

Archivos clave:
- `app/api/reports/route.ts` (GET, POST)
- `app/api/reports/[id]/route.ts` (GET, PATCH)
- `app/api/reports/[id]/confirm/route.ts` (POST)
- `app/api/reports/[id]/resolve/route.ts` (POST)
- `lib/dto/reports.ts` (transformación a DTO público)

### Agente 5: UI Foundation (Homepage + Layout)
**Responsabilidad:** Crear el layout global, el homepage con las acciones principales, los componentes base de shadcn/ui, y la estructura para los formularios de reporte.

Archivos clave:
- `app/page.tsx` (homepage)
- `app/layout.tsx` (layout global con metadata)
- `components/ui/button.tsx` (shadcn)
- `components/ui/card.tsx` (shadcn)
- `components/ui/badge.tsx` (shadcn)
- `components/ui/dialog.tsx` (shadcn)
- `lib/utils.ts` (cn helper)

## Orden de Ejecución

Todos los agentes se ejecutan en **paralelo**. No hay dependencia de bloqueo entre ellos porque:
- Agente 1 crea el scaffolding base (package.json, configs)
- Agentes 2-5 crean archivos en subcarpetas separadas
- Después de que todos terminen, yo integro y verifico que todo compila.

## Post-integración

Una vez los 5 agentes terminen, yo:
1. Verifico que no hay conflictos de archivos
2. Instalo dependencias (`npm install`)
3. Verifico que TypeScript compila
4. Hago un commit inicial

## Dependencias a instalar (Agente 1 las declara)

```json
{
  "next": "^15",
  "react": "^19",
  "react-dom": "^19",
  "typescript": "^5",
  "@supabase/supabase-js": "^2",
  "zod": "^3",
  "tailwindcss": "^4",
  "maplibre-gl": "^4",
  "lucide-react": "latest",
  "clsx": "^2",
  "tailwind-merge": "^2",
  "class-variance-authority": "^0.7"
}
```
