import { useEffect, useState } from 'react';
import { Stethoscope, Sparkles, Send, CalendarDays, MailCheck, Wind, Users } from 'lucide-react';
import { Card, SectionTitle, Spinner, ErrorState, EmptyState } from './ui';
import { DailyChart } from './DailyChart';
import { fetchDashboardStats, type DashboardStats } from '../lib/queries';
import { SupabaseError } from '../lib/queries';
import type { Niche } from '../lib/types';

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
  onClick,
}: {
  label: string;
  value: number;
  icon: typeof Send;
  accent: string;
  onClick?: () => void;
}) {
  const card = (
    <Card className={`p-5 ${onClick ? 'hover:shadow-md transition-shadow' : ''}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900 tabular-nums">{value}</p>
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${accent}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </Card>
  );
  return onClick ? (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-2xl text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
    >
      {card}
    </button>
  ) : card;
}

export function DashboardPage({
  onOpenNiche,
  onOpenTodaysLeads,
}: {
  onOpenNiche: (niche: Niche | 'All') => void;
  onOpenTodaysLeads: () => void;
}) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const s = await fetchDashboardStats();
        if (!cancelled) setStats(s);
      } catch (e) {
        if (cancelled) return;
        if (e instanceof SupabaseError && e.code === '42501') {
          setError('Authentication required to view dashboard statistics.');
        } else if (e instanceof Error) {
          setError(e.message);
        } else {
          setError('Unable to load dashboard data.');
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
      <SectionTitle subtitle="Overview of your Hermes outreach pipeline.">Dashboard</SectionTitle>

      {loading && <Spinner label="Loading dashboard statistics…" />}
      {!loading && error && (
        <Card className="p-6">
          <ErrorState message={error} />
        </Card>
      )}
      {!loading && !error && stats && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
            <StatCard
              label="Dental leads"
              value={stats.dentalLeads}
              icon={Stethoscope}
              accent="bg-blue-50 text-blue-600"
              onClick={() => onOpenNiche('Dental')}
            />
            <StatCard
              label="Dermatology leads"
              value={stats.dermLeads}
              icon={Sparkles}
              accent="bg-purple-50 text-purple-600"
              onClick={() => onOpenNiche('Dermatology')}
            />
            <StatCard
              label="HVAC leads"
              value={stats.hvacLeads}
              icon={Wind}
              accent="bg-orange-50 text-orange-600"
              onClick={() => onOpenNiche('HVAC')}
            />
            <StatCard
              label="Total leads"
              value={stats.totalLeads}
              icon={Users}
              accent="bg-gray-50 text-gray-600"
              onClick={() => onOpenNiche('All')}
            />
            <StatCard
              label="Today's leads"
              value={stats.todayLeads}
              icon={CalendarDays}
              accent="bg-emerald-50 text-emerald-600"
              onClick={onOpenTodaysLeads}
            />
            <StatCard label="Sent overall" value={stats.sentTotal} icon={MailCheck} accent="bg-gray-100 text-gray-600" />
          </div>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-semibold text-gray-900">Daily outreach</h2>
              <span className="text-xs text-gray-500">Successfully sent messages per date (last 14 days)</span>
            </div>
            {stats.daily.length === 0 ? (
              <EmptyState title="No sent messages yet" message="Once Hermes starts sending outreach, daily totals will appear here." />
            ) : (
              <DailyChart data={stats.daily} />
            )}
          </Card>
        </>
      )}
    </div>
  );
}
