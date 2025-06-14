
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
        const productElements = Array.from(document.querySelectorAll('a[href]'));
        const extractedProducts = [];

        for (const linkElement of productElements) {
          const imgElement = linkElement.querySelector('img');
          if (!imgElement) continue; // Only consider links that contain an image

          const productLink = linkElement.href;
          // Basic validation for productLink
          if (!productLink || !productLink.startsWith('http') || productLink.includes('javascript:void(0)')) {
            continue;
          }

          let name = '';
          let price = '';

          // Try to find a common ancestor that represents the "product card"
          const cardSelectors = [
              'article', 'li', 
              '[class*="product-card"]', '[class*="ProductCard"]',
              '[class*="product-item"]', '[class*="ProductItem"]',
              '[class*="item-cell"]', '[class*="ItemCell"]',
              '[class*="product_grid_item"]', '[class*="s-result-item"]', // Amazon-like
              '[role="listitem"]', '[data-component-type="s-search-result"]', // Amazon-like
              '[class*="product-tile"]', '[class*="tile-product"]',
              '[class*="product-wrapper"]', '[class*="product-container"]'
          ];
          let searchRoot: HTMLElement | null = linkElement.closest(cardSelectors.join(', '));
          
          if (!searchRoot) {
              // Fallback: go up from the link's parent a few levels
              let parent = linkElement.parentElement;
              for (let i = 0; i < 3 && parent; i++) {
                  if (parent.matches(cardSelectors.join(','))) {
                      searchRoot = parent;
                      break;
                  }
                  // Heuristic: if an element has an image, and some text, it might be a product card.
                  if (parent.querySelector('img') && parent.textContent && parent.textContent.trim().length > 10 && parent.textContent.trim().length < 3000) {
                      const area = parent.offsetWidth * parent.offsetHeight;
                      if (area > 1000 && area < 4000000) { 
                          searchRoot = parent;
                          break;
                      }
                  }
                  parent = parent.parentElement;
              }
              if (!searchRoot) searchRoot = linkElement.parentElement?.parentElement || linkElement.parentElement || linkElement;
          }
          if(!searchRoot) continue;

          // Selectors for name (prioritized)
          const nameSelectors = [
            '[itemprop="name"]',
            'h1[class*="name" i], h2[class*="name" i], h3[class*="name" i], h4[class*="name" i]', // Case-insensitive conceptually
            'div[class*="name" i], p[class*="name" i], span[class*="name" i]',
            '[data-testid*="product-name" i]', '[data-testid*="productTitle" i]',
            '[class*="product-title" i], [class*="ProductTitle" i]',
            '[class*="item-title" i], [class*="card-title" i]',
            'h1, h2, h3, h4, h5, h6'
          ];
          
          // Selectors for price (prioritized)
          const priceSelectors = [
            '[itemprop="price"]', '[itemprop="offers"] [itemprop="price"]',
            'span[class*="price" i], div[class*="price" i], p[class*="price" i]',
            '[data-testid*="price" i]',
            '[class*="amount" i]', '[class*="value" i]',
            '[class*="sale-price" i]', '[class*="offer-price" i]', '[class*="final-price"]'
          ];

          // Helper to find text using a list of selectors
          // Note: CSS selectors are case-sensitive. The "i" flag is conceptual.
          // For actual case-insensitivity, manual filtering or listing variants would be needed.
          // Here, we list common variants or rely on lowercase matching.
          const findText = (root: HTMLElement, selectors: string[], isPrice = false): string => {
            for (const selector of selectors) {
              const elements = Array.from(root.querySelectorAll(selector));
              for (const el of elements) {
                // Avoid getting text from the link that triggered the search if it's not the best source
                if (el === linkElement && elements.length > 1) continue;

                const text = el.textContent?.trim();
                if (text) {
                  if (isPrice) {
                    if (/\d/.test(text) && text.length < 60) return text; // Price needs a digit, not too long
                  } else {
                    if (text.length >= 3 && text.length < 250 && !/^\W*$/.test(text) && !/^\d[\d\s.,]*$/.test(text) ) return text; // Name: not just symbols or numbers
                  }
                }
              }
            }
            return '';
          };
          
          name = findText(searchRoot, nameSelectors.flatMap(s => [s.replace(' i]', ']'), s.replace(' i]', ']').replace(/class\*="([^"]+)"/, (match,p1) => `class*="${p1.charAt(0).toUpperCase() + p1.slice(1)}"`)]), false);
          
          if (!name && imgElement.alt) {
            const altText = imgElement.alt.trim();
            if (altText.length >= 3 && altText.length < 250 && !/^\W*$/.test(altText) && !/^\d[\d\s.,]*$/.test(altText)) {
              name = altText;
            }
          }

          price = findText(searchRoot, priceSelectors.flatMap(s => [s.replace(' i]', ']'), s.replace(' i]', ']').replace(/class\*="([^"]+)"/, (match,p1) => `class*="${p1.charAt(0).toUpperCase() + p1.slice(1)}"`)]), true);

          if (name && price && productLink) {
             if (name.length > 1 && /\d/.test(price)) { // Basic validation
              extractedProducts.push({
                  name: name,
                  price: price,
                  link: productLink,
              });
             }
          }
        }
        // Deduplicate products based on link
        const uniqueProducts = [];
        const seenLinks = new Set<string>();
        for (const prod of extractedProducts) {
            if (!seenLinks.has(prod.link)) {
                // Further deduplication: check if a similar product name already exists for a different link fragment
                const nameExists = uniqueProducts.some(up => up.name === prod.name && up.link.split('#')[0] === prod.link.split('#')[0]);
                if(!nameExists){
                    seenLinks.add(prod.link);
                    uniqueProducts.push(prod);
                }
            }
        }
        return uniqueProducts;
      });

      return products;
    } catch (error: any) {
      console.error('Error during scraping:', error.message ? error.message : error);
      // Return an empty array or rethrow if you want the caller to handle it specifically
      return []; 
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }
);

    