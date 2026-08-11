import { NewsFeed } from '@/components/news/news-feed';

export const metadata = {
  title: 'Noticias — Cali Ayuda',
  description: 'Información en tiempo real sobre el terremoto en Cali desde X.',
};

export default function NoticiasPage() {
  return (
    <main className="min-h-[calc(100vh-3.5rem)] px-4 py-6 max-w-3xl mx-auto">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">
          📰 Noticias y Actualizaciones
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Información en tiempo real desde X sobre el terremoto en Cali
        </p>
      </header>

      <NewsFeed />
    </main>
  );
}
