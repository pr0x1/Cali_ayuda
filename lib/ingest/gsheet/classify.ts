/**
 * Deterministic category classifier for free-text needs/offers.
 *
 * AGENTS.md §13/§14/§15: matching + classification must have a deterministic,
 * non-AI path. AI classification may be layered on later as an OPTIONAL
 * enhancement, but must always fall back to this keyword map.
 */
import type { ReportCategory } from '@/lib/constants';

interface Rule {
  category: ReportCategory;
  pattern: RegExp;
}

// Order matters: earlier rules win. Accent-insensitive matching via normalize().
const RULES: Rule[] = [
  { category: 'rescate', pattern: /rescat|atrapad|escombr|colaps|remocion/i },
  {
    category: 'asistencia_medica',
    pattern: /medic[oa]s|enferm|primeros auxili|canaliz|sangre/i,
  },
  {
    category: 'medicamentos',
    pattern: /medicament|ensure|pañal|panal|sulfonato|gotas para ojos/i,
  },
  {
    category: 'herramientas',
    pattern:
      /taladro|pulidora|alicate|pica|pica[s]?|pala|disco|herramient|casco|guante|cinta de seg|cincel|bisturi|tijera|gato electr|planta electr|extension|megafono|maquinaria|volqueta/i,
  },
  { category: 'agua', pattern: /agua|hidratant|bebida/i },
  {
    category: 'alimentos',
    pattern:
      /comida|almuerz|proteina|pollo|res\b|carne|sandwich|aliment|desechable|olla comun|cena|platos|cubiertos|hielo/i,
  },
  { category: 'higiene', pattern: /aseo|higien|papel higenic|panitos|pañitos|bebe|toalla/i },
  { category: 'transporte', pattern: /gasolina|transporte|volqueta|carro de mercado|zorra/i },
  { category: 'albergue', pattern: /albergue|bano|ducha|descanso|refugio/i },
  { category: 'voluntarios', pattern: /personal|voluntari|relevo|brigadista|sonidista|drone/i },
  { category: 'ropa', pattern: /ropa/i },
  { category: 'comunicaciones', pattern: /megafono|comunicacion|radio/i },
];

/** Strip accents so "médicos" matches /medic/. */
function normalize(text: string): string {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Classify free text into a report category.
 * Always returns a category — 'otro' when nothing matches.
 */
export function classifyCategory(text: string | undefined): ReportCategory {
  if (!text) return 'otro';
  const normalized = normalize(text);
  for (const rule of RULES) {
    if (rule.pattern.test(normalized)) {
      return rule.category;
    }
  }
  return 'otro';
}
