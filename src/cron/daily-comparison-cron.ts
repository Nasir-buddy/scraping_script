#!/usr/bin/env node

/**
 * This script runs a daily comparison of landing pages
 * It compares the current day's scraped content with the previous day's content
 * and stores the differences in a separate collection
 *
 * Usage:
 *   node src/cron/daily-comparison-cron.js
 */

// Run with: NODE_ENV=production node src/cron/daily-comparison-cron.js
console.log('Starting daily landing page comparison cron job...');

import path from 'path';
import mongoose from 'mongoose';
// @ts-ignore
import cron from 'node-cron';
import dotenv from 'dotenv';
import { compareScrapedContent } from '../pages/platform/datacapture/script/utils/compare-content';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Import models
import { connectToDatabase } from '../lib/utils/tempDB';
import DataCaptureModel from '../schemas/data-capture/datacapture.schema';
import ScrapedContentModel from '../schemas/data-capture/scraped-content.schema';
import PageComparisonModel from '../schemas/data-capture/page-comparison.schema';

interface Form {
  _id: mongoose.Types.ObjectId;
  url?: string;
  url2?: string;
  [key: string]: any;
}

// Helper to recursively filter only changed fields in the comparison result
function filterChangedFields(comparison: any): any {
  function filter(obj: any): any {
    if (Array.isArray(obj)) return obj;
    if (obj && typeof obj === 'object') {
      // If this object has a 'changed' property and it's false, skip it
      if ('changed' in obj && obj.changed === false) return undefined;
      // If this object has a 'changed' property and it's true, filter its children
      const result: Record<string, any> = {};
      for (const [key, value] of Object.entries(obj)) {
        if (key === 'changed' || key === 'previous' || key === 'current' || key === 'details') {
          result[key] = value;
        } else {
          const filtered = filter(value);
          if (filtered !== undefined) result[key] = filtered;
        }
      }
      return result;
    }
    return obj;
  }

  const filteredChanges: Record<string, any> = {};
  for (const [key, value] of Object.entries(comparison.changes || {})) {
    const filtered = filter(value);
    if (filtered !== undefined) filteredChanges[key] = filtered;
  }
  return {
    url: comparison.url,
    currentDate: comparison.currentDate,
    previousDate: comparison.previousDate,
    currentContentId: comparison.currentContentId,
    previousContentId: comparison.previousContentId,
    hasChanges: comparison.hasChanges,
    changes: filteredChanges,
    changeScore: comparison.changeScore,
  };
}

async function runDailyComparison() {
  try {
    console.log(`Daily comparison job started at: ${new Date().toISOString()}`);
    await connectToDatabase();
    
    // Find data capture entries with URLs
    const dataCaptureEntries = await DataCaptureModel.find({});
    
    // Filter entries with URLs in any of the form entries
    const entriesWithUrls = dataCaptureEntries.filter(entry => {
      return entry.forms && entry.forms.some((form: Form) => 
        Array.isArray(form.url) && form.url.length > 0 && form.url.some(u => u && u.trim() !== '')
      );
    });
    
    console.log(`Found ${entriesWithUrls.length} data capture entries with URLs.`);
    
    // Get the current date and previous date (yesterday)
    const currentDate = new Date();
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(currentDate.getDate() - 2);
    
    // Format dates for logging
    const currentDateStr = currentDate.toISOString().split('T')[0];
    const twoDaysAgoStr = twoDaysAgo.toISOString().split('T')[0];
    
    console.log(`Comparing content between ${twoDaysAgoStr} and ${currentDateStr}`);
    
    for (const entry of entriesWithUrls) {
      // Process each form with URLs
      for (const form of entry.forms as Form[]) {
        if (!Array.isArray(form.url) || form.url.length === 0) continue;
        for (const url of form.url) {
          if (!url || url.trim() === '') continue;
          
          try {
            console.log(`Processing URL: ${url} from entry ${entry._id}`);
            
            // Find the most recent successful scrape for this URL
            const currentContent = await ScrapedContentModel.findOne({
              formId: form._id.toString(),
              url: url,
              status: 'success',
              lastScraped: { $gte: twoDaysAgo }
            }).sort({ lastScraped: -1 });
            
            if (!currentContent) {
              console.log(`No recent content found for URL ${url}. Skipping comparison.`);
              continue;
            }
            
            // Find the previous successful scrape for this URL
            const previousContent = await ScrapedContentModel.findOne({
              formId: form._id.toString(),
              url: url,
              status: 'success',
              lastScraped: { $lt: currentContent.lastScraped }
            }).sort({ lastScraped: -1 });
            
            if (!previousContent) {
              console.log(`No previous content found for URL ${url}. Skipping comparison.`);
              continue;
            }
            
            console.log(`Comparing content for ${url} between ${previousContent.lastScraped.toISOString()} and ${currentContent.lastScraped.toISOString()}`);
            
            // Compare the content
            const comparison = compareScrapedContent(previousContent, currentContent);
            
            // Check if there are changes
            if (comparison.hasChanges) {
              console.log(`Changes detected for URL ${url}. Saving comparison results.`);
              // Save only changed fields to the database
              const filteredComparison = filterChangedFields(comparison);
              console.log('Filtered comparison to save:', JSON.stringify(filteredComparison, null, 2));
              if (Object.keys(filteredComparison.changes).length > 0) {
                const pageComparison = new PageComparisonModel(filteredComparison);
                await pageComparison.save();
                console.log(`Saved comparison with ID: ${pageComparison._id}`);
                // Log the change score
                console.log(`Change score: ${comparison.changeScore}/100`);
              } else {
                console.log('No actual changed fields to save for this comparison.');
              }
            } else {
              console.log(`No changes detected for URL ${url}.`);
            }
          } catch (error) {
            console.error(`Error comparing URL ${url}:`, error);
          }
        }
      }
    }
  } catch (error) {
    console.error('Error running daily comparison:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Daily comparison job completed.');
  }
}

process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  await mongoose.disconnect();
  process.exit(0);
});

// Run the comparison once when the script is executed
runDailyComparison();

// Schedule the job to run daily at midnight
// Uncomment this for production use
cron.schedule('*/30 * * * *', async () => {
  console.log('Running daily comparison...');
  await runDailyComparison();
}); 