import { useEffect, useState } from 'react';
import { Calendar, Filter } from 'lucide-react';
import { Card, SectionTitle, Spinner, ErrorState, EmptyState, Badge, statusTone } from './ui';
import { fetchOutreachHistoryFiltered, SupabaseError } from '../lib/queries';
import type { OutreachWithLead, Niche } from '../lib/types';
import { formatDateTime, orNa } from '../lib/format';

type RangePreset = 'all' | 'today' | 'yesterday' | '7d' | 'custom';

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function todayYMD(): string {
  return ymd(new Date());
}
function yesterdayYMD(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return ymd(d);
}
function sevenDaysAgoYMD(): string {
  const d = new Date();
  d.setDate(d.getDate() - 6);
  return ymd(d);
}

export function OutreachHistoryPage({ onOpenLead }: { onOpenLead: (leadId: string) => void }) {
  const [records, setRecords] = useState<OutreachWithLead[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [niche, setNiche] = useState<'All' | Niche>('All');
  const [status, setStatus] = useState('All');
  const [preset, setPreset] = useState<RangePreset>('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        let fromStr: string | undefined;
        let toStr: string | undefined;
        if (preset === 'today') {
          fromStr = todayYMD();
          toStr = todayYMD();
        } else if (preset === 'yesterday') {
          fromStr = yesterdayYMD();
          toStr = yesterdayYMD();
        } else if (preset === '7d') {
          fromStr = sevenDaysAgoYMD();
          toStr = todayYMD();
        } else if (preset === 'custom') {
          fromStr = from || undefined;
          toStr = to || undefined;
        }
        const r = await fetchOutreachHistoryFiltered({
          niche: niche === 'All' ? undefined : niche,
          status: status === 'All' ? undefined : status,
          from: fromStr,
          to: toStr,
        });
        if (!cancelled) setRecords(r);
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
  }, [niche, status, preset, from, to]);

  return (
    <div>
      <SectionTitle subtitle="Every outreach attempt across both niches, with the exact message sent.">
        Outreach History
      </SectionTitle>

      <Card className="p-4 mb-4">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <select
              value={preset}
              onChange={(e) => setPreset(e.target.value as RangePreset)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            >
              <option value="all">All time</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="7d">Last 7 days</option>
              <option value="custom">Custom range</option>
            </select>
          </div>
          {preset === 'custom' && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              />
              <span className="text-gray-400 text-sm">to</span>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              />
            </div>
          )}
          <div className="flex items-center gap-2 lg:ml-auto">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={niche}
              onChange={(e) => setNiche(e.target.value as 'All' | Niche)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            >
              <option value="All">All niches</option>
              <option value="Dental">Dental</option>
              <option value="Dermatology">Dermatology</option>
            </select>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            >
              <option value="All">All statuses</option>
              <option value="Sent">Sent</option>
              <option value="Draft">Draft</option>
              <option value="Failed">Failed</option>
            </select>
          </div>
        </div>
      </Card>

      {loading && <Spinner label="Loading outreach history…" />}
      {!loading && error && <Card className="p-6"><ErrorState message={error} /></Card>}
      {!loading && !error && records && records.length === 0 && (
        <Card className="p-6">
          <EmptyState title="No outreach records" message="No outreach matches your filters, or no messages have been logged yet." />
        </Card>
      )}
      {!loading && !error && records && records.length > 0 && (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                  <th className="px-5 py-3">Sent at</th>
                  <th className="px-5 py-3">Business</th>
                  <th className="px-5 py-3">Niche</th>
                  <th className="px-5 py-3">Phone</th>
                  <th className="px-5 py-3">Message</th>
                  <th className="px-5 py-3">Channel</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {records.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => onOpenLead(r.lead_id)}
                    className="cursor-pointer hover:bg-emerald-50/40 transition-colors align-top"
                  >
                    <td className="px-5 py-3 whitespace-nowrap text-gray-600">
                      {r.sent_at ? formatDateTime(r.sent_at) : 'Not sent'}
                    </td>
                    <td className="px-5 py-3 font-medium text-gray-900">{r.lead?.business_name ?? 'Unknown'}</td>
                    <td className="px-5 py-3 text-gray-600">{r.lead?.niche ?? '—'}</td>
                    <td className="px-5 py-3 text-gray-600">{orNa(r.lead?.phone)}</td>
                    <td className="px-5 py-3 text-gray-700 max-w-md">
                      <div className="line-clamp-2 whitespace-pre-wrap">{r.message}</div>
                    </td>
                    <td className="px-5 py-3 text-gray-600">{r.channel}</td>
                    <td className="px-5 py-3"><Badge tone={statusTone(r.status)}>{r.status}</Badge></td>
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
