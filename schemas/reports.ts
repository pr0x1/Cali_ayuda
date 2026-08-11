import { z } from 'zod';
import { REPORT_CATEGORIES } from '@/lib/constants';

export const reportTypeSchema = z.enum(['need', 'offer', 'service_point']);

export const reportStatusSchema = z.enum([
  'active',
  'matched',
  'in_progress',
  'resolved',
  'stale',
  'expired',
  'rejected',
]);

export const verificationStatusSchema = z.enum([
  'unverified',
  'community_verified',
  'official',
  'rejected',
]);

export const urgencySchema = z.enum(['low', 'medium', 'high', 'critical']);

export const sourceTypeSchema = z.enum(['community', 'official', 'system']);

export const confirmationTypeSchema = z.enum(['confirm', 'deny', 'resolved']);

export const createReportSchema = z.object({
  reportType: reportTypeSchema,
  category: z.enum(REPORT_CATEGORIES as unknown as [string, ...string[]]),
  title: z
    .string()
    .min(3, 'El título debe tener al menos 3 caracteres')
    .max(200, 'El título no puede exceder 200 caracteres'),
  description: z
    .string()
    .max(2000, 'La descripción no puede exceder 2000 caracteres')
    .optional(),
  city: z.string().max(100).default('Cali'),
  neighborhood: z.string().max(100).optional(),
  addressText: z.string().max(300).optional(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  contactName: z.string().max(100).optional(),
  contactPhone: z
    .string()
    .max(20)
    .regex(/^[\d\s+\-()]+$/, 'Formato de teléfono inválido')
    .optional(),
  showContact: z.boolean().default(true),
  urgency: urgencySchema.default('medium'),
  quantity: z.number().positive().optional(),
  quantityUnit: z.string().max(50).optional(),
  peopleAffected: z.number().int().positive().optional(),
  vulnerablePeople: z.number().int().min(0).default(0),
  eventId: z.string().uuid().optional(),
});

export const updateReportSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  description: z.string().max(2000).optional(),
  category: z
    .enum(REPORT_CATEGORIES as unknown as [string, ...string[]])
    .optional(),
  status: reportStatusSchema.optional(),
  urgency: urgencySchema.optional(),
  neighborhood: z.string().max(100).optional(),
  addressText: z.string().max(300).optional(),
  quantity: z.number().positive().optional(),
  quantityUnit: z.string().max(50).optional(),
  peopleAffected: z.number().int().positive().optional(),
});

export const confirmReportSchema = z.object({
  confirmationType: confirmationTypeSchema,
});

export type CreateReportInput = z.infer<typeof createReportSchema>;
export type UpdateReportInput = z.infer<typeof updateReportSchema>;
export type ConfirmReportInput = z.infer<typeof confirmReportSchema>;
