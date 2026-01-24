# God Mode Intel - Make.com Blueprints

Ready-to-import Make.com scenarios that demonstrate the power of God Mode Intel MCP.

## 📦 Available Blueprints

### Core Scenarios

| Blueprint | Description | God Mode Tools |
|-----------|-------------|----------------|
| `lead-enrichment-pipeline.json` | Sheets → Enrich → Update → Slack | `research_company` |
| `competitive-intel-monitor.json` | Daily competitor monitoring | `monitor_competitors` |
| `full-prospect-pipeline.json` | End-to-end prospecting | 4 tools |

### Database Variants (Full Pipeline)

| Blueprint | Database | Notes |
|-----------|----------|-------|
| `full-prospect-pipeline.json` | Airtable | Original version |
| `full-prospect-pipeline-supabase.json` | Supabase | REST API, PostgreSQL backend |
| `full-prospect-pipeline-postgres.json` | PostgreSQL | Direct connection |
| `full-prospect-pipeline-notion.json` | Notion | Database pages |

### Notification Variants (Lead Enrichment)

| Blueprint | Platform | Setup Required |
|-----------|----------|----------------|
| `lead-enrichment-pipeline.json` | Slack | Slack app/webhook |
| `lead-enrichment-discord.json` | Discord | Webhook URL |
| `lead-enrichment-teams.json` | Microsoft Teams | Incoming webhook |
| `lead-enrichment-whatsapp.json` | WhatsApp Business | Meta Business API |
| `lead-enrichment-telegram.json` | Telegram | Bot token + chat ID |

---

## 🚀 How to Import

1. Go to **Make.com** → Scenarios → Create new
2. Click the **⋮** menu → **Import Blueprint**
3. Upload any JSON file
4. Configure connections and replace placeholders

### Placeholders to Replace

| Placeholder | Where to Get It |
|-------------|-----------------|
| `YOUR_APIFY_TOKEN` | [Apify Console](https://console.apify.com/account/integrations) |
| `YOUR_SPREADSHEET_ID` | From Google Sheets URL |
| `YOUR_SLACK_CHANNEL` | Slack channel ID |
| `YOUR_DISCORD_WEBHOOK_URL` | Server Settings → Integrations → Webhooks |
| `YOUR_TEAMS_WEBHOOK_URL` | Channel → Connectors → Incoming Webhook |
| `YOUR_TELEGRAM_BOT_TOKEN` | From @BotFather |
| `YOUR_SUPABASE_URL` | Supabase project settings |
| `YOUR_SUPABASE_ANON_KEY` | Supabase API settings |
| `YOUR_NOTION_DATABASE_ID` | From Notion database URL |

---

## 🔧 God Mode Intel Actor

**Apify Store:** [alizarin_refrigerator-owner/god-mode---marketing-intelligence-mcp](https://apify.com/alizarin_refrigerator-owner/god-mode---marketing-intelligence-mcp)

**Actor ID:** `LF3BPd0DBfXIgI0uA`

### API Endpoint
```
POST https://api.apify.com/v2/acts/alizarin_refrigerator-owner~god-mode---marketing-intelligence-mcp/runs?token=YOUR_TOKEN&waitForFinish=120
```

### Request Body
```json
{
  "tool": "tool_name",
  "args": {
    "param1": "value1"
  }
}
```

### Get Results
```
GET https://api.apify.com/v2/actor-runs/{runId}/dataset/items?token=YOUR_TOKEN&format=json
```

---

## 🛠️ All 44 Tools

### Discovery (5)
- `find_prospects` - Google Maps business search
- `find_lookalikes` - Similar company finder
- `scrape_local_leads` - Bulk local lead scraping
- `discover_companies` - Deep web crawling
- `enrich_from_url` - AI extraction from any URL

### Enrichment (3)
- `enrich_lead` - Single lead enrichment
- `enrich_leads_batch` - Batch enrichment
- `enrich_company_contacts` - Find decision makers

### LinkedIn (3)
- `scrape_linkedin_profile` - Profile data
- `scrape_linkedin_posts` - Recent posts
- `analyze_linkedin_voice` - Voice/style analysis

### Company Research (4)
- `research_company` - Full company research
- `scan_tech_stack` - Technology detection
- `get_crunchbase_data` - Funding/investors
- `get_glassdoor_reviews` - Employee reviews

### Reviews (6)
- `scrape_g2` - G2 reviews
- `scrape_capterra` - Capterra reviews
- `scrape_trustpilot` - Trustpilot reviews
- `scrape_yelp` - Yelp reviews
- `aggregate_reviews` - Multi-source aggregation
- `analyze_sentiment` - Sentiment analysis

### Competitive Intel (5)
- `monitor_competitors` - Track changes
- `scrape_facebook_ads` - Ad library
- `track_competitor_keywords` - SEO monitoring
- `compare_tech_stacks` - Tech comparison
- `competitive_gap_analysis` - Gap analysis

### Local SEO (4)
- `scrape_gbp` - Google Business Profile
- `track_local_serp` - Local rankings
- `audit_citations` - Citation audit
- `analyze_local_competitors` - Local competitor analysis

### Social Listening (3)
- `scrape_reddit` - Reddit discussions
- `scrape_quora` - Quora Q&A
- `monitor_brand_mentions` - Brand monitoring

### Sales Intelligence (5)
- `score_and_prioritize` - Lead scoring
- `generate_outreach` - AI outreach generation
- `analyze_buying_signals` - Intent signals
- `predict_deal_probability` - Deal prediction
- `recommend_approach` - Sales approach

### Workflows (3)
- `full_company_research` - Complete research
- `full_prospect_pipeline` - End-to-end prospecting
- `full_competitive_audit` - Competitor audit

### Utility (2)
- `list_tools` - List all available tools
- `get_tool_help` - Get help for a tool

---

## 💰 Pricing

Pay-per-event pricing:

| Event | Price |
|-------|-------|
| Tool Executed | $0.10 |
| Lead Enriched | $0.15 |
| Company Researched | $0.25 |
| LinkedIn Profile Scraped | $0.12 |
| Outreach Generated | $0.08 |

---

## 📊 Database Schema Templates

### Supabase/PostgreSQL
```sql
CREATE TABLE leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT NOT NULL,
  website TEXT UNIQUE,
  phone TEXT,
  email TEXT,
  industry TEXT,
  employee_count INTEGER,
  tech_stack JSONB,
  decision_makers JSONB,
  lead_score INTEGER,
  status TEXT CHECK (status IN ('hot', 'nurture', 'contacted', 'converted')),
  email_draft TEXT,
  linkedin_draft TEXT,
  source_industry TEXT,
  source_location TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  outreach_generated_at TIMESTAMPTZ
);

CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_score ON leads(lead_score);
```

### Notion Database Properties
- Name (title)
- Website (url)
- Phone (phone)
- Email (email)
- Industry (select)
- Employee Count (number)
- Tech Stack (multi_select)
- Lead Score (number)
- Status (status: Hot Lead, Nurture, Contacted)
- Email Draft (rich_text)
- LinkedIn Draft (rich_text)
- Source (rich_text)

---

## 🔗 Links

- **Marketing Site:** https://god-mode-intel-site.vercel.app
- **Apify Store:** https://apify.com/alizarin_refrigerator-owner/god-mode---marketing-intelligence-mcp
- **Actor Arsenal:** https://actor-arsenal-site.vercel.app/actors/god-mode-intel-mcp.html

---

Built by **LocalHowl** | Powered by **Apify + Make.com**

*Submitted for Make.com Automation Contest 2026*
