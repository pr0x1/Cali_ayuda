import { CATEGORY_LABELS, type ReportCategory } from '@/lib/constants';
import type { ReportType, Urgency } from '@/types';

/** Time ago in Spanish */
export function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;

  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'hace un momento';
  if (minutes < 60) return `hace ${minutes} min`;
  if (hours < 24) return `hace ${hours}h`;
  if (days === 1) return 'hace 1 día';
  if (days < 7) return `hace ${days} días`;
  if (days < 30) return `hace ${Math.floor(days / 7)} sem`;

  return new Date(dateStr).toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'short',
  });
}

/** Format category key to Spanish label */
export function formatCategory(key: string): string {
  return CATEGORY_LABELS[key as ReportCategory] ?? key;
}

/** Format urgency to Spanish label with emoji */
export function formatUrgency(urgency: Urgency): {
  label: string;
  emoji: string;
} {
  const map: Record<Urgency, { label: string; emoji: string }> = {
    critical: { label: 'Crítica', emoji: '🔴' },
    high: { label: 'Alta', emoji: '🟠' },
    medium: { label: 'Media', emoji: '🟡' },
    low: { label: 'Baja', emoji: '🟢' },
  };
  return map[urgency];
}

/** Format report type to Spanish label with emoji */
export function formatReportType(type: ReportType): {
  label: string;
  emoji: string;
} {
  const map: Record<ReportType, { label: string; emoji: string }> = {
    need: { label: 'Necesidad', emoji: '🆘' },
    offer: { label: 'Oferta', emoji: '🤝' },
    service_point: { label: 'Punto de ayuda', emoji: '📍' },
  };
  return map[type];
}

/** Get badge variant for report type */
export function reportTypeBadgeVariant(
  type: ReportType
): 'need' | 'offer' | 'service-point' {
  const map: Record<ReportType, 'need' | 'offer' | 'service-point'> = {
    need: 'need',
    offer: 'offer',
    service_point: 'service-point',
  };
  return map[type];
}

/** Get badge variant for urgency */
export function urgencyBadgeVariant(
  urgency: Urgency
): 'critical' | 'warning' | 'secondary' | 'success' {
  const map: Record<
    Urgency,
    'critical' | 'warning' | 'secondary' | 'success'
  > = {
    critical: 'critical',
    high: 'warning',
    medium: 'secondary',
    low: 'success',
  };
  return map[urgency];
}
