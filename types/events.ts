export type EventStatus = 'active' | 'monitoring' | 'closed';

export interface EmergencyEvent {
  id: string;
  createdAt: string;
  slug: string;
  name: string;
  eventType: string;
  city: string | null;
  region: string | null;
  country: string;
  status: EventStatus;
}
