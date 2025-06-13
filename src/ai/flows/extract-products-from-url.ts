// This file is machine-generated - edit at your own risk!

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

import {Browser, chromium} from 'playwright';

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
    let browser: Browser | null = null;
    try {
      browser = await chromium.launch();
      const page = await browser.newPage();
      await page.goto(input.url);

      const products = await page.evaluate(() => {
        const productElements = document.querySelectorAll('*');
        const products = [];

        for (let i = 0; i < productElements.length; i++) {
          const element = productElements[i];
          // Basic heuristics to identify product-like elements
          if (
            element.tagName === 'A' &&
            element.href &&
            element.querySelector('*[src]') // has an image
          ) {
            const nameElement = element.querySelector('h1, h2, h3, div');
            const priceElement = element.querySelector('span, div');

            const name = nameElement ? nameElement.textContent?.trim() : '';
            const price = priceElement ? priceElement.textContent?.trim() : '';

            if (name && price) {
              products.push({
                name: name,
                price: price,
                link: element.href,
              });
            }
          }
        }

        return products;
      });

      return products;
    } catch (error) {
      console.error('Error during scraping:', error);
      return []; // Return an empty array in case of an error
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }
);
