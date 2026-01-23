import { Actor, ProxyConfiguration } from 'apify';
import { PlaywrightCrawler } from 'crawlee';
import { firefox } from 'playwright';
import { launchOptions } from 'camoufox-js';
import axios from 'axios';

interface NextdoorInput {
  scrapeType?: 'recommendations' | 'posts' | 'businesses' | 'events';
  location?: string;
  searchQuery?: string;
  searchUrl?: string;
  category?: string;
  maxResults?: number;
  includeComments?: boolean;
  includeVotes?: boolean;
  minRecommendations?: number;
  dateRange?: 'all' | 'today' | 'week' | 'month' | 'year';
  proxyConfiguration?: {
    useApifyProxy?: boolean;
    apifyProxyGroups?: string[];
  };
  nextdoorEmail?: string;
  nextdoorPassword?: string;
  nextdoorCookies?: string;
  useFirecrawl?: boolean;
  firecrawlApiKey?: string;
  demoMode?: boolean;
  webhookUrl?: string;
}

interface BrowserCookie {
  name: string;
  value: string;
  domain?: string;
  path?: string;
  expires?: number;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'Strict' | 'Lax' | 'None';
}

// Parse cookies from various formats (JSON array, semicolon string, or EditThisCookie export)
function parseCookies(cookieInput: string): BrowserCookie[] {
  const cookies: BrowserCookie[] = [];

  try {
    // Try parsing as JSON array first (EditThisCookie format or custom)
    const parsed = JSON.parse(cookieInput);
    if (Array.isArray(parsed)) {
      for (const cookie of parsed) {
        if (cookie.name && cookie.value) {
          cookies.push({
            name: cookie.name,
            value: cookie.value,
            domain: cookie.domain || '.nextdoor.com',
            path: cookie.path || '/',
            expires: cookie.expirationDate ? Math.floor(cookie.expirationDate) : undefined,
            httpOnly: cookie.httpOnly || false,
            secure: cookie.secure || true,
            sameSite: cookie.sameSite || 'Lax'
          });
        }
      }
      return cookies;
    }
  } catch {
    // Not JSON, try semicolon-separated format
  }

  // Parse semicolon-separated format: "name1=value1; name2=value2"
  const pairs = cookieInput.split(';');
  for (const pair of pairs) {
    const trimmed = pair.trim();
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex > 0) {
      const name = trimmed.substring(0, eqIndex).trim();
      const value = trimmed.substring(eqIndex + 1).trim();
      if (name && value) {
        cookies.push({
          name,
          value,
          domain: '.nextdoor.com',
          path: '/',
          secure: true,
          sameSite: 'Lax'
        });
      }
    }
  }

  return cookies;
}

interface BusinessRecommendation {
  businessName: string;
  category: string;
  recommendationCount: number;
  hearts: number;
  latestRecommendation: {
    author: string;
    neighborhood: string;
    text: string;
    date: string;
    upvotes: number;
  };
  mentions: {
    postType: string;
    text: string;
    author: string;
    neighborhood: string;
    date: string;
    upvotes: number;
    comments: number;
  }[];
  neighborhoods: string[];
  phone?: string;
  website?: string;
  address?: string;
  searchQuery: string;
  location: string;
  scrapedAt: string;
}

interface NeighborhoodPost {
  postType: string;
  title: string;
  content: string;
  author: string;
  neighborhood: string;
  date: string;
  upvotes: number;
  commentCount: number;
  comments?: {
    author: string;
    text: string;
    date: string;
    upvotes: number;
  }[];
  businessMentions: string[];
  scrapedAt: string;
}

// Demo data for Sausalito plumbers (based on real Nextdoor patterns)
function getDemoRecommendations(query: string, location: string): BusinessRecommendation[] {
  const baseData = [
    {
      businessName: "Dan's Plumbing and Sewer Service Inc.",
      category: "Plumbers",
      recommendationCount: 251,
      hearts: 251,
      latestRecommendation: {
        author: "Sarah M.",
        neighborhood: "San Rafael",
        text: "They get an A+ from me! Fast, professional, and fair pricing.",
        date: "2024-12-15",
        upvotes: 12
      },
      mentions: [],
      neighborhoods: ["San Rafael", "Sausalito", "Mill Valley"],
      phone: "(415) 462-5858",
      website: "http://dansplumbingandsewer.com",
      address: "15 Woodland Avenue, San Rafael, CA 94901",
    },
    {
      businessName: "Warrior Plumbing & Drain",
      category: "Plumbers",
      recommendationCount: 647,
      hearts: 647,
      latestRecommendation: {
        author: "Tom H.",
        neighborhood: "Marin City",
        text: "Warriors plumbing Joe is fantastic. Reliable and trustworthy.",
        date: "2024-12-18",
        upvotes: 8
      },
      mentions: [],
      neighborhoods: ["Marin City", "Sausalito", "Tiburon"],
      phone: "(650) 290-1335",
      website: undefined,
      address: undefined,
    },
    {
      businessName: "Genteel Plumbers",
      category: "Plumbers",
      recommendationCount: 59,
      hearts: 59,
      latestRecommendation: {
        author: "Lisa R.",
        neighborhood: "Sausalito",
        text: "Love Genteel Plumbers! Professional and courteous.",
        date: "2024-12-10",
        upvotes: 5
      },
      mentions: [],
      neighborhoods: ["Sausalito", "Mill Valley"],
      phone: undefined,
      website: undefined,
      address: undefined,
    },
    {
      businessName: "Rojas Plumbing & Heating",
      category: "Plumbers",
      recommendationCount: 127,
      hearts: 127,
      latestRecommendation: {
        author: "Emily K.",
        neighborhood: "Belvedere",
        text: "Rojas Plumbing in Belvedere is supposed to be very good!",
        date: "2024-12-12",
        upvotes: 6
      },
      mentions: [],
      neighborhoods: ["Belvedere", "Tiburon", "Sausalito"],
      phone: "(415) 505-4995",
      website: undefined,
      address: "180 Bella Vista Ave, Belvedere, CA 94920",
    },
    {
      businessName: "Letts Plumbing",
      category: "Plumbers",
      recommendationCount: 906,
      hearts: 906,
      latestRecommendation: {
        author: "Nicole P.",
        neighborhood: "Concord",
        text: "Letts Plumbing does the entire job and haulaway, good prices.",
        date: "2024-12-20",
        upvotes: 15
      },
      mentions: [],
      neighborhoods: ["Concord", "Walnut Creek", "Pleasant Hill"],
      phone: undefined,
      website: undefined,
      address: "1717 Solano Way, Concord, CA 94520",
    },
  ];

  return baseData.map(b => ({
    ...b,
    searchQuery: query,
    location: location,
    scrapedAt: new Date().toISOString(),
    website: b.website || undefined,
    address: b.address || undefined,
  }));
}

function getDemoPosts(): NeighborhoodPost[] {
  return [
    {
      postType: "recommendation_request",
      title: "Need a reliable plumber",
      content: "Looking for a plumber to fix a leak under the kitchen sink. Any recommendations in the Sausalito area?",
      author: "Maria G.",
      neighborhood: "Sausalito",
      date: "2024-12-20",
      upvotes: 5,
      commentCount: 12,
      comments: [
        {
          author: "Tom H.",
          text: "I highly recommend Dan's Plumbing. They did great work at my place.",
          date: "2024-12-20",
          upvotes: 3
        },
        {
          author: "Lisa R.",
          text: "Warrior Plumbing is also great! Joe is very responsive.",
          date: "2024-12-20",
          upvotes: 2
        }
      ],
      businessMentions: ["Dan's Plumbing", "Warrior Plumbing"],
      scrapedAt: new Date().toISOString()
    },
  ];
}

// Firecrawl scraping function (optional enhancement)
async function scrapeWithFirecrawl(
  url: string,
  apiKey: string,
  log: { info: (msg: string) => void; warning: (msg: string) => void }
): Promise<string | null> {
  try {
    log.info(`Attempting Firecrawl scrape: ${url}`);

    const response = await axios.post(
      'https://api.firecrawl.dev/v1/scrape',
      {
        url,
        formats: ['markdown', 'html'],
        waitFor: 5000,
        timeout: 30000,
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 60000,
      }
    );

    if (response.data?.success && response.data?.data?.markdown) {
      log.info('Firecrawl scrape successful');
      return response.data.data.markdown;
    }

    log.warning('Firecrawl returned no content');
    return null;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    log.warning(`Firecrawl error: ${errorMessage}`);
    return null;
  }
}

// Parse Nextdoor business listings from markdown/text
function parseBusinessListings(content: string, query: string, location: string): BusinessRecommendation[] {
  const businesses: BusinessRecommendation[] = [];
  const lines = content.split('\n');

  // Pattern: Business name followed by hearts count (e.g., "Dan's Plumbing and Sewer Service Inc. 251")
  // Or markdown format: **Business Name** - hearts pattern
  const businessPattern = /^(?:\*\*)?([A-Z][^*\n]+?)(?:\*\*)?\s*(?:\[?\s*)?(\d+)(?:\s*Hearts?|\s*Recommendations?)?/gmi;
  const addressPattern = /(\d+\s+[\w\s]+(?:Ave|St|Rd|Blvd|Way|Dr|Lane|Ln|Circle|Ct|Court)[\w\s,]*\d{5})/gi;
  const phonePattern = /\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
  const websitePattern = /https?:\/\/[^\s<>"]+/gi;

  let currentBusiness: Partial<BusinessRecommendation> | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip empty lines and navigation elements
    if (!line || line.length < 3) continue;
    if (/^(All|Posts|Businesses|Pages|For Sale|Search|Home|Nextdoor)/i.test(line)) continue;

    // Check for business name with hearts
    const heartsMatch = line.match(/^(.+?)\s+(\d+)\s*$/);
    if (heartsMatch && heartsMatch[2]) {
      const hearts = parseInt(heartsMatch[2], 10);
      if (hearts > 0 && heartsMatch[1].length > 3 && heartsMatch[1].length < 100) {
        // Save previous business
        if (currentBusiness?.businessName) {
          businesses.push({
            businessName: currentBusiness.businessName,
            category: currentBusiness.category || 'Business',
            recommendationCount: currentBusiness.hearts || 0,
            hearts: currentBusiness.hearts || 0,
            latestRecommendation: {
              author: 'Neighbor',
              neighborhood: location,
              text: currentBusiness.latestRecommendation?.text || '',
              date: new Date().toISOString().split('T')[0],
              upvotes: 0
            },
            mentions: [],
            neighborhoods: [location],
            phone: currentBusiness.phone,
            website: currentBusiness.website,
            address: currentBusiness.address,
            searchQuery: query,
            location: location,
            scrapedAt: new Date().toISOString()
          });
        }

        currentBusiness = {
          businessName: heartsMatch[1].trim(),
          hearts: hearts,
          category: 'Business'
        };
        continue;
      }
    }

    // Look for address
    const addressMatches = line.match(addressPattern);
    if (addressMatches && currentBusiness) {
      currentBusiness.address = addressMatches[0];
    }

    // Look for phone
    const phoneMatches = line.match(phonePattern);
    if (phoneMatches && currentBusiness) {
      currentBusiness.phone = phoneMatches[0];
    }

    // Look for website
    const websiteMatches = line.match(websitePattern);
    if (websiteMatches && currentBusiness) {
      const website = websiteMatches.find(w => !w.includes('nextdoor.com'));
      if (website) currentBusiness.website = website;
    }

    // Look for recommendation text
    if (currentBusiness && !currentBusiness.latestRecommendation?.text && line.length > 20 && line.length < 300) {
      if (!line.includes('http') && !addressPattern.test(line) && !phonePattern.test(line)) {
        currentBusiness.latestRecommendation = {
          author: 'Neighbor',
          neighborhood: location,
          text: line,
          date: new Date().toISOString().split('T')[0],
          upvotes: 0
        };
      }
    }
  }

  // Don't forget the last business
  if (currentBusiness?.businessName) {
    businesses.push({
      businessName: currentBusiness.businessName,
      category: currentBusiness.category || 'Business',
      recommendationCount: currentBusiness.hearts || 0,
      hearts: currentBusiness.hearts || 0,
      latestRecommendation: {
        author: 'Neighbor',
        neighborhood: location,
        text: currentBusiness.latestRecommendation?.text || '',
        date: new Date().toISOString().split('T')[0],
        upvotes: 0
      },
      mentions: [],
      neighborhoods: [location],
      phone: currentBusiness.phone,
      website: currentBusiness.website,
      address: currentBusiness.address,
      searchQuery: query,
      location: location,
      scrapedAt: new Date().toISOString()
    });
  }

  return businesses;
}

// Build Nextdoor search URL
function buildNextdoorUrl(query: string, location: string, scrapeType: string): string {
  // If a full URL is provided, use it
  if (query.startsWith('http')) {
    return query;
  }

  // Build search URL for businesses tab
  const encodedQuery = encodeURIComponent(query);

  if (scrapeType === 'businesses' || scrapeType === 'recommendations') {
    return `https://nextdoor.com/search/businesses/?query=${encodedQuery}`;
  } else if (scrapeType === 'events') {
    return `https://nextdoor.com/search/events/?query=${encodedQuery}`;
  }

  return `https://nextdoor.com/search/?query=${encodedQuery}`;
}

Actor.main(async () => {
  const input = await Actor.getInput<NextdoorInput>() ?? {};

  // If input is completely empty (no keys), use demo mode
  const isEmptyInput = Object.keys(input).length === 0;

  const {
    scrapeType = 'businesses',
    location = 'Sausalito, CA',
    searchQuery = 'Plumber',
    searchUrl,
    category = 'all',
    maxResults = 50,
    includeComments = false,
    includeVotes = true,
    minRecommendations = 0,
    dateRange = 'all',
    proxyConfiguration,
    nextdoorEmail,
    nextdoorPassword,
    nextdoorCookies,
    useFirecrawl = false,
    firecrawlApiKey,
    demoMode = isEmptyInput,
    webhookUrl,
  } = input;

  // Parse cookies if provided
  const parsedCookies = nextdoorCookies ? parseCookies(nextdoorCookies) : [];

  // Check authentication method
  const hasLoginCredentials = nextdoorEmail && nextdoorPassword;
  const hasCookies = parsedCookies.length > 0;

  console.log('='.repeat(50));
  console.log('NEXTDOOR SCRAPER - Business Recommendations');
  console.log('='.repeat(50));
  console.log(`Scrape type: ${scrapeType}`);
  console.log(`Location: ${location}`);
  console.log(`Search query: ${searchQuery}`);
  console.log(`Search URL: ${searchUrl || 'auto-generated'}`);
  console.log(`Max results: ${maxResults}`);
  console.log(`Nextdoor login: ${hasLoginCredentials ? 'Email/password provided' : 'No credentials'}`);
  console.log(`Nextdoor cookies: ${hasCookies ? `Yes (${parsedCookies.length} cookies)` : 'No'}`);
  console.log(`Firecrawl: ${useFirecrawl && firecrawlApiKey ? 'Enabled' : 'Disabled'}`);
  console.log(`Demo mode: ${demoMode}`);

  // Demo mode - return sample data
  if (demoMode) {
    console.log('\n[DEMO MODE] Returning sample Nextdoor recommendations data');

    let results: (BusinessRecommendation | NeighborhoodPost)[];

    if (scrapeType === 'recommendations' || scrapeType === 'businesses') {
      results = getDemoRecommendations(searchQuery, location);

      // Apply minRecommendations filter
      if (minRecommendations > 0) {
        results = (results as BusinessRecommendation[]).filter(r =>
          r.recommendationCount >= minRecommendations
        );
      }
    } else {
      results = getDemoPosts();

      // Remove comments if not requested
      if (!includeComments) {
        results = (results as NeighborhoodPost[]).map(p => ({
          ...p,
          comments: undefined
        }));
      }
    }

    // Limit results
    results = results.slice(0, maxResults);

    // Push to dataset
    await Actor.pushData(results);

    console.log(`\n[DEMO] Returned ${results.length} sample items.`);
    console.log('To scrape real data, set demoMode: false and provide your Nextdoor login credentials');

    // Webhook delivery
    if (webhookUrl) {
      try {
        await axios.post(webhookUrl, {
          source: 'nextdoor-scraper',
          demoMode: true,
          query: searchQuery,
          location: location,
          results: results
        });
        console.log('Results delivered to webhook');
      } catch (e) {
        console.log('Webhook delivery failed');
      }
    }

    return;
  }

  // Real scraping mode
  console.log('\n[LIVE MODE] Scraping Nextdoor...');

  if (!hasLoginCredentials && !hasCookies) {
    console.log('\n⚠️  WARNING: No authentication provided!');
    console.log('Nextdoor requires login to view search results.');
    console.log('\nTo fix this, provide ONE of the following:');
    console.log('1. Email + Password (easiest) - enter your Nextdoor login credentials');
    console.log('2. Session Cookies - export from your browser using EditThisCookie/Cookie-Editor');
    console.log('\nOr set demoMode: true to test with sample data.\n');
  }

  const results: BusinessRecommendation[] = [];
  const targetUrl = searchUrl || buildNextdoorUrl(searchQuery, location, scrapeType);

  console.log(`Target URL: ${targetUrl}`);

  // Try Firecrawl first if enabled (optional - may help with some pages)
  if (useFirecrawl && firecrawlApiKey) {
    console.log('\nAttempting Firecrawl scrape first...');
    console.log('Note: Firecrawl may not bypass Nextdoor login wall, but can help with rendering');

    const markdown = await scrapeWithFirecrawl(
      targetUrl,
      firecrawlApiKey,
      { info: console.log, warning: console.warn }
    );

    if (markdown) {
      console.log(`Got ${markdown.length} characters from Firecrawl`);

      const parsed = parseBusinessListings(markdown, searchQuery, location);
      console.log(`Parsed ${parsed.length} businesses from Firecrawl content`);

      if (parsed.length > 0) {
        results.push(...parsed);
        console.log('Firecrawl extraction successful - skipping browser scrape');
      } else {
        console.log('Firecrawl returned content but no businesses found - falling back to browser');
      }
    } else {
      console.log('Firecrawl failed - falling back to browser scrape');
    }
  }

  // Use Camoufox browser if Firecrawl didn't get results
  if (results.length === 0) {
    console.log('\nAttempting browser scrape with Camoufox...');

    try {
      // Set up Camoufox for stealth browsing
      const camoufoxOptions = await launchOptions({
        headless: true,
      });

      let proxyConfig: ProxyConfiguration | undefined;
      if (proxyConfiguration?.useApifyProxy) {
        proxyConfig = await Actor.createProxyConfiguration({
          groups: proxyConfiguration.apifyProxyGroups,
        });
      }

      const crawler = new PlaywrightCrawler({
        launchContext: {
          launcher: firefox,
          launchOptions: camoufoxOptions,
        },
        browserPoolOptions: {
          useFingerprints: false,
        },
        proxyConfiguration: proxyConfig,
        maxRequestsPerCrawl: 5,
        requestHandlerTimeoutSecs: 60,
        navigationTimeoutSecs: 30,

        async requestHandler({ page, request, log }) {
          log.info(`Processing: ${request.url}`);

          // Inject cookies if provided (for authenticated access)
          if (hasCookies) {
            log.info(`Injecting ${parsedCookies.length} cookies for authenticated access...`);
            try {
              const context = page.context();
              await context.addCookies(parsedCookies.map(c => ({
                name: c.name,
                value: c.value,
                domain: c.domain || '.nextdoor.com',
                path: c.path || '/',
                expires: c.expires,
                httpOnly: c.httpOnly,
                secure: c.secure,
                sameSite: c.sameSite,
              })));
              log.info('Cookies injected successfully');
              // Reload page with cookies
              await page.reload({ waitUntil: 'networkidle' });
            } catch (cookieError) {
              log.warning(`Cookie injection failed: ${cookieError}`);
            }
          }

          // Wait for content to load
          await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
          await page.waitForTimeout(3000);

          // Check if we hit a login wall
          let pageContent = await page.content();
          let loginRequired = pageContent.includes('Sign in to Nextdoor') ||
                               pageContent.includes('Join Nextdoor') ||
                               pageContent.includes('Log in') ||
                               pageContent.includes('sign-in');

          // If login required and we have credentials, perform login
          if (loginRequired && hasLoginCredentials) {
            log.info('Login wall detected - attempting to log in with provided credentials...');

            try {
              // Navigate to login page
              await page.goto('https://nextdoor.com/login/', { waitUntil: 'networkidle' });
              await page.waitForTimeout(2000);

              // Fill in email
              const emailInput = await page.locator('input[type="email"], input[name="email"], input[id="email"]').first();
              if (await emailInput.isVisible()) {
                await emailInput.fill(nextdoorEmail!);
                log.info('Email entered');
              } else {
                // Try alternative selectors
                const altEmailInput = await page.locator('input[placeholder*="email"], input[placeholder*="Email"]').first();
                if (await altEmailInput.isVisible()) {
                  await altEmailInput.fill(nextdoorEmail!);
                  log.info('Email entered (alt selector)');
                }
              }

              await page.waitForTimeout(1000);

              // Fill in password
              const passwordInput = await page.locator('input[type="password"], input[name="password"]').first();
              if (await passwordInput.isVisible()) {
                await passwordInput.fill(nextdoorPassword!);
                log.info('Password entered');
              }

              await page.waitForTimeout(1000);

              // Click login button
              const loginButton = await page.locator('button[type="submit"], button:has-text("Sign in"), button:has-text("Log in")').first();
              if (await loginButton.isVisible()) {
                await loginButton.click();
                log.info('Login button clicked');
              }

              // Wait for login to complete
              await page.waitForTimeout(5000);
              await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});

              // Check if login succeeded
              const postLoginContent = await page.content();
              if (postLoginContent.includes('Sign in to Nextdoor') || postLoginContent.includes('incorrect')) {
                log.warning('Login may have failed - check credentials');
              } else {
                log.info('Login appears successful!');
              }

              // Navigate back to target URL
              log.info(`Navigating to target: ${targetUrl}`);
              await page.goto(targetUrl, { waitUntil: 'networkidle' });
              await page.waitForTimeout(3000);

              // Re-check page content
              pageContent = await page.content();
              loginRequired = pageContent.includes('Sign in to Nextdoor') ||
                             pageContent.includes('Join Nextdoor') ||
                             pageContent.includes('Log in');

            } catch (loginError) {
              log.warning(`Login attempt failed: ${loginError}`);
            }
          }

          // If still showing login wall
          if (loginRequired) {
            log.warning('Login wall still detected after authentication attempt');
            log.info('TIP: Check your credentials or try exporting cookies manually');

            // Try to extract any visible content anyway
            const visibleText = await page.evaluate(() => document.body.innerText);
            const parsed = parseBusinessListings(visibleText, searchQuery, location);
            if (parsed.length > 0) {
              results.push(...parsed);
              log.info(`Extracted ${parsed.length} businesses from partial content`);
            }
            return;
          }

          // Get page content
          const textContent = await page.evaluate(() => document.body.innerText);
          log.info(`Got ${textContent.length} characters from page`);

          // Parse business listings
          const parsed = parseBusinessListings(textContent, searchQuery, location);
          log.info(`Parsed ${parsed.length} businesses`);

          results.push(...parsed);
        },

        failedRequestHandler({ request, log }) {
          log.warning(`Request failed: ${request.url}`);
        },
      });

      await crawler.run([targetUrl]);

    } catch (error) {
      console.error('Browser scrape error:', error);
    }
  }

  // Apply filters
  let filteredResults = results;

  if (minRecommendations > 0) {
    filteredResults = filteredResults.filter(r => r.recommendationCount >= minRecommendations);
  }

  // Limit results
  filteredResults = filteredResults.slice(0, maxResults);

  // Push results
  if (filteredResults.length > 0) {
    await Actor.pushData(filteredResults);
    console.log(`\nSaved ${filteredResults.length} businesses to dataset`);

    // Charge for items scraped
    try {
      await Actor.charge({ eventName: 'business_scraped', count: filteredResults.length });
      console.log(`Charged for ${filteredResults.length} business_scraped events`);
    } catch (e) {
      // Pay-per-event not available
    }
  } else {
    console.log('\nNo results found.');
    console.log('Tips:');
    console.log('1. Make sure you provided Nextdoor login (email/password) or cookies');
    console.log('2. Check your credentials are correct');
    console.log('3. If using cookies, they may have expired - try fresh ones');
    console.log('4. Make sure location is valid (e.g., "Sausalito, CA")');
    console.log('5. Try a different search query');
  }

  // Webhook delivery
  if (webhookUrl && filteredResults.length > 0) {
    try {
      await axios.post(webhookUrl, {
        source: 'nextdoor-scraper',
        demoMode: false,
        query: searchQuery,
        location: location,
        resultCount: filteredResults.length,
        results: filteredResults
      });
      console.log('Results delivered to webhook');

      try {
        await Actor.charge({ eventName: 'webhook_delivered', count: 1 });
      } catch (e) {
        // Pay-per-event not available
      }
    } catch (e) {
      console.warn('Webhook delivery failed');
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('SCRAPING COMPLETE');
  console.log('='.repeat(50));
});
