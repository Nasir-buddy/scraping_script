import mongoose, { Schema, Document } from 'mongoose';
import { ScrapedContentType } from './scraped-content.schema';
import { ArrayDiffResult } from '../../pages/platform/datacapture/script/utils/compare-content';

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
    seoMetadata: any;
    performanceMetrics: any;
    securityAndAccessibility: any;
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