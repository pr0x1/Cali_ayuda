import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Cali Ayuda — Coordinación de Emergencias',
  description:
    'Plataforma comunitaria para coordinar ayuda durante emergencias en Cali y municipios cercanos.',
  keywords: ['emergencia', 'ayuda', 'Cali', 'terremoto', 'comunidad'],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#0a0a0a',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="dark">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
