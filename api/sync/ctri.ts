/**
 * @file api/sync/ctri.ts
 * @description Main sync pipeline for TrialFinder India.
 */

import { VercelRequest, VercelResponse } from '@vercel/node';
import * as cheerio from 'cheerio';
import { distance } from 'fastest-levenshtein';
import { createClient } from '@supabase/supabase-js';
import { 
  fetchWithRetry
} from '../_lib/scraper.js';

interface RawTrial {
  ctri_id?: string;
  nct_id?: string;
  title: string;
  phase: string;
  status: string;
  source: string;
  last_synced: string;
  ncg_network?: boolean;
  eligibility?: { raw_text: string };
  summaries?: { en: string };
}

// Supabase Admin Client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const getSupabase = () => {
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase environment variables (VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY) are not configured.');
  }
  return createClient(supabaseUrl, supabaseServiceKey);
};

/**
 * Step 1: Fetch CTRI Data
 */
async function fetchCTRITrials(): Promise<RawTrial[]> {
  const url = 'https://ctri.nic.in/Clinicaltrials.php';
  const body = 'EncHid=&seqNo=&jour=&searchtype=adv&Crit1=2&CritVal1=cancer&Crit2=3&CritVal2=&phase=&StartDate=&EndDate=&status=1&State=';
  
  try {
    const response = await fetchWithRetry(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body
    });
    const html = await response.text();
    const $ = cheerio.load(html);
    const trials: RawTrial[] = [];

    // Parsing logic for CTRI table
    $('table tr').each((i, el) => {
      if (i === 0) return; // Skip header
      const cols = $(el).find('td');
      if (cols.length < 5) return;

      const ctri_id = $(cols[1]).text().trim();
      const title = $(cols[2]).text().trim();
      const phase = $(cols[3]).text().trim();
      const status = $(cols[4]).text().trim();

      if (ctri_id.startsWith('CTRI/')) {
        trials.push({
          ctri_id,
          title,
          phase,
          status: status.includes('Recruiting') ? 'Recruiting' : 'Not yet recruiting',
          source: 'CTRI',
          last_synced: new Date().toISOString()
        });
      }
    });

    return trials;
  } catch (error) {
    console.error('CTRI Fetch Error:', error);
    return [];
  }
}

/**
 * Step 2: Fetch NCG Trials
 */
async function fetchNCGTrials(): Promise<RawTrial[]> {
  const url = 'https://www.ncgindia.org/research/clinical-trial-network';
  try {
    const response = await fetchWithRetry(url);
    const html = await response.text();
    const $ = cheerio.load(html);
    const trials: RawTrial[] = [];

    $('.trial-item').each((i, el) => {
      const title = $(el).find('.trial-title').text().trim();
      const phase = $(el).find('.trial-phase').text().trim();
      if (title) {
        trials.push({
          title,
          phase,
          status: 'Recruiting', // NCG usually lists active trials
          source: 'NCG',
          ncg_network: true,
          last_synced: new Date().toISOString()
        });
      }
    });

    return trials;
  } catch (error) {
    console.error('NCG Fetch Error:', error);
    return [];
  }
}

/**
 * Step 3: Fetch CT.gov Trials
 */
async function fetchCTgovTrials(): Promise<RawTrial[]> {
  const url = 'https://clinicaltrials.gov/api/v2/studies?query.locn=India&filter.condition=Cancer&pageSize=100';
  try {
    const response = await fetchWithRetry(url);
    const data = await response.json() as { studies: Array<{ protocolSection: Record<string, unknown> }> };
    return (data.studies || []).map((s) => {
      const protocol = s.protocolSection;
      const identification = protocol.identificationModule as Record<string, string>;
      const status = protocol.statusModule as Record<string, string>;
      const design = protocol.designModule as { phases?: string[] };

      return {
        nct_id: identification.nctId,
        title: identification.officialTitle || identification.briefTitle,
        phase: design?.phases?.[0] || 'N/A',
        status: status.overallStatus === 'RECRUITING' ? 'Recruiting' : 'Not yet recruiting',
        source: 'CTgov',
        last_synced: new Date().toISOString()
      };
    });
  } catch (error) {
    console.error('CTgov Fetch Error:', error);
    return [];
  }
}

/**
 * Step 4: Deduplication
 */
function deduplicateTrials(ctri: RawTrial[], ctgov: RawTrial[], ncg: RawTrial[]): RawTrial[] {
  const merged: Map<string, RawTrial> = new Map();

  // Use CTRI ID as primary key
  ctri.forEach(t => {
    if (t.ctri_id) merged.set(t.ctri_id, t);
  });

  // Merge CTgov
  ctgov.forEach(t => {
    // Try to find matching CTRI ID in CTgov record (often in secondary IDs)
    const existing = Array.from(merged.values()).find(m => m.nct_id === t.nct_id);
    if (existing) {
      Object.assign(existing, { ...t, source: 'CTRI+CTgov' });
    } else {
      // Fuzzy match by title
      const fuzzyMatch = Array.from(merged.values()).find(m => {
        const d = distance(m.title.toLowerCase(), t.title.toLowerCase());
        return d < m.title.length * 0.15;
      });

      if (fuzzyMatch) {
        Object.assign(fuzzyMatch, { ...t, source: 'CTRI+CTgov' });
      } else {
        merged.set(t.nct_id || t.title, t);
      }
    }
  });

  // Merge NCG
  ncg.forEach(t => {
    const fuzzyMatch = Array.from(merged.values()).find(m => {
      const d = distance(m.title.toLowerCase(), t.title.toLowerCase());
      return d < m.title.length * 0.15;
    });
    if (fuzzyMatch) {
      fuzzyMatch.ncg_network = true;
    } else {
      merged.set(t.title, t);
    }
  });

  return Array.from(merged.values());
}

/**
 * Main Handler
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const startTime = new Date();
  const logId = crypto.randomUUID();
  const supabase = getSupabase();

  try {
    // Initial Log
    await supabase.from('sync_log').insert({
      id: logId,
      source: 'ALL',
      status: 'running',
      started_at: startTime.toISOString()
    });

    // Parallel Fetching
    const [ctri, ncg, ctgov] = await Promise.all([
      fetchCTRITrials(),
      fetchNCGTrials(),
      fetchCTgovTrials()
    ]);

    const finalTrials = deduplicateTrials(ctri, ctgov, ncg);

    // Step 5: Upsert to Supabase
    let added = 0;

    for (const trial of finalTrials) {
      const { error } = await supabase
        .from('trials')
        .upsert({
          ctri_id: trial.ctri_id,
          nct_id: trial.nct_id,
          title: trial.title,
          phase: trial.phase,
          status: trial.status,
          source: trial.source,
          ncg_network: trial.ncg_network || false,
          last_synced: trial.last_synced,
          eligibility: trial.eligibility || { raw_text: '' },
          summaries: trial.summaries || { en: trial.title }
        }, { onConflict: 'ctri_id' });

      if (error) console.error('Upsert Error:', error);
      else added++;
    }

    // Final Log Update
    await supabase.from('sync_log').update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      trials_added: added,
      trials_updated: 0
    }).eq('id', logId);

    return res.status(200).json({
      success: true,
      trials_processed: finalTrials.length,
      duration: `${(new Date().getTime() - startTime.getTime()) / 1000}s`
    });

  } catch (error) {
    console.error('Sync Pipeline Failed:', error);
    await supabase.from('sync_log').update({
      status: 'failed',
      errors: { message: error instanceof Error ? error.message : String(error) }
    }).eq('id', logId);

    return res.status(500).json({ success: false, error: 'Sync failed' });
  }
}
