import Link from 'next/link';
import { Button } from '@/components/ui/button';
import StatsDisplay from '@/components/home/stats-display';

export default function HomePage() {
  return (
    <main className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center px-4 py-8">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          CALI AYUDA
        </h1>
        <p className="mt-2 text-muted-foreground">
          Coordinación comunitaria de emergencias
        </p>
      </div>

      {/* Main Actions */}
      <div className="flex w-full max-w-md flex-col gap-4">
        <Link href="/reports/new?type=need" className="w-full">
          <Button
            variant="need"
            size="xl"
            className="w-full text-lg font-semibold"
          >
            🆘 Necesito ayuda
          </Button>
        </Link>

        <Link href="/reports/new?type=offer" className="w-full">
          <Button
            variant="offer"
            size="xl"
            className="w-full text-lg font-semibold"
          >
            🤝 Puedo ayudar
          </Button>
        </Link>

        <Link href="/reports/new?type=service_point" className="w-full">
          <Button
            variant="service-point"
            size="xl"
            className="w-full text-lg font-semibold"
          >
            📍 Reportar punto de ayuda
          </Button>
        </Link>
      </div>

      {/* Live Stats */}
      <StatsDisplay />

      {/* News CTA */}
      <div className="mt-6 w-full max-w-md">
        <Link href="/noticias" className="w-full">
          <Button
            variant="outline"
            size="xl"
            className="w-full text-lg font-semibold border-primary/50 hover:bg-primary/10"
          >
            📰 Noticias oficiales
          </Button>
        </Link>
      </div>

      {/* Navigation */}
      <div className="mt-4 flex gap-4">
        <Link href="/map">
          <Button variant="outline" size="lg">
            🗺️ Ver mapa
          </Button>
        </Link>
        <Link href="/reports">
          <Button variant="outline" size="lg">
            📋 Ver lista
          </Button>
        </Link>
      </div>

      {/* Disclaimer */}
      <p className="mt-8 max-w-md text-center text-xs text-muted-foreground">
        Esta es una plataforma comunitaria. La información publicada aquí
        proviene de la comunidad y no constituye información oficial de
        autoridades de emergencia.
      </p>
    </main>
  );
}
