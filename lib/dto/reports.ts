/**
 * Data Transfer Object utilities for reports.
 * Ensures no internal/private data leaks to public responses.
 */

import type { PublicReport } from '@/types';

/**
 * Transform a list of public reports into a paginated API response.
 */
export function formatReportsResponse(
  reports: PublicReport[],
  total?: number
) {
  return {
    data: reports,
    count: reports.length,
    total: total ?? reports.length,
  };
}

/**
 * Fields that must NEVER be included in public API responses.
 * Used as a safety check in development/testing.
 */
export const PRIVATE_FIELDS = [
  'lat',
  'lng',
  'contact_name',
  'contact_phone',
  'contactName',
  'contactPhone',
  'source_url',
  'sourceUrl',
] as const;

/**
 * Verify that an object does not contain private fields.
 * Use in tests to ensure DTOs are safe.
 */
export function assertNoPrivateFields(obj: Record<string, unknown>): boolean {
  for (const field of PRIVATE_FIELDS) {
    if (field in obj && obj[field] != null) {
      throw new Error(
        `Private field "${field}" found in public response object`
      );
    }
  }
  return true;
}
