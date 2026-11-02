import { useEffect, useState } from 'react';
import { Card, SectionTitle, Spinner, ErrorState, EmptyState, Badge, BackButton, leadStatusTone } from './ui';
import { fetchTodaysLeads, SupabaseError } from '../lib/queries';
import type { Lead, Niche } from '../lib/types';
import { formatDateTime, orNa } from '../lib/format';

const niches: Niche[] = ['Dental', 'Dermatology', 'HVAC'];

export function TodaysLeadsPage({
  onBack,
  onOpenLead,
}: {
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
        const todaysLeads = await fetchTodaysLeads();
        if (!cancelled) setLeads(todaysLeads);
      } catch (e) {
        if (cancelled) return;
        if (e instanceof SupabaseError && e.code === '42501') {
          setError('Authentication required to view leads.');
        } else {
          setError(e instanceof Error ? e.message : 'Unable to load today’s leads.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <SectionTitle subtitle="Leads created today, grouped by category.">
        Today's Leads
      </SectionTitle>
      <div className="mb-4">
        <BackButton onClick={onBack} label="Back to Dashboard" />
      </div>

      {loading && <Spinner label="Loading today's leads…" />}
      {!loading && error && (
        <Card className="p-6">
          <ErrorState message={error} />
        </Card>
      )}
      {!loading && !error && leads && leads.length === 0 && (
        <Card className="p-6">
          <EmptyState
            title="No leads added today"
            message="New leads added today will appear here, grouped by Dental, Dermatology, and HVAC."
          />
        </Card>
      )}
      {!loading && !error && leads && leads.length > 0 && (
        <div className="space-y-6">
          {niches.map((niche) => {
            const categoryLeads = leads.filter((lead) => lead.niche === niche);
            return (
              <section key={niche} aria-labelledby={`today-${niche.toLowerCase()}-heading`}>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h2 id={`today-${niche.toLowerCase()}-heading`} className="text-base font-semibold text-gray-900">
                    {niche} Leads
                  </h2>
                  <span className="text-sm text-gray-500">{categoryLeads.length}</span>
                </div>
                {categoryLeads.length === 0 ? (
                  <Card className="p-4">
                    <p className="text-sm text-gray-500">No {niche.toLowerCase()} leads added today.</p>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    {categoryLeads.map((lead) => (
                      <Card key={lead.id} className="h-full p-5">
                        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-3 text-sm">
                          <div className="min-w-0 sm:col-span-2">
                            <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Business Name</dt>
                            <dd className="mt-1 text-base font-semibold text-gray-900">
                              <button
                                type="button"
                                onClick={() => onOpenLead(lead.id)}
                                className="text-left hover:text-emerald-700 focus:outline-none focus-visible:underline"
                              >
                                {lead.business_name}
                              </button>
                            </dd>
                          </div>
                          <div className="min-w-0">
                            <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Phone</dt>
                            <dd className="mt-1 break-words text-gray-900">
                              {lead.phone ? <a href={`tel:${lead.phone}`} className="hover:text-emerald-700">{lead.phone}</a> : orNa(lead.phone)}
                            </dd>
                          </div>
                          <div className="min-w-0">
                            <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Email</dt>
                            <dd className="mt-1 break-words text-gray-900">
                              {lead.email ? <a href={`mailto:${lead.email}`} className="text-emerald-700 hover:underline">{lead.email}</a> : orNa(lead.email)}
                            </dd>
                          </div>
                          <div className="min-w-0">
                            <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Website</dt>
                            <dd className="mt-1 break-words text-gray-900">
                              {lead.website ? <a href={lead.website} target="_blank" rel="noopener noreferrer" className="text-emerald-700 hover:underline">{lead.website}</a> : orNa(lead.website)}
                            </dd>
                          </div>
                          <div className="min-w-0">
                            <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Location</dt>
                            <dd className="mt-1 break-words text-gray-900">{orNa(lead.address)}</dd>
                          </div>
                          <div>
                            <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Category</dt>
                            <dd className="mt-1"><Badge tone="blue">{lead.niche}</Badge></dd>
                          </div>
                          <div>
                            <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Status</dt>
                            <dd className="mt-1"><Badge tone={leadStatusTone(lead.lead_status)}>{lead.lead_status}</Badge></dd>
                          </div>
                          <div className="min-w-0 sm:col-span-2">
                            <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Date Added</dt>
                            <dd className="mt-1 text-gray-900">{formatDateTime(lead.created_at)}</dd>
                          </div>
                        </dl>
                      </Card>
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
