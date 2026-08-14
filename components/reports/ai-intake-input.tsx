'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface ExtractedFields {
  _invalid?: boolean;
  _rejectionReason?: string;
  reportType?: 'need' | 'offer' | 'service_point';
  category?: string;
  title?: string;
  description?: string;
  urgency?: 'low' | 'medium' | 'high' | 'critical';
  neighborhood?: string;
  addressText?: string;
  peopleAffected?: number;
  vulnerablePeople?: number;
  quantity?: number;
  quantityUnit?: string;
  contactName?: string;
  contactPhone?: string;
}

interface AIIntakeInputProps {
  onFieldsExtracted: (fields: ExtractedFields) => void;
}

type IntakeState = 'idle' | 'analyzing' | 'done' | 'error';

export function AIIntakeInput({ onFieldsExtracted }: AIIntakeInputProps) {
  const [text, setText] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [state, setState] = useState<IntakeState>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Compress image using canvas to stay within Vercel payload limits.
   * Resizes to max 1024px on longest side and uses JPEG quality 0.7.
   */
  function compressImage(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(url);

        const MAX_SIZE = 1024;
        let { width, height } = img;

        if (width > MAX_SIZE || height > MAX_SIZE) {
          if (width > height) {
            height = Math.round((height * MAX_SIZE) / width);
            width = MAX_SIZE;
          } else {
            width = Math.round((width * MAX_SIZE) / height);
            height = MAX_SIZE;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('No canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        resolve(dataUrl);
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Error al cargar imagen'));
      };

      img.src = url;
    });
  }

  async function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Solo se permiten imágenes');
      return;
    }

    try {
      setErrorMessage('');
      const compressed = await compressImage(file);
      setImagePreview(compressed);
      setImageBase64(compressed);
    } catch {
      setErrorMessage('Error al procesar la imagen. Intenta con otra.');
    }
  }

  function removeImage() {
    setImagePreview(null);
    setImageBase64(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  async function handleAnalyze() {
    if (!text.trim() && !imageBase64) return;

    setState('analyzing');
    setErrorMessage('');

    try {
      const res = await fetch('/api/ai/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text.trim() || undefined,
          image: imageBase64 || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setState('error');
        setErrorMessage(data.error || 'Error al analizar');
        return;
      }

      // Check if AI rejected the input as not a valid emergency
      if (data.data._invalid) {
        setState('error');
        setErrorMessage(
          data.data._rejectionReason ||
            'Esto no parece ser una situación de emergencia. Describe una necesidad, oferta de ayuda o punto de servicio.'
        );
        return;
      }

      setState('done');
      onFieldsExtracted(data.data);
    } catch {
      setState('error');
      setErrorMessage('Error de conexión. Intenta de nuevo.');
    }
  }

  return (
    <div className="space-y-3 rounded-lg border border-border bg-card p-4">
      <div className="flex items-center gap-2">
        <span className="text-lg">🤖</span>
        <Label className="text-sm font-medium">
          Asistente IA — Describe tu situación
        </Label>
      </div>

      <p className="text-xs text-muted-foreground">
        Escribe lo que necesitas o sube una foto. La IA pre-llenará el
        formulario automáticamente.
      </p>

      {/* Text input */}
      <Textarea
        placeholder="Ej: Somos 15 personas en el barrio San Antonio, necesitamos agua urgente. Hay 3 niños y 2 adultos mayores..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        maxLength={5000}
        rows={3}
        disabled={state === 'analyzing'}
      />

      {/* Image upload */}
      <div className="flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageSelect}
          className="hidden"
          id="ai-image-input"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={state === 'analyzing'}
        >
          📷 {imagePreview ? 'Cambiar imagen' : 'Subir imagen'}
        </Button>
        {imagePreview && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={removeImage}
            disabled={state === 'analyzing'}
          >
            ✕ Quitar
          </Button>
        )}
      </div>

      {/* Image preview */}
      {imagePreview && (
        <div className="relative">
          <img
            src={imagePreview}
            alt="Preview"
            className="max-h-40 rounded-lg border border-border object-contain"
          />
        </div>
      )}

      {/* Analyze button */}
      <Button
        type="button"
        variant="default"
        size="sm"
        className="w-full"
        onClick={handleAnalyze}
        disabled={state === 'analyzing' || (!text.trim() && !imageBase64)}
      >
        {state === 'analyzing'
          ? '🔄 Analizando...'
          : '🤖 Analizar con IA'}
      </Button>

      {/* Success message */}
      {state === 'done' && (
        <div className="rounded-lg border border-offer/30 bg-offer/10 p-3 text-center">
          <p className="text-sm text-offer">
            ✨ Formulario pre-llenado — revisa y ajusta si es necesario
          </p>
        </div>
      )}

      {/* Error message */}
      {errorMessage && (
        <p className="text-xs text-destructive">{errorMessage}</p>
      )}
    </div>
  );
}
