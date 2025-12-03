# Scrapers Documentation

All scrapers run via [Apify](https://apify.com). Requires `APIFY_API_TOKEN` in environment variables.

---

## Currently Used Scrapers

### 1. LinkedIn Post Scraper
| Property | Value |
|----------|-------|
| **Actor ID** | `d0DhjXPjkkwm4W5xK` |
| **Apify URL** | https://apify.com/scrap3r/linkedin-post-scraper |
| **Used In** | `app/actions/analyze-post.ts` |
| **Purpose** | Fetches LinkedIn post metadata (author, content, engagement stats, images) |
| **Cost** | **$5 per 1000 results** ($0.005 per post) |

**Input:**
```json
{
  "post_urls": ["https://linkedin.com/posts/..."]
}
```

**Output:**
- `author.name` - Post author's name
- `author.headline` - Author's headline
- `author.profile_picture` - Author's avatar URL
- `post.text` - Post content
- `post.id` - Post activity ID
- `stats.total_reactions` - Total reaction count
- `stats.comments` - Comment count
- `stats.shares` - Share count
- `media[].url` - Post images/media

---

### 2. LinkedIn Reactions Scraper
| Property | Value |
|----------|-------|
| **Actor ID** | `J9UfswnR3Kae4O6vm` |
| **Apify URL** | https://apify.com/scrap3r/linkedin-reactions-scraper |
| **Used In** | `app/actions/analyze-post.ts` |
| **Purpose** | Fetches list of people who reacted to a post |
| **Cost** | **$5 per 1000 results** ($0.005 per reaction) |

⚠️ **Cost Warning:** 1 reaction = 1 result. A post with 10,000 reactions = $50 to scrape all.

**Input:**
```json
{
  "post_urls": ["7123456789012345678"],  // Activity ID, not full URL
  "page_number": 1,
  "reaction_type": "ALL",  // or "LIKE", "CELEBRATE", etc.
  "limit": 100
}
```

**Output (per reactor):**
- `reactor.name` - Reactor's name
- `reactor.headline` - Job title/headline
- `reactor.profile_url` - LinkedIn profile URL
- `reactor.profile_pictures.small/medium/large` - Avatar URLs
- `reaction_type` - Type of reaction (LIKE, CELEBRATE, etc.)

**Cost Example:**
- 100 reactions = $0.50
- 500 reactions = $2.50
- 1000 reactions = $5.00
- 10,000 reactions = $50.00 ← DANGER

---

### 3. LinkedIn Profile Scraper
| Property | Value |
|----------|-------|
| **Actor ID** | `VhxlqQXRwhW8H5hNV` |
| **Apify URL** | https://apify.com/scrap3r/linkedin-profile-scraper |
| **Used In** | `app/api/crm/enrich/route.ts` |
| **Purpose** | Full profile enrichment for CRM leads |
| **Cost** | **$5 per 1000 results** ($0.005 per profile) |

**Input:**
```json
{
  "username": "johndoe",  // LinkedIn username (from /in/johndoe)
  "includeEmail": false   // Keep false to save credits
}
```

**Output:**
- `name` - Full name
- `headline` - Current title
- `summary` - About section
- `location` - Location string
- `company` - Current company
- `connections` - Connection count
- `experience[]` - Work history
- `education[]` - Education history
- `skills[]` - Listed skills
- `profilePicture` - Avatar URL

---

## Potential Future Scrapers

### LinkedIn Comments Scraper
**Use Case:** Extract people who commented on a post (higher intent than reactions)

**Why:** Commenters show stronger engagement than reactors. They took time to write something.

**Apify Options:**
- `epctex/linkedin-comment-scraper`
- `curious_coder/linkedin-comments-scraper`

---

### LinkedIn Company Scraper
**Use Case:** Get company info for account-based targeting

**Why:** When a lead works at an interesting company, scrape the company page for:
- Employee count
- Industry
- Recent posts
- Other employees to target

**Apify Options:**
- `anchor/linkedin-company-scraper`
- `scrap3r/linkedin-company-scraper`

---

### Email Finder (Hunter.io / Apollo)
**Use Case:** Find verified work emails for leads

**Why:** LinkedIn doesn't expose emails. Need external service for outreach.

**Options:**
- Hunter.io API (not Apify)
- Apollo.io API (not Apify)
- `vdrmota/contact-info-scraper` (Apify)

---

## Cost Management Tips

1. **Batch requests** - Run multiple profiles in one actor call when possible
2. **Cache results** - Store enriched data in Supabase, don't re-scrape
3. **Use limits** - Set `limit` parameter to control how many results you fetch
4. **Skip email lookups** - `includeEmail: false` saves significant credits
5. **Rate limit users** - Use credit system to prevent abuse

---

## Environment Setup

```env
APIFY_API_TOKEN=apify_api_xxxxxxxxxxxxx
```

Get your token: https://console.apify.com/account/integrations

