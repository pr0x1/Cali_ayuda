/** Application-wide constants */

export const REPORT_CATEGORIES = [
  'agua',
  'alimentos',
  'medicamentos',
  'transporte',
  'albergue',
  'asistencia_medica',
  'herramientas',
  'rescate',
  'ropa',
  'higiene',
  'comunicaciones',
  'voluntarios',
  'donaciones',
  'informacion',
  'otro',
] as const;

export type ReportCategory = (typeof REPORT_CATEGORIES)[number];

export const CATEGORY_LABELS: Record<ReportCategory, string> = {
  agua: 'Agua',
  alimentos: 'Alimentos',
  medicamentos: 'Medicamentos',
  transporte: 'Transporte',
  albergue: 'Albergue',
  asistencia_medica: 'Asistencia médica',
  herramientas: 'Herramientas',
  rescate: 'Rescate',
  ropa: 'Ropa',
  higiene: 'Higiene',
  comunicaciones: 'Comunicaciones',
  voluntarios: 'Voluntarios',
  donaciones: 'Donaciones',
  informacion: 'Información',
  otro: 'Otro',
};

/** Default expiration times in hours per urgency level */
export const EXPIRATION_HOURS: Record<string, number> = {
  critical: 2,
  high: 4,
  medium: 12,
  low: 24,
};

/** Privacy displacement radius in meters for residential coordinates */
export const PRIVACY_RADIUS_METERS = 150;

/** Default city for new reports */
export const DEFAULT_CITY = 'Cali';

/** Cali center coordinates */
export const CALI_CENTER = {
  lat: 3.4516,
  lng: -76.532,
} as const;

/** Default map zoom */
export const DEFAULT_MAP_ZOOM = 12;
