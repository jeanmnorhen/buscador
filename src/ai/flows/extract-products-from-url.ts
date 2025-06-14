
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
      await page.goto(input.url, { waitUntil: 'networkidle' });

      const products = await page.evaluate(() => {
        const productElements = document.querySelectorAll('a[href]');
        const extractedProducts = [];

        for (let i = 0; i < productElements.length; i++) {
          const linkElement = productElements[i] as HTMLAnchorElement;

          if (linkElement.querySelector('img')) { // Check if the link contains an image
            const productLink = linkElement.href;
            
            let name = '';
            let price = '';

            // Define scopes to search for name and price: current link, parent, grandparent
            const scopesToTry: HTMLElement[] = [];
            if (linkElement.parentElement) {
              scopesToTry.push(linkElement.parentElement);
              if (linkElement.parentElement.parentElement) {
                scopesToTry.push(linkElement.parentElement.parentElement);
              }
            }
            scopesToTry.push(linkElement); // Check inside the link element itself last

            for (const scope of scopesToTry) {
              if (!name) {
                const nameEl = scope.querySelector('h1, h2, h3, h4, h5, h6, [itemprop="name"], [class*="title"], [class*="name"], [class*="Title"], [class*="Name"]');
                if (nameEl) name = nameEl.textContent?.trim() || '';
                else {
                  // Broader search if specific name selectors fail within this scope
                  const generalNameSelectors = ['p', 'div', 'span'];
                  for (const selector of generalNameSelectors) {
                    const generalNameEl = scope.querySelector(selector);
                    if (generalNameEl && generalNameEl.textContent?.trim().length > 3 && generalNameEl.textContent?.trim().length < 150) { // Basic heuristic for name-like text
                       name = generalNameEl.textContent.trim();
                       if (name) break;
                    }
                  }
                }
              }

              if (!price) {
                const priceEl = scope.querySelector('[itemprop="price"], [class*="price"], [class*="Price"]');
                if (priceEl) price = priceEl.textContent?.trim() || '';
                else {
                    // Broader search for price-like text, ensuring it has digits
                    const generalPriceSelectors = ['span', 'div', 'p'];
                     for (const selector of generalPriceSelectors) {
                        const generalPriceEl = scope.querySelector(selector);
                        if (generalPriceEl && generalPriceEl.textContent?.trim() && /\d/.test(generalPriceEl.textContent)) {
                             price = generalPriceEl.textContent.trim();
                             if (price) break;
                        }
                    }
                }
              }
              if (name && price) break; 
            }
            
            if (!name) {
              const imgElement = linkElement.querySelector('img');
              if (imgElement && imgElement.alt) {
                name = imgElement.alt.trim();
              }
            }

            if (name && price && productLink) {
              if (/\d/.test(price)) { // Ensure price string contains at least one digit
                extractedProducts.push({
                  name: name,
                  price: price,
                  link: productLink,
                });
              }
            }
          }
        }
        // Deduplicate products based on link
        const uniqueProducts = [];
        const seenLinks = new Set();
        for (const prod of extractedProducts) {
            if (!seenLinks.has(prod.link)) {
                seenLinks.add(prod.link);
                uniqueProducts.push(prod);
            }
        }
        return uniqueProducts;
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
