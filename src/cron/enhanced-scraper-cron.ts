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

    // Add retry mechanism with backoff
    let retryCount = 0;
    const maxRetries = 3;
    const retryDelay = 5000; // 5 seconds
    
    for (const [url, { entryId, formId }] of Array.from(urlMap.entries())) {
      // Use 1-minute granularity for scrapeDate (YYYY-MM-DDTHH:MM)
      const now = new Date();
      now.setSeconds(0, 0);
      const scrapeDate = now.toISOString().slice(0, 16); // 'YYYY-MM-DDTHH:MM'

      try {
        console.log(`Processing URL: ${url} from entry ${entryId}`);
        const scrapedData = await scrapeEnhancedSeoData(url);
        
        // Save the successful data to database
        await ScrapedContentModel.findOneAndUpdate(
          { formId, url, scrapeDate },
          {
            data: sanitizeMapKeys(scrapedData),
            status: 'completed',
            lastScraped: new Date(),
            formId,
            url,
            scrapeDate
          },
          { upsert: true }
        );
        
      } catch (error) {
        console.error(`Error scraping URL ${url}:`, error);
        
        // Save error information to database
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
        
        // Implement retry with exponential backoff
        if (retryCount < maxRetries) {
          retryCount++;
          const backoffTime = retryDelay * Math.pow(2, retryCount - 1);
          console.log(`Retrying in ${backoffTime / 1000} seconds... (Attempt ${retryCount} of ${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, backoffTime));
          // Continue to the next URL instead of retrying the same one
          // to avoid getting blocked by the site
        } else {
          console.error(`Max retries reached for URL ${url}, skipping...`);
          retryCount = 0; // Reset for next URL
        }
      }
      
      // Add delay between requests to avoid triggering anti-scraping measures
      const randomDelay = 3000 + Math.floor(Math.random() * 5000); // 3-8 seconds
      console.log(`Waiting ${randomDelay / 1000} seconds before next request...`);
      await new Promise(resolve => setTimeout(resolve, randomDelay));
    }
  } catch (error) {
    console.error("Fatal error in enhanced scraper job:", error);
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
