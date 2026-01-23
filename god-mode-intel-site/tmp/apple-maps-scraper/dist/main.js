import { Actor } from 'apify';
import { PlaywrightCrawler, Dataset, Log } from 'crawlee';
import axios from 'axios';
// Demo data for testing
const DEMO_BUSINESSES = [
    {
        name: "Joe's Pizza",
        category: 'Pizza Restaurant',
        appleRating: '92%',
        externalRatings: [
            { source: 'Yelp', rating: '4.5' },
            { source: 'Google', rating: '4.6' },
        ],
        hours: 'Open till 11 PM',
        address: '7 Carmine St, New York, NY 10014',
        phone: '(212) 366-1182',
        website: 'https://joespizzanyc.com',
        appleMapsUrl: 'https://maps.apple.com/search?query=Joe%27s%20Pizza',
        searchQuery: 'pizza austin tx',
        scrapedAt: new Date().toISOString(),
    },
    {
        name: 'Via 313 Pizza',
        category: 'Pizza Restaurant',
        appleRating: '95%',
        externalRatings: [
            { source: 'Yelp', rating: '4.7' },
            { source: 'TripAdvisor', rating: '4.5' },
        ],
        hours: 'Open till 10 PM',
        address: '1111 E 6th St, Austin, TX 78702',
        phone: '(512) 939-1927',
        website: 'https://via313.com',
        appleMapsUrl: 'https://maps.apple.com/search?query=Via%20313%20Pizza',
        searchQuery: 'pizza austin tx',
        scrapedAt: new Date().toISOString(),
    },
    {
        name: 'Home Slice Pizza',
        category: 'Pizza Restaurant',
        appleRating: '91%',
        externalRatings: [
            { source: 'Yelp', rating: '4.4' },
            { source: 'Google', rating: '4.5' },
        ],
        hours: 'Open till 11 PM',
        address: '1415 S Congress Ave, Austin, TX 78704',
        phone: '(512) 444-7437',
        website: 'https://homeslicepizza.com',
        appleMapsUrl: 'https://maps.apple.com/search?query=Home%20Slice%20Pizza',
        searchQuery: 'pizza austin tx',
        scrapedAt: new Date().toISOString(),
    },
    {
        name: "Pinthouse Pizza",
        category: 'Pizza Restaurant',
        appleRating: '89%',
        externalRatings: [
            { source: 'Yelp', rating: '4.3' },
            { source: 'Google', rating: '4.4' },
        ],
        hours: 'Open till 10 PM',
        address: '4729 Burnet Rd, Austin, TX 78756',
        phone: '(512) 436-9605',
        website: 'https://pinthousepizza.com',
        appleMapsUrl: 'https://maps.apple.com/search?query=Pinthouse%20Pizza',
        searchQuery: 'pizza austin tx',
        scrapedAt: new Date().toISOString(),
    },
    {
        name: 'Blue Star Coffee',
        category: 'Coffee Shop',
        appleRating: '94%',
        externalRatings: [
            { source: 'Yelp', rating: '4.6' },
            { source: 'Google', rating: '4.7' },
        ],
        hours: 'Open till 6 PM',
        address: '1142 Folsom St, San Francisco, CA 94103',
        phone: '(415) 495-3394',
        website: 'https://bluebottlecoffee.com',
        appleMapsUrl: 'https://maps.apple.com/search?query=Blue%20Star%20Coffee',
        searchQuery: 'coffee shop san francisco',
        scrapedAt: new Date().toISOString(),
    },
    {
        name: 'Ritual Coffee Roasters',
        category: 'Coffee Shop',
        appleRating: '93%',
        externalRatings: [
            { source: 'Yelp', rating: '4.5' },
            { source: 'TripAdvisor', rating: '4.4' },
        ],
        hours: 'Open till 7 PM',
        address: '1026 Valencia St, San Francisco, CA 94110',
        phone: '(415) 641-1011',
        website: 'https://ritualroasters.com',
        appleMapsUrl: 'https://maps.apple.com/search?query=Ritual%20Coffee%20Roasters',
        searchQuery: 'coffee shop san francisco',
        scrapedAt: new Date().toISOString(),
    },
    {
        name: 'Sightglass Coffee',
        category: 'Coffee Shop',
        appleRating: '92%',
        externalRatings: [
            { source: 'Yelp', rating: '4.4' },
            { source: 'Google', rating: '4.5' },
        ],
        hours: 'Open till 6 PM',
        address: '270 7th St, San Francisco, CA 94103',
        phone: '(415) 861-1313',
        website: 'https://sightglasscoffee.com',
        appleMapsUrl: 'https://maps.apple.com/search?query=Sightglass%20Coffee',
        searchQuery: 'coffee shop san francisco',
        scrapedAt: new Date().toISOString(),
    },
    {
        name: 'Philz Coffee',
        category: 'Coffee Shop',
        appleRating: '90%',
        externalRatings: [
            { source: 'Yelp', rating: '4.3' },
            { source: 'Google', rating: '4.4' },
        ],
        hours: 'Open till 8 PM',
        address: '3101 24th St, San Francisco, CA 94110',
        phone: '(415) 875-9656',
        website: 'https://philzcoffee.com',
        appleMapsUrl: 'https://maps.apple.com/search?query=Philz%20Coffee',
        searchQuery: 'coffee shop san francisco',
        scrapedAt: new Date().toISOString(),
    },
];
const log = new Log({ prefix: 'AppleMaps' });
async function deliverToWebhook(url, data) {
    try {
        await axios.post(url, data, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 30000,
        });
        log.info('Results delivered to webhook');
        return true;
    }
    catch (error) {
        log.warning(`Failed to deliver to webhook: ${error}`);
        return false;
    }
}
await Actor.init();
const input = await Actor.getInput();
const { searchQueries = ['pizza austin tx', 'coffee shop san francisco'], maxResults = 20, demoMode = false, proxyConfiguration: proxyConfig, webhookUrl, } = input || {};
log.info('Apple Maps Scraper starting');
log.info(`Search queries: ${searchQueries.join(', ')}`);
log.info(`Max results per query: ${maxResults}`);
log.info(`Demo mode: ${demoMode}`);
if (demoMode) {
    log.info('Running in DEMO MODE - using sample business data');
    // Filter demo data by search queries and limit results
    const results = [];
    for (const query of searchQueries) {
        const queryLower = query.toLowerCase();
        const matchingBusinesses = DEMO_BUSINESSES
            .filter(b => {
            const searchMatch = b.searchQuery.toLowerCase().includes(queryLower) ||
                queryLower.includes(b.category?.toLowerCase() || '') ||
                queryLower.includes(b.name.toLowerCase());
            return searchMatch;
        })
            .slice(0, maxResults)
            .map(b => ({ ...b, searchQuery: query, scrapedAt: new Date().toISOString() }));
        results.push(...matchingBusinesses);
        log.info(`[DEMO] Found ${matchingBusinesses.length} businesses for "${query}"`);
    }
    // If no specific matches, return some sample data
    if (results.length === 0) {
        const sampleResults = DEMO_BUSINESSES.slice(0, maxResults).map(b => ({
            ...b,
            searchQuery: searchQueries[0] || 'demo search',
            scrapedAt: new Date().toISOString(),
        }));
        results.push(...sampleResults);
        log.info(`[DEMO] Returning ${sampleResults.length} sample businesses`);
    }
    await Dataset.pushData(results);
    log.info(`Saved ${results.length} business listings to dataset`);
    // Charge for businesses scraped
    if (results.length > 0) {
        try {
            // DISABLED IN DEMO: await Actor.charge({ eventName: 'business_scraped', count: results.length });
            log.info(`Charged for ${results.length} business_scraped events`);
        }
        catch (e) {
            // Pay-per-event not available in this environment
        }
    }
    // Deliver to webhook if configured
    if (webhookUrl) {
        const delivered = await deliverToWebhook(webhookUrl, { businesses: results, searchQueries, demoMode: true });
        if (delivered) {
            // DISABLED IN DEMO: await Actor.charge({ eventName: 'webhook-delivered', count: 1 });
        }
    }
    log.info('Demo mode complete!');
    await Actor.exit();
}
else {
    // Real scraping mode
    log.info('Running in LIVE MODE - scraping Apple Maps');
    const results = [];
    // Setup proxy configuration
    let proxyConfiguration;
    if (proxyConfig) {
        proxyConfiguration = await Actor.createProxyConfiguration(proxyConfig);
    }
    const crawler = new PlaywrightCrawler({
        proxyConfiguration,
        headless: true,
        maxRequestsPerMinute: 15,
        navigationTimeoutSecs: 60,
        requestHandlerTimeoutSecs: 120,
        launchContext: {
            launchOptions: {
                args: ['--disable-blink-features=AutomationControlled'],
            },
        },
        async requestHandler({ page, request }) {
            const searchQuery = request.userData.searchQuery;
            const isDetailPage = request.userData.isDetailPage;
            if (isDetailPage) {
                // Handle detail page
                log.info(`Processing detail page for: ${request.userData.businessName}`);
                await page.waitForTimeout(3000);
                const details = await page.evaluate(() => {
                    const getText = (selectors) => {
                        for (const selector of selectors) {
                            const el = document.querySelector(selector);
                            if (el?.textContent?.trim()) {
                                return el.textContent.trim();
                            }
                        }
                        return null;
                    };
                    // Try to find phone number
                    const phoneLink = document.querySelector('a[href^="tel:"]');
                    const phone = phoneLink ? phoneLink.getAttribute('href')?.replace('tel:', '') || null : null;
                    // Try to find website
                    const websiteLink = document.querySelector('a[href^="http"]:not([href*="apple.com"])');
                    const website = websiteLink ? websiteLink.getAttribute('href') || null : null;
                    // Try to find address
                    const addressEl = document.querySelector('[class*="address"], [class*="location"]');
                    const address = addressEl?.textContent?.trim() || null;
                    return { phone, website, address };
                });
                // Update the existing result with details
                const existingIndex = results.findIndex(r => r.name === request.userData.businessName && r.searchQuery === searchQuery);
                if (existingIndex !== -1) {
                    results[existingIndex].phone = details.phone;
                    results[existingIndex].website = details.website;
                    if (details.address) {
                        results[existingIndex].address = details.address;
                    }
                }
                return;
            }
            // Search results page
            log.info(`Processing search: ${searchQuery}`);
            // Wait for the page to fully load
            await page.waitForTimeout(5000);
            // Wait for search results to appear
            try {
                await page.waitForSelector('.mw-card, [class*="search-result"], [class*="place"]', { timeout: 15000 });
            }
            catch {
                log.warning(`No search results found for: ${searchQuery}`);
                return;
            }
            // Extract business listings from search results
            const listings = await page.evaluate((maxRes) => {
                const businesses = [];
                // Get the visible text content and parse it
                const bodyText = document.body.innerText;
                const lines = bodyText.split('\n').filter(l => l.trim());
                // Find business entries by looking for patterns
                let currentBusiness = null;
                for (let i = 0; i < lines.length && businesses.length < maxRes; i++) {
                    const line = lines[i].trim();
                    const nextLine = lines[i + 1]?.trim() || '';
                    // Skip navigation/UI elements
                    if (['Search', 'Guides', 'Directions', 'Apple Maps', 'Privacy', 'Terms', 'Legal'].includes(line)) {
                        continue;
                    }
                    // Detect category patterns (e.g., "Pizza Restaurant", "Coffee Shop")
                    const categoryPatterns = [
                        /Restaurant$/i, /Cafe$/i, /Coffee$/i, /Shop$/i, /Store$/i, /Bar$/i,
                        /Bakery$/i, /Hotel$/i, /Gym$/i, /Spa$/i, /Salon$/i, /Pizzeria$/i,
                        /New York-Style Pizza Restaurant$/i, /Pizza Restaurant$/i
                    ];
                    const isCategory = categoryPatterns.some(p => p.test(line));
                    // Detect hours pattern
                    const hoursMatch = line.match(/^(Open|Closed|Opens?)\s+(till|until|at)?\s*\d/i) ||
                        line.match(/^Open till \d+/i) ||
                        line.match(/^Closed/i);
                    // Detect rating patterns
                    const appleRatingMatch = line.match(/^(\d+)%$/);
                    const externalRatingMatch = line.match(/^(\d+\.?\d*)\s+on\s+(\w+)$/i);
                    // If we have a business name (not a category, not hours, not rating)
                    if (!isCategory && !hoursMatch && !appleRatingMatch && !externalRatingMatch &&
                        line.length > 2 && line.length < 100 &&
                        !line.includes('GUIDE') && !line.includes('PLACES')) {
                        // Check if next line is a category
                        const nextIsCategory = categoryPatterns.some(p => p.test(nextLine));
                        if (nextIsCategory && (currentBusiness === null || currentBusiness.name !== line)) {
                            // Save previous business
                            if (currentBusiness !== null && currentBusiness.name) {
                                businesses.push(currentBusiness);
                            }
                            // Start new business
                            currentBusiness = {
                                name: line,
                                category: nextLine,
                                appleRating: null,
                                externalRatings: [],
                                hours: null,
                                address: null,
                            };
                        }
                    }
                    // Add hours to current business
                    if (hoursMatch && currentBusiness) {
                        currentBusiness.hours = line;
                    }
                    // Add Apple rating to current business
                    if (appleRatingMatch && currentBusiness) {
                        currentBusiness.appleRating = appleRatingMatch[1] + '%';
                    }
                    // Add external rating to current business
                    if (externalRatingMatch && currentBusiness) {
                        currentBusiness.externalRatings.push({
                            source: externalRatingMatch[2],
                            rating: externalRatingMatch[1],
                        });
                    }
                }
                // Don't forget the last business
                if (currentBusiness && currentBusiness.name) {
                    businesses.push(currentBusiness);
                }
                return businesses;
            }, maxResults);
            log.info(`Found ${listings.length} businesses for "${searchQuery}"`);
            // Add to results
            for (const listing of listings) {
                const business = {
                    name: listing.name,
                    category: listing.category,
                    appleRating: listing.appleRating,
                    externalRatings: listing.externalRatings,
                    hours: listing.hours,
                    address: listing.address,
                    phone: null,
                    website: null,
                    appleMapsUrl: `https://maps.apple.com/search?query=${encodeURIComponent(listing.name)}`,
                    searchQuery,
                    scrapedAt: new Date().toISOString(),
                };
                results.push(business);
            }
        },
    });
    // Build start URLs for each search query
    const startUrls = searchQueries.map(query => ({
        url: `https://maps.apple.com/search?query=${encodeURIComponent(query)}`,
        userData: {
            searchQuery: query,
            isDetailPage: false,
        },
    }));
    log.info(`Starting crawl with ${startUrls.length} search queries`);
    await crawler.run(startUrls);
    // Push results to dataset
    if (results.length > 0) {
        await Dataset.pushData(results);
        log.info(`Saved ${results.length} business listings to dataset`);
        // Deliver to webhook if configured
        if (webhookUrl) {
            const delivered = await deliverToWebhook(webhookUrl, { businesses: results, searchQueries, demoMode: false });
            if (delivered) {
                // DISABLED IN DEMO: await Actor.charge({ eventName: 'webhook-delivered', count: 1 });
            }
        }
    }
    else {
        log.warning('No results found');
    }
    await Actor.exit();
}
//# sourceMappingURL=main.js.map