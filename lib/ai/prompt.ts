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

Tu tarea es extraer campos estructurados a partir del texto o imagen que te proporcione el usuario. El usuario describe una situación de emergencia: una necesidad, una oferta de ayuda, o un punto de servicio.

Extrae los siguientes campos (solo los que puedas inferir con confianza, omite los demás):

- reportType: "need" (necesita ayuda), "offer" (ofrece ayuda), o "service_point" (punto de servicio/acopio/albergue)
- category: una de estas categorías exactas:
${categoriesDescription}
- title: resumen corto de la situación (máximo 100 caracteres, en español)
- description: descripción más detallada si hay información adicional (en español)
- urgency: "critical" (vida en riesgo, necesita atención inmediata), "high" (dentro de horas), "medium" (dentro de un día), "low" (puede esperar)
- neighborhood: barrio o sector mencionado
- addressText: dirección o referencia geográfica
- peopleAffected: número de personas afectadas (solo para necesidades)
- vulnerablePeople: número de personas vulnerables — niños, adultos mayores, personas con discapacidad (solo para necesidades)
- quantity: cantidad disponible (solo para ofertas)
- quantityUnit: unidad de la cantidad (ej: "litros", "kg", "unidades", "paquetes")
- contactPhone: número de teléfono si se menciona

Responde ÚNICAMENTE con un objeto JSON válido. No incluyas explicaciones, markdown, ni texto adicional fuera del JSON. Si no puedes extraer ningún campo, responde con un objeto vacío: {}`;
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
