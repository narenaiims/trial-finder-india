/**
 * @file api/sync/status.ts
 * @description GET endpoint returning last sync status for TrialFinder India.
 */

import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get last successful sync log
    const { data: lastSync, error: syncError } = await supabase
      .from('sync_log')
      .select('*')
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(1)
      .single();

    if (syncError && syncError.code !== 'PGRST116') {
      throw syncError;
    }

    // Get total trials count
    const { count: totalTrials } = await supabase
      .from('trials')
      .select('*', { count: 'exact', head: true });

    // Get recruiting trials count
    const { count: recruitingTrials } = await supabase
      .from('trials')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'Recruiting');

    // Calculate next sync (assuming daily at 5 AM IST / 23:00 UTC)
    const now = new Date();
    const nextSync = new Date();
    nextSync.setUTCHours(23, 0, 0, 0);
    if (nextSync <= now) {
      nextSync.setUTCDate(nextSync.getUTCDate() + 1);
    }
    const nextSyncInMinutes = Math.round((nextSync.getTime() - now.getTime()) / (1000 * 60));

    return res.status(200).json({
      last_sync_time: lastSync?.completed_at || null,
      trials_total: totalTrials || 0,
      trials_recruiting: recruitingTrials || 0,
      sources_synced: ['CTRI', 'CTgov', 'NCG'],
      next_sync_in: nextSyncInMinutes,
      status: lastSync ? 'healthy' : 'pending'
    });

  } catch (error) {
    console.error('Status Fetch Error:', error);
    return res.status(500).json({ error: 'Failed to fetch sync status' });
  }
}
