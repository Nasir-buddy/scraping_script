import type { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '@/lib/utils/tempDB';
import ScrapedContentModel from '@/schemas/data-capture/scraped-content.schema';
import DataCaptureModel from '@/schemas/data-capture/datacapture.schema';
import { scrapeEnhancedSeoData } from '@/pages/platform/datacapture/script/scrapData';

// Using the same fixed userId as in dataCapture.ts
const DEMO_USER_ID = 'demo-user-1234';

// Define interfaces for better type safety
interface FormEntry {
  _id?: { toString: () => string };
  url: string[];
}

interface HeadingData {
  tag?: string;
  text: string;
}

interface ImageData {
  src: string;
  alt?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Use the fixed userId instead of Clerk authentication
  const userId = DEMO_USER_ID;
  console.log('Using demo user ID:', userId);

  try {
    // Connect to MongoDB
    await connectToDatabase();
  } catch (dbError) {
    console.error('Database connection error:', dbError);
    return res.status(500).json({ message: 'Database connection failed' });
  }

  // GET: Retrieve advanced scraped content
  if (req.method === 'GET') {
    try {
      const { formId } = req.query;
      
      if (!formId) {
        return res.status(400).json({ message: 'Missing formId parameter' });
      }
      
      const scrapedContent = await ScrapedContentModel.find({ 
        formId: formId as string 
      }).sort({ lastScraped: -1 });
      
      return res.status(200).json(scrapedContent);
    } catch (error) {
      console.error('Error fetching scraped content:', error);
      return res.status(500).json({ 
        message: 'Failed to fetch scraped content', 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  }

  // POST: Trigger enhanced scraping
  if (req.method === 'POST') {
    try {
      const { formId } = req.body;
      
      if (!formId) {
        return res.status(400).json({ message: 'Missing formId parameter' });
      }
      
      // Get the data capture entry for the current user
      const dataCaptureEntry = await DataCaptureModel.findOne({
        userId
      });
      
      if (!dataCaptureEntry) {
        return res.status(404).json({ message: 'Data capture entry not found for this user' });
      }

      // Find the form entry by its _id (formId) inside the forms array
      const formEntry = dataCaptureEntry.forms.find(
        (form: FormEntry) => form._id?.toString() === formId
      );
      
      if (!formEntry) {
        return res.status(404).json({ message: 'Form entry not found for this user' });
      }

      if (!Array.isArray(formEntry.url) || formEntry.url.length === 0) {
        return res.status(400).json({ message: 'No URLs to scrape' });
      }
      
      // For each URL, create or update a record in ScrapedContentModel
      for (const url of formEntry.url) {
        await ScrapedContentModel.findOneAndUpdate(
          { formId, url },
          { 
            status: 'pending',
            lastScraped: new Date(),
            formId,
            url
          },
          { upsert: true }
        );
      }
      
      // Start scraping in the background
      (async () => {
        for (const url of formEntry.url) {
          try {
            const scrapedData = await scrapeEnhancedSeoData(url);
            // Extract the needed fields from the enhanced data
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
            
            // Prepare the data for storage in our schema
            const headings = [...(mainHeadings || []), ...(allHeadings?.map((h: HeadingData) => h.text) || [])];
            const paragraphs = testimonials || [];
            const images = imageAlts?.map((img: ImageData) => img.src) || [];
            const links = [...(internalLinks || []), ...(externalLinks || [])];
            
            // Update the record with the scraped content
            await ScrapedContentModel.findOneAndUpdate(
              { formId, url },
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
                pageSpeed: scrapedData.pageSpeed
              },
              { upsert: true }
            );
            console.log(`[enhanced-scrape] Successfully scraped URL: ${url}`);
          } catch (error) {
            console.error(`[enhanced-scrape] Error scraping URL ${url}:`, error);
            // Update the record with the error
            await ScrapedContentModel.findOneAndUpdate(
              { formId, url },
              { 
                status: 'failed',
                error: error instanceof Error ? error.message : String(error),
                lastScraped: new Date(),
                formId,
                url
              },
              { upsert: true }
            );
          }
        }
      })();
      
      return res.status(200).json({ 
        message: 'Enhanced scraping job triggered successfully',
        urls: formEntry.url
      });
    } catch (error) {
      console.error('Error triggering scraping job:', error);
      return res.status(500).json({ 
        message: 'Failed to trigger scraping job', 
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
} 