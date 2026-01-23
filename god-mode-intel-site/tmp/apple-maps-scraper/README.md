# Apple Maps Scraper

Scrape business listings from Apple Maps. Extract business names, categories, ratings (Apple's % rating + Yelp/Tripadvisor aggregated), hours, and more.

## Features

### Apple-Exclusive Data

Extract data unique to Apple Maps:

| Data Point | Description |
|------------|-------------|
| **Apple % Rating** | Apple's proprietary percentage-based rating (e.g., 92%) |
| **External Ratings** | Aggregated from Yelp, TripAdvisor, Google |
| **Business Hours** | Current open/closed status with times |
| **Categories** | Apple's business categorization |

### Search Any Location

Search for businesses anywhere:
- "pizza new york"
- "coffee shop san francisco"
- "dentist austin tx"
- "gym boston ma"

---

## Quick Start

```json
{
  "url": "https://example.com",
  "maxResults": 100
}
```

## Demo Mode

Set `demoMode: true` to test with sample data (no charges). When you're ready for real results, set `demoMode: false` or omit it.

```json
{
  "demoMode": true,
  ...
}
```

## Input Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `searchQueries` | array | No | Demo queries | Search queries like "pizza austin tx" |
| `maxResults` | number | No | 20 | Max businesses per query |
| `demoMode` | boolean | No | true | Use sample data |
| `proxyConfiguration` | object | No | - | Proxy settings for live scraping |
| `webhookUrl` | string | No | - | URL to send results to (Zapier, Make, n8n) |

---

## Output Format

```json
{
  "name": "Via 313 Pizza",
  "category": "Pizza Restaurant",
  "appleRating": "95%",
  "externalRatings": [
    { "source": "Yelp", "rating": "4.7" },
    { "source": "TripAdvisor", "rating": "4.5" }
  ],
  "hours": "Open till 10 PM",
  "address": "1111 E 6th St, Austin, TX 78702",
  "phone": "(512) 939-1927",
  "website": "https://via313.com",
  "appleMapsUrl": "https://maps.apple.com/search?query=Via%20313%20Pizza",
  "searchQuery": "pizza austin tx",
  "scrapedAt": "2025-01-14T12:00:00.000Z"
}
```

---

## Pricing

This actor uses **pay-per-event** billing:
- `data_point`: $0.01 per result

## Use Cases

### Local SEO Research

Compare Apple Maps data with Google Business Profiles to identify listing inconsistencies.

### Competitive Analysis

Extract ratings and reviews for competitors in a specific area.

### Lead Generation

Build lists of local businesses with contact information.

### Market Research

Analyze business density and categories in different markets.

### Citation Building

Verify NAP (Name, Address, Phone) data across platforms.

---

---

**Built by John Rippy | [Actor Arsenal](https://actorarsenal.com)**
