export async function scrapeProducts(url, workspaceId) {
  try {
    // Validate URL
    if (!url || !isValidUrl(url)) {
      throw new Error('URL inválida');
    }

    // Fetch the page
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`Error al acceder a la URL: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Extract products based on common e-commerce patterns
    const products = [];
    
    // Try different selectors for product listings
    const productSelectors = [
      '[data-product]',
      '.product',
      '.item',
      '.product-item',
      '.product-card',
      '[itemtype*="Product"]',
      '.Product',
      '.product-list > div',
      '.products > div'
    ];

    let productElements = $();
    for (const selector of productSelectors) {
      const elements = $(selector);
      if (elements.length > 0) {
        productElements = elements;
        break;
      }
    }

    // If no specific product elements found, try to find repeated patterns
    if (productElements.length === 0) {
      // Look for repeated elements that might be products
      const allDivs = $('div');
      const repeatedClasses = new Map();
      
      allDivs.each((_, el) => {
        const className = $(el).attr('class');
        if (className) {
          repeatedClasses.set(className, (repeatedClasses.get(className) || 0) + 1);
        }
      });

      // Find classes that appear multiple times (likely product cards)
      const productClass = Array.from(repeatedClasses.entries())
        .filter(([_, count]) => count >= 2 && count <= 20)
        .sort((a, b) => b[1] - a[1])[0]?.[0];

      if (productClass) {
        productElements = $(`.${productClass}`);
      }
    }

    // Extract product data
    productElements.slice(0, 50).each((_, element) => {
      const $el = $(element);
      
      // Try to extract product information
      const name = $el.find('h1, h2, h3, h4, .title, .name, .product-title, .product-name').first().text().trim() ||
                   $el.find('a').first().attr('title')?.trim() ||
                   $el.find('img').first().attr('alt')?.trim() ||
                   'Producto sin nombre';

      const priceText = $el.find('.price, .product-price, .current-price, [itemprop="price"]').first().text().trim();
      const price = parseFloat(priceText.replace(/[^\d.,]/g, '').replace(',', '.')) || 0;

      const imageUrl = $el.find('img').first().attr('src') ||
                       $el.find('img').first().attr('data-src') ||
                       $el.find('img').first().attr('data-lazy-src') ||
                       '';

      const description = $el.find('.description, .product-description, .short-description').first().text().trim().substring(0, 200);

      if (name && name !== 'Producto sin nombre') {
        products.push({
          id: generateProductId(name),
          name,
          description,
          price,
          image_url: imageUrl,
          url: $el.find('a').first().attr('href') || '',
          category: extractCategory($el)
        });
      }
    });

    // Deduplicate products
    const uniqueProducts = Array.from(
      new Map(products.map(p => [p.name.toLowerCase(), p])).values()
    );

    return {
      success: true,
      products: uniqueProducts,
      total: uniqueProducts.length,
      source_url: url
    };

  } catch (error) {
    console.error('Scraping error:', error);
    throw error;
  }
}

function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

function generateProductId(name) {
  return `scraped_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function extractCategory($el) {
  // Try to find category in breadcrumbs or meta tags
  const category = $el.find('[itemprop="category"], .category, .product-category').first().text().trim();
  return category || '';
}