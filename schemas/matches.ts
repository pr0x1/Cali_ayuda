import { z } from 'zod';

export const matchStatusSchema = z.enum([
  'proposed',
  'accepted',
  'in_progress',
  'completed',
  'cancelled',
  'rejected',
]);

export type MatchStatusInput = z.infer<typeof matchStatusSchema>;
