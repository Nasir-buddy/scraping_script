import mongoose, { Schema, Document } from 'mongoose';

export interface ScrapedContentType extends Document {
  formId: string;
  url: string;
  title: string;
  description: string;
  headings: string[];
  paragraphs: string[];
  images: string[];
  links: string[];
  fullHtml: string;
  lastScraped: Date;
  status: 'success' | 'failed' | 'pending';
  error?: string;
  // Enhanced SEO data
  metaKeywords?: string;
  canonicalUrl?: string;
  openGraph?: Record<string, string>;
  twitterCard?: Record<string, string>;
  structuredData?: string[];
  robotsMeta?: string;
  favicon?: string;
  alternateHreflangs?: string[];
  mainHeadings?: string[];
  heroImage?: string;
  testimonials?: string[];
  pricing?: {
    packages: Array<{
      name: string;
      price: string;
      features: string[];
    }>;
  };
  ctaElements?: string[];
  internalLinks?: string[];
  externalLinks?: string[];
  imageAlts?: Array<{ src: string; alt: string }>;
  pageLoadTimeMs?: number;
  statusCode?: number;
  wordCount?: number;
  textToHtmlRatio?: number;
  metaRobotsTags?: {
    index: boolean;
    follow: boolean;
    other: string[];
  };
  urlAnalysis?: {
    length: number;
    parameters: Record<string, string>;
    isSeoFriendly: boolean;
  };
  parsedSchemaTypes?: string[];
  linkAnalysis?: {
    brokenLinks: string[];
    nofollowLinks: string[];
    downloadLinks: string[];
    anchorTextFrequency: Record<string, number>;
  };
  imageAnalysis?: {
    unoptimizedImages: Array<{ src: string; size: number; dimensions: string }>;
    missingAltText: string[];
    lazyLoadedImages: string[];
  };
  security?: {
    isHttps: boolean;
    hasMixedContent: boolean;
    securityHeaders: Record<string, string | null>;
  };
  accessibility?: {
    missingFormLabels: number;
    ariaAttributes: number;
    emptyLinks: number;
  };
  pagination?: {
    prevUrl: string | null;
    nextUrl: string | null;
  };
  breadcrumbs?: string[];
  coreWebVitals?: {
    lcp: number | null;
    cls: number | null;
    fid: number | null;
  };
  keywordDensity?: Record<string, number>;
  pageSpeed?: {
    resourceSizes: Record<string, number>;
    totalRequestSize: number;
    slowResources: Array<{ url: string; duration: number }>;
  };
  screenshotPath?: string;
  screenshotBase64?: string;
  scrapeDate: string; // YYYY-MM-DD
}

const ScrapedContentSchema: Schema<ScrapedContentType> = new Schema(
  {
    formId: { type: String, required: true },
    url: { type: String, required: true },
    title: { type: String },
    description: { type: String },
    headings: [{ type: String }],
    paragraphs: [{ type: String }],
    images: [{ type: String }],
    links: [{ type: String }],
    fullHtml: { type: String },
    lastScraped: { type: Date, default: Date.now },
    status: { 
      type: String, 
      enum: ['success', 'failed', 'pending'], 
      default: 'pending' 
    },
    error: { type: String },
    // Enhanced SEO data
    metaKeywords: { type: String },
    canonicalUrl: { type: String },
    openGraph: { type: Map, of: String },
    twitterCard: { type: Map, of: String },
    structuredData: [{ type: String }],
    robotsMeta: { type: String },
    favicon: { type: String },
    alternateHreflangs: [{ type: String }],
    mainHeadings: [{ type: String }],
    heroImage: { type: String },
    testimonials: [{ type: String }],
    pricing: {
      packages: [{
        name: { type: String },
        price: { type: String },
        features: [{ type: String }]
      }]
    },
    ctaElements: [{ type: String }],
    internalLinks: [{ type: String }],
    externalLinks: [{ type: String }],
    imageAlts: [{
      src: { type: String },
      alt: { type: String }
    }],
    pageLoadTimeMs: { type: Number },
    statusCode: { type: Number },
    wordCount: { type: Number },
    textToHtmlRatio: { type: Number },
    metaRobotsTags: {
      index: { type: Boolean },
      follow: { type: Boolean },
      other: [{ type: String }]
    },
    urlAnalysis: {
      length: { type: Number },
      parameters: { type: Map, of: String },
      isSeoFriendly: { type: Boolean }
    },
    parsedSchemaTypes: [{ type: String }],
    linkAnalysis: {
      brokenLinks: [{ type: String }],
      nofollowLinks: [{ type: String }],
      downloadLinks: [{ type: String }],
      anchorTextFrequency: { type: Map, of: Number }
    },
    imageAnalysis: {
      unoptimizedImages: [{
        src: { type: String },
        size: { type: Number },
        dimensions: { type: String }
      }],
      missingAltText: [{ type: String }],
      lazyLoadedImages: [{ type: String }]
    },
    security: {
      isHttps: { type: Boolean },
      hasMixedContent: { type: Boolean },
      securityHeaders: { type: Map, of: String }
    },
    accessibility: {
      missingFormLabels: { type: Number },
      ariaAttributes: { type: Number },
      emptyLinks: { type: Number }
    },
    pagination: {
      prevUrl: { type: String },
      nextUrl: { type: String }
    },
    breadcrumbs: [{ type: String }],
    coreWebVitals: {
      lcp: { type: Number },
      cls: { type: Number },
      fid: { type: Number }
    },
    keywordDensity: { type: Map, of: Number },
    pageSpeed: {
      resourceSizes: { type: Map, of: Number },
      totalRequestSize: { type: Number },
      slowResources: [{
        url: { type: String },
        duration: { type: Number }
      }]
    },
    screenshotPath: { type: String },
    screenshotBase64: { type: String },
    scrapeDate: { type: String, required: true }
  },
  { timestamps: true }
);

// Create compound index for faster queries
ScrapedContentSchema.index({ formId: 1 });
ScrapedContentSchema.index({ url: 1 });
ScrapedContentSchema.index({ formId: 1, url: 1, scrapeDate: 1 }, { unique: true });

const ScrapedContentModel =
  mongoose.models.ScrapedContent || 
  mongoose.model<ScrapedContentType>('ScrapedContent', ScrapedContentSchema);

export default ScrapedContentModel; 