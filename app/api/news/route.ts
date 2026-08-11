import { NextResponse } from 'next/server';
import { fetchXAINews } from '@/lib/xai/client';
import type { NewsResponse } from '@/types/news';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/** In-memory cache for news response */
let cachedNews: NewsResponse | null = null;
let cacheTimestamp = 0;

/** Refresh interval from env, default 15 minutes (900000ms) */
function getRefreshInterval(): number {
  const envVal = process.env.NEWS_REFRESH_INTERVAL_MS;
  if (envVal) {
    const parsed = parseInt(envVal, 10);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }
  return 900_000; // 15 minutes
}

/**
 * GET /api/news
 * Returns cached news from xAI x_search.
 * Refreshes every NEWS_REFRESH_INTERVAL_MS (default 15 min).
 */
export async function GET(): Promise<Response> {
  try {
    const now = Date.now();
    const refreshInterval = getRefreshInterval();

    // Return cached if still fresh
    if (cachedNews && now - cacheTimestamp < refreshInterval) {
      return NextResponse.json(
        { data: cachedNews, cached: true },
        {
          headers: {
            'Cache-Control': `public, s-maxage=${Math.floor(refreshInterval / 1000)}, stale-while-revalidate=60`,
          },
        }
      );
    }

    // Fetch fresh news from xAI
    const news = await fetchXAINews();

    // Update cache
    cachedNews = news;
    cacheTimestamp = now;

    return NextResponse.json(
      { data: news, cached: false },
      {
        headers: {
          'Cache-Control': `public, s-maxage=${Math.floor(refreshInterval / 1000)}, stale-while-revalidate=60`,
        },
      }
    );
  } catch (error) {
    console.error('[api/news] Error fetching news:', error);

    // If we have stale cache, return it with a warning
    if (cachedNews) {
      return NextResponse.json(
        { data: cachedNews, cached: true, stale: true },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        error: 'No se pudieron obtener las noticias',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
