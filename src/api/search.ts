/**
 * @file src/api/search.ts
 * @description Client-side search API wrapper for TrialFinder India.
 */

import { supabase } from '../lib/supabase';
import { FilterState, Trial } from '../types/trial';

export interface SearchResponse {
  trials: Trial[];
  total: number;
  hasMore: boolean;
}

/**
 * Searches trials using Supabase RPC (search_trials function defined in schema.sql)
 */
export async function searchTrials(filters: FilterState, page: number = 0, limit: number = 20): Promise<SearchResponse> {
  const offset = page * limit;

  try {
    // We use the search_trials RPC function defined in our schema.sql
    const { data, error } = await supabase.rpc('search_trials', {
      query_text: filters.query || '',
      cancer_type_filter: filters.cancer_type ? [filters.cancer_type] : null,
      phase_filter: filters.phase ? [filters.phase] : null,
      state_filter: filters.state ? [filters.state] : null,
      is_free_filter: filters.is_free_only || null
    });

    if (error) throw error;

    const trials = (data || []) as Trial[];
    
    // Manual pagination for now as the RPC returns all matches
    const paginatedTrials = trials.slice(offset, offset + limit);

    return {
      trials: paginatedTrials,
      total: trials.length,
      hasMore: offset + limit < trials.length
    };
  } catch (error) {
    console.error('Search API Error:', error);
    return { trials: [], total: 0, hasMore: false };
  }
}

/**
 * Fetches distinct drug agents for autocomplete
 */
export async function getDistinctDrugs(): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('trials')
      .select('drug_agents');
    
    if (error) throw error;
    
    const allDrugs = (data || []).flatMap(t => (t.drug_agents as string[]) || []);
    return Array.from(new Set(allDrugs)).sort() as string[];
  } catch (error) {
    console.error('Fetch Drugs Error:', error);
    return [];
  }
}
