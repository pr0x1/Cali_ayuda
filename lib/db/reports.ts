import { createServerClient, createServerAnonClient } from './client';
import type { Report, PublicReport } from '@/types';
import type { CreateReportInput } from '@/schemas/reports';
import { generatePrivacyCoordinates } from '@/lib/privacy/coordinates';
import { EXPIRATION_HOURS, DEFAULT_CITY } from '@/lib/constants';

/** Convert DB row (snake_case) to domain type (camelCase) */
function toReport(row: Record<string, unknown>): Report {
  return {
    id: row.id as string,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    eventId: (row.event_id as string) ?? null,
    reportType: row.report_type as Report['reportType'],
    category: row.category as string,
    title: row.title as string,
    description: (row.description as string) ?? null,
    city: row.city as string,
    neighborhood: (row.neighborhood as string) ?? null,
    addressText: (row.address_text as string) ?? null,
    lat: (row.lat as number) ?? null,
    lng: (row.lng as number) ?? null,
    publicLat: (row.public_lat as number) ?? null,
    publicLng: (row.public_lng as number) ?? null,
    contactName: (row.contact_name as string) ?? null,
    contactPhone: (row.contact_phone as string) ?? null,
    showContact: row.show_contact !== false,
    status: row.status as Report['status'],
    verificationStatus: row.verification_status as Report['verificationStatus'],
    urgency: row.urgency as Report['urgency'],
    quantity: (row.quantity as number) ?? null,
    quantityUnit: (row.quantity_unit as string) ?? null,
    peopleAffected: (row.people_affected as number) ?? null,
    vulnerablePeople: (row.vulnerable_people as number) ?? 0,
    confirmationCount: (row.confirmation_count as number) ?? 0,
    expiresAt: (row.expires_at as string) ?? null,
    sourceType: row.source_type as Report['sourceType'],
    sourceUrl: (row.source_url as string) ?? null,
  };
}

/** Convert Report to public-safe DTO (contact only if user opted in) */
export function toPublicReport(report: Report): PublicReport {
  return {
    id: report.id,
    reportType: report.reportType,
    category: report.category,
    title: report.title,
    description: report.description,
    city: report.city,
    neighborhood: report.neighborhood,
    addressText: report.addressText,
    publicLat: report.publicLat,
    publicLng: report.publicLng,
    contactName: report.showContact ? report.contactName : null,
    contactPhone: report.showContact ? report.contactPhone : null,
    status: report.status,
    verificationStatus: report.verificationStatus,
    urgency: report.urgency,
    quantity: report.quantity,
    quantityUnit: report.quantityUnit,
    peopleAffected: report.peopleAffected,
    confirmationCount: report.confirmationCount,
    createdAt: report.createdAt,
    expiresAt: report.expiresAt,
    sourceType: report.sourceType,
  };
}

/** Calculate expiration timestamp based on urgency */
function calculateExpiresAt(urgency: string): string {
  const hours = EXPIRATION_HOURS[urgency] ?? EXPIRATION_HOURS.medium;
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + hours);
  return expiresAt.toISOString();
}

/** Create a new report */
export async function createReport(input: CreateReportInput): Promise<Report> {
  const supabase = createServerClient();

  // Generate privacy-safe coordinates if exact ones provided
  let publicLat: number | null = null;
  let publicLng: number | null = null;

  if (input.lat != null && input.lng != null) {
    // Service points can keep exact coordinates public
    if (input.reportType === 'service_point') {
      publicLat = input.lat;
      publicLng = input.lng;
    } else {
      const safeCoords = generatePrivacyCoordinates(input.lat, input.lng);
      publicLat = safeCoords.lat;
      publicLng = safeCoords.lng;
    }
  }

  const { data, error } = await supabase
    .from('reports')
    .insert({
      report_type: input.reportType,
      category: input.category,
      title: input.title,
      description: input.description ?? null,
      city: input.city ?? DEFAULT_CITY,
      neighborhood: input.neighborhood ?? null,
      address_text: input.addressText ?? null,
      lat: input.lat ?? null,
      lng: input.lng ?? null,
      public_lat: publicLat,
      public_lng: publicLng,
      contact_name: input.contactName ?? null,
      contact_phone: input.contactPhone ?? null,
      show_contact: input.showContact !== false,
      urgency: input.urgency ?? 'medium',
      quantity: input.quantity ?? null,
      quantity_unit: input.quantityUnit ?? null,
      people_affected: input.peopleAffected ?? null,
      vulnerable_people: input.vulnerablePeople ?? 0,
      event_id: input.eventId ?? null,
      expires_at: calculateExpiresAt(input.urgency ?? 'medium'),
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create report: ${error.message}`);
  }

  return toReport(data);
}

/**
 * Upsert a report by its external source_ref (idempotent ingest).
 *
 * AGENTS.md §4/§10: ingested reports are UNTRUSTED community input.
 * This function FORCES source_type='community' and verification_status='unverified'.
 * It cannot set 'official' — that is reserved for trusted moderation logic.
 *
 * Re-running an import with the same source_ref updates the existing row
 * instead of creating a duplicate (DB-enforced by the unique constraint).
 */
export async function upsertReportBySourceRef(
  input: CreateReportInput,
  sourceRef: string
): Promise<Report> {
  const supabase = createServerClient();

  const row = {
    source_ref: sourceRef,
    source_type: 'community' as const,
    verification_status: 'unverified' as const,
    report_type: input.reportType,
    category: input.category,
    title: input.title,
    description: input.description ?? null,
    city: input.city ?? DEFAULT_CITY,
    neighborhood: input.neighborhood ?? null,
    address_text: input.addressText ?? null,
    // Location: ingest never sets coordinates (list-only display).
    lat: null,
    lng: null,
    public_lat: null,
    public_lng: null,
    contact_name: input.contactName ?? null,
    contact_phone: input.contactPhone ?? null,
    show_contact: input.showContact !== false,
    urgency: input.urgency ?? 'medium',
    quantity: input.quantity ?? null,
    quantity_unit: input.quantityUnit ?? null,
    people_affected: input.peopleAffected ?? null,
    vulnerable_people: input.vulnerablePeople ?? 0,
    event_id: input.eventId ?? null,
    expires_at: calculateExpiresAt(input.urgency ?? 'medium'),
  };

  const { data, error } = await supabase
    .from('reports')
    .upsert(row, { onConflict: 'source_ref' })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to upsert report: ${error.message}`);
  }

  return toReport(data as Record<string, unknown>);
}

/** Mark an ingested report resolved, keyed by source_ref. Returns row id or null. */
export async function resolveReportBySourceRef(
  sourceRef: string
): Promise<string | null> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('reports')
    .update({ status: 'resolved' })
    .eq('source_ref', sourceRef)
    .select('id')
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to resolve report: ${error.message}`);
  }
  return (data?.id as string) ?? null;
}

/** Fetch public reports with optional filters */
export async function getPublicReports(filters?: {
  reportType?: string;
  category?: string;
  status?: string;
  urgency?: string;
  city?: string;
  limit?: number;
  offset?: number;
}): Promise<PublicReport[]> {
  const supabase = createServerAnonClient();

  let query = supabase
    .from('public_reports')
    .select('*')
    .order('created_at', { ascending: false });

  // Always exclude expired reports and those past their expiration time
  query = query
    .neq('status', 'expired')
    .gt('expires_at', new Date().toISOString());

  if (filters?.reportType) {
    query = query.eq('report_type', filters.reportType);
  }
  if (filters?.category) {
    query = query.eq('category', filters.category);
  }
  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  if (filters?.urgency) {
    query = query.eq('urgency', filters.urgency);
  }
  if (filters?.city) {
    query = query.eq('city', filters.city);
  }

  const limit = filters?.limit ?? 100;
  const offset = filters?.offset ?? 0;
  query = query.range(offset, offset + limit - 1);

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch reports: ${error.message}`);
  }

  return (data ?? [])
    .map((row) => toReport(row as Record<string, unknown>))
    .map(toPublicReport);
}

/** Fetch a single report by ID (internal use, includes all fields) */
export async function getReportById(id: string): Promise<Report | null> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // not found
    throw new Error(`Failed to fetch report: ${error.message}`);
  }

  return toReport(data as Record<string, unknown>);
}

/** Update a report */
export async function updateReport(
  id: string,
  updates: Record<string, unknown>
): Promise<Report> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from('reports')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update report: ${error.message}`);
  }

  return toReport(data as Record<string, unknown>);
}

/** Add a confirmation to a report and update count */
export async function confirmReport(
  reportId: string,
  confirmationType: 'confirm' | 'deny' | 'resolved'
): Promise<void> {
  const supabase = createServerClient();

  // Insert confirmation
  const { error: confirmError } = await supabase
    .from('report_confirmations')
    .insert({
      report_id: reportId,
      confirmation_type: confirmationType,
    });

  if (confirmError) {
    throw new Error(`Failed to confirm report: ${confirmError.message}`);
  }

  // Update confirmation count for 'confirm' type
  if (confirmationType === 'confirm') {
    const report = await getReportById(reportId);
    if (report) {
      await supabase
        .from('reports')
        .update({ confirmation_count: report.confirmationCount + 1 })
        .eq('id', reportId);
    }
  }

  // If resolved, update report status
  if (confirmationType === 'resolved') {
    await supabase
      .from('reports')
      .update({ status: 'resolved' })
      .eq('id', reportId);
  }
}
