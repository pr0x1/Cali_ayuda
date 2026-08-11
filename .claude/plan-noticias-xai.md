# Plan: Noticias vía xAI Grok API (x_search)

## Objetivo
Agregar una sección de noticias que muestra información en tiempo real sobre el terremoto en Cali, extraída de X (Twitter) mediante la API de xAI con la herramienta `x_search`.

## Arquitectura

```
Usuario → /noticias → Server Component
                          ↓
              API Route /api/news (cached)
                          ↓
              POST https://api.x.ai/v1/responses
              model: grok-4.5 | tools: [x_search]
              prompt: "noticias terremoto Cali, alcaldía"
                          ↓
              Response con texto + annotations (urls)
                          ↓
              Parse → NewsItem[] → JSON response
```

## Archivos a crear/modificar

### Nuevos:
1. **`app/api/news/route.ts`** — API endpoint server-side
   - Llama a xAI Responses API con `x_search`
   - Prompt enfocado en: terremoto Cali, @AlcaldiaDeCali, emergencia
   - Cache: `Cache-Control: s-maxage=300` (5 min) para no abusar del API
   - Parsea la respuesta: extrae texto y annotations (citations)
   - Devuelve array de noticias estructuradas

2. **`lib/xai/client.ts`** — Cliente ligero para xAI
   - Función `fetchXAINews(query: string)` 
   - Tipado de request/response
   - Manejo de errores

3. **`types/news.ts`** — Tipos TypeScript
   ```ts
   interface NewsResponse {
     summary: string;       // texto principal de Grok
     citations: Citation[]; // fuentes extraídas de annotations
     fetchedAt: string;     // timestamp de la consulta
   }
   interface Citation {
     url: string;
     title: string;
   }
   ```

4. **`app/noticias/page.tsx`** — Página de noticias
   - Server component que hace fetch a /api/news con revalidate
   - Muestra el resumen de Grok como texto formateado
   - Lista de fuentes/links citados
   - Indicador de "última actualización"

5. **`components/news/news-feed.tsx`** — Componente client para refresh
   - Fetch inicial + auto-refresh cada 5 min
   - Loading skeleton
   - Estado vacío/error

### Modificados:
6. **`components/layout/navbar.tsx`** — Agregar link "Noticias" al nav
7. **`.env.example`** — Agregar `XAI_API_KEY=`

## Detalle técnico de la llamada a xAI

**Request:**
```json
POST https://api.x.ai/v1/responses
Authorization: Bearer ${XAI_API_KEY}

{
  "model": "grok-4.5",
  "input": [
    {
      "role": "user", 
      "content": "Dame las noticias más recientes sobre el terremoto en Cali, Colombia. Incluye información de la Alcaldía de Cali (@AlcaldiaDeCali) y fuentes oficiales. Resume los puntos clave de las últimas horas."
    }
  ],
  "tools": [
    { "type": "x_search" }
  ]
}
```

**Response (lo que nos interesa):**
```json
{
  "output": [{
    "type": "message",
    "content": [{
      "type": "output_text",
      "text": "Resumen de noticias...",
      "annotations": [
        {"type": "url_citation", "url": "https://x.com/...", "title": "1", "start_index": N, "end_index": N}
      ]
    }]
  }],
  "usage": {...}
}
```

## Variables de entorno
```
XAI_API_KEY=xai-xxxxx  (server-side only, NO NEXT_PUBLIC_)
```

## UX de la página /noticias
- Header: "Noticias y Actualizaciones"
- Subtexto: "Información en tiempo real desde X sobre el terremoto en Cali"
- Bloque principal: resumen formateado por Grok (markdown → HTML)
- Sección "Fuentes": lista de links a los posts/páginas citados
- Footer: "Actualizado hace X minutos" + botón "Actualizar"
- Disclaimer: "Información recopilada automáticamente. Verifica siempre con fuentes oficiales."

## Costo y rate limiting
- Cache de 5 minutos en el API route (no llama xAI en cada request de usuario)
- Un solo prompt por refresh → ~500-1000 tokens input + ~1000-2000 output
- Hobby tier de xAI: verificar límites (generalmente generoso para baja frecuencia)

## Orden de implementación
1. Tipos (`types/news.ts`)
2. Cliente xAI (`lib/xai/client.ts`)
3. API route (`app/api/news/route.ts`)
4. Componente news feed (`components/news/news-feed.tsx`)
5. Página (`app/noticias/page.tsx`)
6. Navbar update
7. Env example update
8. Commit + push
