
import { PackageSearch, ThumbsUp } from 'lucide-react';
import Link from 'next/link';
import { Button } from './ui/button';

export function Header() {
  return (
    <header className="py-4 px-4 md:px-8 border-b border-border/50 shadow-sm bg-card">
      <div className="container mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group" aria-label="Product Prospector Home">
          <PackageSearch className="h-8 w-8 text-primary group-hover:text-primary/80 transition-colors" />
          <h1 className="text-2xl md:text-3xl font-headline font-semibold text-foreground group-hover:text-foreground/80 transition-colors">
            Product Prospector
          </h1>
        </Link>
        <nav>
          <Button asChild variant="ghost">
            <Link href="/approval" className="flex items-center gap-2 text-foreground hover:text-primary transition-colors">
              <ThumbsUp className="h-5 w-5" />
              Approve Products
            </Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
