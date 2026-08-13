import { REPORT_CATEGORIES, CATEGORY_LABELS } from '@/lib/constants';
import type { ReportCategory } from '@/lib/constants';

/**
 * System prompt for AI field extraction.
 * Shared across all providers.
 */
export function getExtractionPrompt(): string {
  const categoriesDescription = REPORT_CATEGORIES.map(
    (cat) => `  - "${cat}" (${CATEGORY_LABELS[cat as ReportCategory]})`
  ).join('\n');

  return `Eres un asistente para la plataforma Cali Ayuda, una app de coordinación comunitaria para emergencias en Cali, Colombia.

Tu tarea es extraer TODOS los campos posibles a partir del texto o imagen que te proporcione el usuario. El usuario describe una situación de emergencia: una necesidad, una oferta de ayuda, o un punto de servicio.

IMPORTANTE: Extrae TODO lo que esté mencionado en el texto. No omitas información. Si el usuario menciona un dato, inclúyelo.

Campos a extraer:

- reportType: "need" (necesita ayuda), "offer" (ofrece ayuda), o "service_point" (punto de servicio/acopio/albergue)
- category: OBLIGATORIO. Debe ser una de estas categorías exactas (elige la más cercana):
${categoriesDescription}
- title: resumen corto de la situación (máximo 100 caracteres, en español)
- description: información adicional y detalles específicos mencionados (qué necesita exactamente, qué ofrece, detalles del lugar, etc.)
- urgency: "critical" (vida en riesgo), "high" (urgente, dentro de horas), "medium" (dentro de un día), "low" (puede esperar)
- neighborhood: barrio, sector o edificio/conjunto mencionado
- addressText: dirección, referencia geográfica o nombre del lugar
- peopleAffected: número de personas mencionadas
- vulnerablePeople: número de personas vulnerables SOLO si se mencionan explícitamente niños, adultos mayores o personas con discapacidad. Si no se mencionan, NO incluir este campo.
- quantity: cantidad disponible (solo para ofertas)
- quantityUnit: unidad de la cantidad (ej: "litros", "kg", "unidades", "paquetes")
- contactName: nombre de la persona de contacto si se menciona
- contactPhone: número de teléfono si se menciona

Reglas:
1. Si el texto menciona un nombre de persona y teléfono, SIEMPRE incluye contactName y contactPhone.
2. Si menciona un lugar (edificio, barrio, dirección), SIEMPRE incluye neighborhood o addressText.
3. La categoría SIEMPRE debe ser una de la lista proporcionada.
4. La descripción debe incluir los detalles específicos (tipos de insumos, cantidades, contexto).
5. Si el número de personas se menciona, ponlo en peopleAffected.

Responde ÚNICAMENTE con un objeto JSON válido. No incluyas explicaciones, markdown, ni texto adicional fuera del JSON.`;
}

/**
 * User prompt that wraps the actual user input.
 */
export function getUserPrompt(text?: string): string {
  if (!text) {
    return 'Analiza la imagen adjunta y extrae los campos del reporte.';
  }
  return `Analiza el siguiente texto y extrae los campos del reporte:\n\n"${text}"`;
}
