'use client';

import { useState, useTransition } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Header } from '@/components/Header';
import { ProductCard } from '@/components/ProductCard';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { fetchProductsAndSummary } from './actions';
import type { ExtractProductsFromUrlOutput } from '@/ai/flows/extract-products-from-url';
import type { ProductSearchSummaryOutput } from '@/ai/flows/product-search-summary';
import { AlertCircle, Info, PackageSearch, SearchIcon } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const formSchema = z.object({
  url: z.string().url({ message: 'Please enter a valid URL (e.g., https://example.com)' }),
});

type FormValues = z.infer<typeof formSchema>;

export default function HomePage() {
  const [products, setProducts] = useState<ExtractProductsFromUrlOutput | null>(null);
  const [summary, setSummary] = useState<ProductSearchSummaryOutput | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      url: '',
    },
  });

  const onSubmit: SubmitHandler<FormValues> = (data) => {
    setProducts(null);
    setSummary(null);

    startTransition(async () => {
      const result = await fetchProductsAndSummary(data.url);
      if (result.error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error,
        });
        setProducts(null);
        setSummary(null);
      } else {
        setProducts(result.products);
        setSummary(result.summary);
        if (!result.products || result.products.length === 0) {
            toast({
                title: "No Products Found",
                description: result.summary?.summary || "Could not find any products on the page.",
            });
        }
      }
    });
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8 md:py-12">
        <section className="mb-12">
          <Card className="max-w-2xl mx-auto shadow-xl rounded-xl overflow-hidden">
            <CardHeader className="bg-primary/10 p-6">
              <div className="flex items-center gap-3">
                <SearchIcon className="h-8 w-8 text-primary" />
                <CardTitle className="text-2xl font-headline text-primary">Search Products by URL</CardTitle>
              </div>
              <CardDescription className="text-foreground/80 pt-1">
                Enter a website URL below, and our AI will try to find products listed on that page.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-lg font-medium">Website URL</FormLabel>
                        <FormControl>
                          <Input
                            type="url"
                            placeholder="https://www.example-store.com/products"
                            {...field}
                            className="text-base py-3 px-4 h-12 rounded-lg focus:ring-2 focus:ring-primary/50"
                            aria-describedby="url-form-message"
                          />
                        </FormControl>
                        <FormMessage id="url-form-message" />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={isPending} className="w-full text-lg py-6 rounded-lg bg-accent hover:bg-accent/90 text-accent-foreground shadow-md transition-all duration-150 ease-in-out transform hover:scale-105">
                    {isPending ? (
                      <>
                        <LoadingSpinner size={20} className="mr-2" />
                        Searching...
                      </>
                    ) : (
                      <>
                        <PackageSearch className="mr-2 h-5 w-5" />
                        Find Products
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </section>

        {isPending && (
          <div className="flex flex-col items-center justify-center py-10 text-center animate-fade-in">
            <LoadingSpinner size={48} />
            <p className="mt-4 text-xl font-medium text-foreground/90">Prospecting for products...</p>
            <p className="text-foreground/70">This might take a moment.</p>
          </div>
        )}

        {!isPending && summary && (
          <section className="mb-12 animate-fade-in animation-delay-200">
            <Card className="shadow-lg rounded-xl">
              <CardHeader className="bg-secondary/30 p-6">
                <div className="flex items-center gap-3">
                  <Info className="h-6 w-6 text-primary" />
                  <CardTitle className="text-xl font-headline text-primary">Search Summary</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-base text-foreground/90 leading-relaxed">{summary.summary}</p>
              </CardContent>
            </Card>
          </section>
        )}

        {!isPending && products && products.length > 0 && (
          <section className="animate-fade-in animation-delay-400">
            <h2 className="text-3xl font-headline font-semibold mb-8 text-center text-foreground">
              Found Products ({products.length})
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
              {products.map((product, index) => (
                <div key={product.link + index} className="animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          </section>
        )}

        {!isPending && products && products.length === 0 && summary && summary.summary.startsWith("No products found") && (
           <Alert variant="default" className="max-w-xl mx-auto animate-fade-in bg-secondary/50 border-secondary rounded-lg">
             <AlertCircle className="h-5 w-5 text-foreground/80" />
             <AlertTitle className="font-semibold text-foreground">No Products Found</AlertTitle>
             <AlertDescription className="text-foreground/70">
               {summary.summary || "We couldn't find any products on the provided URL. Try a different page or website."}
             </AlertDescription>
           </Alert>
        )}
      </main>
      <footer className="py-6 text-center text-sm text-muted-foreground border-t">
        <p>&copy; {new Date().getFullYear()} Product Prospector. All rights reserved.</p>
      </footer>
    </div>
  );
}
