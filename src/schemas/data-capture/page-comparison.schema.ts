import mongoose, { Schema, Document } from 'mongoose';
import { ArrayDiffResult } from '../../pages/platform/datacapture/script/utils/compare-content';

export interface SeoMetadataType {
  changed: boolean;
  metaKeywords?: { changed: boolean; previous: string; current: string };
  canonicalUrl?: { changed: boolean; previous: string; current: string };
  openGraph?: { changed: boolean; previous: Record<string, string>; current: Record<string, string> };
  twitterCard?: { changed: boolean; previous: Record<string, string>; current: Record<string, string> };
  structuredData?: { changed: boolean; previous: string[]; current: string[] };
  robotsMeta?: { changed: boolean; previous: string; current: string };
}

export interface PerformanceMetricsType {
  changed: boolean;
  pageLoadTimeMs?: { changed: boolean; previous: number; current: number };
  coreWebVitals?: { changed: boolean; previous: Record<string, number>; current: Record<string, number> };
  pageSpeed?: { changed: boolean; previous: number; current: number };
}

export interface SecurityAndAccessibilityType {
  changed: boolean;
  security?: { 
    changed: boolean; 
    isHttps: { changed: boolean; previous: boolean | null; current: boolean | null };
    hasMixedContent: { changed: boolean; previous: boolean | null; current: boolean | null };
  };
  accessibility?: { changed: boolean; previous: Record<string, boolean>; current: Record<string, boolean> };
}

export interface PageComparisonType extends Document {
  url: string;
  currentDate: Date;
  previousDate: Date;
  currentContentId: Schema.Types.ObjectId;
  previousContentId: Schema.Types.ObjectId;
  hasChanges: boolean;
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
    seoMetadata: SeoMetadataType;
    performanceMetrics: PerformanceMetricsType;
    securityAndAccessibility: SecurityAndAccessibilityType;
  };
  changeScore: number;
  createdAt: Date;
  updatedAt: Date;
}

const PageComparisonSchema: Schema<PageComparisonType> = new Schema(
  {
    url: { type: String, required: true },
    currentDate: { type: Date, required: true },
    previousDate: { type: Date, required: true },
    currentContentId: { type: Schema.Types.ObjectId, ref: 'ScrapedContent', required: true },
    previousContentId: { type: Schema.Types.ObjectId, ref: 'ScrapedContent', required: true },
    hasChanges: { type: Boolean, default: false },
    changes: { type: Object, default: {} },
    changeScore: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Create compound index for faster queries
PageComparisonSchema.index({ url: 1, currentDate: -1 });

const PageComparisonModel =
  mongoose.models.PageComparison || 
  mongoose.model<PageComparisonType>('PageComparison', PageComparisonSchema);

export default PageComparisonModel; 