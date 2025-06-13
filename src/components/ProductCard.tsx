import Image from 'next/image';
import type { ExtractProductsFromUrlOutput } from '@/ai/flows/extract-products-from-url';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, Tag } from 'lucide-react';

interface ProductCardProps {
  product: ExtractProductsFromUrlOutput[0];
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <Card className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-lg">
      <CardHeader className="p-0">
        <div className="aspect-video relative w-full overflow-hidden">
           <Image
            src={`https://placehold.co/600x400.png?text=${encodeURIComponent(product.name)}`}
            alt={product.name}
            data-ai-hint="product item"
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <CardTitle className="text-lg font-semibold mb-2 line-clamp-2" title={product.name}>
          {product.name}
        </CardTitle>
        {product.price && (
          <div className="flex items-center text-primary font-medium mb-3">
            <Tag className="h-4 w-4 mr-1.5" />
            <span className="text-base">{product.price}</span>
          </div>
        )}
      </CardContent>
      <CardFooter className="p-4 bg-secondary/30">
        <Button asChild variant="outline" className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
          <a href={product.link} target="_blank" rel="noopener noreferrer" aria-label={`View product: ${product.name}`}>
            View Product
            <ExternalLink className="ml-2 h-4 w-4" />
          </a>
        </Button>
      </CardFooter>
    </Card>
  );
}
