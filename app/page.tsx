import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-8">
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

      {/* Stats placeholder */}
      <Card className="mt-8 w-full max-w-md">
        <CardContent className="grid grid-cols-3 gap-4 p-6 text-center">
          <StatsItem label="Necesidades activas" value="—" color="text-need" />
          <StatsItem
            label="Recursos disponibles"
            value="—"
            color="text-offer"
          />
          <StatsItem
            label="Casos resueltos"
            value="—"
            color="text-success"
          />
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="mt-6 flex gap-4">
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

function StatsItem({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
