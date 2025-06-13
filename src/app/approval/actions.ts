
'use server';

import { z } from 'zod';
import { extractProductsFromUrl, type ExtractProductsFromUrlOutput } from '@/ai/flows/extract-products-from-url';
import { addCanonicalProduct } from '@/services/canonical-products-service';

const UrlSchema = z.string().url({ message: "Please enter a valid URL." });

interface ProductForApproval {
  name: string;
  price: string;
  link: string;
  sourceUrl: string;
}

export async function getProductsForApprovalAction(url: string): Promise<{ products: ExtractProductsFromUrlOutput | null; error: string | null }> {
  try {
    const validatedUrl = UrlSchema.parse(url);
    const products = await extractProductsFromUrl({ url: validatedUrl });

    if (!products) {
      return { products: null, error: "Could not fetch products from the URL." };
    }
    return { products, error: null };
  } catch (e: any) {
    if (e instanceof z.ZodError) {
      return { products: null, error: e.errors[0].message };
    }
    console.error("Error in getProductsForApprovalAction:", e);
    return { products: null, error: e.message || "An unexpected error occurred while fetching products." };
  }
}

export async function approveProductAction(productData: ProductForApproval): Promise<{ success: boolean; error?: string; canonicalProductId?: string }> {
  try {
    const canonicalProductId = await addCanonicalProduct({
      name: productData.name,
      price: productData.price,
      link: productData.link,
      sourceUrl: productData.sourceUrl,
    });
    return { success: true, canonicalProductId };
  } catch (error: any) {
    console.error('Error approving product:', error);
    return { success: false, error: error.message || 'Failed to approve product.' };
  }
}
