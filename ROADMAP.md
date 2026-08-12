# Cali Ayuda — Roadmap

## v0.1 — MVP Foundation

### ✅ Completado

- [x] Mapa (MapLibre GL con OpenStreetMap tiles)
- [x] Lista de reportes con filtros
- [x] Flujo "Necesito ayuda"
- [x] Flujo "Puedo ayudar"
- [x] Reporte de punto de servicio
- [x] Captura GPS + selección manual en mapa (LocationPicker)
- [x] Entrada manual de barrio/dirección
- [x] Categorías (15 categorías definidas)
- [x] Filtrado por tipo, categoría, urgencia
- [x] Status de reportes (active, matched, in_progress, resolved, stale, expired, rejected)
- [x] Confirmación comunitaria (confirm, deny, resolved)
- [x] Coordenadas públicas con privacidad (~150m displacement)
- [x] Expiración automática de reportes (cron)
- [x] Resolver reporte desde UI (botón "Ya se resolvió" en detalle)

### ❌ Pendiente

- [ ] Realtime updates (Supabase Realtime — reportes nuevos sin refresh)
- [x] Status "stale" automático (transición antes de expirar, con reconfirmación)
- [ ] Tests automatizados (core flows)
- [ ] Light mode (actualmente solo dark)

### 🔧 Deuda técnica

- [ ] Aplicar security fixes (stash: `security-fixes-p0-edit-token-rls` — RLS, edit-token, dedup)
- [x] Aumentar expiración de reportes (critical:12h, high:24h, medium:48h, low:72h)
- [ ] Limpiar `/api/news` viejo (existe junto con `/api/news/stream`)

---

## v0.2 — AI Intake

- [ ] Intake en lenguaje natural (usuario describe necesidad, AI extrae campos)
- [ ] Clasificación automática de categoría
- [ ] Extracción de campos estructurados desde texto libre
- [ ] Preguntas de seguimiento generadas por AI
- [ ] Detección de duplicados
- [ ] Resúmenes con AI

---

## v0.3 — Matching

- [ ] Matching necesidad ↔ oferta (reglas determinísticas)
- [ ] Cálculo de distancia geográfica
- [ ] Matching por cantidad/capacidad
- [ ] Verificación de disponibilidad
- [ ] Workflow de match (proponer, aceptar, completar, cancelar)
- [ ] Notificaciones

---

## v0.4 — Integraciones

- [ ] Integración WhatsApp
- [ ] Ingesta de fuentes oficiales (con provenance)
- [ ] Albergues, hospitales, cierres viales
- [ ] Dashboard operacional
- [ ] Soporte multi-ciudad/evento

---

## Extras ya implementados (fuera del roadmap original)

- [x] Noticias con IA (Grok streaming desde X/noticias)
- [x] Página de comunidad (apps aliadas)
- [x] Prompt de noticias configurable via env var (`XAI_NEWS_PROMPT`)
