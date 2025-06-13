
'use client';

import { Suspense, useState, useTransition, useEffect } from 'react';
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
import { getProductsForApprovalAction, approveProductAction } from './actions';
import type { ExtractProductsFromUrlOutput } from '@/ai/flows/extract-products-from-url';
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, CheckCircle, ThumbsUp, PackageSearch, LinkIcon } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useSearchParams } from 'next/navigation';

const formSchema = z.object({
  url: z.string().url({ message: 'Please enter a valid URL (e.g., https://example.com)' }),
});

type FormValues = z.infer<typeof formSchema>;

// This component contains the logic that uses useSearchParams
function ApprovalFormLogic() {
  const searchParams = useSearchParams();
  const initialUrl = searchParams.get('url') || '';

  const [productsForApproval, setProductsForApproval] = useState<ExtractProductsFromUrlOutput | null>(null);
  const [approvedProducts, setApprovedProducts] = useState<string[]>([]); // Stores links of approved products
  const [currentUrl, setCurrentUrl] = useState<string>(initialUrl);
  const [isFetching, startFetchingTransition] = useTransition();
  const [isApproving, startApprovingTransition] = useTransition();
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      url: initialUrl,
    },
  });

  const handleFetchProducts: SubmitHandler<FormValues> = (data) => {
    setProductsForApproval(null);
    setApprovedProducts([]);
    setCurrentUrl(data.url);

    startFetchingTransition(async () => {
      const result = await getProductsForApprovalAction(data.url);
      if (result.error) {
        toast({
          variant: "destructive",
          title: "Error Fetching Products",
          description: result.error,
        });
        setProductsForApproval(null);
      } else {
        setProductsForApproval(result.products);
        if (!result.products || result.products.length === 0) {
            toast({
                title: "No Products Found",
                description: "Could not find any products on the page to approve.",
            });
        }
      }
    });
  };

  useEffect(() => {
    if (initialUrl) {
      // defaultValues in useForm should set the input,
      // so we only need to trigger the fetch.
      handleFetchProducts({ url: initialUrl });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialUrl]); // Effect runs when initialUrl (from searchParams) is available/changes.


  const handleApproveProduct = (product: ExtractProductsFromUrlOutput[0]) => {
    startApprovingTransition(async () => {
      const result = await approveProductAction({ ...product, sourceUrl: currentUrl });
      if (result.success) {
        toast({
          title: "Product Approved",
          description: `${product.name} has been saved.`,
          action: <CheckCircle className="text-green-500" />,
        });
        setApprovedProducts(prev => [...prev, product.link]);
      } else {
        toast({
          variant: "destructive",
          title: "Approval Failed",
          description: result.error || "Could not approve the product.",
        });
      }
    });
  };

  const isProductApproved = (productLink: string) => approvedProducts.includes(productLink);

  return (
    <>
      <section className="mb-12">
        <Card className="max-w-2xl mx-auto shadow-xl rounded-xl overflow-hidden">
          <CardHeader className="bg-primary/10 p-6">
            <div className="flex items-center gap-3">
              <ThumbsUp className="h-8 w-8 text-primary" />
              <CardTitle className="text-2xl font-headline text-primary">Product Approval</CardTitle>
            </div>
            <CardDescription className="text-foreground/80 pt-1">
              Enter a website URL to fetch products and approve them. Approved products will be saved.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleFetchProducts)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-lg font-medium">Website URL to Fetch Products</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                          <Input
                            type="url"
                            placeholder="https://www.example-store.com/products"
                            {...field}
                            className="text-base py-3 px-4 h-12 rounded-lg focus:ring-2 focus:ring-primary/50 pl-10"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={isFetching} className="w-full text-lg py-6 rounded-lg bg-accent hover:bg-accent/90 text-accent-foreground shadow-md">
                  {isFetching ? (
                    <>
                      <LoadingSpinner size={20} className="mr-2" />
                      Fetching Products...
                    </>
                  ) : (
                    <>
                      <PackageSearch className="mr-2 h-5 w-5" />
                      Fetch Products for Approval
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </section>

      {isFetching && (
        <div className="flex flex-col items-center justify-center py-10 text-center animate-fade-in">
          <LoadingSpinner size={48} />
          <p className="mt-4 text-xl font-medium text-foreground/90">Fetching products for approval...</p>
          <p className="text-foreground/70">This might take a moment.</p>
        </div>
      )}

      {!isFetching && productsForApproval && productsForApproval.length > 0 && (
        <section className="animate-fade-in">
          <h2 className="text-3xl font-headline font-semibold mb-8 text-center text-foreground">
            Products Pending Approval ({productsForApproval.length - approvedProducts.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
            {productsForApproval.map((product, index) => (
              <div key={product.link + index} className="animate-fade-in flex flex-col" style={{ animationDelay: `${index * 100}ms` }}>
                <ProductCard product={product} />
                <Button
                  onClick={() => handleApproveProduct(product)}
                  disabled={isApproving || isProductApproved(product.link)}
                  className="mt-2 w-full rounded-md"
                  variant={isProductApproved(product.link) ? "secondary" : "default"}
                >
                  {isApproving && !isProductApproved(product.link) && !isFetching ? <LoadingSpinner size={18} className="mr-2" /> : null}
                  {isProductApproved(product.link) ? (
                    <>
                      <CheckCircle className="mr-2 h-5 w-5 text-green-500" /> Approved
                    </>
                  ) : (
                    <>
                     <ThumbsUp className="mr-2 h-5 w-5" /> Approve Product
                    </>
                  )}
                </Button>
              </div>
            ))}
          </div>
        </section>
      )}

      {!isFetching && productsForApproval && productsForApproval.length === 0 && (
         <Alert variant="default" className="max-w-xl mx-auto animate-fade-in bg-secondary/50 border-secondary rounded-lg">
           <AlertCircle className="h-5 w-5 text-foreground/80" />
           <AlertTitle className="font-semibold text-foreground">No Products Found</AlertTitle>
           <AlertDescription className="text-foreground/70">
             We couldn't find any products on the provided URL to approve. Try a different page or website.
           </AlertDescription>
         </Alert>
      )}
    </>
  );
}


export default function ApprovalPage() {
  // This outer component no longer uses useSearchParams directly
  const [clientFooterYear, setClientFooterYear] = useState<number | null>(null);

  useEffect(() => {
    setClientFooterYear(new Date().getFullYear());
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8 md:py-12">
        <Suspense fallback={
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <LoadingSpinner size={48} />
            <p className="mt-4 text-xl font-medium text-foreground/90">Loading approval page...</p>
          </div>
        }>
          <ApprovalFormLogic />
        </Suspense>
      </main>
      <footer className="py-6 text-center text-sm text-muted-foreground border-t">
        <p>&copy; {clientFooterYear ?? new Date().getFullYear()} Product Prospector - Approval. All rights reserved.</p>
      </footer>
    </div>
  );
}
