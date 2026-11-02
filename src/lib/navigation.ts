import type { Niche } from './types';

export type LeadDetailOrigin =
  | { kind: 'niche-date-leads'; niche: Niche; date: string }
  | { kind: 'niche-service-leads'; niche: Niche; serviceType: 'website' | 'voice' }
  | { kind: 'niche-leads'; niche: Niche }
  | { kind: 'all-leads' }
  | { kind: 'today-leads' }
  | { kind: 'outreach-history' };

export type View =
  | { kind: 'dashboard' }
  | { kind: 'niche-dates'; niche: Niche }
  | { kind: 'niche-date-leads'; niche: Niche; date: string }
  | { kind: 'niche-service-leads'; niche: Niche; serviceType: 'website' | 'voice' }
  | { kind: 'niche-leads'; niche: Niche }
  | { kind: 'today-leads' }
  | { kind: 'lead-detail'; leadId: string; origin: LeadDetailOrigin }
  | { kind: 'all-leads' }
  | { kind: 'outreach-history' };

export type SidebarItem =
  | 'dashboard'
  | 'dental'
  | 'dental-website'
  | 'dental-voice'
  | 'dermatology'
  | 'hvac'
  | 'all-leads'
  | 'outreach-history';
