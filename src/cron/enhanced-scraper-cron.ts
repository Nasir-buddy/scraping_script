#!/usr/bin/env node

import path from 'path';
import mongoose from 'mongoose';
import cron from 'node-cron';
import dotenv from 'dotenv';
import { connectToDatabase } from '../lib/utils/tempDB';
import DataCaptureModel, { DataCaptureType, FormEntry } from '../schemas/data-capture/datacapture.schema';
import ScrapedContentModel from '../schemas/data-capture/scraped-content.schema';
import { scrapeEnhancedSeoData, EnhancedScrapedData } from '../pages/platform/datacapture/script/scrapData';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

console.log('Starting enhanced website scraper cron job...');

let isRunning = false;

async function runEnhancedScraper(): Promise<void> {
  if (isRunning) {
    console.log('Previous run still in progress, skipping this minute.');
    return;
  }
  isRunning = true;
  try {
    console.log(`Enhanced scraper job started at: ${new Date().toISOString()}`);
    await connectToDatabase();

    // Find data capture entries with URLs
    const dataCaptureEntries = await DataCaptureModel.find({});

    // Filter entries with URLs in any of the form entries
    const entriesWithUrls = dataCaptureEntries.filter((entry: DataCaptureType) => {
      return entry.forms && entry.forms.some((form: FormEntry) =>
        Array.isArray(form.url) && form.url.length > 0 && form.url.some(u => u && u.trim() !== '')
      );
    });

    console.log(`Found ${entriesWithUrls.length} data capture entries with URLs.`);

    // Collect unique URLs with their first associated entry and form
    const urlMap = new Map<string, { entryId: string; formId: string }>();
    for (const entry of entriesWithUrls) {
      for (const form of entry.forms) {
        if (!Array.isArray(form.url) || form.url.length === 0) continue;
        for (const url of form.url) {
          const trimmedUrl = url && url.trim();
          if (!trimmedUrl) continue;
          if (!urlMap.has(trimmedUrl)) {
            urlMap.set(trimmedUrl, { entryId: entry._id.toString(), formId: form._id.toString() });
          }
        }
      }
    }

    console.log(`Found ${urlMap.size} unique URLs to scrape.`);

    for (const [url, { entryId, formId }] of Array.from(urlMap.entries())) {
      // Use 1-minute granularity for scrapeDate (YYYY-MM-DDTHH:MM)
      const now = new Date();
      now.setSeconds(0, 0);
      const scrapeDate = now.toISOString().slice(0, 16); // 'YYYY-MM-DDTHH:MM'

      try {
        console.log(`Processing URL: ${url} from entry ${entryId}`);

        // Create or update the scraped content record for this 1-minute window
        await ScrapedContentModel.findOneAndUpdate(
          { formId, url, scrapeDate },
          {
            status: 'pending',
            lastScraped: new Date(),
            formId,
            url,
            scrapeDate
          },
          { upsert: true, new: true }
        );

        // Use the advanced scraper
        console.log(`Scraping URL: ${url}`);
        const scrapedData: EnhancedScrapedData = await scrapeEnhancedSeoData(url);

        // Extract data from scraped results
        const {
          title,
          metaDescription: description,
          headings: allHeadings,
          mainHeadings,
          testimonials,
          internalLinks,
          externalLinks,
          imageAlts
        } = scrapedData;

        // Prepare data for storage
        const headings = [...(mainHeadings || []), ...(allHeadings?.map((h: { tag: string; text: string }) => h.text) || [])];
        const paragraphs = testimonials || [];
        const images = imageAlts?.map((img: { src: string; alt: string }) => img.src) || [];
        const links = [...(internalLinks || []), ...(externalLinks || [])];

        // Update the scraped content record with the results for this 1-minute window
        console.log(`Saving scraped data to MongoDB for URL: ${url}`);
        
        // Log that we're storing screenshot as base64 only
        if (scrapedData.screenshotBase64) {
          console.log(`Screenshot captured as base64 for URL: ${url} (${scrapedData.screenshotBase64.length} characters)`);
        } else {
          console.log(`No screenshot captured for URL: ${url}`);
        }
        
        await ScrapedContentModel.findOneAndUpdate(
          { formId, url, scrapeDate },
          {
            title,
            description,
            headings,
            paragraphs,
            images,
            links,
            status: 'success',
            lastScraped: new Date(),
            formId,
            url,
            scrapeDate,
            // Include all enhanced SEO data
            metaKeywords: scrapedData.metaKeywords,
            canonicalUrl: scrapedData.canonicalUrl,
            openGraph: scrapedData.openGraph,
            twitterCard: scrapedData.twitterCard,
            structuredData: scrapedData.structuredData,
            robotsMeta: scrapedData.robotsMeta,
            favicon: scrapedData.favicon,
            alternateHreflangs: scrapedData.alternateHreflangs,
            mainHeadings: scrapedData.mainHeadings,
            heroImage: scrapedData.heroImage,
            testimonials: scrapedData.testimonials,
            pricing: scrapedData.pricing,
            ctaElements: scrapedData.ctaElements,
            internalLinks: scrapedData.internalLinks,
            externalLinks: scrapedData.externalLinks,
            imageAlts: scrapedData.imageAlts,
            pageLoadTimeMs: scrapedData.pageLoadTimeMs,
            statusCode: scrapedData.statusCode,
            sitemapUrls: scrapedData.sitemapUrls,
            robotsTxt: scrapedData.robotsTxt,
            wordCount: scrapedData.wordCount,
            textToHtmlRatio: scrapedData.textToHtmlRatio,
            metaRobotsTags: scrapedData.metaRobotsTags,
            urlAnalysis: scrapedData.urlAnalysis,
            parsedSchemaTypes: scrapedData.parsedSchemaTypes,
            linkAnalysis: scrapedData.linkAnalysis,
            imageAnalysis: scrapedData.imageAnalysis,
            security: scrapedData.security,
            accessibility: scrapedData.accessibility,
            pagination: scrapedData.pagination,
            breadcrumbs: scrapedData.breadcrumbs,
            coreWebVitals: scrapedData.coreWebVitals,
            keywordDensity: scrapedData.keywordDensity,
            pageSpeed: scrapedData.pageSpeed,
            screenshotPath: scrapedData.screenshotPath,
            screenshotBase64: scrapedData.screenshotBase64
          },
          { upsert: true, new: true }
        );

        console.log(`Successfully scraped URL: ${url}`);
      } catch (error) {
        console.error(`Error scraping URL ${url}:`, error);
        await ScrapedContentModel.findOneAndUpdate(
          { formId, url, scrapeDate },
          {
            status: 'failed',
            error: error instanceof Error ? error.message : String(error),
            lastScraped: new Date(),
            formId,
            url,
            scrapeDate
          },
          { upsert: true }
        );
      }
    }
  } catch (error) {
    console.error('Error running enhanced scraper:', error);
  } finally {
    isRunning = false;
    // Don't disconnect from mongoose or exit process when using cron
    // This allows the script to continue running for the next scheduled execution
    console.log('Enhanced scraper job completed at:', new Date().toISOString());
  }
}

process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  await mongoose.disconnect();
  process.exit(0);
});

// Run the scraper once at startup
runEnhancedScraper();

// Schedule the scraper to run every 30 minutes
cron.schedule('*/30 * * * *', async () => {
  console.log('Running enhanced scraper every 30 minutes...');
  await runEnhancedScraper();
});
