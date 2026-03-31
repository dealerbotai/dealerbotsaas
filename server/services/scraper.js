import * as cheerio from 'cheerio';
import { logger } from '../utils/logger.js';

export async function scrapeProducts(url, workspaceId) {
  try {
    if (!url || !isValidUrl(url)) {
      throw new Error('URL inválida');
    }

    logger.info('SCRAPER', `Conectando a: ${url}...`);
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Referer': 'https://www.google.com/'
      }
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: La web bloqueó el acceso.`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const baseUrl = new URL(url).origin;

    let products = [];
    
    // 1. JSON-LD (La más fiable)
    logger.info('SCRAPER', 'Buscando metadatos JSON-LD...');
    $('script[type="application/ld+json"]').each((_, el) => {
        try {
            const content = $(el).html();
            if (!content) return;
            const data = JSON.parse(content);
            
            const processItem = (item) => {
                if (!item) return;
                const type = item['@type'];
                const isProduct = type === 'Product' || (Array.isArray(type) && type.includes('Product'));
                
                if (isProduct) {
                    const name = item.name || '';
                    if (name.length < 2) return;

                    products.push({
                        id: generateProductId(name),
                        name: name,
                        description: item.description || '',
                        price: parseFloat(item.offers?.price || item.offers?.[0]?.price || 0) || 0,
                        image_url: resolveUrl(item.image?.[0] || item.image || '', baseUrl),
                        url: resolveUrl(item.url || '', baseUrl) || url,
                        category: item.category || ''
                    });
                }
            };

            if (Array.isArray(data)) {
                data.forEach(processItem);
            } else if (data['@graph'] && Array.isArray(data['@graph'])) {
                data['@graph'].forEach(processItem);
            } else if (data.itemListElement && Array.isArray(data.itemListElement)) {
                data.itemListElement.forEach(li => processItem(li.item));
            } else {
                processItem(data);
            }
        } catch (e) { }
    });

    // 2. DOM Scraping (Si no hubo JSON-LD suficiente)
    if (products.length < 2) {
        logger.info('SCRAPER', 'JSON-LD insuficiente, usando selectores DOM...');
        const containers = $('.product, .product-card, .product-item, .item, li.product, article, [class*="product-card"], [class*="item-card"]');
        
        containers.each((_, el) => {
            const $el = $(el);
            let name = $el.find('h1, h2, h3, h4, .title, .name, [class*="title"], [class*="name"]').first().text().trim();
            if (!name) name = $el.find('img').attr('alt')?.trim();

            const priceText = $el.find('[class*="price"], .price, [itemprop="price"]').text().trim();
            const priceMatches = priceText.match(/[\d.,]{2,}/);
            const price = priceMatches ? parseFloat(priceMatches[0].replace('.', '').replace(',', '.')) : 0;

            let imageUrl = $el.find('img').attr('src') || $el.find('img').attr('data-src') || '';
            
            if (name && name.length > 3 && (price > 0 || imageUrl)) {
                products.push({
                    id: generateProductId(name),
                    name,
                    description: $el.find('[class*="description"], .summary').text().trim().substring(0, 100),
                    price,
                    image_url: resolveUrl(imageUrl, baseUrl),
                    url: resolveUrl($el.find('a').attr('href') || '', baseUrl),
                    category: ''
                });
            }
        });
    }

    // 3. FALLBACK FINAL: Modo "Busca lo que sea"
    if (products.length === 0) {
        logger.warn('SCRAPER', 'No se encontraron productos estructurados, usando modo heurístico...');
        $('div').each((_, el) => {
            const $el = $(el);
            const hasImg = $el.find('img').length > 0;
            const text = $el.text().trim();
            const hasPrice = text.includes('$') || text.includes('€');
            
            if (hasImg && hasPrice && text.length < 300) {
                const name = $el.find('img').attr('alt')?.trim() || $el.find('a').text().trim().substring(0, 50);
                if (name && name.length > 5) {
                    products.push({
                        id: generateProductId(name),
                        name,
                        description: '',
                        price: 0,
                        image_url: resolveUrl($el.find('img').attr('src'), baseUrl),
                        url: resolveUrl($el.find('a').attr('href'), baseUrl),
                        category: ''
                    });
                }
            }
        });
    }

    // Limpieza final
    const uniqueProducts = Array.from(
      new Map(products.map(p => [p.name.toLowerCase(), p])).values()
    ).filter(p => p.name && p.name.length > 2);

    logger.success('SCRAPER', `✅ Escaneo finalizado: ${uniqueProducts.length} productos detectados`);

    return {
      success: true,
      products: uniqueProducts,
      total: uniqueProducts.length,
      source_url: url
    };

  } catch (error) {
    logger.error('SCRAPER', `Error en servicio de escaneo: ${error.message}`, error);
    throw error;
  }
}

function resolveUrl(url, base) {
    if (!url) return '';
    if (url.startsWith('data:')) return url;
    try {
        if (url.startsWith('http')) return url;
        if (url.startsWith('//')) return `https:${url}`;
        return new URL(url, base).href;
    } catch (e) {
        return url;
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
  return `sc_${Math.random().toString(36).substr(2, 5)}`;
}