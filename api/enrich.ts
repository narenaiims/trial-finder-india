/**
 * @file api/enrich.ts
 * @description AI enrichment endpoint for TrialFinder India.
 */

import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { parseEligibility } from './_lib/eligibilityParser.js';
import { generateSummaries } from './_lib/summaryGenerator.js';
import { Trial } from '../src/types/trial.js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const getSupabase = () => {
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase environment variables (VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY) are not configured.');
  }
  return createClient(supabaseUrl, supabaseServiceKey);
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabase = getSupabase();

  const { trialIds } = req.body as { trialIds: string[] };

  if (!trialIds || !Array.isArray(trialIds)) {
    return res.status(400).json({ error: 'Invalid trialIds' });
  }

  const errors: string[] = [];
  let enrichedCount = 0;

  // Process in batches of 10
  const batchSize = 10;
  for (let i = 0; i < trialIds.length; i += batchSize) {
    const batch = trialIds.slice(i, i + batchSize);
    
    await Promise.all(batch.map(async (id) => {
      try {
        // Fetch trial data
        const { data: trial, error: fetchError } = await supabase
          .from('trials')
          .select('*')
          .eq('ctri_id', id)
          .single();

        if (fetchError || !trial) throw new Error(`Fetch failed for ${id}`);

        // 1. Parse Eligibility
        const eligibility = await parseEligibility(trial.eligibility?.raw_text || trial.title, trial.cancer_types?.[0] || 'Cancer');

        // 2. Generate Summaries
        const summaries = await generateSummaries({ ...trial, eligibility } as Trial);

        // 3. Update Supabase
        const { error: updateError } = await supabase
          .from('trials')
          .update({
            eligibility,
            summaries,
            last_enriched: new Date().toISOString()
          })
          .eq('ctri_id', id);

        if (updateError) throw updateError;
        enrichedCount++;

      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`Error enriching ${id}: ${msg}`);
      }
    }));

    // Delay between batches to stay within rate limits
    if (i + batchSize < trialIds.length) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  return res.status(200).json({
    enriched: enrichedCount,
    errors
  });
}
