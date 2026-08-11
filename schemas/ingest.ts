import { z } from 'zod';

/**
 * Zod schema for a single parsed sheet row before it becomes a report.
 * This validates the SHAPE of extracted sheet data. The resulting
 * CreateReportInput is separately validated against createReportSchema
 * (AGENTS.md §9 — ingested data passes the same validation as user data).
 */
export const parsedSheetRowSchema = z.object({
  /** Stable app-owned ID from column A ("CA-XXXXX"); empty if not yet assigned. */
  sheetRowId: z.string(),
  reportType: z.enum(['need', 'offer']),
  title: z.string().min(1),
  description: z.string().optional(),
  neighborhood: z.string().optional(),
  contactName: z.string().optional(),
  contactPhone: z.string().optional(),
  estadoRaw: z.string().optional(),
  /** 0-based row index within the sheet (for write-back cell targeting). */
  rowIndex: z.number().int().min(0),
});

export type ParsedSheetRow = z.infer<typeof parsedSheetRowSchema>;
