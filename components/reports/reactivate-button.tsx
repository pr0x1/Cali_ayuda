'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface ReactivateButtonProps {
  reportId: string;
}

type ActionState = 'idle' | 'loading' | 'done' | 'error';

export function ReactivateButton({ reportId }: ReactivateButtonProps) {
  const [state, setState] = useState<ActionState>('idle');

  async function handleReactivate() {
    setState('loading');

    try {
      const res = await fetch(`/api/reports/${reportId}/reactivate`, {
        method: 'POST',
      });

      if (!res.ok) {
        setState('error');
        return;
      }

      setState('done');
    } catch {
      setState('error');
    }
  }

  if (state === 'done') {
    return (
      <div className="rounded-lg border border-offer/30 bg-offer/10 p-4 text-center">
        <p className="text-sm font-medium text-offer">
          ✅ Reporte reactivado — seguirá visible
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-4">
      <div className="flex items-start gap-3">
        <span className="text-2xl">⚠️</span>
        <div className="flex-1">
          <p className="text-sm font-medium text-yellow-200">
            Este reporte está por expirar
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Si la situación sigue vigente, confirma para mantenerlo activo.
          </p>
          <div className="mt-3 flex gap-2">
            <Button
              variant="offer"
              size="sm"
              onClick={handleReactivate}
              disabled={state === 'loading'}
            >
              {state === 'loading' ? 'Reactivando...' : '✓ Sigue activo'}
            </Button>
          </div>
          {state === 'error' && (
            <p className="mt-2 text-xs text-destructive">
              Error al reactivar. Intenta de nuevo.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
