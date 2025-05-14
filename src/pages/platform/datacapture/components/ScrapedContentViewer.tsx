'use client';

import { useState, useEffect } from 'react';
import { 
  Box, 
  Heading, 
  Text, 
  Button, 
  Flex, 
  Card, 
  ScrollArea, 
  Badge, 
  Tabs, 
  Container, 
  Grid,
  Switch,
  Tooltip
} from '@radix-ui/themes';
import { Cross2Icon, ReloadIcon, CheckIcon, ExclamationTriangleIcon, InfoCircledIcon } from '@radix-ui/react-icons';
import { ScrapedContentType } from '@/schemas/data-capture/scraped-content.schema';

interface ScrapedContentViewerProps {
  dataCaptureId: string;
}

export function ScrapedContentViewer({ dataCaptureId }: ScrapedContentViewerProps) {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isScrapingInProgress, setIsScrapingInProgress] = useState<boolean>(false);
  const [scrapedContents, setScrapedContents] = useState<Partial<ScrapedContentType>[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [useAdvancedScraping, setUseAdvancedScraping] = useState<boolean>(false);

  // Fetch scraped content
  const fetchScrapedContent = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`/api/data-capture/scrape?dataCaptureId=${dataCaptureId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      setScrapedContents(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch scraped content');
      console.error('Error fetching scraped content:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Trigger scraping
  const triggerScraping = async () => {
    try {
      setIsScrapingInProgress(true);
      setError(null);
      
      // Choose the endpoint based on advanced scraping toggle
      const endpoint = useAdvancedScraping 
        ? '/api/data-capture/enhanced-scrape' 
        : '/api/data-capture/scrape';
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          dataCaptureId,
          useAdvancedScraping
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      // Poll for updates every 2 seconds
      const pollingInterval = setInterval(async () => {
        const freshResponse = await fetch(`/api/data-capture/scrape?dataCaptureId=${dataCaptureId}`);
        const freshData = await freshResponse.json();
        
        setScrapedContents(freshData);
        
        // Check if all scraping is complete
        const allComplete = freshData.every((item: Partial<ScrapedContentType>) => 
          item.status !== 'pending'
        );
        
        if (allComplete) {
          clearInterval(pollingInterval);
          setIsScrapingInProgress(false);
        }
      }, 2000);
      
      // Safety timeout after 2 minutes
      setTimeout(() => {
        clearInterval(pollingInterval);
        setIsScrapingInProgress(false);
        fetchScrapedContent();
      }, 120000);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to trigger scraping');
      setIsScrapingInProgress(false);
      console.error('Error triggering scraping:', err);
    }
  };

  // Load data on component mount
  useEffect(() => {
    if (dataCaptureId) {
      fetchScrapedContent();
    }
  }, [dataCaptureId]);

  // Status badge component
  const StatusBadge = ({ status }: { status?: string }) => {
    if (!status) return null;
    
    switch (status) {
      case 'success':
        return <Badge color="green" size="1"><CheckIcon /> Success</Badge>;
      case 'failed':
        return <Badge color="red" size="1"><Cross2Icon /> Failed</Badge>;
      case 'pending':
        return <Badge color="yellow" size="1"><ReloadIcon /> Pending</Badge>;
      default:
        return <Badge color="gray" size="1">{status}</Badge>;
    }
  };

  return (
    <Container size="3">
      <Flex direction="column" gap="4">
        <Flex justify="between" align="center">
          <Heading size="5">Scraped Website Content</Heading>
          <Flex gap="4" align="center">
            <Flex gap="2" align="center">
              <Text size="2">Advanced Scraping</Text>
              <Tooltip content="Uses more advanced scraping techniques for detailed content extraction">
                <InfoCircledIcon />
              </Tooltip>
              <Switch 
                checked={useAdvancedScraping} 
                onCheckedChange={setUseAdvancedScraping} 
                disabled={isScrapingInProgress}
              />
            </Flex>
            <Flex gap="2">
              <Button 
                variant="soft" 
                onClick={fetchScrapedContent} 
                disabled={isLoading || isScrapingInProgress}
              >
                <ReloadIcon /> Refresh
              </Button>
              <Button 
                onClick={triggerScraping} 
                disabled={isScrapingInProgress}
              >
                {isScrapingInProgress ? (
                  <>
                    <ReloadIcon className="animate-spin" /> Scraping...
                  </>
                ) : (
                  'Scrape Websites'
                )}
              </Button>
            </Flex>
          </Flex>
        </Flex>
        
        {error && (
          <Card variant="surface">
            <Flex gap="2" align="center">
              <ExclamationTriangleIcon color="red" />
              <Text color="red">{error}</Text>
            </Flex>
          </Card>
        )}
        
        {isLoading ? (
          <Flex justify="center" align="center" height="200px">
            <ReloadIcon className="animate-spin" /> Loading...
          </Flex>
        ) : scrapedContents.length === 0 ? (
          <Card variant="surface">
            <Text>No scraped content found. Click &quot;Scrape Websites&quot; to start.</Text>
          </Card>
        ) : (
          scrapedContents.map((content) => (
            <Card key={content._id?.toString()} variant="surface">
              <Tabs.Root defaultValue="summary">
                <Tabs.List>
                  <Tabs.Trigger value="summary">Summary</Tabs.Trigger>
                  <Tabs.Trigger value="headings">Headings</Tabs.Trigger>
                  <Tabs.Trigger value="paragraphs">Paragraphs</Tabs.Trigger>
                  <Tabs.Trigger value="links">Links</Tabs.Trigger>
                  <Tabs.Trigger value="images">Images</Tabs.Trigger>
                </Tabs.List>
                
                <Box pt="3">
                  <Flex justify="between" align="center" mb="2">
                    <Flex direction="column" gap="1">
                      <Heading size="3" as="h3">
                        <a href={content.url} target="_blank" rel="noopener noreferrer">
                          {content.title || content.url}
                        </a>
                      </Heading>
                      <Flex gap="2" align="center">
                        <StatusBadge status={content.status} />
                        <Text size="1">
                          Last scraped: {content.lastScraped 
                            ? new Date(content.lastScraped).toLocaleString() 
                            : 'Never'}
                        </Text>
                      </Flex>
                    </Flex>
                  </Flex>
                  
                  <Tabs.Content value="summary">
                    <Grid columns="2" gap="3">
                      <Card variant="surface">
                        <Heading size="2">Description</Heading>
                        <Text>{content.description || 'No description found'}</Text>
                      </Card>
                      <Card variant="surface">
                        <Heading size="2">Stats</Heading>
                        <Text>Headings: {content.headings?.length || 0}</Text>
                        <Text>Paragraphs: {content.paragraphs?.length || 0}</Text>
                        <Text>Links: {content.links?.length || 0}</Text>
                        <Text>Images: {content.images?.length || 0}</Text>
                      </Card>
                    </Grid>
                  </Tabs.Content>
                  
                  <Tabs.Content value="headings">
                    <ScrollArea style={{ height: '300px' }}>
                      {content.headings?.length ? (
                        content.headings.map((heading, i) => (
                          <Box key={i} mb="2">
                            <Text weight="bold">{heading}</Text>
                          </Box>
                        ))
                      ) : (
                        <Text>No headings found</Text>
                      )}
                    </ScrollArea>
                  </Tabs.Content>
                  
                  <Tabs.Content value="paragraphs">
                    <ScrollArea style={{ height: '300px' }}>
                      {content.paragraphs?.length ? (
                        content.paragraphs.map((paragraph, i) => (
                          <Box key={i} mb="3">
                            <Text>{paragraph}</Text>
                          </Box>
                        ))
                      ) : (
                        <Text>No paragraphs found</Text>
                      )}
                    </ScrollArea>
                  </Tabs.Content>
                  
                  <Tabs.Content value="links">
                    <ScrollArea style={{ height: '300px' }}>
                      {content.links?.length ? (
                        content.links.map((link, i) => (
                          <Box key={i} mb="2">
                            <a href={link} target="_blank" rel="noopener noreferrer">
                              <Text>{link}</Text>
                            </a>
                          </Box>
                        ))
                      ) : (
                        <Text>No links found</Text>
                      )}
                    </ScrollArea>
                  </Tabs.Content>
                  
                  <Tabs.Content value="images">
                    <ScrollArea style={{ height: '300px' }}>
                      {content.images?.length ? (
                        <Grid columns="3" gap="2">
                          {content.images.map((image, i) => (
                            <Box key={i}>
                              <a href={image} target="_blank" rel="noopener noreferrer">
                                <img 
                                  src={image} 
                                  alt={`Image ${i}`} 
                                  style={{ 
                                    maxWidth: '100%', 
                                    maxHeight: '150px',
                                    objectFit: 'contain' 
                                  }} 
                                />
                              </a>
                            </Box>
                          ))}
                        </Grid>
                      ) : (
                        <Text>No images found</Text>
                      )}
                    </ScrollArea>
                  </Tabs.Content>
                </Box>
              </Tabs.Root>
            </Card>
          ))
        )}
      </Flex>
    </Container>
  );
} 