-- Add show_contact flag so users can opt-in to displaying their contact info publicly
-- Default TRUE so existing and new reports show contact by default (user's request)

ALTER TABLE reports ADD COLUMN show_contact BOOLEAN NOT NULL DEFAULT true;

-- Recreate the public view to include address_text and conditional contact fields
DROP VIEW IF EXISTS public_reports;
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
    address_text,
    public_lat,
    public_lng,
    CASE WHEN show_contact THEN contact_name ELSE NULL END AS contact_name,
    CASE WHEN show_contact THEN contact_phone ELSE NULL END AS contact_phone,
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
