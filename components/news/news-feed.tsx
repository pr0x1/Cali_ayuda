'use client';

import { useState, useCallback, useRef } from 'react';

interface Citation {
  url: string;
  title: string;
}

export function NewsFeed() {
  const [text, setText] = useState('');
  const [citations, setCitations] = useState<Citation[]>([]);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchStream = useCallback(async () => {
    // Abort any previous stream
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setText('');
    setCitations([]);
    setLoading(true);
    setDone(false);
    setError(null);

    try {
      const res = await fetch('/api/news/stream', {
        signal: controller.signal,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Error ${res.status}`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done: streamDone, value } = await reader.read();
        if (streamDone) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();

          try {
            const event = JSON.parse(data);

            if (event.type === 'text') {
              setText((prev) => prev + event.content);
            } else if (event.type === 'citations') {
              setCitations(event.citations);
            } else if (event.type === 'done') {
              setDone(true);
            } else if (event.type === 'error') {
              setError(event.error);
            }
          } catch {
            // Skip malformed events
          }
        }
      }

      setLastRefresh(new Date());
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setError(err instanceof Error ? err.message : 'Error al cargar noticias');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-fetch on mount
  const hasFetched = useRef(false);
  if (!hasFetched.current) {
    hasFetched.current = true;
    // Use setTimeout to avoid state update during render
    setTimeout(() => fetchStream(), 0);
  }

  const handleRefresh = () => {
    fetchStream();
  };

  if (!text && !loading && error) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 text-center">
        <p className="text-destructive font-medium mb-2">⚠️ {error}</p>
        <button
          onClick={handleRefresh}
          className="text-sm text-primary underline hover:no-underline"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (!text && loading) {
    return <NewsSkeleton />;
  }

  return (
    <div className="space-y-4">
      {/* Summary content — streams in real-time */}
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="prose prose-sm prose-invert max-w-none">
          <div className="whitespace-pre-wrap text-sm text-foreground leading-relaxed">
            {formatSummary(text)}
            {loading && <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-0.5" />}
          </div>
        </div>
      </div>

      {/* Citations / Sources — appear when stream completes */}
      {citations.length > 0 && done && (
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Fuentes ({citations.length})
          </h3>
          <ul className="space-y-2">
            {citations.map((citation, i) => (
              <li key={`${citation.url}-${i}`}>
                <a
                  href={citation.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline flex items-start gap-2"
                >
                  <span className="text-muted-foreground shrink-0">[{i + 1}]</span>
                  <span className="break-all">
                    {formatCitationLabel(citation)}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Refresh info */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {lastRefresh
            ? `Actualizado: ${lastRefresh.toLocaleTimeString('es-CO')}`
            : ''}
        </span>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="text-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Actualizando...' : '↻ Actualizar'}
        </button>
      </div>

      {/* Disclaimer */}
      {done && (
        <p className="text-xs text-muted-foreground italic border-t border-border pt-3">
          Información recopilada automáticamente desde X. Verifica siempre con fuentes oficiales
          antes de tomar decisiones.
        </p>
      )}
    </div>
  );
}

/** Format the summary text - clean up markdown-style references */
function formatSummary(text: string): string {
  return text.replace(/\[\[\d+\]\]\([^)]*\)/g, '').trim();
}

/** Format citation label from URL or title */
function formatCitationLabel(citation: { url: string; title: string }): string {
  if (/^\d+$/.test(citation.title)) {
    try {
      const url = new URL(citation.url);
      return `${url.hostname}${url.pathname.slice(0, 50)}`;
    } catch {
      return citation.url;
    }
  }
  return citation.title;
}

/** Loading skeleton */
function NewsSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="rounded-lg border border-border bg-card p-6 space-y-3">
        <div className="h-4 bg-muted rounded w-3/4" />
        <div className="h-4 bg-muted rounded w-full" />
        <div className="h-4 bg-muted rounded w-5/6" />
        <div className="h-4 bg-muted rounded w-2/3" />
        <div className="h-4 bg-muted rounded w-full" />
        <div className="h-4 bg-muted rounded w-4/5" />
      </div>
    </div>
  );
}
