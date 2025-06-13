import { PackageSearch } from 'lucide-react';
import Link from 'next/link';

export function Header() {
  return (
    <header className="py-6 px-4 md:px-8 border-b border-border/50 shadow-sm">
      <div className="container mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group" aria-label="Product Prospector Home">
          <PackageSearch className="h-8 w-8 text-primary group-hover:text-primary/80 transition-colors" />
          <h1 className="text-2xl md:text-3xl font-headline font-semibold text-foreground group-hover:text-foreground/80 transition-colors">
            Product Prospector
          </h1>
        </Link>
      </div>
    </header>
  );
}
