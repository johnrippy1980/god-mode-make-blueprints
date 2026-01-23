# Nextdoor Scraper - Local Business Recommendations & Hearts

Scrape local business recommendations and "Hearts" from Nextdoor. Extract verified neighbor endorsements, recommendation counts, phone numbers, websites, and addresses.

**Built by [John Rippy](https://www.linkedin.com/in/johnrippy/) - Zapier 2025 Automation Hero of the Year**

## Why Nextdoor Data is Valuable

Nextdoor recommendations are **hyper-local gold** that you can't find anywhere else:
- Real neighbors recommending real businesses (not fake reviews)
- "Hearts" count = trusted social proof metric
- Phone numbers and websites included
- See which neighborhoods trust which businesses

---

## Important: Nextdoor Requires Your Login

Unlike Google Maps or Yelp, **Nextdoor search results are only visible to logged-in members**. This is a hard authentication requirement - not just anti-bot protection.

To scrape Nextdoor business searches, you must provide your Nextdoor account cookies.

---

## Quick Start

### Option 1: Test with Demo Mode (Free)

```json
{
  "location": "Sausalito, CA",
  "searchQuery": "Plumber",
  "demoMode": true
}
```

This returns realistic sample data so you can test your Make.com/Zapier workflow without needing login.

### Option 2: Live Scraping with Email/Password (Easiest)

```json
{
  "location": "Sausalito, CA",
  "searchQuery": "Plumber",
  "demoMode": false,
  "nextdoorEmail": "your-email@example.com",
  "nextdoorPassword": "your-password"
}
```

Just enter your Nextdoor login credentials and the scraper will log in automatically.

### Option 3: Live Scraping with Cookies (Alternative)

```json
{
  "location": "Sausalito, CA",
  "searchQuery": "Plumber",
  "demoMode": false,
  "nextdoorCookies": "[paste your exported cookies JSON here]"
}
```

Use this if email/password login doesn't work for your account (e.g., if you use Google/Facebook login).

---

## Authentication Options

### Option A: Email + Password (Recommended)

The easiest way! Just enter your Nextdoor email and password in the input fields. The scraper will log in automatically.

**Note:** This works for accounts created with email/password. If you signed up with Google or Facebook, use the cookie method instead.

### Option B: Export Your Cookies

If email/password doesn't work (Google/Facebook login accounts), export your session cookies:

### Step 1: Install a Cookie Export Extension

**Chrome:**
- [EditThisCookie](https://chrome.google.com/webstore/detail/editthiscookie/fngmhnnpilhplaeedifhccceomclgfbg) (most popular)
- [Cookie-Editor](https://chrome.google.com/webstore/detail/cookie-editor/hlkenndednhfkekhgcdicdfddnkalmdm)

**Firefox:**
- [Cookie-Editor](https://addons.mozilla.org/en-US/firefox/addon/cookie-editor/)

### Step 2: Log Into Nextdoor

Go to [nextdoor.com](https://nextdoor.com) and log in with your account.

### Step 3: Export Your Cookies

1. Click the cookie extension icon in your browser toolbar
2. Click "Export" or "Export as JSON"
3. Copy the entire JSON output to your clipboard

### Step 4: Paste Into the Actor

In the "Nextdoor Session Cookies" field, paste your exported cookies.

**Supported formats:**
- JSON array (what EditThisCookie/Cookie-Editor exports)
- Semicolon-separated string: `cookie1=value1; cookie2=value2`

**Important:** Keep your cookies private - they grant access to your Nextdoor account. Cookies typically expire after a few weeks, so you may need to re-export them periodically.

---

## Demo Mode Explained

| Setting | What Happens |
|---------|--------------|
| `demoMode: true` | Returns sample plumber data from Sausalito area. Free. No cookies needed. Use for testing workflows. |
| `demoMode: false` | Scrapes real Nextdoor data. **Requires your Nextdoor cookies.** |

---

## Input Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `location` | string | "Sausalito, CA" | City and state to search (e.g., "Austin, TX", "Miami, FL") |
| `searchQuery` | string | "Plumber" | What to search for (e.g., "Electrician", "Restaurant", "HVAC") |
| `searchUrl` | string | - | Optional: Paste a Nextdoor search URL directly |
| `scrapeType` | string | "businesses" | Type: businesses, recommendations, posts, events |
| `maxResults` | number | 50 | Maximum businesses to return (1-500) |
| `minRecommendations` | number | 0 | Only include businesses with at least this many hearts |
| `nextdoorEmail` | string | - | Your Nextdoor email (easiest authentication method) |
| `nextdoorPassword` | string | - | Your Nextdoor password |
| `nextdoorCookies` | string | - | Alternative: Session cookies for Google/Facebook login accounts |
| `demoMode` | boolean | false | Return sample data instead of scraping |
| `webhookUrl` | string | - | URL to POST results (Make.com, Zapier, n8n) |

---

## Output Format

Each business includes:

```json
{
  "businessName": "Dan's Plumbing and Sewer Service Inc.",
  "category": "Plumbers",
  "recommendationCount": 251,
  "hearts": 251,
  "latestRecommendation": {
    "author": "Sarah M.",
    "neighborhood": "San Rafael",
    "text": "They get an A+ from me! Fast, professional, and fair pricing.",
    "date": "2024-12-15",
    "upvotes": 12
  },
  "neighborhoods": ["San Rafael", "Sausalito", "Mill Valley"],
  "phone": "(415) 462-5858",
  "website": "http://dansplumbingandsewer.com",
  "address": "15 Woodland Avenue, San Rafael, CA 94901",
  "searchQuery": "Plumber",
  "location": "Sausalito, CA",
  "scrapedAt": "2026-01-23T20:19:38.221Z"
}
```

---

## Pricing

This actor uses **pay-per-event** pricing:

| Event | Price | Description |
|-------|-------|-------------|
| Actor Start | $0.10 | Per GB of memory (4GB = $0.40 base) |
| Business Scraped | $0.01 | Per business listing |
| Dataset Item | $0.00001 | Per result saved |

**Example costs:**
- 50 businesses: ~$0.50 + $0.40 base = **$0.90**
- 100 businesses: ~$1.00 + $0.40 base = **$1.40**
- Demo mode: **Free** (no scraping charges)

---

## Use Cases

- **Lead Generation**: Find highly-recommended local businesses
- **Competitor Research**: See who's getting the most hearts in your category
- **Local SEO**: Discover businesses to partner with or compete against
- **Market Research**: Understand local preferences by neighborhood
- **Reputation Monitoring**: Track mentions across neighborhoods
- **Sales Prospecting**: Find businesses with strong local presence but no website

---

## Troubleshooting

### "Login wall detected"

Nextdoor requires authentication for search results. Solutions:
1. **Try email/password login** - Enter your Nextdoor credentials in the input fields
2. **Export cookies** - If you use Google/Facebook login, export cookies instead
3. **Check credentials** - Make sure email/password are correct

### Login not working

- **Email/password accounts:** Double-check your credentials are correct
- **Google/Facebook accounts:** These can't use email/password login - use cookie export instead
- **2FA enabled:** If you have two-factor auth, you'll need to use cookie export

### No results returned

- Check your `location` format: "City, ST" (e.g., "Austin, TX")
- Try a broader `searchQuery` (e.g., "plumber" instead of "emergency plumber")
- Ensure `demoMode` is set to `false`

### Need help?

- [Open an issue](https://github.com/anthropics/claude-code/issues)
- [Contact John Rippy](https://www.linkedin.com/in/johnrippy/)

---

## Why Cookies Are Required (Technical Explanation)

Nextdoor is a private neighborhood network. Unlike public sites like Google Maps or Yelp:

- **Search results pages** (`/search/businesses/`) require login - no exceptions
- **Individual business pages** (`/pages/business-name/`) are public but don't show hearts count

The hearts/recommendations count is the most valuable data on Nextdoor, and it's only visible on search result pages - which require authentication.

No scraping tool (Firecrawl, proxies, stealth browsers) can bypass this because it's not anti-bot protection - it's a fundamental login requirement.

---

## Related Actors

- [Google Maps Scraper](https://apify.com/alizarin_refrigerator-owner/google-maps-scraper) - Scrape Google Maps business listings (no login required)
- [Apple Maps Scraper](https://apify.com/alizarin_refrigerator-owner/apple-maps-business-listings-scraper) - Scrape Apple Maps with ratings (no login required)
- [Yelp Scraper](https://apify.com/alizarin_refrigerator-owner/yelp-scraper) - Scrape Yelp reviews and ratings (no login required)

---

## About the Builder

**John Rippy** - [LinkedIn](https://www.linkedin.com/in/johnrippy/) | [Website](https://johnrippy.link/)

- Zapier 2025 Automation Hero of the Year
- 280+ Apify actors in production
- Creator of [Actor Arsenal](https://actor-arsenal-site.vercel.app) (DOOM-themed) and [GOD MODE INTEL](https://god-mode-intel-site.vercel.app) (Splatterhouse-themed)

---

**Keywords:** Nextdoor scraper, local business recommendations, neighborhood data, hearts count, local lead generation, hyper-local marketing, neighbor endorsements, Nextdoor API alternative
