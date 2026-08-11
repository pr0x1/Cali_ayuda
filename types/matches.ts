export type MatchStatus =
  | 'proposed'
  | 'accepted'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'rejected';

export interface Match {
  id: string;
  createdAt: string;
  needReportId: string;
  offerReportId: string;
  distanceMeters: number | null;
  matchScore: number | null;
  status: MatchStatus;
}
