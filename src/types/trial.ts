/**
 * @file src/types/trial.ts
 * @description TypeScript interfaces for TrialFinder India data models.
 */

export type TrialPhase = 'I' | 'II' | 'III' | 'IV' | 'I/II' | 'II/III';
export type TrialStatus = 'Recruiting' | 'Completed' | 'Suspended' | 'Not yet recruiting';
export type InstituteTier = 'AIIMS' | 'NCG-A' | 'NCG-B' | 'Private';

export interface TrialSite {
  name: string;
  city: string;
  state: string;
  pi_name: string;
  pi_email?: string;
  pi_phone?: string;
  institute_tier: InstituteTier;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface EligibilityCriteria {
  age_min: number | null;
  age_max: number | null;
  ecog_max: number | null;
  inclusion: string[];
  exclusion: string[];
  biomarkers_required: string[];
  india_specific_notes: string[];
  key_red_flags: string[];
  raw_text: string;
}

export interface LocalisedSummary {
  en: string;
  hi?: string;
  ta?: string;
  mr?: string;
}

export interface Trial {
  id: string;
  ctri_id: string;
  nct_id?: string;
  title: string;
  cancer_types: string[];
  phase: TrialPhase;
  status: TrialStatus;
  sponsor: string;
  drug_agents: string[];
  sites: TrialSite[];
  eligibility: EligibilityCriteria;
  summaries: LocalisedSummary;
  last_synced: string;
  source: string;
  is_free: boolean;
  ncg_network: boolean;
}

export interface FilterState {
  cancer_type?: string;
  phase?: TrialPhase;
  state?: string;
  drug_agent?: string;
  status?: TrialStatus;
  source?: string;
  query?: string;
  is_free_only: boolean;
}
