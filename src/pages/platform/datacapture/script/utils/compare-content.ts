import { Schema } from 'mongoose';
import { ScrapedContentType } from '../../../../../schemas/data-capture/scraped-content.schema';
import { PageComparisonType } from '../../../../../schemas/data-capture/page-comparison.schema';

interface ChangedArrayElement<T> {
  index: number;
  previous: T | undefined;
  current: T | undefined;
}

export interface ArrayDiffResult<T> {
  changed: boolean;
  changes: ChangedArrayElement<T>[];
}

function compareArrays<T>(previous: T[], current: T[]): ArrayDiffResult<T> {
  const prevArr = previous || [];
  const currArr = current || [];
  const maxLength = Math.max(prevArr.length, currArr.length);
  const changes: ChangedArrayElement<T>[] = [];
  
  for (let i = 0; i < maxLength; i++) {
    if (JSON.stringify(prevArr[i]) !== JSON.stringify(currArr[i])) {
      changes.push({
        index: i,
        previous: prevArr[i],
        current: currArr[i],
      });
    }
  }
  
  return {
    changed: changes.length > 0,
    changes,
  };
}

function compareStrings(previous: string | undefined, current: string | undefined): {
  changed: boolean;
  previous: string;
  current: string;
} {
  const prevValue = previous || '';
  const currValue = current || '';
  
  return {
    changed: prevValue !== currValue,
    previous: prevValue,
    current: currValue
  };
}

function compareNumbers(previous: number | undefined | null, current: number | undefined | null): {
  changed: boolean;
  previous: number;
  current: number;
} {
  const prevValue = previous === undefined || previous === null ? 0 : previous;
  const currValue = current === undefined || current === null ? 0 : current;
  
  return {
    changed: prevValue !== currValue,
    previous: prevValue,
    current: currValue
  };
}

function compareBooleans(previous: boolean | undefined, current: boolean | undefined): {
  changed: boolean;
  previous: boolean | null;
  current: boolean | null;
} {
  const prevValue = previous === undefined ? null : previous;
  const currValue = current === undefined ? null : current;
  
  return {
    changed: prevValue !== currValue,
    previous: prevValue,
    current: currValue
  };
}

function comparePricing(previous: ScrapedContentType, current: ScrapedContentType): {
  changed: boolean;
  details: string;
} {
  const prevPricing = previous.pricing?.packages || [];
  const currPricing = current.pricing?.packages || [];
  
  if (!prevPricing.length && !currPricing.length) {
    return { changed: false, details: 'No pricing information available' };
  }
  
  if (prevPricing.length !== currPricing.length) {
    return {
      changed: true,
      details: `Package count changed: ${prevPricing.length} → ${currPricing.length}`
    };
  }
  
  const changes: string[] = [];
  
  for (let i = 0; i < currPricing.length; i++) {
    const prevPackage = prevPricing[i];
    const currPackage = currPricing[i];
    
    if (!prevPackage || !currPackage) continue;
    
    if (prevPackage.name !== currPackage.name) {
      changes.push(`Package name changed: "${prevPackage.name}" → "${currPackage.name}"`);
    }
    
    if (prevPackage.price !== currPackage.price) {
      changes.push(`Price changed for "${currPackage.name}": ${prevPackage.price} → ${currPackage.price}`);
    }
    
    const featureComparison = compareArrays(
      prevPackage.features || [],
      currPackage.features || []
    );
    
    if (featureComparison.changed) {
      changes.push(`Features changed for "${currPackage.name}": previous=[${featureComparison.changes.map(c => c.previous).join(', ')}], current=[${featureComparison.changes.map(c => c.current).join(', ')}]`);
    }
  }
  
  return {
    changed: changes.length > 0,
    details: changes.length ? changes.join('; ') : 'No pricing changes detected'
  };
}

function compareSeoMetadata(previous: ScrapedContentType, current: ScrapedContentType): {
  changed: boolean;
  metaKeywords: { changed: boolean; previous: string; current: string };
  canonicalUrl: { changed: boolean; previous: string; current: string };
  robotsMeta: { changed: boolean; previous: string; current: string };
  openGraph: { changed: boolean; details: string; previous: Record<string, string>; current: Record<string, string> };
  twitterCard: { changed: boolean; details: string; previous: Record<string, string>; current: Record<string, string> };
} {
  const metaKeywords = compareStrings(previous.metaKeywords, current.metaKeywords);
  const canonicalUrl = compareStrings(previous.canonicalUrl, current.canonicalUrl);
  const robotsMeta = compareStrings(previous.robotsMeta, current.robotsMeta);
  
  const prevOg = previous.openGraph || {};
  const currOg = current.openGraph || {};
  const ogChanges: string[] = [];
  
  const ogKeys = Array.from(new Set([...Object.keys(prevOg), ...Object.keys(currOg)]));
  
  for (const key of ogKeys) {
    const prevValue = prevOg[key] || '';
    const currValue = currOg[key] || '';
    
    if (prevValue !== currValue) {
      ogChanges.push(`OpenGraph "${key}": "${prevValue}" → "${currValue}"`);
    }
  }
  
  const prevTwitter = previous.twitterCard || {};
  const currTwitter = current.twitterCard || {};
  const twitterChanges: string[] = [];
  
  const twitterKeys = Array.from(new Set([...Object.keys(prevTwitter), ...Object.keys(currTwitter)]));
  
  for (const key of twitterKeys) {
    const prevValue = prevTwitter[key] || '';
    const currValue = currTwitter[key] || '';
    
    if (prevValue !== currValue) {
      twitterChanges.push(`Twitter Card "${key}": "${prevValue}" → "${currValue}"`);
    }
  }
  
  return {
    changed: metaKeywords.changed || canonicalUrl.changed || robotsMeta.changed || 
             ogChanges.length > 0 || twitterChanges.length > 0,
    metaKeywords,
    canonicalUrl,
    robotsMeta,
    openGraph: {
      changed: ogChanges.length > 0,
      details: ogChanges.join('; '),
      previous: prevOg,
      current: currOg
    },
    twitterCard: {
      changed: twitterChanges.length > 0,
      details: twitterChanges.join('; '),
      previous: prevTwitter,
      current: currTwitter
    }
  };
}

function comparePerformanceMetrics(previous: ScrapedContentType, current: ScrapedContentType): {
  changed: boolean;
  pageLoadTimeMs: { changed: boolean; previous: number; current: number };
  wordCount: { changed: boolean; previous: number; current: number };
  textToHtmlRatio: { changed: boolean; previous: number; current: number };
  coreWebVitals: {
    changed: boolean;
    lcp: { changed: boolean; previous: number; current: number };
    cls: { changed: boolean; previous: number; current: number };
    fid: { changed: boolean; previous: number; current: number };
    previous: Record<string, number>;
    current: Record<string, number>;
  };
} {
  // Convert any null or undefined values to 0
  const prevLoadTime = previous.pageLoadTimeMs ?? 0;
  const currLoadTime = current.pageLoadTimeMs ?? 0;
  const prevWordCount = previous.wordCount ?? 0;
  const currWordCount = current.wordCount ?? 0;
  const prevRatio = previous.textToHtmlRatio ?? 0;
  const currRatio = current.textToHtmlRatio ?? 0;
  
  const pageLoadTimeMs = {
    changed: prevLoadTime !== currLoadTime,
    previous: prevLoadTime,
    current: currLoadTime
  };
  
  const wordCount = {
    changed: prevWordCount !== currWordCount,
    previous: prevWordCount,
    current: currWordCount
  };
  
  const textToHtmlRatio = {
    changed: prevRatio !== currRatio,
    previous: prevRatio,
    current: currRatio
  };
  
  const prevVitals = previous.coreWebVitals || { lcp: null, cls: null, fid: null };
  const currVitals = current.coreWebVitals || { lcp: null, cls: null, fid: null };
  
  const prevLcp = prevVitals.lcp ?? 0;
  const currLcp = currVitals.lcp ?? 0;
  const prevCls = prevVitals.cls ?? 0;
  const currCls = currVitals.cls ?? 0;
  const prevFid = prevVitals.fid ?? 0;
  const currFid = currVitals.fid ?? 0;
  
  const lcp = {
    changed: prevLcp !== currLcp,
    previous: prevLcp,
    current: currLcp
  };
  
  const cls = {
    changed: prevCls !== currCls,
    previous: prevCls,
    current: currCls
  };
  
  const fid = {
    changed: prevFid !== currFid,
    previous: prevFid,
    current: currFid
  };
  
  const vitalsChanged = lcp.changed || cls.changed || fid.changed;
  
  return {
    changed: pageLoadTimeMs.changed || wordCount.changed || textToHtmlRatio.changed || vitalsChanged,
    pageLoadTimeMs,
    wordCount,
    textToHtmlRatio,
    coreWebVitals: {
      changed: vitalsChanged,
      lcp,
      cls,
      fid,
      previous: {
        lcp: prevLcp,
        cls: prevCls,
        fid: prevFid
      },
      current: {
        lcp: currLcp,
        cls: currCls,
        fid: currFid
      }
    }
  };
}

/**
 * Compares security and accessibility metrics
 */
function compareSecurityAndAccessibility(previous: ScrapedContentType, current: ScrapedContentType): {
  changed: boolean;
  security: {
    changed: boolean;
    isHttps: { changed: boolean; previous: boolean | null; current: boolean | null };
    hasMixedContent: { changed: boolean; previous: boolean | null; current: boolean | null };
    previous: Record<string, boolean>;
    current: Record<string, boolean>;
  };
  accessibility: {
    changed: boolean;
    missingFormLabels: { changed: boolean; previous: number | null; current: number | null };
    ariaAttributes: { changed: boolean; previous: number | null; current: number | null };
    emptyLinks: { changed: boolean; previous: number | null; current: number | null };
    previous: Record<string, boolean>;
    current: Record<string, boolean>;
  };
} {
  // Compare security fields
  const prevSecurity = previous.security || { isHttps: false, hasMixedContent: false };
  const currSecurity = current.security || { isHttps: false, hasMixedContent: false };
  
  const isHttps = compareBooleans(prevSecurity.isHttps, currSecurity.isHttps);
  const hasMixedContent = compareBooleans(prevSecurity.hasMixedContent, currSecurity.hasMixedContent);
  
  // Compare accessibility fields
  const prevAccess = previous.accessibility || { missingFormLabels: 0, ariaAttributes: 0, emptyLinks: 0 };
  const currAccess = current.accessibility || { missingFormLabels: 0, ariaAttributes: 0, emptyLinks: 0 };
  
  const missingFormLabels = compareNumbers(prevAccess.missingFormLabels, currAccess.missingFormLabels);
  const ariaAttributes = compareNumbers(prevAccess.ariaAttributes, currAccess.ariaAttributes);
  const emptyLinks = compareNumbers(prevAccess.emptyLinks, currAccess.emptyLinks);
  
  const securityChanged = isHttps.changed || hasMixedContent.changed;
  const accessibilityChanged = missingFormLabels.changed || ariaAttributes.changed || emptyLinks.changed;
  
  return {
    changed: securityChanged || accessibilityChanged,
    security: {
      changed: securityChanged,
      isHttps,
      hasMixedContent,
      previous: {
        isHttps: !!prevSecurity.isHttps,
        hasMixedContent: !!prevSecurity.hasMixedContent
      },
      current: {
        isHttps: !!currSecurity.isHttps,
        hasMixedContent: !!currSecurity.hasMixedContent
      }
    },
    accessibility: {
      changed: accessibilityChanged,
      missingFormLabels,
      ariaAttributes,
      emptyLinks,
      previous: {
        hasMissingFormLabels: prevAccess.missingFormLabels > 0,
        hasAriaAttributes: prevAccess.ariaAttributes > 0,
        hasEmptyLinks: prevAccess.emptyLinks > 0
      },
      current: {
        hasMissingFormLabels: currAccess.missingFormLabels > 0,
        hasAriaAttributes: currAccess.ariaAttributes > 0,
        hasEmptyLinks: currAccess.emptyLinks > 0
      }
    }
  };
}

/**
 * Calculates a change score based on the importance of different elements
 */
function calculateChangeScore(comparison: Partial<PageComparisonType>): number {
  let score = 0;
  const changes = comparison.changes;
  if (!changes) return score;
  // Title changes are highly significant
  if (changes.title?.changed) score += 20;
  // Description changes are significant
  if (changes.description?.changed) score += 15;
  // Main headings are very important for structure
  if (changes.mainHeadings?.changed) {
    score += 15;
    score += changes.mainHeadings.changes.length * 2;
  }
  // Regular headings
  if (changes.headings?.changed) {
    score += 10;
    score += Math.min(10, changes.headings.changes.length);
  }
  // CTA elements are critical for conversion
  if (changes.ctaElements?.changed) {
    score += 25;
    score += changes.ctaElements.changes.length * 3;
  }
  // Pricing changes are very significant
  if (changes.pricing?.changed) score += 30;
  // Testimonial changes
  if (changes.testimonials?.changed) {
    score += 10;
    score += Math.min(15, changes.testimonials.changes.length * 1.5);
  }
  // Image changes
  if (changes.imageChanges?.changed) {
    score += 10;
    score += Math.min(10, changes.imageChanges.changes.length);
  }
  // SEO metadata changes
  if (changes.seoMetadata?.changed) score += 15;
  // Performance metric changes
  if (changes.performanceMetrics?.changed) score += 10;
  // Security and accessibility changes
  if (changes.securityAndAccessibility?.changed) score += 5;
  return Math.min(100, score);
}

/**
 * Compares two scraped content objects and returns a detailed comparison
 */
export function compareScrapedContent(
  previous: ScrapedContentType,
  current: ScrapedContentType
): Partial<Omit<PageComparisonType, 'changes'> & {
  changes: {
    title: { changed: boolean; previous: string; current: string };
    description: { changed: boolean; previous: string; current: string };
    headings: ArrayDiffResult<string>;
    mainHeadings: ArrayDiffResult<string>;
    testimonials: ArrayDiffResult<string>;
    ctaElements: ArrayDiffResult<string>;
    pricing: { changed: boolean; details: string };
    imageChanges: ArrayDiffResult<string>;
    favicon: { changed: boolean; previous: string; current: string };
    heroImage: { changed: boolean; previous: string; current: string };
    internalLinks: ArrayDiffResult<string>;
    externalLinks: ArrayDiffResult<string>;
    structuredData: ArrayDiffResult<string>;
    breadcrumbs: ArrayDiffResult<string>;
    seoMetadata: {
      changed: boolean;
      metaKeywords?: { changed: boolean; previous: string; current: string };
      canonicalUrl?: { changed: boolean; previous: string; current: string };
      openGraph?: { changed: boolean; previous: Record<string, string>; current: Record<string, string> };
      twitterCard?: { changed: boolean; previous: Record<string, string>; current: Record<string, string> };
      structuredData?: { changed: boolean; previous: string[]; current: string[] };
      robotsMeta?: { changed: boolean; previous: string; current: string };
    };
    performanceMetrics: {
      changed: boolean;
      pageLoadTimeMs?: { changed: boolean; previous: number; current: number };
      coreWebVitals?: { changed: boolean; previous: Record<string, number>; current: Record<string, number> };
      pageSpeed?: { changed: boolean; previous: number; current: number };
    };
    securityAndAccessibility: {
      changed: boolean;
      security?: { 
        changed: boolean; 
        isHttps: { changed: boolean; previous: boolean | null; current: boolean | null };
        hasMixedContent: { changed: boolean; previous: boolean | null; current: boolean | null };
      };
      accessibility?: { changed: boolean; previous: Record<string, boolean>; current: Record<string, boolean> };
    };
  }
}> {
  // Compare SEO metadata
  const seoMetadata = compareSeoMetadata(previous, current);
  
  // Compare performance metrics
  const performanceMetrics = comparePerformanceMetrics(previous, current);
  
  // Compare security and accessibility
  const securityAndAccessibility = compareSecurityAndAccessibility(previous, current);
  
  // Basic metadata
  const comparison: Partial<Omit<PageComparisonType, 'changes'> & {
    changes: {
      title: { changed: boolean; previous: string; current: string };
      description: { changed: boolean; previous: string; current: string };
      headings: ArrayDiffResult<string>;
      mainHeadings: ArrayDiffResult<string>;
      testimonials: ArrayDiffResult<string>;
      ctaElements: ArrayDiffResult<string>;
      pricing: { changed: boolean; details: string };
      imageChanges: ArrayDiffResult<string>;
      favicon: { changed: boolean; previous: string; current: string };
      heroImage: { changed: boolean; previous: string; current: string };
      internalLinks: ArrayDiffResult<string>;
      externalLinks: ArrayDiffResult<string>;
      structuredData: ArrayDiffResult<string>;
      breadcrumbs: ArrayDiffResult<string>;
      seoMetadata: {
        changed: boolean;
        metaKeywords?: { changed: boolean; previous: string; current: string };
        canonicalUrl?: { changed: boolean; previous: string; current: string };
        openGraph?: { changed: boolean; previous: Record<string, string>; current: Record<string, string> };
        twitterCard?: { changed: boolean; previous: Record<string, string>; current: Record<string, string> };
        structuredData?: { changed: boolean; previous: string[]; current: string[] };
        robotsMeta?: { changed: boolean; previous: string; current: string };
      };
      performanceMetrics: {
        changed: boolean;
        pageLoadTimeMs?: { changed: boolean; previous: number; current: number };
        coreWebVitals?: { changed: boolean; previous: Record<string, number>; current: Record<string, number> };
        pageSpeed?: { changed: boolean; previous: number; current: number };
      };
      securityAndAccessibility: {
        changed: boolean;
        security?: { 
          changed: boolean; 
          isHttps: { changed: boolean; previous: boolean | null; current: boolean | null };
          hasMixedContent: { changed: boolean; previous: boolean | null; current: boolean | null };
        };
        accessibility?: { changed: boolean; previous: Record<string, boolean>; current: Record<string, boolean> };
      };
    }
  }> = {
    url: current.url,
    currentDate: current.lastScraped,
    previousDate: previous.lastScraped,
    currentContentId: current._id as unknown as Schema.Types.ObjectId,
    previousContentId: previous._id as unknown as Schema.Types.ObjectId,
    hasChanges: false,
    changes: {
      title: compareStrings(previous.title, current.title),
      description: compareStrings(previous.description, current.description),
      headings: compareArrays(previous.headings || [], current.headings || []),
      mainHeadings: compareArrays(previous.mainHeadings || [], current.mainHeadings || []),
      testimonials: compareArrays(previous.testimonials || [], current.testimonials || []),
      ctaElements: compareArrays(previous.ctaElements || [], current.ctaElements || []),
      pricing: comparePricing(previous, current),
      imageChanges: compareArrays(
        previous.images || [],
        current.images || []
      ),
      favicon: compareStrings(previous.favicon, current.favicon),
      heroImage: compareStrings(previous.heroImage, current.heroImage),
      internalLinks: compareArrays(previous.internalLinks || [], current.internalLinks || []),
      externalLinks: compareArrays(previous.externalLinks || [], current.externalLinks || []),
      structuredData: compareArrays(previous.structuredData || [], current.structuredData || []),
      breadcrumbs: compareArrays(previous.breadcrumbs || [], current.breadcrumbs || []),
      seoMetadata,
      performanceMetrics,
      securityAndAccessibility
    }
  };
  
  // Determine if there are any changes
  const changes = comparison.changes;
  if (changes) {
    comparison.hasChanges = (
      changes.title.changed ||
      changes.description.changed ||
      changes.headings.changed ||
      changes.mainHeadings.changed ||
      changes.testimonials.changed ||
      changes.ctaElements.changed ||
      changes.pricing.changed ||
      changes.imageChanges.changed ||
      changes.favicon.changed ||
      changes.heroImage.changed ||
      changes.internalLinks.changed ||
      changes.externalLinks.changed ||
      changes.structuredData.changed ||
      changes.breadcrumbs.changed ||
      changes.seoMetadata.changed ||
      changes.performanceMetrics.changed ||
      changes.securityAndAccessibility.changed
    );
  }
  
  // Calculate a score for the changes
  comparison.changeScore = calculateChangeScore(comparison);
  
  return comparison;
}

/**
 * Recursively extracts only the changed data from a comparison object,
 * including only changed indices for arrays (deeply).
 */
export function extractDeepChangedData(obj: unknown): unknown {
  if (Array.isArray(obj)) {
    // For arrays, only include changed elements (by index) if they are objects with 'changed'
    return obj
      .map((item, idx) => {
        if (item && typeof item === 'object' && 'changed' in item) {
          // Only include if changed
          // @ts-expect-error - Type assertion needed for dynamic property access
          return item.changed ? { index: idx, ...extractDeepChangedData(item) } : undefined;
        }
        return undefined;
      })
      .filter(Boolean);
  }
  if (obj && typeof obj === 'object') {
    // If this object has a 'changed' property and it's false, skip it
    if ('changed' in obj && (obj as Record<string, unknown>).changed === false) return undefined;
    // If this object has a 'changed' property and it's true, filter its children
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (key === 'changed' || key === 'previous' || key === 'current' || key === 'details') {
        result[key] = value;
      } else {
        const filtered = extractDeepChangedData(value);
        if (filtered !== undefined && (Array.isArray(filtered) ? filtered.length : true)) result[key] = filtered;
      }
    }
    return result;
  }
  return obj;
} 