export type Niche = 'Dental' | 'Dermatology' | 'HVAC';
export type OutreachStatus = 'Draft' | 'Sent' | 'Failed';
export type Channel = 'WhatsApp' | 'Gmail' | 'Other';

export interface Lead {
  id: string;
  niche: Niche;
  business_name: string;
  phone: string | null;
  rating: number | null;
  review_count: number | null;
  address: string | null;
  google_maps_url: string | null;
  website: string | null;
  email: string | null;
  email_source_url: string | null;
  service_type: 'website' | 'voice' | null;
  lead_status: string;
  created_at: string;
  updated_at: string;
}

export interface OutreachRecord {
  id: string;
  lead_id: string;
  message: string;
  channel: Channel;
  status: OutreachStatus;
  sent_at: string | null;
  created_at: string;
}

export interface OutreachWithLead extends OutreachRecord {
  lead: Lead;
}

export interface DateGroup {
  date: string; // YYYY-MM-DD
  sentCount: number;
  uniqueBusinesses: number;
  replyCount: number;
}
