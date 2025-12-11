# LinkedIn Post to Leads

Turn LinkedIn post engagement into qualified leads.

## What It Does

1. **Analyze LinkedIn Posts** — Paste any LinkedIn post URL and extract everyone who reacted to it
2. **Filter by ICP** — Automatically identify decision-makers (CEOs, founders, VPs, etc.) based on customizable keywords
3. **Build a CRM** — Save qualified leads and enrich their profiles with full LinkedIn data
4. **Export** — Download leads as CSV for your outreach tools

## How It Works

People who engage with LinkedIn posts are warm leads — they're actively interested in the topic. This app captures that intent by:

- Scraping post reactors via Apify
- Matching headlines against your Ideal Customer Profile keywords
- Enriching profiles with company, location, experience data
- Storing everything in Supabase for easy access

## Tech Stack

- Next.js 16 (App Router)
- Supabase (PostgreSQL + Auth)
- Apify (LinkedIn scraping)
- Tailwind CSS
