'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { REPORT_CATEGORIES, CATEGORY_LABELS } from '@/lib/constants';
import type { ReportCategory } from '@/lib/constants';

export function ReportFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentType = searchParams.get('reportType') ?? '';
  const currentCategory = searchParams.get('category') ?? '';
  const currentUrgency = searchParams.get('urgency') ?? '';

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/reports?${params.toString()}`);
  }

  function clearFilters() {
    router.push('/reports');
  }

  const hasFilters = currentType || currentCategory || currentUrgency;

  return (
    <div className="space-y-3">
      {/* Type filter buttons */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={!currentType ? 'default' : 'outline'}
          size="sm"
          onClick={() => updateFilter('reportType', '')}
        >
          Todos
        </Button>
        <Button
          variant={currentType === 'need' ? 'need' : 'outline'}
          size="sm"
          onClick={() => updateFilter('reportType', 'need')}
        >
          🆘 Necesidades
        </Button>
        <Button
          variant={currentType === 'offer' ? 'offer' : 'outline'}
          size="sm"
          onClick={() => updateFilter('reportType', 'offer')}
        >
          🤝 Ofertas
        </Button>
        <Button
          variant={currentType === 'service_point' ? 'service-point' : 'outline'}
          size="sm"
          onClick={() => updateFilter('reportType', 'service_point')}
        >
          📍 Puntos
        </Button>
      </div>

      {/* Category and urgency selects */}
      <div className="flex gap-2">
        <Select
          value={currentCategory}
          onChange={(e) => updateFilter('category', e.target.value)}
          className="max-w-[180px]"
        >
          <option value="">Todas las categorías</option>
          {REPORT_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {CATEGORY_LABELS[cat as ReportCategory]}
            </option>
          ))}
        </Select>

        <Select
          value={currentUrgency}
          onChange={(e) => updateFilter('urgency', e.target.value)}
          className="max-w-[150px]"
        >
          <option value="">Toda urgencia</option>
          <option value="critical">🔴 Crítica</option>
          <option value="high">🟠 Alta</option>
          <option value="medium">🟡 Media</option>
          <option value="low">🟢 Baja</option>
        </Select>

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            ✕ Limpiar
          </Button>
        )}
      </div>
    </div>
  );
}
