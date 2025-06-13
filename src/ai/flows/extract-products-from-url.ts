
'use server';

/**
 * @fileOverview An AI agent to extract products from a given URL.
 *
 * - extractProductsFromUrl - A function that handles the product extraction process.
 * - ExtractProductsFromUrlInput - The input type for the extractProductsFromUrl function.
 * - ExtractProductsFromUrlOutput - The return type for the extractProductsFromUrl function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExtractProductsFromUrlInputSchema = z.object({
  url: z.string().url().describe('The URL to extract products from.'),
});
export type ExtractProductsFromUrlInput = z.infer<
  typeof ExtractProductsFromUrlInputSchema
>;

const ProductSchema = z.object({
  name: z.string().describe('The name of the product.'),
  price: z.string().describe('The price of the product.'),
  link: z.string().url().describe('The link to the product page.'),
});

const ExtractProductsFromUrlOutputSchema = z.array(ProductSchema).describe('A list of products found on the page.');
export type ExtractProductsFromUrlOutput = z.infer<
  typeof ExtractProductsFromUrlOutputSchema
>;

export async function extractProductsFromUrl(
  input: ExtractProductsFromUrlInput
): Promise<ExtractProductsFromUrlOutput> {
  return extractProductsFromUrlFlow(input);
}

const extractProductsFromUrlFlow = ai.defineFlow(
  {
    name: 'extractProductsFromUrlFlow',
    inputSchema: ExtractProductsFromUrlInputSchema,
    outputSchema: ExtractProductsFromUrlOutputSchema,
  },
  async input => {
    let browser: import('playwright').Browser | null = null;
    try {
      const { chromium } = await import('playwright');
      browser = await chromium.launch({ headless: true });
      const page = await browser.newPage();
      await page.goto(input.url);

      const products = await page.evaluate(() => {
        const productElements = document.querySelectorAll('*');
        const products = [];

        for (let i = 0; i < productElements.length; i++) {
          const element = productElements[i];
          if (
            element.tagName === 'A' &&
            (element as HTMLAnchorElement).href &&
            element.querySelector('*[src]')
          ) {
            const nameElement = element.querySelector('h1, h2, h3, div');
            const priceElement = element.querySelector('span, div');

            const name = nameElement ? nameElement.textContent?.trim() : '';
            const price = priceElement ? priceElement.textContent?.trim() : '';

            if (name && price) {
              products.push({
                name: name,
                price: price,
                link: (element as HTMLAnchorElement).href,
              });
            }
          }
        }
        return products;
      });

      return products;
    } catch (error: any) {
      console.error('Error during scraping:', error.message ? error.message : error);
      return []; 
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }
);

