import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';
import type { HTTPResponse } from 'puppeteer';

interface ScrapedData {
  url: string;
  title: string;
  metaDescription: string | null;
  metaKeywords: string | null;
  canonicalUrl: string | null;
  openGraph: Record<string, string>;
  twitterCard: Record<string, string>;
  structuredData: string[];
  robotsMeta: string | null;
  favicon: string | null;
  alternateHreflangs: string[];
  headings: Array<{ tag: string; text: string }>;
  mainHeadings: string[];
  heroImage: string | null;
  testimonials: string[];
  pricing: {
    packages: Array<{
      name: string;
      price: string;
      features: string[];
    }>;
  };
  ctaElements: string[];
  internalLinks: string[];
  externalLinks: string[];
  imageAlts: Array<{ src: string; alt: string }>;
  pageLoadTimeMs: number;
  screenshotPath?: string | null;
  screenshotBase64?: string;
  timestamp?: string;
}

export interface EnhancedScrapedData extends ScrapedData {
  statusCode: number;
  headers: Record<string, string>;
  sitemapUrls?: string[];
  robotsTxt?: string | null;
  wordCount: number;
  textToHtmlRatio: number;
  metaRobotsTags: {
    index: boolean;
    follow: boolean;
    other: string[];
  };
  urlAnalysis: {
    length: number;
    parameters: Record<string, string>;
    isSeoFriendly: boolean;
  };
  parsedSchemaTypes: string[];
  linkAnalysis: {
    brokenLinks: string[];
    nofollowLinks: string[];
    downloadLinks: string[];
    anchorTextFrequency: Record<string, number>;
  };
  imageAnalysis: {
    unoptimizedImages: Array<{ src: string; size: number; dimensions: string }>;
    missingAltText: string[];
    lazyLoadedImages: string[];
  };
  security: {
    isHttps: boolean;
    hasMixedContent: boolean;
    securityHeaders: Record<string, string | null>;
  };
  accessibility: {
    missingFormLabels: number;
    ariaAttributes: number;
    emptyLinks: number;
  };
  pagination: {
    prevUrl: string | null;
    nextUrl: string | null;
  };
  breadcrumbs: string[];
  coreWebVitals: {
    lcp: number | null;
    cls: number | null;
    fid: number | null;
  };
  keywordDensity: Record<string, number>;
  pageSpeed: {
    resourceSizes: Record<string, number>;
    totalRequestSize: number;
    slowResources: Array<{ url: string; duration: number }>;
  };
}

// Helper functions for extracting data
function extractOpenGraph($: cheerio.CheerioAPI): Record<string, string> {
  const openGraph: Record<string, string> = {};
  $('meta[property^="og:"]').each((_, element) => {
    const property = $(element).attr('property');
    const content = $(element).attr('content');
    if (property && content) {
      openGraph[property] = content;
    }
  });
  return openGraph;
}

function extractTwitterCard($: cheerio.CheerioAPI): Record<string, string> {
  const twitterCard: Record<string, string> = {};
  $('meta[name^="twitter:"]').each((_, element) => {
    const name = $(element).attr('name');
    const content = $(element).attr('content');
    if (name && content) {
      twitterCard[name] = content;
    }
  });
  return twitterCard;
}

function extractStructuredData($: cheerio.CheerioAPI): string[] {
  const structuredData: string[] = [];
  $('script[type="application/ld+json"]').each((_, element) => {
    structuredData.push($(element).html() || '');
  });
  return structuredData;
}

function extractHeadings($: cheerio.CheerioAPI): Array<{ tag: string; text: string }> {
  const headings: Array<{ tag: string; text: string }> = [];
  $('h1, h2, h3, h4, h5, h6').each((_, element) => {
    // Get the tag name safely
    const tag = element.type === 'tag' ? element.tagName || '' : '';
    const text = $(element).text().trim();
    if (text) {
      headings.push({ tag, text });
    }
  });
  return headings;
}

function extractMainHeadings($: cheerio.CheerioAPI): string[] {
  const mainHeadings: string[] = [];
  $('h1').each((_, element) => {
    const text = $(element).text().trim();
    if (text) {
      mainHeadings.push(text);
    }
  });
  return mainHeadings;
}

function extractTestimonials($: cheerio.CheerioAPI): string[] {
  // This is a heuristic approach to find testimonials
  const testimonials: string[] = [];
  
  // Look for elements that might contain testimonials
  $('.testimonial, .review, blockquote, .quote, [class*="testimonial"], [class*="review"]').each((_, element) => {
    const text = $(element).text().trim();
    if (text) {
      testimonials.push(text);
    }
  });
  
  return testimonials;
}

function extractPricing($: cheerio.CheerioAPI): { packages: Array<{ name: string; price: string; features: string[] }> } {
  const pricingPackages: Array<{ name: string; price: string; features: string[] }> = [];
  
  // Look for pricing tables or elements containing pricing information
  $('.pricing, .price, .plan, [class*="pricing"], [class*="price"], [class*="plan"]').each((_, element) => {
    const packageElement = $(element);
    
    // Extract package name
    const nameElement = packageElement.find('.name, .title, h2, h3, [class*="name"], [class*="title"]').first();
    const name = nameElement.text().trim() || 'Unnamed Package';
    
    // Extract price
    const priceElement = packageElement.find('.price, [class*="price"]').first();
    const price = priceElement.text().trim() || 'No price listed';
    
    // Extract features
    const features: string[] = [];
    packageElement.find('li, .feature, [class*="feature"]').each((_, featureElement) => {
      const feature = $(featureElement).text().trim();
      if (feature) {
        features.push(feature);
      }
    });
    
    pricingPackages.push({ name, price, features });
  });
  
  return { packages: pricingPackages };
}

function extractCTAElements($: cheerio.CheerioAPI): string[] {
  const ctaElements: string[] = [];
  
  // Look for common CTA elements
  $('a.btn, button, .cta, [class*="cta"], a[class*="button"], button[class*="button"]').each((_, element) => {
    const text = $(element).text().trim();
    if (text) {
      ctaElements.push(text);
    }
  });
  
  return ctaElements;
}

function extractLinks($: cheerio.CheerioAPI, baseUrl: string): { internal: string[]; external: string[] } {
  const internal: string[] = [];
  const external: string[] = [];
  
  const urlObj = new URL(baseUrl);
  const domain = urlObj.hostname;
  
  $('a[href]').each((_, element) => {
    const href = $(element).attr('href');
    if (!href || href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:')) {
      return;
    }
    
    try {
      const absoluteUrl = new URL(href, baseUrl).href;
      const linkDomain = new URL(absoluteUrl).hostname;
      
      if (linkDomain === domain) {
        if (!internal.includes(absoluteUrl)) {
          internal.push(absoluteUrl);
        }
      } else {
        if (!external.includes(absoluteUrl)) {
          external.push(absoluteUrl);
        }
      }
    } catch (error) {
      console.warn(`Error processing link: ${href}`, error);
    }
  });
  
  return { internal, external };
}

function extractImageAlts($: cheerio.CheerioAPI, baseUrl: string): Array<{ src: string; alt: string }> {
  const imageAlts: Array<{ src: string; alt: string }> = [];
  
  $('img[src]').each((_, element) => {
    const src = $(element).attr('src');
    const alt = $(element).attr('alt') || '';
    
    if (src) {
      try {
        const absoluteSrc = new URL(src, baseUrl).href;
        imageAlts.push({ src: absoluteSrc, alt });
      } catch (error) {
        console.warn(`Error processing image source: ${src}`, error);
      }
    }
  });
  
  return imageAlts;
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function calculateSeoFriendlyUrl(url: string): boolean {
  const urlObj = new URL(url);
  const path = urlObj.pathname.toLowerCase();
  
  // Check for length (not too long)
  if (path.length > 100) return false;
  
  // Check for kebab-case words (preferred for SEO)
  const hasKebabCase = /[a-z0-9]+-[a-z0-9]+/.test(path);
  
  // Check for readable words versus random strings/numbers
  const hasReadableWords = /[a-z]{3,}/.test(path);
  
  // Check for absence of excessive numbers or special characters
  const noExcessiveSpecialChars = !/[_!@#$%^&*()=+[\]{}|\\;:'",<>?]+/.test(path);
  
  // A SEO-friendly URL typically has readable words in kebab case without excessive special chars
  return hasReadableWords && noExcessiveSpecialChars && (hasKebabCase || path.split('/').length > 2);
}

function analyzeUrl(url: string): {
  length: number;
  parameters: Record<string, string>;
  isSeoFriendly: boolean;
} {
  const urlObj = new URL(url);
  const parameters: Record<string, string> = {};
  
  urlObj.searchParams.forEach((value, key) => {
    parameters[key] = value;
  });
  
  return {
    length: url.length,
    parameters,
    isSeoFriendly: calculateSeoFriendlyUrl(url)
  };
}

function extractSchemaTypes(structuredData: string[]): string[] {
  const types: string[] = [];
  
  for (const data of structuredData) {
    try {
      const parsed = JSON.parse(data);
      if (parsed['@type']) {
        if (Array.isArray(parsed['@type'])) {
          types.push(...parsed['@type']);
        } else {
          types.push(parsed['@type']);
        }
      }
      
      // Handle nested types in graph arrays
      if (parsed['@graph'] && Array.isArray(parsed['@graph'])) {
        for (const item of parsed['@graph']) {
          if (item['@type']) {
            if (Array.isArray(item['@type'])) {
              types.push(...item['@type']);
            } else {
              types.push(item['@type']);
            }
          }
        }
      }
    } catch (error) {
      console.warn('Error parsing structured data:', error);
    }
  }
  
  // Convert Set to Array using Array.from() for better TypeScript compatibility
  return Array.from(new Set(types));
}

// Add this helper function to sanitize map keys (for MongoDB compatibility)
function sanitizeMapKeys<T>(obj: Record<string, T>): Record<string, T> {
  const sanitized: Record<string, T> = {};
  
  Object.entries(obj).forEach(([key, value]) => {
    // Replace dots with underscores to make MongoDB happy
    const sanitizedKey = key.replace(/\./g, '_');
    sanitized[sanitizedKey] = value;
  });
  
  return sanitized;
}

export async function scrapeEnhancedSeoData(url: string): Promise<EnhancedScrapedData> {
  console.log(`==========================================`);
  console.log(`🔍 STARTING ENHANCED SCRAPE: ${url}`);
  console.log(`==========================================`);
  
  const timestamp = new Date().toISOString();
  const startTime = Date.now();
  let pageResponse: HTTPResponse | null = null;
  
  // Initialize a browser instance
  console.log(`📊 Launching headless browser...`);
  const browser = await puppeteer.launch({
    headless: true, // Changed from "new" to true for TypeScript compatibility
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });
  
  try {
    // Create a new page
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    console.log(`📊 Browser launched and page created successfully`);
    
    // Set a reasonable timeout
    page.setDefaultNavigationTimeout(30000);
    
    // Navigate to the URL
    console.log(`📊 Navigating to URL: ${url}`);
    try {
      // Increase timeout to 60 seconds
      pageResponse = await page.goto(url, { 
        waitUntil: 'networkidle2',
        timeout: 60000 // 60 seconds instead of default 30
      });
      
      if (!pageResponse) {
        throw new Error(`Failed to load ${url}`);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.log(`⚠️ Navigation issue with ${url}: ${errorMessage}`);
      // Add retry logic
      console.log(`🔄 Retrying navigation to ${url}...`);
      try {
        pageResponse = await page.goto(url, { 
          waitUntil: 'domcontentloaded', // Less strict wait condition
          timeout: 90000 // 90 seconds for retry
        });
        
        if (!pageResponse) {
          throw new Error(`Failed to load ${url} on retry`);
        }
      } catch (retryError: unknown) {
        const retryErrorMessage = retryError instanceof Error ? retryError.message : String(retryError);
        throw new Error(`Failed to navigate to ${url} after retry: ${retryErrorMessage}`);
      }
    }
    
    console.log(`📊 Page loaded successfully with status: ${pageResponse.status()}`);
    const statusCode = pageResponse.status();
    const headers: Record<string, string> = {};
    
    // Extract headers
    const responseHeaders = pageResponse.headers();
    Object.keys(responseHeaders).forEach(key => {
      headers[key] = responseHeaders[key];
    });
    console.log(`📊 Extracted ${Object.keys(headers).length} HTTP headers`);
    
    // Take a screenshot
    console.log(`📊 Taking screenshot of the page...`);

    // Only capture screenshot as base64 for database storage, don't save to disk
    const screenshotBase64 = await page.screenshot({ 
      encoding: "base64", 
      type: "jpeg", 
      quality: 80 
    }) as string;
    console.log(`📊 Screenshot captured in base64 format (${screenshotBase64.length} characters)`);
    
    // Get the HTML content
    console.log(`📊 Extracting HTML content...`);
    const htmlContent = await page.content();
    console.log(`📊 Extracted ${htmlContent.length} characters of HTML`);
    
    // Load the HTML into cheerio for easier parsing
    const $ = cheerio.load(htmlContent) as cheerio.CheerioAPI;
    
    // Basic SEO data
    console.log(`📊 Extracting basic SEO metadata...`);
    const title = $('title').text().trim();
    const metaDescription = $('meta[name="description"]').attr('content') || null;
    const metaKeywords = $('meta[name="keywords"]').attr('content') || null;
    const canonicalUrl = $('link[rel="canonical"]').attr('href') || null;
    const robotsMeta = $('meta[name="robots"]').attr('content') || null;
    const favicon = $('link[rel="icon"], link[rel="shortcut icon"]').attr('href') || null;
    console.log(`📊 Title: "${title}"`);
    console.log(`📊 Meta Description: ${metaDescription ? `"${metaDescription.substring(0, 50)}..."` : 'None'}`);
    
    // Extract hreflang links
    console.log(`📊 Extracting hreflang links...`);
    const alternateHreflangs: string[] = [];
    $('link[rel="alternate"][hreflang]').each((_, element) => {
      const href = $(element).attr('href');
      if (href) {
        alternateHreflangs.push(href);
      }
    });
    console.log(`📊 Found ${alternateHreflangs.length} hreflang links`);
    
    // Extract social media meta tags
    console.log(`📊 Extracting social media metadata...`);
    const openGraph = extractOpenGraph($);
    const twitterCard = extractTwitterCard($);
    console.log(`📊 Found ${Object.keys(openGraph).length} Open Graph tags`);
    console.log(`📊 Found ${Object.keys(twitterCard).length} Twitter Card tags`);
    
    // Extract structured data
    console.log(`📊 Extracting structured data...`);
    const structuredData = extractStructuredData($);
    console.log(`📊 Found ${structuredData.length} structured data blocks`);
    
    // Extract headings
    console.log(`📊 Extracting headings...`);
    const headings = extractHeadings($);
    const mainHeadings = extractMainHeadings($);
    console.log(`📊 Found ${headings.length} headings (${mainHeadings.length} main headings)`);
    
    // Find the hero image
    console.log(`📊 Identifying hero image...`);
    const heroImage = $('header img, .hero img, .banner img, [class*="hero"] img, [class*="banner"] img').first().attr('src') || 
                      $('.hero, .banner, [class*="hero"], [class*="banner"]').css('background-image')?.replace(/url\(['"]?(.*?)['"]?\)/i, '$1') || 
                      null;
    console.log(`📊 Hero image: ${heroImage ? 'Found' : 'Not found'}`);
    
    // Extract other important elements
    console.log(`📊 Extracting page components...`);
    const testimonials = extractTestimonials($);
    const pricing = extractPricing($);
    const ctaElements = extractCTAElements($);
    console.log(`📊 Found ${testimonials.length} testimonials`);
    console.log(`📊 Found ${pricing.packages.length} pricing packages`);
    console.log(`📊 Found ${ctaElements.length} CTA elements`);
    
    // Extract links
    console.log(`📊 Analyzing links...`);
    const { internal: internalLinks, external: externalLinks } = extractLinks($, url);
    console.log(`📊 Found ${internalLinks.length} internal links and ${externalLinks.length} external links`);
    
    // Extract images with alt text
    console.log(`📊 Analyzing images...`);
    const imageAlts = extractImageAlts($, url);
    console.log(`📊 Found ${imageAlts.length} images`);
    
    // Page load time
    const pageLoadTimeMs = Date.now() - startTime;
    console.log(`📊 Page load time: ${pageLoadTimeMs}ms`);
    
    // Count words in the visible text
    console.log(`📊 Analyzing text content...`);
    const bodyText = $('body').text().trim();
    const wordCount = countWords(bodyText);
    console.log(`📊 Word count: ${wordCount}`);
    
    // Calculate text to HTML ratio
    const textToHtmlRatio = bodyText.length / htmlContent.length;
    console.log(`📊 Text-to-HTML ratio: ${textToHtmlRatio.toFixed(4)}`);
    
    // Parse robots meta tag
    console.log(`📊 Analyzing robots directives...`);
    const metaRobotsTags = {
      index: !robotsMeta || !robotsMeta.includes('noindex'),
      follow: !robotsMeta || !robotsMeta.includes('nofollow'),
      other: robotsMeta ? 
        robotsMeta.split(',')
          .map(directive => directive.trim())
          .filter(directive => !['index', 'noindex', 'follow', 'nofollow'].includes(directive)) 
        : []
    };
    console.log(`📊 Robots meta: index=${metaRobotsTags.index}, follow=${metaRobotsTags.follow}`);
    
    // Analyze URL structure
    console.log(`📊 Analyzing URL structure...`);
    const urlAnalysis = analyzeUrl(url);
    console.log(`📊 URL length: ${urlAnalysis.length}, SEO-friendly: ${urlAnalysis.isSeoFriendly}`);
    
    // Extract schema types from structured data
    console.log(`📊 Extracting schema types...`);
    const parsedSchemaTypes = extractSchemaTypes(structuredData);
    console.log(`📊 Found schema types: ${parsedSchemaTypes.join(', ') || 'None'}`);
    
    // Analyze links
    console.log(`📊 Performing detailed link analysis...`);
    const linkAnalysis = {
      brokenLinks: [], // Would need to check each link which is too time-consuming
      nofollowLinks: $('a[rel*="nofollow"]').map((_, el) => $(el).attr('href') || '').get(),
      downloadLinks: $('a[href$=".pdf"], a[href$=".doc"], a[href$=".docx"], a[href$=".xls"], a[href$=".xlsx"], a[href$=".zip"], a[href$=".rar"]')
        .map((_, el) => $(el).attr('href') || '').get(),
      anchorTextFrequency: {} as Record<string, number>
    };
    console.log(`📊 Found ${linkAnalysis.nofollowLinks.length} nofollow links`);
    console.log(`📊 Found ${linkAnalysis.downloadLinks.length} download links`);
    
    // Count anchor text frequency
    $('a').each((_, element) => {
      const text = $(element).text().trim();
      if (text) {
        // Sanitize the anchor text itself before using as key
        const sanitizedText = text.replace(/\./g, '_');
        linkAnalysis.anchorTextFrequency[sanitizedText] = (linkAnalysis.anchorTextFrequency[sanitizedText] || 0) + 1;
      }
    });
    console.log(`📊 Analyzed ${Object.keys(linkAnalysis.anchorTextFrequency).length} unique anchor texts`);
    
    // Analyze images
    console.log(`📊 Performing detailed image analysis...`);
    const imageAnalysis = {
      unoptimizedImages: [], // Would need to check image sizes
      missingAltText: $('img:not([alt]), img[alt=""]').map((_, el) => $(el).attr('src') || '').get(),
      lazyLoadedImages: $('img[loading="lazy"], img[data-src], img[data-lazy-src]').map((_, el) => $(el).attr('src') || '').get()
    };
    console.log(`📊 Found ${imageAnalysis.missingAltText.length} images missing alt text`);
    console.log(`📊 Found ${imageAnalysis.lazyLoadedImages.length} lazy-loaded images`);
    
    // Check for HTTPS and mixed content
    console.log(`📊 Analyzing security aspects...`);
    const security = {
      isHttps: url.startsWith('https://'),
      hasMixedContent: htmlContent.includes('http://') && url.startsWith('https://'),
      securityHeaders: {
        'Content-Security-Policy': headers['content-security-policy'] || null,
        'X-XSS-Protection': headers['x-xss-protection'] || null
      }
    };
    console.log(`📊 HTTPS: ${security.isHttps}, Mixed Content: ${security.hasMixedContent}`);
    
    // Analyze accessibility
    console.log(`📊 Analyzing accessibility...`);
    const accessibility = {
      missingFormLabels: $('input:not([type="hidden"]):not([aria-label]):not([aria-labelledby])').not('input[id]:has(label[for])').length,
      ariaAttributes: $('[aria-label], [aria-labelledby], [aria-describedby], [role]').length,
      emptyLinks: $('a:not(:has(*)):empty, a:contains(" ")').length
    };
    console.log(`📊 Found ${accessibility.missingFormLabels} form fields missing labels`);
    console.log(`📊 Found ${accessibility.ariaAttributes} ARIA attributes`);
    console.log(`📊 Found ${accessibility.emptyLinks} empty links`);
    
    // Extract pagination links
    console.log(`📊 Detecting pagination...`);
    const pagination = {
      prevUrl: $('link[rel="prev"]').attr('href') || $('a[rel="prev"]').attr('href') || null,
      nextUrl: $('link[rel="next"]').attr('href') || $('a[rel="next"]').attr('href') || null
    };
    console.log(`📊 Pagination: prev=${pagination.prevUrl ? 'Found' : 'None'}, next=${pagination.nextUrl ? 'Found' : 'None'}`);
    
    // Extract breadcrumbs
    console.log(`📊 Extracting breadcrumbs...`);
    const breadcrumbs: string[] = [];
    $('.breadcrumb, .breadcrumbs, [itemtype*="BreadcrumbList"] [itemprop="name"]').each((_, element) => {
      const text = $(element).text().trim();
      if (text) {
        breadcrumbs.push(text);
      }
    });
    console.log(`📊 Found ${breadcrumbs.length} breadcrumb items`);
    
    // Core Web Vitals - this is a rough approximation, real values would need real user monitoring
    console.log(`📊 Estimating Core Web Vitals...`);
    const coreWebVitals = {
      lcp: null, // Largest Contentful Paint
      cls: null, // Cumulative Layout Shift
      fid: null  // First Input Delay
    };
    
    // Calculate keyword density for top words
    console.log(`📊 Calculating keyword density...`);
    const keywordDensity: Record<string, number> = {};
    const words = bodyText.toLowerCase().split(/\W+/).filter(word => word.length > 3);
    const wordCount2 = words.length;
    
    const wordFrequency: Record<string, number> = {};
    words.forEach(word => {
      wordFrequency[word] = (wordFrequency[word] || 0) + 1;
    });
    
    // Get top 20 keywords by frequency
    Object.entries(wordFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .forEach(([word, count]) => {
        keywordDensity[word] = count / wordCount2;
      });
    console.log(`📊 Analyzed top ${Object.keys(keywordDensity).length} keywords by density`);
    
    // Resource size analysis (simplified approximation)
    console.log(`📊 Analyzing page resources...`);
    const pageSpeed = {
      resourceSizes: {
        'js': 0,  // JavaScript size
        'css': 0, // CSS size
        'images': 0 // Images size
      },
      totalRequestSize: 0,
      slowResources: []
    };
    
    // Combine all data
    console.log(`📊 Compiling all analyzed data...`);
    
    const result: EnhancedScrapedData = {
      url,
      title,
      metaDescription,
      metaKeywords,
      canonicalUrl,
      openGraph: sanitizeMapKeys(openGraph),
      twitterCard: sanitizeMapKeys(twitterCard),
      structuredData,
      robotsMeta,
      favicon,
      alternateHreflangs,
      headings,
      mainHeadings,
      heroImage,
      testimonials,
      pricing,
      ctaElements,
      internalLinks,
      externalLinks,
      imageAlts,
      pageLoadTimeMs,
      // No local file path anymore, only store base64
      screenshotPath: null,
      screenshotBase64,
      timestamp,
      // Enhanced data
      statusCode,
      headers: sanitizeMapKeys(headers),
      wordCount,
      textToHtmlRatio,
      metaRobotsTags,
      urlAnalysis: {
        ...urlAnalysis,
        parameters: sanitizeMapKeys(urlAnalysis.parameters)
      },
      parsedSchemaTypes,
      linkAnalysis: {
        ...linkAnalysis,
        anchorTextFrequency: sanitizeMapKeys(linkAnalysis.anchorTextFrequency)
      },
      imageAnalysis,
      security,
      accessibility,
      pagination,
      breadcrumbs,
      coreWebVitals,
      keywordDensity: sanitizeMapKeys(keywordDensity),
      pageSpeed: {
        ...pageSpeed,
        resourceSizes: sanitizeMapKeys(pageSpeed.resourceSizes)
      }
    };
    
    console.log(`✅ Successfully completed enhanced scraping for: ${url}`);
    console.log(`📊 Total scraping time: ${Date.now() - startTime}ms`);
    console.log(`==========================================`);
    
    return result;
  } catch (error) {
    console.error(`❌ ERROR during enhanced scraping of ${url}:`, error);
    console.log(`==========================================`);
    throw error;
  } finally {
    await browser.close();
    console.log(`📊 Browser closed`);
  }
} 