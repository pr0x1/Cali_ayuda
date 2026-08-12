'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navLinks = [
  { href: '/map', label: 'Mapa' },
  { href: '/reports', label: 'Reportes' },
  { href: '/reports/new', label: 'Crear' },
  { href: '/noticias', label: 'Noticias' },
  { href: '/comunidad', label: 'Comunidad' },
];

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/reports') {
      return pathname === '/reports';
    }
    return pathname.startsWith(href);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-14 bg-background border-b border-border">
      <div className="flex items-center justify-between h-full px-4 max-w-7xl mx-auto">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-1 font-bold text-lg tracking-tight">
          <span className="text-destructive">CALI</span>
          <span className="text-foreground">AYUDA</span>
        </Link>

        {/* Desktop links */}
        <ul className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={`text-sm font-medium transition-colors hover:text-foreground ${
                  isActive(link.href)
                    ? 'text-foreground border-b-2 border-primary pb-0.5'
                    : 'text-muted-foreground'
                }`}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Mobile hamburger button */}
        <button
          type="button"
          className="md:hidden flex flex-col justify-center items-center w-8 h-8 gap-1.5"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={menuOpen}
        >
          <span
            className={`block w-5 h-0.5 bg-foreground transition-transform duration-200 ${
              menuOpen ? 'rotate-45 translate-y-1' : ''
            }`}
          />
          <span
            className={`block w-5 h-0.5 bg-foreground transition-opacity duration-200 ${
              menuOpen ? 'opacity-0' : ''
            }`}
          />
          <span
            className={`block w-5 h-0.5 bg-foreground transition-transform duration-200 ${
              menuOpen ? '-rotate-45 -translate-y-1' : ''
            }`}
          />
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-background border-b border-border">
          <ul className="flex flex-col px-4 py-2 gap-1">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className={`block py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                    isActive(link.href)
                      ? 'text-foreground bg-accent'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  }`}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </nav>
  );
}
