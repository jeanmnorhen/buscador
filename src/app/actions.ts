
'use server';

import { extractProductsFromUrl, type ExtractProductsFromUrlOutput } from '@/ai/flows/extract-products-from-url';
import { productSearchSummary, type ProductSearchSummaryOutput } from '@/ai/flows/product-search-summary';
import { z } from 'zod';

const UrlSchema = z.string().url({ message: "Please enter a valid URL." });
const SearchTermSchema = z.string().optional();

interface ActionResult {
  products: ExtractProductsFromUrlOutput | null;
  summary: ProductSearchSummaryOutput | null;
  error: string | null;
}

export async function fetchProductsAndSummary(url: string, searchTerm?: string): Promise<ActionResult> {
  try {
    const validatedUrl = UrlSchema.parse(url);
    const validatedSearchTerm = SearchTermSchema.parse(searchTerm);
    
    const products = await extractProductsFromUrl({ url: validatedUrl });

    if (!products || products.length === 0) {
      return {
        products: [],
        summary: { summary: "No products found at the provided URL or the page structure is not recognized." },
        error: null,
      };
    }
    
    const productDetailsString = products.map(p => `Name: ${p.name}, Price: ${p.price}, Link: ${p.link}`).join('\\n');

    const summaryInput: { url: string; productDetails: string; searchTerm?: string } = {
      url: validatedUrl,
      productDetails: productDetailsString,
    };

    if (validatedSearchTerm) {
      summaryInput.searchTerm = validatedSearchTerm;
    }

    const summary = await productSearchSummary(summaryInput);

    return { products, summary, error: null };

  } catch (e: any) {
    if (e instanceof z.ZodError) {
      return { products: null, summary: null, error: e.errors[0].message };
    }
    console.error("Error fetching products and summary:", e);
    return { 
      products: null, 
      summary: null, 
      error: e.message || "An unexpected error occurred while processing the URL. The website might be inaccessible or restrict scraping." 
    };
  }
}
