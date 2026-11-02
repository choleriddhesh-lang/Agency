import { useEffect, useMemo, useState } from 'react';
import { Search, ArrowUpDown, Star } from 'lucide-react';
import { Card, SectionTitle, Spinner, ErrorState, EmptyState, Badge, leadStatusTone } from './ui';
import { fetchLeads, SupabaseError } from '../lib/queries';
import type { Lead, Niche } from '../lib/types';
import { orNa, formatDate } from '../lib/format';

type SortKey = 'rating' | 'review_count' | 'created_at';

export function AllLeadsPage({ onOpenLead }: { onOpenLead: (leadId: string) => void }) {
  const [leads, setLeads] = useState<Lead[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [niche, setNiche] = useState<'All' | Niche>('All');
  const [status, setStatus] = useState('All');
  const [sortKey, setSortKey] = useState<SortKey>('created_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const l = await fetchLeads();
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
  }, []);

  const statusOptions = useMemo(() => {
    const set = new Set<string>();
    leads?.forEach((l) => set.add(l.lead_status));
    return ['All', ...[...set].sort()];
  }, [leads]);

  const filtered = useMemo(() => {
    if (!leads) return [];
    const term = search.trim().toLowerCase();
    let rows = leads.filter((l) => {
      if (niche !== 'All' && l.niche !== niche) return false;
      if (status !== 'All' && l.lead_status !== status) return false;
      if (term) {
        const hay = `${l.business_name} ${l.phone ?? ''}`.toLowerCase();
        if (!hay.includes(term)) return false;
      }
      return true;
    });
    rows = [...rows].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      const aN = av === null ? -Infinity : Number(av);
      const bN = bv === null ? -Infinity : Number(bv);
      return sortDir === 'asc' ? aN - bN : bN - aN;
    });
    return rows;
  }, [leads, search, niche, status, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  }

  return (
    <div>
      <SectionTitle subtitle="Every collected business, whether or not outreach has been sent.">
        All Leads
      </SectionTitle>

      <Card className="p-4 mb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by business name or phone"
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500"
            />
          </div>
          <select
            value={niche}
            onChange={(e) => setNiche(e.target.value as 'All' | Niche)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
          >
            <option value="All">All niches</option>
            <option value="Dental">Dental</option>
            <option value="Dermatology">Dermatology</option>
            <option value="HVAC">HVAC</option>
          </select>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
          >
            {statusOptions.map((s) => (
              <option key={s} value={s}>{s === 'All' ? 'All statuses' : s}</option>
            ))}
          </select>
        </div>
      </Card>

      {loading && <Spinner label="Loading leads…" />}
      {!loading && error && <Card className="p-6"><ErrorState message={error} /></Card>}
      {!loading && !error && filtered.length === 0 && (
        <Card className="p-6">
          <EmptyState title="No leads found" message="No leads match your search and filters, or no leads have been collected yet." />
        </Card>
      )}
      {!loading && !error && filtered.length > 0 && (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                  <th className="px-5 py-3">Business</th>
                  <th className="px-5 py-3">Niche</th>
                  <th className="px-5 py-3">Phone</th>
                  <th className="px-5 py-3">Email</th>
                  <th className="px-5 py-3 cursor-pointer select-none" onClick={() => toggleSort('rating')}>
                    <span className="inline-flex items-center gap-1">Rating <Star className="w-3 h-3" /></span>
                  </th>
                  <th className="px-5 py-3 cursor-pointer select-none" onClick={() => toggleSort('review_count')}>
                    <span className="inline-flex items-center gap-1">Reviews <ArrowUpDown className="w-3 h-3" /></span>
                  </th>
                  <th className="px-5 py-3">Address</th>
                  <th className="px-5 py-3">Maps</th>
                  <th className="px-5 py-3">Website</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 cursor-pointer select-none" onClick={() => toggleSort('created_at')}>
                    <span className="inline-flex items-center gap-1">Added <ArrowUpDown className="w-3 h-3" /></span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((l) => (
                  <tr
                    key={l.id}
                    onClick={() => onOpenLead(l.id)}
                    className="cursor-pointer hover:bg-emerald-50/40 transition-colors"
                  >
                    <td className="px-5 py-3 font-medium text-gray-900">{l.business_name}</td>
                    <td className="px-5 py-3 text-gray-600">{l.niche}</td>
                    <td className="px-5 py-3 text-gray-600">{orNa(l.phone)}</td>
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
                    <td className="px-5 py-3 text-gray-600 max-w-xs truncate">{orNa(l.address)}</td>
                    <td className="px-5 py-3 text-gray-600">
                      {l.google_maps_url ? (
                        <a href={l.google_maps_url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-emerald-700 hover:underline">
                          Map
                        </a>
                      ) : (
                        'Not available'
                      )}
                    </td>
                    <td className="px-5 py-3 text-gray-600 max-w-[160px] truncate">
                      {l.website ? (
                        <a href={l.website} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-emerald-700 hover:underline">
                          {l.website}
                        </a>
                      ) : (
                        'Not available'
                      )}
                    </td>
                    <td className="px-5 py-3"><Badge tone={leadStatusTone(l.lead_status)}>{l.lead_status}</Badge></td>
                    <td className="px-5 py-3 text-gray-600 whitespace-nowrap">{formatDate(l.created_at)}</td>
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
