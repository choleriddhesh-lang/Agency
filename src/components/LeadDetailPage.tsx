import { useEffect, useState } from 'react';
import { Phone, MapPin, Star, Globe, MessageSquare, Send, Clock, Mail, Link2 } from 'lucide-react';
import { Card, SectionTitle, Spinner, ErrorState, EmptyState, BackButton, Badge, statusTone, leadStatusTone } from './ui';
import { fetchLeadById, fetchOutreachForLead, SupabaseError } from '../lib/queries';
import type { Lead, OutreachRecord } from '../lib/types';
import { orNa, orNaNum, formatDateTime } from '../lib/format';

function InfoRow({ icon: Icon, label, children }: { icon: typeof Phone; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-3">
      <div className="flex items-center gap-2 w-36 shrink-0 text-gray-500">
        <Icon className="w-4 h-4" />
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <div className="flex-1 text-sm text-gray-900 min-w-0">{children}</div>
    </div>
  );
}

export function LeadDetailPage({
  leadId,
  backLabel,
  onBack,
}: {
  leadId: string;
  backLabel: string;
  onBack: () => void;
}) {
  const [lead, setLead] = useState<Lead | null>(null);
  const [outreach, setOutreach] = useState<OutreachRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [l, o] = await Promise.all([
          fetchLeadById(leadId),
          fetchOutreachForLead(leadId),
        ]);
        if (cancelled) return;
        setLead(l);
        setOutreach(o);
      } catch (e) {
        if (cancelled) return;
        if (e instanceof SupabaseError && e.code === '42501') {
          setError('Authentication required to view lead details.');
        } else {
          setError(e instanceof Error ? e.message : 'Unable to load lead details.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [leadId]);

  if (loading) return <Spinner label="Loading lead detailsâ€¦" />;
  if (error) return <Card className="p-6"><ErrorState message={error} /></Card>;
  if (!lead)
    return (
      <Card className="p-6">
        <EmptyState title="Lead not found" message="This lead may have been removed." />
      </Card>
    );

  return (
    <div>
      <div className="mb-4">
        <BackButton onClick={onBack} label={backLabel} />
      </div>

      <SectionTitle subtitle={`${lead.niche} lead`}>{lead.business_name}</SectionTitle>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6 lg:col-span-2">
          <h2 className="text-sm font-semibold text-gray-900 mb-2">Business information</h2>
          <div className="divide-y divide-gray-100">
            <InfoRow icon={Phone} label="Phone">
              {lead.phone ? (
                <a href={`tel:${lead.phone}`} className="text-emerald-700 hover:underline font-medium">
                  {lead.phone}
                </a>
              ) : (
                'Not available'
              )}
            </InfoRow>
            <InfoRow icon={MapPin} label="Address">{orNa(lead.address)}</InfoRow>
            <InfoRow icon={MapPin} label="Maps">
              {lead.google_maps_url ? (
                <a href={lead.google_maps_url} target="_blank" rel="noopener noreferrer" className="text-emerald-700 hover:underline">
                  Open in Google Maps
                </a>
              ) : (
                'Not available'
              )}
            </InfoRow>
            <InfoRow icon={Star} label="Rating">{orNaNum(lead.rating)}</InfoRow>
            <InfoRow icon={Star} label="Reviews">{orNaNum(lead.review_count)}</InfoRow>
            <InfoRow icon={Globe} label="Website">
              {lead.website ? (
                <a href={lead.website} target="_blank" rel="noopener noreferrer" className="text-emerald-700 hover:underline truncate">
                  {lead.website}
                </a>
              ) : (
                'Not available'
              )}
            </InfoRow>
            <InfoRow icon={Mail} label="Email">
              {lead.email ? (
                <a href={`mailto:${lead.email}`} className="text-emerald-700 hover:underline font-medium">
                  {lead.email}
                </a>
              ) : (
                'Not available'
              )}
            </InfoRow>
            {lead.email_source_url && (
              <InfoRow icon={Link2} label="Email Source">
                <a href={lead.email_source_url} target="_blank" rel="noopener noreferrer" className="text-emerald-700 hover:underline truncate">
                  {lead.email_source_url}
                </a>
              </InfoRow>
            )}
            <InfoRow icon={MessageSquare} label="Status">
              <Badge tone={leadStatusTone(lead.lead_status)}>{lead.lead_status}</Badge>
            </InfoRow>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Quick facts</h2>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">Niche</dt>
              <dd className="font-medium text-gray-900">{lead.niche}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Lead status</dt>
              <dd><Badge tone={leadStatusTone(lead.lead_status)}>{lead.lead_status}</Badge></dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Added</dt>
              <dd className="font-medium text-gray-900">{formatDateTime(lead.created_at)}</dd>
            </div>
          </dl>
        </Card>
      </div>

      <div className="mt-6">
        <h2 className="text-base font-semibold text-gray-900 mb-3">Message history</h2>
        <Card className="p-6">
          {outreach.length === 0 ? (
            <EmptyState title="No messages yet" message="No outreach records have been logged for this lead." />
          ) : (
            <ol className="space-y-5">
              {outreach.map((o) => (
                <li key={o.id} className="border-l-2 border-emerald-200 pl-4 relative">
                  <div className="absolute -left-1.5 top-1 w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <Badge tone={statusTone(o.status)}>{o.status}</Badge>
                    <Badge tone="gray">{o.channel}</Badge>
                    <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      {o.sent_at ? formatDateTime(o.sent_at) : 'Not sent'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-800 whitespace-pre-wrap bg-gray-50 rounded-lg p-3 border border-gray-100">
                    {o.message}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </Card>
      </div>
    </div>
  );
}

