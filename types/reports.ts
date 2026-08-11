/** Core domain types for the Cali Ayuda report system */

export type ReportType = 'need' | 'offer' | 'service_point';

export type ReportStatus =
  | 'active'
  | 'matched'
  | 'in_progress'
  | 'resolved'
  | 'stale'
  | 'expired'
  | 'rejected';

export type VerificationStatus =
  | 'unverified'
  | 'community_verified'
  | 'official'
  | 'rejected';

export type Urgency = 'low' | 'medium' | 'high' | 'critical';

export type SourceType = 'community' | 'official' | 'system';

export type ConfirmationType = 'confirm' | 'deny' | 'resolved';

export interface Report {
  id: string;
  createdAt: string;
  updatedAt: string;
  eventId: string | null;
  reportType: ReportType;
  category: string;
  title: string;
  description: string | null;
  city: string;
  neighborhood: string | null;
  addressText: string | null;
  lat: number | null;
  lng: number | null;
  publicLat: number | null;
  publicLng: number | null;
  contactName: string | null;
  contactPhone: string | null;
  showContact: boolean;
  status: ReportStatus;
  verificationStatus: VerificationStatus;
  urgency: Urgency;
  quantity: number | null;
  quantityUnit: string | null;
  peopleAffected: number | null;
  vulnerablePeople: number;
  confirmationCount: number;
  expiresAt: string | null;
  sourceType: SourceType;
  sourceUrl: string | null;
}

/** Public-safe DTO — never contains exact coordinates; contact shown only if user opted in */
export interface PublicReport {
  id: string;
  reportType: ReportType;
  category: string;
  title: string;
  description: string | null;
  city: string;
  neighborhood: string | null;
  addressText: string | null;
  publicLat: number | null;
  publicLng: number | null;
  contactName: string | null;
  contactPhone: string | null;
  status: ReportStatus;
  verificationStatus: VerificationStatus;
  urgency: Urgency;
  quantity: number | null;
  quantityUnit: string | null;
  peopleAffected: number | null;
  confirmationCount: number;
  createdAt: string;
  expiresAt: string | null;
  sourceType: SourceType;
}

export interface ReportConfirmation {
  id: string;
  createdAt: string;
  reportId: string;
  actorId: string | null;
  confirmationType: ConfirmationType;
}

export interface CreateReportInput {
  reportType: ReportType;
  category: string;
  title: string;
  description?: string;
  city?: string;
  neighborhood?: string;
  addressText?: string;
  lat?: number;
  lng?: number;
  contactName?: string;
  contactPhone?: string;
  urgency?: Urgency;
  quantity?: number;
  quantityUnit?: string;
  peopleAffected?: number;
  vulnerablePeople?: number;
  eventId?: string;
}

export interface UpdateReportInput {
  title?: string;
  description?: string;
  category?: string;
  status?: ReportStatus;
  urgency?: Urgency;
  neighborhood?: string;
  addressText?: string;
  quantity?: number;
  quantityUnit?: string;
  peopleAffected?: number;
}
