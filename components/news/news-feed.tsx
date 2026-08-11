'use client';

import { useState, useEffect, useCallback } from 'react';
import type { NewsResponse } from '@/types/news';

/** How often the client polls for fresh news (matches server cache) */
const CLIENT_REFRESH_MS = 900_000; // 15 minutes

export function NewsFeed() {
  const [news, setNews] = useState<NewsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchNews = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch('/api/news');

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Error ${res.status}`);
      }

      const { data } = await res.json();
      setNews(data);
      setLastRefresh(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar noticias');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNews();
    const interval = setInterval(fetchNews, CLIENT_REFRESH_MS);
    return () => clearInterval(interval);
  }, [fetchNews]);

  const handleManualRefresh = () => {
    setLoading(true);
    fetchNews();
  };

  if (loading && !news) {
    return <NewsSkeleton />;
  }

  if (error && !news) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 text-center">
        <p className="text-destructive font-medium mb-2">⚠️ {error}</p>
        <button
          onClick={handleManualRefresh}
          className="text-sm text-primary underline hover:no-underline"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (!news) return null;

  return (
    <div className="space-y-4">
      {/* Summary content */}
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="prose prose-sm prose-invert max-w-none">
          <div className="whitespace-pre-wrap text-sm text-foreground leading-relaxed">
            {formatSummary(news.summary)}
          </div>
        </div>
      </div>

      {/* Citations / Sources */}
      {news.citations.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Fuentes ({news.citations.length})
          </h3>
          <ul className="space-y-2">
            {news.citations.map((citation, i) => (
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
          onClick={handleManualRefresh}
          disabled={loading}
          className="text-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Actualizando...' : '↻ Actualizar'}
        </button>
      </div>

      {/* Disclaimer */}
      <p className="text-xs text-muted-foreground italic border-t border-border pt-3">
        Información recopilada automáticamente desde X. Verifica siempre con fuentes oficiales
        antes de tomar decisiones.
      </p>
    </div>
  );
}

/** Format the summary text - clean up markdown-style references */
function formatSummary(text: string): string {
  // Remove inline citation markers like [[1]](url) — we show them separately
  return text.replace(/\[\[\d+\]\]\([^)]*\)/g, '').trim();
}

/** Format citation label from URL or title */
function formatCitationLabel(citation: { url: string; title: string }): string {
  // If title is just a number, show the URL domain instead
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
      <div className="rounded-lg border border-border bg-card p-4 space-y-2">
        <div className="h-3 bg-muted rounded w-20" />
        <div className="h-3 bg-muted rounded w-48" />
        <div className="h-3 bg-muted rounded w-40" />
      </div>
    </div>
  );
}
