import { useEffect, useState } from 'react';
import { Calendar, Send, Building2, MessageCircle, Globe, Phone } from 'lucide-react';
import { Card, SectionTitle, Spinner, ErrorState, EmptyState, BackButton, Badge } from './ui';
import { fetchDateGroups, fetchLeadsForDate, fetchLeadsByServiceType, fetchLeads, SupabaseError } from '../lib/queries';
import type { Niche, Lead, DateGroup } from '../lib/types';
import { formatDate, fromYMD } from '../lib/format';

function MetricChip({ icon: Icon, value, label }: { icon: typeof Send; value: number; label: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <Icon className="w-4 h-4 text-gray-400" />
      <span className="font-semibold text-gray-900 tabular-nums">{value}</span>
      <span className="text-gray-500">{label}</span>
    </div>
  );
}

/** Level 1: dates with outreach for a niche, newest first. */
export function NicheDatesPage({
  niche,
  onBack,
  onOpenDate,
}: {
  niche: Niche;
  onBack: () => void;
  onOpenDate: (date: string) => void;
}) {
  const [groups, setGroups] = useState<DateGroup[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const g = await fetchDateGroups(niche);
        if (!cancelled) setGroups(g);
      } catch (e) {
        if (cancelled) return;
        if (e instanceof SupabaseError && e.code === '42501') {
          setError('Authentication required to view outreach history.');
        } else {
          setError(e instanceof Error ? e.message : 'Unable to load outreach history.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [niche]);

  return (
    <div>
      <SectionTitle subtitle={`Outreach history grouped by date. Click a date to view its ${niche.toLowerCase()} leads.`}>
        {niche} History by Date
      </SectionTitle>
      <div className="mb-4">
        <BackButton onClick={onBack} label="Back to Dashboard" />
      </div>

      {loading && <Spinner label="Loading date history…" />}
      {!loading && error && (
        <Card className="p-6">
          <ErrorState message={error} />
        </Card>
      )}
      {!loading && !error && groups && groups.length === 0 && (
        <Card className="p-6">
          <EmptyState
            title={`No ${niche.toLowerCase()} outreach yet`}
            message="Once Hermes sends messages to these businesses, the dates they were contacted on will appear here."
          />
        </Card>
      )}
      {!loading && !error && groups && groups.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map((g) => (
            <button
              key={g.date}
              onClick={() => onOpenDate(g.date)}
              className="text-left"
            >
              <Card className="p-5 hover:border-emerald-400 hover:shadow-md transition-all cursor-pointer h-full">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-emerald-600" />
                    <span className="font-semibold text-gray-900">{formatDate(fromYMD(g.date).toISOString())}</span>
                  </div>
                  <Badge tone="gray">{g.date}</Badge>
                </div>
                <div className="space-y-2">
                  <MetricChip icon={Send} value={g.sentCount} label="messages sent" />
                  <MetricChip icon={Building2} value={g.uniqueBusinesses} label="businesses contacted" />
                  <MetricChip icon={MessageCircle} value={g.replyCount} label="replies" />
                </div>
              </Card>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Level 2: leads successfully contacted on a given date for a niche. */
export function NicheDateLeadsPage({
  niche,
  date,
  onBack,
  onOpenLead,
}: {
  niche: Niche;
  date: string;
  onBack: () => void;
  onOpenLead: (leadId: string) => void;
}) {
  const [leads, setLeads] = useState<Lead[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const l = await fetchLeadsForDate(niche, date);
        if (!cancelled) setLeads(l);
      } catch (e) {
        if (cancelled) return;
        if (e instanceof SupabaseError && e.code === '42501') {
          setError('Authentication required to view leads.');
        } else {
          setError(e instanceof Error ? e.message : 'Unable to load leads.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [niche, date]);

  return (
    <div>
      <SectionTitle subtitle={`${niche} leads successfully contacted on ${formatDate(fromYMD(date).toISOString())}.`}>
        {niche} Leads — {formatDate(fromYMD(date).toISOString())}
      </SectionTitle>
      <div className="mb-4">
        <BackButton onClick={onBack} label={`Back to ${niche} dates`} />
      </div>

      {loading && <Spinner label="Loading leads…" />}
      {!loading && error && (
        <Card className="p-6">
          <ErrorState message={error} />
        </Card>
      )}
      {!loading && !error && leads && leads.length === 0 && (
        <Card className="p-6">
          <EmptyState
            title="No leads contacted on this date"
            message="There are no successfully sent outreach records for this date in this niche."
          />
        </Card>
      )}
      {!loading && !error && leads && leads.length > 0 && (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                  <th className="px-5 py-3">Business</th>
                  <th className="px-5 py-3">Phone</th>
                  <th className="px-5 py-3">Email</th>
                  <th className="px-5 py-3">Rating</th>
                  <th className="px-5 py-3">Reviews</th>
                  <th className="px-5 py-3">Address</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {leads.map((l) => (
                  <tr
                    key={l.id}
                    onClick={() => onOpenLead(l.id)}
                    className="cursor-pointer hover:bg-emerald-50/40 transition-colors"
                  >
                    <td className="px-5 py-3 font-medium text-gray-900">{l.business_name}</td>
                    <td className="px-5 py-3 text-gray-600">{l.phone ?? 'Not available'}</td>
                    <td className="px-5 py-3 text-gray-600 max-w-[200px] truncate">
                      {l.email ? (
                        <a href={`mailto:${l.email}`} onClick={(e) => e.stopPropagation()} className="text-emerald-700 hover:underline truncate block">
                          {l.email}
                        </a>
                      ) : (
                        'Not available'
                      )}
                    </td>
                    <td className="px-5 py-3 text-gray-600 tabular-nums">{l.rating ?? '—'}</td>
                    <td className="px-5 py-3 text-gray-600 tabular-nums">{l.review_count ?? '—'}</td>
                    <td className="px-5 py-3 text-gray-600 max-w-xs truncate">{l.address ?? 'Not available'}</td>
                    <td className="px-5 py-3 text-gray-600">{l.lead_status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

/** New: General leads page for a niche, showing all leads regardless of outreach status. */
export function NicheLeadsPage({
  niche,
  onBack,
  onOpenLead,
}: {
  niche: Niche;
  onBack: () => void;
  onOpenLead: (leadId: string) => void;
}) {
  const [leads, setLeads] = useState<Lead[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const l = await fetchLeads(niche);
        if (!cancelled) setLeads(l);
      } catch (e) {
        if (cancelled) return;
        if (e instanceof SupabaseError && e.code === '42501') {
          setError('Authentication required to view leads.');
        } else {
          setError(e instanceof Error ? e.message : 'Unable to load leads.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [niche]);

  return (
    <div>
      <SectionTitle subtitle={`All ${niche} leads in the database.`}>
        {niche} Leads
      </SectionTitle>
      <div className="mb-4">
        <BackButton onClick={onBack} label="Back to Dashboard" />
      </div>

      {loading && <Spinner label="Loading leads…" />}
      {!loading && error && (
        <Card className="p-6">
          <ErrorState message={error} />
        </Card>
      )}
      {!loading && !error && leads && leads.length === 0 && (
        <Card className="p-6">
          <EmptyState
            title={`No ${niche.toLowerCase()} leads found`}
            message={`There are currently no leads categorized under ${niche} in the database.`}
          />
        </Card>
      )}
      {!loading && !error && leads && leads.length > 0 && (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                  <th className="px-5 py-3">Business</th>
                  <th className="px-5 py-3">Phone</th>
                  <th className="px-5 py-3">Email</th>
                  <th className="px-5 py-3">Website</th>
                  <th className="px-5 py-3">Location</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {leads.map((l) => (
                  <tr
                    key={l.id}
                    onClick={() => onOpenLead(l.id)}
                    className="cursor-pointer hover:bg-emerald-50/40 transition-colors"
                  >
                    <td className="px-5 py-3 font-medium text-gray-900">{l.business_name}</td>
                    <td className="px-5 py-3 text-gray-600">{l.phone ?? 'Not available'}</td>
                    <td className="px-5 py-3 text-gray-600 max-w-[200px] truncate">
                      {l.email ? (
                        <a href={`mailto:${l.email}`} onClick={(e) => e.stopPropagation()} className="text-emerald-700 hover:underline truncate block">
                          {l.email}
                        </a>
                      ) : (
                        'Not available'
                      )}
                    </td>
                    <td className="px-5 py-3 text-gray-600 max-w-[200px] truncate">
                      {l.website ? (
                        <a href={l.website} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-emerald-700 hover:underline truncate block">
                          {l.website}
                        </a>
                      ) : (
                        'Not available'
                      )}
                    </td>
                    <td className="px-5 py-3 text-gray-600 max-w-xs truncate">{l.address ?? 'Not available'}</td>
                    <td className="px-5 py-3 text-gray-600">{l.lead_status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

/** New: Leads filtered by niche and service type (Website vs Voice). */
export function NicheServiceLeadsPage({
  niche,
  serviceType,
  onBack,
  onOpenLead,
}: {
  niche: Niche;
  serviceType: 'website' | 'voice';
  onBack: () => void;
  onOpenLead: (leadId: string) => void;
}) {
  const [leads, setLeads] = useState<Lead[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const l = await fetchLeadsByServiceType(niche, serviceType);
        if (!cancelled) setLeads(l);
      } catch (e) {
        if (cancelled) return;
        if (e instanceof SupabaseError && e.code === '42501') {
          setError('Authentication required to view leads.');
        } else {
          setError(e instanceof Error ? e.message : 'Unable to load leads.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [niche, serviceType]);

  const isWebsite = serviceType === 'website';

  return (
    <div>
      <SectionTitle subtitle={`Showing all ${niche} leads categorized as ${serviceType}.`}>
        {niche} {isWebsite ? 'Website' : 'Voice'} Leads
      </SectionTitle>
      <div className="mb-4">
        <BackButton onClick={onBack} label={`Back to ${niche} dates`} />
      </div>

      {loading && <Spinner label="Loading leads…" />}
      {!loading && error && (
        <Card className="p-6">
          <ErrorState message={error} />
        </Card>
      )}
      {!loading && !error && leads && leads.length === 0 && (
        <Card className="p-6">
          <EmptyState
            title={`No ${serviceType} leads found`}
            message={`There are currently no ${niche} leads with the ${serviceType} source type.`}
          />
        </Card>
      )}
      {!loading && !error && leads && leads.length > 0 && (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                  <th className="px-5 py-3">Business</th>
                  <th className="px-5 py-3">Phone</th>
                  <th className="px-5 py-3">Email</th>
                  {isWebsite && <th className="px-5 py-3">Website</th>}
                  <th className="px-5 py-3">Location</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {leads.map((l) => (
                  <tr
                    key={l.id}
                    onClick={() => onOpenLead(l.id)}
                    className="cursor-pointer hover:bg-emerald-50/40 transition-colors"
                  >
                    <td className="px-5 py-3 font-medium text-gray-900">{l.business_name}</td>
                    <td className="px-5 py-3 text-gray-600">{l.phone ?? 'Not available'}</td>
                    <td className="px-5 py-3 text-gray-600 max-w-[200px] truncate">
                      {l.email ? (
                        <a href={`mailto:${l.email}`} onClick={(e) => e.stopPropagation()} className="text-emerald-700 hover:underline truncate block">
                          {l.email}
                        </a>
                      ) : (
                        'Not available'
                      )}
                    </td>
                    {isWebsite && (
                      <td className="px-5 py-3 text-gray-600 max-w-[200px] truncate">
                        {l.website ? (
                          <a href={l.website} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-emerald-700 hover:underline truncate block">
                            {l.website}
                          </a>
                        ) : (
                          'Not available'
                        )}
                      </td>
                    )}
                    <td className="px-5 py-3 text-gray-600 max-w-xs truncate">{l.address ?? 'Not available'}</td>
                    <td className="px-5 py-3 text-gray-600">{l.lead_status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
