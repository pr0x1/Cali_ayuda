-- Cali Ayuda Initial Schema
-- Emergency coordination platform

-- Emergency Events
CREATE TABLE emergency_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    event_type TEXT NOT NULL,
    city TEXT,
    region TEXT,
    country TEXT NOT NULL DEFAULT 'Colombia',

    status TEXT NOT NULL DEFAULT 'active'
      CHECK (status IN ('active', 'monitoring', 'closed'))
);

-- Reports (needs, offers, service points)
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    event_id UUID REFERENCES emergency_events(id),

    report_type TEXT NOT NULL
      CHECK (report_type IN ('need', 'offer', 'service_point')),

    category TEXT NOT NULL,

    title TEXT NOT NULL,
    description TEXT,

    city TEXT NOT NULL DEFAULT 'Cali',
    neighborhood TEXT,
    address_text TEXT,

    -- Exact internal coordinates (never exposed publicly)
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,

    -- Privacy-safe coordinates for public display
    public_lat DOUBLE PRECISION,
    public_lng DOUBLE PRECISION,

    contact_name TEXT,
    contact_phone TEXT,

    status TEXT NOT NULL DEFAULT 'active'
      CHECK (status IN (
        'active',
        'matched',
        'in_progress',
        'resolved',
        'stale',
        'expired',
        'rejected'
      )),

    verification_status TEXT NOT NULL DEFAULT 'unverified'
      CHECK (verification_status IN (
        'unverified',
        'community_verified',
        'official',
        'rejected'
      )),

    urgency TEXT NOT NULL DEFAULT 'medium'
      CHECK (urgency IN ('low', 'medium', 'high', 'critical')),

    quantity NUMERIC,
    quantity_unit TEXT,

    people_affected INTEGER,
    vulnerable_people INTEGER DEFAULT 0,

    confirmation_count INTEGER NOT NULL DEFAULT 0,

    expires_at TIMESTAMPTZ,

    source_type TEXT NOT NULL DEFAULT 'community'
      CHECK (source_type IN ('community', 'official', 'system')),

    source_url TEXT
);

-- Matches between needs and offers
CREATE TABLE matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    need_report_id UUID NOT NULL REFERENCES reports(id),
    offer_report_id UUID NOT NULL REFERENCES reports(id),

    distance_meters INTEGER,
    match_score NUMERIC,

    status TEXT NOT NULL DEFAULT 'proposed'
      CHECK (status IN (
        'proposed',
        'accepted',
        'in_progress',
        'completed',
        'cancelled',
        'rejected'
      ))
);

-- Community confirmations/denials
CREATE TABLE report_confirmations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    report_id UUID NOT NULL REFERENCES reports(id),
    actor_id UUID,
    confirmation_type TEXT NOT NULL
      CHECK (confirmation_type IN (
        'confirm',
        'deny',
        'resolved'
      ))
);

-- Indexes for common queries
CREATE INDEX idx_reports_type ON reports(report_type);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_category ON reports(category);
CREATE INDEX idx_reports_city ON reports(city);
CREATE INDEX idx_reports_urgency ON reports(urgency);
CREATE INDEX idx_reports_created_at ON reports(created_at DESC);
CREATE INDEX idx_reports_expires_at ON reports(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX idx_reports_event_id ON reports(event_id) WHERE event_id IS NOT NULL;
CREATE INDEX idx_reports_location ON reports(public_lat, public_lng) WHERE public_lat IS NOT NULL;

CREATE INDEX idx_matches_need ON matches(need_report_id);
CREATE INDEX idx_matches_offer ON matches(offer_report_id);
CREATE INDEX idx_matches_status ON matches(status);

CREATE INDEX idx_confirmations_report ON report_confirmations(report_id);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_reports_updated_at
    BEFORE UPDATE ON reports
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Public-safe view (never exposes exact coordinates or contact info)
CREATE VIEW public_reports AS
SELECT
    id,
    created_at,
    updated_at,
    event_id,
    report_type,
    category,
    title,
    description,
    city,
    neighborhood,
    public_lat,
    public_lng,
    status,
    verification_status,
    urgency,
    quantity,
    quantity_unit,
    people_affected,
    confirmation_count,
    expires_at,
    source_type
FROM reports
WHERE status NOT IN ('rejected');

-- Row Level Security
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_confirmations ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_events ENABLE ROW LEVEL SECURITY;

-- Public read access for active reports (via anon key)
CREATE POLICY "Public can view active reports"
    ON reports FOR SELECT
    USING (status NOT IN ('rejected'));

-- Public can create reports (anonymous reporting in v0.1)
CREATE POLICY "Anyone can create reports"
    ON reports FOR INSERT
    WITH CHECK (true);

-- Public read access for events
CREATE POLICY "Public can view events"
    ON emergency_events FOR SELECT
    USING (true);

-- Public can create confirmations
CREATE POLICY "Anyone can confirm reports"
    ON report_confirmations FOR INSERT
    WITH CHECK (true);

-- Public can view confirmations
CREATE POLICY "Public can view confirmations"
    ON report_confirmations FOR SELECT
    USING (true);

-- Public can view matches
CREATE POLICY "Public can view matches"
    ON matches FOR SELECT
    USING (true);

-- Seed initial emergency event
INSERT INTO emergency_events (slug, name, event_type, city, region, country, status)
VALUES (
    'terremoto-cali-2026-08',
    'Terremoto Cali - Agosto 2026',
    'earthquake',
    'Cali',
    'Valle del Cauca',
    'Colombia',
    'active'
);
