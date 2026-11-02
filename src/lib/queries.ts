import { supabase } from './supabase';
import type {
  Lead,
  OutreachRecord,
  OutreachWithLead,
  DateGroup,
  Niche,
} from './types';

export class SupabaseError extends Error {
  constructor(message: string, public readonly code?: string) {
    super(message);
  }
}

function wrapError(error: { message: string; code?: string }): SupabaseError {
  // Permission denied shows up as 42501 — surface it honestly to the UI
  return new SupabaseError(error.message, error.code);
}

/** All leads for a niche (or all niches if undefined). */
export async function fetchLeads(niche?: Niche): Promise<Lead[]> {
  let query = supabase.from('leads').select('*').order('created_at', { ascending: false });
  if (niche) query = query.eq('niche', niche);
  const { data, error } = await query;
  if (error) throw wrapError(error);
  if (!data) throw new SupabaseError('No data returned from Supabase');
  return data as Lead[];
}

/** Leads for a specific niche and service type. */
export async function fetchLeadsByServiceType(niche: Niche, serviceType: 'website' | 'voice'): Promise<Lead[]> {
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .eq('niche', niche)
    .eq('service_type', serviceType)
    .order('business_name', { ascending: true });
  if (error) throw wrapError(error);
  return (data ?? []) as Lead[];
}

/** A single lead by id. */
export async function fetchLeadById(id: string): Promise<Lead | null> {
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw wrapError(error);
  if (data === null) return null;
  return data as Lead;
}

/** All outreach records for a lead, oldest first. */
export async function fetchOutreachForLead(leadId: string): Promise<OutreachRecord[]> {
  const { data, error } = await supabase
    .from('outreach_history')
    .select('*')
    .eq('lead_id', leadId)
    .order('sent_at', { ascending: true, nullsFirst: true })
    .order('created_at', { ascending: true });
  if (error) throw wrapError(error);
  if (!data) throw new SupabaseError('No data returned from Supabase');
  return data as OutreachRecord[];
}

/**
 * Outreach records joined with their lead, filtered to a niche.
 * Sorted newest sent first.
 */
export async function fetchOutreachWithLeads(niche?: Niche): Promise<OutreachWithLead[]> {
  let query = supabase
    .from('outreach_history')
    .select('*, lead:leads(*)')
    .order('sent_at', { ascending: false, nullsFirst: false });
  if (niche) query = query.eq('lead.niche', niche);
  const { data, error } = await query;
  if (error) throw wrapError(error);
  if (!data) throw new SupabaseError('No data returned from Supabase');
  return data as OutreachWithLead[];
}

/**
 * Date groups for a niche: groups Sent outreach by the sent_at date.
 * Returns newest date first.
 */
export async function fetchDateGroups(niche: Niche): Promise<DateGroup[]> {
  const records = await fetchOutreachWithLeads(niche);
  const byDate = new Map<string, { sent: Set<string>; businesses: Set<string> }>();

  for (const r of records) {
    if (r.status !== 'Sent' || !r.sent_at) continue;
    if (r.lead?.niche !== niche) continue;
    const day = r.sent_at.slice(0, 10);
    if (!byDate.has(day)) byDate.set(day, { sent: new Set(), businesses: new Set() });
    const g = byDate.get(day)!;
    g.sent.add(r.id);
    g.businesses.add(r.lead_id);
  }

  return [...byDate.entries()]
    .map(([date, g]) => ({
      date,
      sentCount: g.sent.size,
      uniqueBusinesses: g.businesses.size,
      replyCount: 0, // replies not yet tracked in schema
    }))
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

/** Leads that were successfully contacted (Sent) on a given date for a niche. */
export async function fetchLeadsForDate(niche: Niche, date: string): Promise<Lead[]> {
  const records = await fetchOutreachWithLeads(niche);
  const ids = new Set<string>();
  for (const r of records) {
    if (r.status !== 'Sent' || !r.sent_at) continue;
    if (r.lead?.niche !== niche) continue;
    if (r.sent_at.slice(0, 10) !== date) continue;
    ids.add(r.lead_id);
  }
  if (ids.size === 0) return [];
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .in('id', [...ids])
    .order('business_name', { ascending: true });
  if (error) throw wrapError(error);
  return (data ?? []) as Lead[];
}

export interface DashboardStats {
  dentalLeads: number;
  dermLeads: number;
  hvacLeads: number;
  totalLeads: number;
  todayLeads: number;
  sentTotal: number;
  daily: { date: string; count: number }[];
}

function localDay(ts: string): string {
  return ts.slice(0, 10);
}

function getLocalDayRange(now = new Date()): { start: string; end: string } {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return { start: start.toISOString(), end: end.toISOString() };
}

export async function fetchTodaysLeads(): Promise<Lead[]> {
  const { start, end } = getLocalDayRange();
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .gte('created_at', start)
    .lt('created_at', end)
    .order('created_at', { ascending: false });
  if (error) throw wrapError(error);
  if (!data) throw new SupabaseError('No data returned from Supabase');
  return data as Lead[];
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const { start, end } = getLocalDayRange();
  const [leadsRes, outreachRes, todayLeadsRes] = await Promise.all([
    supabase.from('leads').select('id, niche'),
    supabase.from('outreach_history').select('id, status, sent_at'),
    supabase
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', start)
      .lt('created_at', end),
  ]);

  if (leadsRes.error) throw wrapError(leadsRes.error);
  if (outreachRes.error) throw wrapError(outreachRes.error);
  if (todayLeadsRes.error) throw wrapError(todayLeadsRes.error);

  const leads = leadsRes.data ?? [];
  const outreach = outreachRes.data ?? [];

  const dentalLeads = leads.filter((l) => l.niche === 'Dental').length;
  const dermLeads = leads.filter((l) => l.niche === 'Dermatology').length;
  const hvacLeads = leads.filter((l) => l.niche === 'HVAC').length;
  const totalLeads = leads.length;

  const sent = outreach.filter((o) => o.status === 'Sent' && o.sent_at);

  const dailyMap = new Map<string, number>();
  for (const o of sent) {
    const day = localDay(o.sent_at as string);
    dailyMap.set(day, (dailyMap.get(day) ?? 0) + 1);
  }

  const daily = [...dailyMap.entries()]
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 14)
    .reverse();

  return {
    dentalLeads,
    dermLeads,
    hvacLeads,
    totalLeads,
    todayLeads: todayLeadsRes.count ?? 0,
    sentTotal: sent.length,
    daily,
  };
}

export async function fetchOutreachHistoryFiltered(opts: {
  niche?: Niche;
  status?: string;
  from?: string;
  to?: string;
}): Promise<OutreachWithLead[]> {
  const all = await fetchOutreachWithLeads(opts.niche);
  return all.filter((r) => {
    if (opts.status && r.status !== opts.status) return false;
    if (opts.from || opts.to) {
      const day = r.sent_at ? localDay(r.sent_at) : '';
      if (opts.from && day < opts.from) return false;
      if (opts.to && day > opts.to) return false;
    }
    return true;
  });
}
