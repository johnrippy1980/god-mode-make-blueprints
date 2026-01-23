# Nextdoor Local Business & Recommendations Scraper

Scrape Nextdoor local business recommendations, neighborhood posts, and community data. Extract verified neighbor endorsements, vote counts, and business mentions. Essential for hyper-local market research and lead generation. Built by John Rippy (https://www.linkedin.com/in/johnrippy/ | https://johnrippy.link/).

## Features

- **Business Recommendations**: Scrape recommended businesses with neighbor endorsements
- **Neighborhood Posts**: Extract posts mentioning businesses or services
- **Category Filtering**: Filter by home services, restaurants, automotive, etc.
- **Comment Extraction**: Optionally scrape comments and replies
- **Vote Counts**: Get upvote/thanks metrics for social proof
- **Multi-Neighborhood**: Scrape multiple neighborhoods in one run

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

| Parameter | Type | Description |
|-----------|------|-------------|
| `scrapeType` | string | Type of content: recommendations, posts, businesses, events |
| `neighborhoods` | array | List of neighborhood URLs or slugs to scrape |
| `searchQuery` | string | Search term for finding specific businesses/posts |
| `category` | string | Business category filter |
| `maxResults` | number | Maximum items to scrape (default: 100) |
| `includeComments` | boolean | Extract comments/replies (default: false) |
| `includeVotes` | boolean | Extract vote counts (default: true) |
| `minRecommendations` | number | Minimum recommendation count filter |
| `dateRange` | string | Filter by date: all, today, week, month, year |
| `proxyConfiguration` | object | Proxy settings |
| `demoMode` | boolean | Return sample data for testing |

## Output Format

### Business Recommendation Output

```json
{
  "businessName": "Mike's Plumbing",
  "category": "Plumbers",
  "recommendationCount": 47,
  "latestRecommendation": {
    "author": "Sarah M.",
    "neighborhood": "Coral Gables",
    "text": "Mike fixed our water heater same day. Fair prices and very professional!",
    "date": "2024-12-15",
    "upvotes": 12
  },
  "mentions": [
    {
      "postType": "recommendation",
      "text": "Looking for a good plumber? Mike's Plumbing is amazing!",
      "author": "John D.",
      "neighborhood": "Coconut Grove",
      "date": "2024-12-10",
      "upvotes": 8,
      "comments": 3
    }
  ],
  "neighborhoods": ["Coral Gables", "Coconut Grove", "South Miami"],
  "phone": "(305) 555-1234",
  "website": "https://mikesplumbing.com",
  "scrapedAt": "2024-12-21T10:30:00.000Z"
}
```

### Neighborhood Post Output

```json
{
  "postType": "recommendation_request",
  "title": "Need a reliable electrician",
  "content": "Looking for an electrician to install a ceiling fan. Any recommendations?",
  "author": "Maria G.",
  "neighborhood": "Miami Beach",
  "date": "2024-12-20",
  "upvotes": 5,
  "commentCount": 12,
  "comments": [
    {
      "author": "Tom H.",
      "text": "I highly recommend Spark Electric. They did great work at my place.",
      "date": "2024-12-20",
      "upvotes": 3
    }
  ],
  "businessMentions": ["Spark Electric", "A1 Electrical"],
  "scrapedAt": "2024-12-21T10:30:00.000Z"
}
```

## Pricing

This actor uses **pay-per-event** billing:
This actor uses **pay-per-event** pricing:

| Event | Description | Price |
|-------|-------------|-------|
| `apify-actor-start` | Base cost per run | $0.15 |
| `item_scraped` | Per recommendation/post scraped | $0.008 |
| `comment_scraped` | Per comment extracted | $0.003 |

**Example costs:**
- 100 recommendations with 5 comments each: $0.15 + (100 × $0.008) + (500 × $0.003) = **$2.45**
- 50 posts, no comments: $0.15 + (50 × $0.008) = **$0.55**

## Use Cases

- **Lead Generation**: Find businesses being recommended by locals
- **Competitor Research**: See which competitors get mentioned and why
- **Market Research**: Understand local sentiment and preferences
- **Reputation Monitoring**: Track mentions of your business
- **Local SEO**: Discover citation and partnership opportunities
- **Content Ideas**: Find trending local topics and concerns

---

**Built by John Rippy | [Actor Arsenal](https://actorarsenal.com)**
