# TrialFinder India

TrialFinder India is a mobile-first Progressive Web App (PWA) designed for Indian oncologists and patients to discover oncology clinical trials across India. It aggregates data from CTRI, ClinicalTrials.gov, and the National Cancer Grid (NCG).

## Quick Start

1.  **Clone the repository and install dependencies:**
    ```bash
    git clone <repo-url>
    cd trialfinder-india
    npm install
    ```
2.  **Setup Supabase:**
    - Create a new project on [Supabase](https://supabase.com).
    - Run the SQL schema provided in `supabase/schema.sql` (if available) or set up tables for `trials`, `sync_log`, and `saved_searches`.
3.  **Get Gemini API Key:**
    - Obtain an API key from [Google AI Studio](https://aistudio.google.com).
4.  **Configure Environment Variables:**
    - Copy `.env.example` to `.env.local`.
    - Fill in the values for Supabase, Gemini, and VAPID keys.
5.  **Run Development Server:**
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deploy to Vercel

1.  **Push to GitHub:** Create a new repository and push your code.
2.  **Import to Vercel:** Go to [Vercel](https://vercel.com), import your repository.
3.  **Add Environment Variables:** Add all variables from `.env.example` in the Vercel project settings.
4.  **Deploy:** Vercel will automatically deploy on every push to the `main` branch.
5.  **Verify Cron Jobs:** Check the "Cron Jobs" tab in your Vercel dashboard to ensure the daily sync is active.
6.  **Setup Supabase Edge Functions:**
    ```bash
    supabase functions deploy search-trials
    ```

## Architecture

```text
CTRI + CT.gov + NCG
       ↓ (Vercel Cron 5AM IST)
  /api/sync/ctri.ts
       ↓ (Gemini enrichment)
  Supabase PostgreSQL
       ↓ (Realtime + REST)
  React PWA (Vite)
       ↓ (Vercel CDN)
  Oncologist / Patient
```

## Adding a New Data Source

1.  Create a new scraper function in `api/sync/[source].ts`.
2.  Integrate it into the main sync orchestrator in `api/sync/ctri.ts`.
3.  Add the new source to the `source` enum in `src/types/trial.ts`.

## Cost Estimate (Free Tiers)

-   **Vercel Hobby**: 100GB bandwidth, 10 cron jobs/day (Free)
-   **Supabase Free**: 500MB DB, 2GB bandwidth, 50K edge function calls (Free)
-   **Gemini 1.5 Flash**: 1M tokens/day free (~1000 eligibility parses/day) (Free)
-   **Estimated cost for 500 MAU**: $0/month on free tiers.

## License

MIT
