'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface ConfirmButtonsProps {
  reportId: string;
  currentCount: number;
}

type ActionState = 'idle' | 'loading' | 'done' | 'error';

export function ConfirmButtons({ reportId, currentCount }: ConfirmButtonsProps) {
  const [state, setState] = useState<ActionState>('idle');
  const [count, setCount] = useState(currentCount);
  const [action, setAction] = useState<string>('');

  async function handleConfirm(type: 'confirm' | 'deny' | 'resolved') {
    setState('loading');
    setAction(type);

    try {
      const res = await fetch(`/api/reports/${reportId}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmationType: type }),
      });

      if (!res.ok) {
        setState('error');
        return;
      }

      setState('done');
      if (type === 'confirm') setCount((c) => c + 1);
    } catch {
      setState('error');
    }
  }

  if (state === 'done') {
    const messages: Record<string, string> = {
      confirm: '✅ Confirmado — gracias por verificar',
      deny: '❌ Reportado como incorrecto',
      resolved: '🎉 Marcado como resuelto',
    };
    return (
      <div className="rounded-lg border border-offer/30 bg-offer/10 p-3 text-center text-sm text-offer">
        {messages[action] || '✅ Acción registrada'}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        ¿Puedes verificar este reporte?
        {count > 0 && (
          <span className="ml-2 text-offer">
            ✓ {count} confirmación{count !== 1 ? 'es' : ''}
          </span>
        )}
      </p>

      <div className="flex flex-wrap gap-2">
        <Button
          variant="offer"
          size="sm"
          onClick={() => handleConfirm('confirm')}
          disabled={state === 'loading'}
        >
          ✓ Confirmar
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleConfirm('resolved')}
          disabled={state === 'loading'}
        >
          🎉 Ya se resolvió
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleConfirm('deny')}
          disabled={state === 'loading'}
        >
          ✕ No es correcto
        </Button>
      </div>

      {state === 'error' && (
        <p className="text-xs text-destructive">
          Error al registrar. Intenta de nuevo.
        </p>
      )}
    </div>
  );
}
