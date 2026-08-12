import Link from 'next/link';

export const metadata = {
  title: 'Comunidad — Cali Ayuda',
  description: 'Otras iniciativas comunitarias para apoyar la respuesta a la emergencia.',
};

interface CommunityApp {
  name: string;
  description: string;
  url: string;
}

const COMMUNITY_APPS: CommunityApp[] = [
  {
    name: 'Donde Ayudo · Valle',
    description:
      'Directorio comunitario, no oficial. La información puede cambiar rápido. Confirma por teléfono antes de desplazarte y sigue las indicaciones de las autoridades.',
    url: 'https://donde-ayudo-valle.vercel.app/',
  },
  {
    name: 'Red de Apoyo Colombia',
    description:
      'Conecta voluntarios con fundaciones verificadas para atender necesidades urgentes, con contacto directo por WhatsApp sin intermediarios.',
    url: 'https://reddeapoyocolombia.com/',
  },
  {
    name: 'Puntos Críticos del Terremoto en Cali',
    description:
      'Mapa de puntos críticos y zonas afectadas por el terremoto en Cali.',
    url: 'https://terremoto-cali-puntos-criticos.netlify.app/',
  },
  {
    name: 'Mapa de Emergencia · Cali',
    description:
      'Mapa colaborativo para reportar ubicaciones con necesidades urgentes, personal requerido y actualizaciones en tiempo real.',
    url: 'https://mapa-emergencia.artefactofilms.workers.dev/',
  },
];

export default function ComunidadPage() {
  return (
    <main className="min-h-[calc(100vh-3.5rem)] px-4 py-6 max-w-3xl mx-auto">
      <header className="mb-6">
        <Link
          href="/"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Inicio
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-foreground">
          🤝 Otras iniciativas de la comunidad
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Amigos cercanos y otros desarrolladores crearon estas herramientas para
          apoyar la respuesta a la emergencia. Explóralas y compártelas — cada
          iniciativa suma.
        </p>
      </header>

      <div className="space-y-4">
        {COMMUNITY_APPS.map((app) => (
          <div
            key={app.url}
            className="rounded-lg border border-border bg-card p-5 space-y-2"
          >
            <h2 className="text-lg font-semibold text-foreground">
              {app.name}
            </h2>
            <p className="text-sm text-muted-foreground">{app.description}</p>
            <a
              href={app.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              Abrir sitio
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
              >
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </a>
          </div>
        ))}
      </div>
    </main>
  );
}
