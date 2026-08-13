'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { REPORT_CATEGORIES, CATEGORY_LABELS } from '@/lib/constants';
import { LocationPicker } from '@/components/map/location-picker';
import { AIIntakeInput } from '@/components/reports/ai-intake-input';
import type { ReportType, Urgency } from '@/types';
import type { ReportCategory } from '@/lib/constants';

interface ReportFormProps {
  initialType: ReportType;
}

type FormState = 'idle' | 'loading' | 'error' | 'success';

export function ReportForm({ initialType }: ReportFormProps) {
  const router = useRouter();
  const [formState, setFormState] = useState<FormState>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  // Form fields
  const [reportType, setReportType] = useState<ReportType>(initialType);
  const [category, setCategory] = useState<string>('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [addressText, setAddressText] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [showContact, setShowContact] = useState(true);
  const [urgency, setUrgency] = useState<Urgency>('medium');
  const [quantity, setQuantity] = useState('');
  const [quantityUnit, setQuantityUnit] = useState('');
  const [peopleAffected, setPeopleAffected] = useState('');
  const [vulnerablePeople, setVulnerablePeople] = useState('');
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState('');

  const [aiPrefilled, setAiPrefilled] = useState(false);

  const typeLabels: Record<ReportType, { title: string; emoji: string }> = {
    need: { title: 'Necesito ayuda', emoji: '🆘' },
    offer: { title: 'Puedo ayudar', emoji: '🤝' },
    service_point: { title: 'Punto de ayuda', emoji: '📍' },
  };

  function handleAIExtracted(fields: {
    reportType?: string;
    category?: string;
    title?: string;
    description?: string;
    urgency?: string;
    neighborhood?: string;
    addressText?: string;
    peopleAffected?: number;
    vulnerablePeople?: number;
    quantity?: number;
    quantityUnit?: string;
    contactPhone?: string;
  }) {
    if (fields.reportType) setReportType(fields.reportType as ReportType);
    if (fields.category) setCategory(fields.category as string);
    if (fields.title) setTitle(fields.title as string);
    if (fields.description) setDescription(fields.description as string);
    if (fields.urgency) setUrgency(fields.urgency as Urgency);
    if (fields.neighborhood) setNeighborhood(fields.neighborhood as string);
    if (fields.addressText) setAddressText(fields.addressText as string);
    if (fields.peopleAffected)
      setPeopleAffected(String(fields.peopleAffected));
    if (fields.vulnerablePeople)
      setVulnerablePeople(String(fields.vulnerablePeople));
    if (fields.quantity) setQuantity(String(fields.quantity));
    if (fields.quantityUnit) setQuantityUnit(fields.quantityUnit as string);
    if (fields.contactPhone) setContactPhone(fields.contactPhone as string);
    setAiPrefilled(true);
  }

  function handleGetLocation() {
    if (!navigator.geolocation) {
      setGeoError('Tu navegador no soporta geolocalización');
      return;
    }

    setGeoLoading(true);
    setGeoError('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLat(position.coords.latitude);
        setLng(position.coords.longitude);
        setGeoLoading(false);
      },
      (err) => {
        setGeoLoading(false);
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setGeoError('Permiso de ubicación denegado');
            break;
          case err.POSITION_UNAVAILABLE:
            setGeoError('Ubicación no disponible');
            break;
          case err.TIMEOUT:
            setGeoError('Tiempo de espera agotado');
            break;
          default:
            setGeoError('Error al obtener ubicación');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormState('loading');
    setErrorMessage('');
    setFieldErrors({});

    const body: Record<string, unknown> = {
      reportType,
      category,
      title,
      description: description || undefined,
      neighborhood: neighborhood || undefined,
      addressText: addressText || undefined,
      contactName: contactName || undefined,
      contactPhone: contactPhone || undefined,
      showContact,
      urgency,
      lat: lat ?? undefined,
      lng: lng ?? undefined,
    };

    // Type-specific fields
    if (reportType === 'need') {
      if (peopleAffected) body.peopleAffected = parseInt(peopleAffected, 10);
      if (vulnerablePeople)
        body.vulnerablePeople = parseInt(vulnerablePeople, 10);
    }
    if (reportType === 'offer') {
      if (quantity) body.quantity = parseInt(quantity, 10);
      if (quantityUnit) body.quantityUnit = quantityUnit;
    }

    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setFormState('error');
        setErrorMessage(data.error || 'Error al crear el reporte');
        if (data.details) setFieldErrors(data.details);
        return;
      }

      setFormState('success');
      // Redirect to reports list after brief success message
      setTimeout(() => {
        router.push('/reports');
      }, 1500);
    } catch {
      setFormState('error');
      setErrorMessage('Error de conexión. Intenta de nuevo.');
    }
  }

  if (formState === 'success') {
    return (
      <div className="rounded-xl border border-offer/50 bg-offer/10 p-8 text-center">
        <p className="text-2xl">✅</p>
        <p className="mt-2 text-lg font-semibold text-offer">
          ¡Reporte creado exitosamente!
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Redirigiendo a la lista de reportes...
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* AI Intake */}
      <AIIntakeInput onFieldsExtracted={handleAIExtracted} />

      {/* Header */}
      <div className="rounded-lg border border-border bg-card p-4">
        <p className="text-lg font-semibold">
          {typeLabels[reportType].emoji} {typeLabels[reportType].title}
          {aiPrefilled && (
            <span className="ml-2 text-xs font-normal text-offer">
              ✨ Pre-llenado por AI
            </span>
          )}
        </p>
      </div>

      {/* Report Type Selector */}
      <div className="space-y-2">
        <Label>Tipo de reporte</Label>
        <div className="grid grid-cols-3 gap-2">
          <Button
            type="button"
            variant={reportType === 'need' ? 'need' : 'outline'}
            size="sm"
            onClick={() => setReportType('need')}
          >
            🆘 Necesidad
          </Button>
          <Button
            type="button"
            variant={reportType === 'offer' ? 'offer' : 'outline'}
            size="sm"
            onClick={() => setReportType('offer')}
          >
            🤝 Oferta
          </Button>
          <Button
            type="button"
            variant={reportType === 'service_point' ? 'service-point' : 'outline'}
            size="sm"
            onClick={() => setReportType('service_point')}
          >
            📍 Punto
          </Button>
        </div>
      </div>

      {/* Category */}
      <div className="space-y-2">
        <Label htmlFor="category">Categoría *</Label>
        <Select
          id="category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          required
        >
          <option value="">Seleccionar categoría...</option>
          {REPORT_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {CATEGORY_LABELS[cat as ReportCategory]}
            </option>
          ))}
        </Select>
        {fieldErrors.category && (
          <p className="text-xs text-destructive">{fieldErrors.category[0]}</p>
        )}
      </div>

      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title">Título *</Label>
        <Input
          id="title"
          placeholder={
            reportType === 'need'
              ? 'Ej: Necesitamos agua potable para 20 personas'
              : reportType === 'offer'
                ? 'Ej: Tengo 50 botellas de agua disponibles'
                : 'Ej: Centro de acopio en Parque del Perro'
          }
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          minLength={3}
          maxLength={200}
        />
        {fieldErrors.title && (
          <p className="text-xs text-destructive">{fieldErrors.title[0]}</p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Descripción</Label>
        <Textarea
          id="description"
          placeholder="Detalles adicionales..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={2000}
          rows={3}
        />
        <p className="text-xs text-muted-foreground">
          {description.length}/2000
        </p>
      </div>

      {/* Urgency (for needs) */}
      {reportType === 'need' && (
        <div className="space-y-2">
          <Label htmlFor="urgency">Urgencia</Label>
          <Select
            id="urgency"
            value={urgency}
            onChange={(e) => setUrgency(e.target.value as Urgency)}
          >
            <option value="critical">🔴 Crítica (necesita atención inmediata)</option>
            <option value="high">🟠 Alta (dentro de 4 horas)</option>
            <option value="medium">🟡 Media (dentro de 12 horas)</option>
            <option value="low">🟢 Baja (puede esperar)</option>
          </Select>
        </div>
      )}

      {/* People affected (for needs) */}
      {reportType === 'need' && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="peopleAffected">Personas afectadas</Label>
            <Input
              id="peopleAffected"
              type="number"
              min="1"
              placeholder="Ej: 15"
              value={peopleAffected}
              onChange={(e) => setPeopleAffected(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="vulnerablePeople">Personas vulnerables</Label>
            <Input
              id="vulnerablePeople"
              type="number"
              min="0"
              placeholder="Ej: 3"
              value={vulnerablePeople}
              onChange={(e) => setVulnerablePeople(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Niños, adultos mayores, discapacidad
            </p>
          </div>
        </div>
      )}

      {/* Quantity (for offers) */}
      {reportType === 'offer' && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="quantity">Cantidad disponible</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              placeholder="Ej: 50"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="quantityUnit">Unidad</Label>
            <Input
              id="quantityUnit"
              placeholder="Ej: botellas, kg, unidades"
              value={quantityUnit}
              onChange={(e) => setQuantityUnit(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* Location */}
      <div className="space-y-3">
        <Label>Ubicación</Label>

        <div className="space-y-2">
          <Input
            placeholder="Barrio"
            value={neighborhood}
            onChange={(e) => setNeighborhood(e.target.value)}
          />
          <Input
            placeholder="Dirección o referencia"
            value={addressText}
            onChange={(e) => setAddressText(e.target.value)}
          />
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleGetLocation}
          disabled={geoLoading}
          className="w-full"
        >
          {geoLoading
            ? '📡 Obteniendo ubicación...'
            : lat !== null
              ? `✅ Ubicación obtenida (${lat.toFixed(4)}, ${lng!.toFixed(4)})`
              : '📍 Usar mi ubicación GPS'}
        </Button>
        {geoError && (
          <p className="text-xs text-destructive">{geoError}</p>
        )}

        {/* Map picker — always visible so user can select/adjust location */}
        <LocationPicker
          lat={lat}
          lng={lng}
          onLocationSelect={(newLat, newLng) => {
            setLat(newLat);
            setLng(newLng);
          }}
        />

        <p className="text-xs text-muted-foreground">
          Tu ubicación exacta nunca se comparte públicamente. Se desplaza ~150m
          para proteger tu privacidad.
        </p>
      </div>

      {/* Contact (optional) */}
      <div className="space-y-3">
        <Label>Contacto (opcional)</Label>
        <div className="grid grid-cols-2 gap-4">
          <Input
            placeholder="Nombre"
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
          />
          <Input
            placeholder="Teléfono"
            type="tel"
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
          />
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showContact}
            onChange={(e) => setShowContact(e.target.checked)}
            className="h-4 w-4 rounded border-border"
          />
          <span className="text-sm">Quiero que me contacten (se mostrará públicamente)</span>
        </label>
      </div>

      {/* Error display */}
      {formState === 'error' && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <p className="text-sm font-medium text-destructive">{errorMessage}</p>
        </div>
      )}

      {/* Submit */}
      <Button
        type="submit"
        variant={
          reportType === 'need'
            ? 'need'
            : reportType === 'offer'
              ? 'offer'
              : 'service-point'
        }
        size="lg"
        className="w-full"
        disabled={formState === 'loading'}
      >
        {formState === 'loading' ? 'Enviando...' : 'Publicar reporte'}
      </Button>
    </form>
  );
}
