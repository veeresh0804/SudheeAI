-- Migration for Phase 3: Production Hardening
-- Date: 2026-02-11
-- Additive only - monitoring and safety tables

-- ════════════════════════════════════════════════════════════
-- 1. AI USAGE LOGS - Token tracking and cost protection
-- ════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS ai_usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    endpoint TEXT NOT NULL,
    tokens_used INTEGER DEFAULT 0,
    latency_ms INTEGER,
    model_used TEXT DEFAULT 'gemini-pro',
    status TEXT DEFAULT 'success',
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_user_id ON ai_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_created_at ON ai_usage_logs(created_at);

-- ════════════════════════════════════════════════════════════
-- 2. AI ANOMALY LOGS - Track validation failures and anomalies
-- ════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS ai_anomaly_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    anomaly_type TEXT NOT NULL,
    endpoint TEXT,
    raw_response TEXT,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    fallback_used BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_anomaly_type ON ai_anomaly_logs(anomaly_type);
CREATE INDEX IF NOT EXISTS idx_ai_anomaly_created_at ON ai_anomaly_logs(created_at);

-- ════════════════════════════════════════════════════════════
-- 3. PLATFORM ACTIVITY LOGS - Track scraping status
-- ════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS platform_activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES auth.users(id),
    platform TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    last_scraped_at TIMESTAMPTZ,
    next_allowed_scrape_at TIMESTAMPTZ,
    error_message TEXT,
    data_hash TEXT,
    scrape_duration_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_platform_activity_student ON platform_activity_logs(student_id);
CREATE INDEX IF NOT EXISTS idx_platform_activity_platform ON platform_activity_logs(platform);

-- Unique constraint: one record per student per platform
CREATE UNIQUE INDEX IF NOT EXISTS idx_platform_activity_unique 
    ON platform_activity_logs(student_id, platform);

-- ════════════════════════════════════════════════════════════
-- 4. SCRAPE CACHE - Cache scraped data to prevent redundancy
-- ════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS scrape_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cache_key TEXT UNIQUE NOT NULL,
    platform TEXT NOT NULL,
    data_json JSONB NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_scrape_cache_key ON scrape_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_scrape_cache_expires ON scrape_cache(expires_at);

-- ════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY POLICIES
-- ════════════════════════════════════════════════════════════

-- AI Usage Logs
ALTER TABLE ai_usage_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_view_own_ai_usage ON ai_usage_logs
    FOR SELECT USING (auth.uid() = user_id);

-- AI Anomaly Logs (admin only - no user access)
ALTER TABLE ai_anomaly_logs ENABLE ROW LEVEL SECURITY;
-- No policy = admin only via service role

-- Platform Activity Logs
ALTER TABLE platform_activity_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY student_view_own_platform_activity ON platform_activity_logs
    FOR SELECT USING (auth.uid() = student_id);

-- Scrape Cache (internal only)
ALTER TABLE scrape_cache ENABLE ROW LEVEL SECURITY;
-- No policy = service role only

-- ════════════════════════════════════════════════════════════
-- HELPER FUNCTIONS
-- ════════════════════════════════════════════════════════════

-- Function to check if scraping is allowed (rate limiting)
CREATE OR REPLACE FUNCTION is_scraping_allowed(
    p_student_id UUID,
    p_platform TEXT
) RETURNS BOOLEAN AS $$
DECLARE
    v_next_allowed TIMESTAMPTZ;
BEGIN
    SELECT next_allowed_scrape_at INTO v_next_allowed
    FROM platform_activity_logs
    WHERE student_id = p_student_id AND platform = p_platform;
    
    IF v_next_allowed IS NULL OR v_next_allowed <= now() THEN
        RETURN TRUE;
    ELSE
        RETURN FALSE;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to update scraping timestamp
CREATE OR REPLACE FUNCTION update_scraping_timestamp(
    p_student_id UUID,
    p_platform TEXT,
    p_status TEXT,
    p_duration_ms INTEGER DEFAULT NULL,
    p_error_message TEXT DEFAULT NULL,
    p_data_hash TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
    INSERT INTO platform_activity_logs (
        student_id,
        platform,
        status,
        last_scraped_at,
        next_allowed_scrape_at,
        error_message,
        data_hash,
        scrape_duration_ms,
        updated_at
    ) VALUES (
        p_student_id,
        p_platform,
        p_status,
        now(),
        now() + INTERVAL '24 hours',
        p_error_message,
        p_data_hash,
        p_duration_ms,
        now()
    )
    ON CONFLICT (student_id, platform) 
    DO UPDATE SET
        status = EXCLUDED.status,
        last_scraped_at = EXCLUDED.last_scraped_at,
        next_allowed_scrape_at = EXCLUDED.next_allowed_scrape_at,
        error_message = EXCLUDED.error_message,
        data_hash = EXCLUDED.data_hash,
        scrape_duration_ms = EXCLUDED.scrape_duration_ms,
        updated_at = now();
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE ai_usage_logs IS 'Phase 3: AI token usage and cost tracking';
COMMENT ON TABLE ai_anomaly_logs IS 'Phase 3: AI validation failures and anomalies';
COMMENT ON TABLE platform_activity_logs IS 'Phase 3: Web scraping status per platform';
COMMENT ON TABLE scrape_cache IS 'Phase 3: Cache for scraped platform data';
