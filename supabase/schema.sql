-- FILE: supabase/schema.sql
-- Description: Complete PostgreSQL schema for TrialFinder India.

-- Enable pg_trgm for full-text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Trials Table
CREATE TABLE IF NOT EXISTS trials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ctri_id TEXT UNIQUE NOT NULL,
    nct_id TEXT,
    title TEXT NOT NULL,
    cancer_types JSONB NOT NULL DEFAULT '[]',
    phase TEXT NOT NULL,
    status TEXT NOT NULL,
    sponsor TEXT,
    drug_agents JSONB NOT NULL DEFAULT '[]',
    eligibility JSONB NOT NULL,
    summaries JSONB NOT NULL,
    last_synced TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    source TEXT NOT NULL,
    is_free BOOLEAN DEFAULT FALSE,
    ncg_network BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trial Sites Table
CREATE TABLE IF NOT EXISTS trial_sites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trial_id UUID REFERENCES trials(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    pi_name TEXT,
    pi_email TEXT,
    pi_phone TEXT,
    institute_tier TEXT,
    coordinates JSONB, -- {lat: number, lng: number}
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sync Log Table
CREATE TABLE IF NOT EXISTS sync_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source TEXT NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    trials_added INTEGER DEFAULT 0,
    trials_updated INTEGER DEFAULT 0,
    errors JSONB DEFAULT '[]',
    status TEXT NOT NULL -- 'running', 'completed', 'failed'
);

-- Saved Searches Table
CREATE TABLE IF NOT EXISTS saved_searches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    filter_state JSONB NOT NULL,
    name TEXT NOT NULL,
    notify_on_new BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE trials ENABLE ROW LEVEL SECURITY;
ALTER TABLE trial_sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;

-- Public read access for trials and sites
CREATE POLICY "Allow public read access on trials" ON trials FOR SELECT USING (true);
CREATE POLICY "Allow public read access on trial_sites" ON trial_sites FOR SELECT USING (true);

-- User-specific access for saved searches
CREATE POLICY "Users can manage their own saved searches" ON saved_searches
    FOR ALL USING (auth.uid() = user_id);

-- Full-text search index
CREATE INDEX IF NOT EXISTS trials_title_drug_idx ON trials USING GIN (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS trials_drug_agents_idx ON trials USING GIN (drug_agents);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_trials_updated_at
    BEFORE UPDATE ON trials
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- Search Function
CREATE OR REPLACE FUNCTION search_trials(search_query TEXT, filters JSONB DEFAULT '{}')
RETURNS SETOF trials AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM trials
    WHERE 
        (search_query IS NULL OR title ILIKE '%' || search_query || '%' OR drug_agents::TEXT ILIKE '%' || search_query || '%')
        AND (filters->>'cancer_type' IS NULL OR cancer_types @> jsonb_build_array(filters->>'cancer_type'))
        AND (filters->>'phase' IS NULL OR phase = filters->>'phase')
        AND (filters->>'status' IS NULL OR status = filters->>'status')
        AND (filters->>'is_free_only' IS NULL OR (filters->>'is_free_only')::BOOLEAN = FALSE OR is_free = TRUE)
    ORDER BY last_synced DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
