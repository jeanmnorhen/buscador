'use server';

/**
 * @fileOverview A product search summary AI agent.
 *
 * - productSearchSummary - A function that handles the product search summary process.
 * - ProductSearchSummaryInput - The input type for the productSearchSummary function.
 * - ProductSearchSummaryOutput - The return type for the productSearchSummary function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ProductSearchSummaryInputSchema = z.object({
  url: z.string().describe('The URL to scrape for product information.'),
  productDetails: z.string().describe('The detailed information about products extracted from the URL.'),
});
export type ProductSearchSummaryInput = z.infer<typeof ProductSearchSummaryInputSchema>;

const ProductSearchSummaryOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the types of products found and their price ranges.'),
});
export type ProductSearchSummaryOutput = z.infer<typeof ProductSearchSummaryOutputSchema>;

export async function productSearchSummary(input: ProductSearchSummaryInput): Promise<ProductSearchSummaryOutput> {
  return productSearchSummaryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'productSearchSummaryPrompt',
  input: {schema: ProductSearchSummaryInputSchema},
  output: {schema: ProductSearchSummaryOutputSchema},
  prompt: `You are an AI assistant designed to provide concise summaries of product offerings from a given website.

  Based on the product details extracted from the URL, create a summary that includes the types of products found and their general price ranges.
  URL: {{{url}}}
  Product Details: {{{productDetails}}}
  Summary:`, // Removed 'generate' to avoid confusion, added colon
});

const productSearchSummaryFlow = ai.defineFlow(
  {
    name: 'productSearchSummaryFlow',
    inputSchema: ProductSearchSummaryInputSchema,
    outputSchema: ProductSearchSummaryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
