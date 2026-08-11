# Cali Ayuda 🆘

Plataforma comunitaria de coordinación de emergencias para Cali, Colombia.

Conecta personas que necesitan ayuda con personas y organizaciones que pueden brindarla durante emergencias como el terremoto de agosto 2026.

## 🚀 Inicio Rápido

### Requisitos

- Node.js 18+
- npm 9+
- Cuenta de [Supabase](https://supabase.com) (plan gratuito suficiente)

### Instalación

```bash
git clone <repo-url>
cd cali-ayuda
npm install
```

### Configuración de Supabase

1. Crea un proyecto nuevo en [app.supabase.com](https://app.supabase.com)
2. Ejecuta la migración inicial:
   - Ve a **SQL Editor** en el dashboard de Supabase
   - Copia y ejecuta el contenido de `supabase/migrations/00001_initial_schema.sql`
3. Copia el archivo de ejemplo de variables de entorno:

```bash
cp .env.example .env.local
```

4. Completa las variables en `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
CRON_SECRET=un-secreto-aleatorio
```

Las claves se encuentran en **Settings → API** en tu proyecto de Supabase.

### Desarrollo

```bash
npm run dev          # Servidor de desarrollo en http://localhost:3000
npm run build        # Build de producción
npm run lint         # Linting con ESLint
npm run type-check   # Verificación de tipos TypeScript
npm test             # Ejecutar tests con Vitest
npm run test:watch   # Tests en modo watch
```

## 📋 Funcionalidades

### MVP (actual)

- **Reportar necesidades** — Agua, alimentos, medicamentos, albergue, rescate, etc.
- **Ofrecer ayuda** — Recursos, transporte, voluntariado, alojamiento
- **Puntos de servicio** — Albergues, centros de acopio, hospitales
- **Mapa interactivo** — Visualización georreferenciada con MapLibre GL
- **Lista con filtros** — Tipo, categoría, urgencia
- **Verificación comunitaria** — Confirmar, negar, marcar como resuelto
- **Actualizaciones en tiempo real** — Via Supabase Realtime
- **Expiración automática** — Reports pasan a stale/expired según urgencia
- **Privacidad** — Coordenadas exactas nunca se exponen públicamente (±150m)
- **Estadísticas en vivo** — Necesidades, ofertas y casos resueltos

### Arquitectura

| Capa | Tecnología |
|------|------------|
| Framework | Next.js 15 (App Router) |
| Lenguaje | TypeScript (strict) |
| Estilos | Tailwind CSS v4 |
| Componentes | shadcn/ui style (CVA + clsx + tailwind-merge) |
| Base de datos | Supabase PostgreSQL + RLS |
| Tiempo real | Supabase Realtime |
| Mapa | MapLibre GL |
| Validación | Zod |
| Tests | Vitest + Testing Library |
| Deploy | Vercel |

## 🗺️ Estructura del Proyecto

```
cali-ayuda/
├── app/
│   ├── api/
│   │   ├── cron/expire-reports/  # Cron job de expiración
│   │   ├── reports/              # CRUD de reportes
│   │   └── stats/                # Estadísticas
│   ├── map/                      # Página del mapa
│   ├── reports/
│   │   ├── [id]/                 # Detalle de reporte
│   │   └── new/                  # Formulario de creación
│   ├── layout.tsx
│   └── page.tsx                  # Homepage
├── components/
│   ├── home/                     # Stats display
│   ├── layout/                   # Navbar, Footer
│   ├── map/                      # MapLibre components
│   ├── reports/                  # Cards, filters, form
│   └── ui/                       # Primitivos (button, card, badge, etc.)
├── hooks/                        # useRealtimeReports
├── lib/
│   ├── db/                       # Supabase client & queries
│   ├── privacy/                  # Coordinate displacement
│   ├── constants.ts
│   └── format.ts                 # Spanish formatting utilities
├── schemas/                      # Zod validation schemas
├── supabase/
│   └── migrations/               # SQL schema
├── tests/                        # Vitest test suite
├── types/                        # TypeScript domain types
└── vercel.json                   # Cron configuration
```

## 🔒 Seguridad y Privacidad

- **Row Level Security (RLS)** habilitado en todas las tablas
- **Validación server-side** con Zod en todos los endpoints
- **Coordenadas privadas** nunca expuestas — DTOs públicos solo contienen `publicLat`/`publicLng`
- **Sin secretos en NEXT_PUBLIC_** — solo URL y anon key son públicos
- **Información de contacto** nunca incluida en respuestas públicas
- **Disclaimers claros** — La plataforma no constituye información oficial

## 🚀 Deploy en Vercel

1. Conecta el repositorio en [vercel.com](https://vercel.com)
2. Configura las variables de entorno (mismas que `.env.local`)
3. Deploy automático en cada push a `main`
4. El cron job de expiración se activa automáticamente (cada 15 min)

## 📝 Tipos de Reporte

| Tipo | Descripción | Ejemplo |
|------|-------------|---------|
| **Necesidad** | Una persona o comunidad requiere algo | Agua, medicamentos, rescate |
| **Oferta** | Alguien puede proveer un recurso | Transporte, alojamiento, alimentos |
| **Punto de servicio** | Ubicación física que presta un servicio | Albergue, centro de acopio |

## ⚡ Ciclo de Vida

```
active → stale → expired
   ↓
matched → in_progress → resolved
```

- **Crítica**: expira en 2h
- **Alta**: expira en 4h
- **Media**: expira en 12h
- **Baja**: expira en 24h

---

**⚠️ Importante:** Esta es una plataforma comunitaria. La información publicada proviene de la comunidad y NO constituye información oficial de autoridades de emergencia.
