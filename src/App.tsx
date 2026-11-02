import { useState } from 'react';
import { Menu } from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { DashboardPage } from './components/DashboardPage';
import { NicheDatesPage, NicheDateLeadsPage, NicheLeadsPage, NicheServiceLeadsPage } from './components/NichePages';
import { LeadDetailPage } from './components/LeadDetailPage';
import { AllLeadsPage } from './components/AllLeadsPage';
import { OutreachHistoryPage } from './components/OutreachHistoryPage';
import { TodaysLeadsPage } from './components/TodaysLeadsPage';
import { ErrorBoundary } from './components/ErrorBoundary';
import { isSupabaseConfigured } from './lib/supabase';
import type { View, SidebarItem, LeadDetailOrigin } from './lib/navigation';
import type { Niche } from './lib/types';

function assertNever(value: never): never {
  throw new Error(`Unsupported navigation value: ${JSON.stringify(value)}`);
}

function sidebarItemForNiche(niche: Niche): SidebarItem {
  switch (niche) {
    case 'Dental':
      return 'dental';
    case 'Dermatology':
      return 'dermatology';
    case 'HVAC':
      return 'hvac';
    default:
      return assertNever(niche);
  }
}

function viewToSidebarItem(v: View): SidebarItem {
  switch (v.kind) {
    case 'dashboard':
      return 'dashboard';
    case 'niche-dates':
    case 'niche-date-leads':
    case 'niche-leads':
      return sidebarItemForNiche(v.niche);
    case 'niche-service-leads':
      if (v.niche !== 'Dental') return sidebarItemForNiche(v.niche);
      return v.serviceType === 'website' ? 'dental-website' : 'dental-voice';
    case 'lead-detail':
      return sidebarItemForOrigin(v.origin);
    case 'all-leads':
      return 'all-leads';
    case 'outreach-history':
      return 'outreach-history';
    case 'today-leads':
      return 'dashboard';
    default:
      return assertNever(v);
  }
}

function sidebarItemForOrigin(o: LeadDetailOrigin): SidebarItem {
  switch (o.kind) {
    case 'niche-date-leads':
    case 'niche-leads':
      return sidebarItemForNiche(o.niche);
    case 'niche-service-leads':
      if (o.niche !== 'Dental') return sidebarItemForNiche(o.niche);
      return o.serviceType === 'website' ? 'dental-website' : 'dental-voice';
    case 'all-leads':
      return 'all-leads';
    case 'outreach-history':
      return 'outreach-history';
    case 'today-leads':
      return 'dashboard';
    default:
      return assertNever(o);
  }
}

function backLabelForOrigin(o: LeadDetailOrigin): string {
  switch (o.kind) {
    case 'niche-date-leads':
      return `Back to ${o.niche.toLowerCase()} leads`;
    case 'niche-service-leads':
      return `Back to ${o.niche.toLowerCase()} ${o.serviceType} leads`;
    case 'niche-leads':
      return `Back to ${o.niche} leads`;
    case 'all-leads':
      return 'Back to all leads';
    case 'today-leads':
      return "Back to today's leads";
    case 'outreach-history':
      return 'Back to outreach history';
    default:
      return assertNever(o);
  }
}

function viewFromOrigin(o: LeadDetailOrigin): View {
  switch (o.kind) {
    case 'niche-date-leads':
      return { kind: 'niche-date-leads', niche: o.niche, date: o.date };
    case 'niche-service-leads':
      return { kind: 'niche-service-leads', niche: o.niche, serviceType: o.serviceType };
    case 'niche-leads':
      return { kind: 'niche-leads', niche: o.niche };
    case 'all-leads':
      return { kind: 'all-leads' };
    case 'today-leads':
      return { kind: 'today-leads' };
    case 'outreach-history':
      return { kind: 'outreach-history' };
    default:
      return assertNever(o);
  }
}

function AppContent() {
  const [view, setView] = useState<View>({ kind: 'dashboard' });
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  function selectSidebar(item: SidebarItem) {
    switch (item) {
      case 'dashboard':
        setView({ kind: 'dashboard' });
        break;
      case 'dental':
        setView({ kind: 'niche-dates', niche: 'Dental' });
        break;
      case 'dental-website':
        setView({ kind: 'niche-service-leads', niche: 'Dental', serviceType: 'website' });
        break;
      case 'dental-voice':
        setView({ kind: 'niche-service-leads', niche: 'Dental', serviceType: 'voice' });
        break;
      case 'dermatology':
        setView({ kind: 'niche-leads', niche: 'Dermatology' });
        break;
      case 'hvac':
        setView({ kind: 'niche-leads', niche: 'HVAC' });
        break;
      case 'all-leads':
        setView({ kind: 'all-leads' });
        break;
      case 'outreach-history':
        setView({ kind: 'outreach-history' });
        break;
      default:
        assertNever(item);
    }
    setMobileSidebarOpen(false);
  }

  function openNiche(niche: Niche | 'All') {
    if (niche === 'All') {
      setView({ kind: 'all-leads' });
    } else {
      setView({ kind: 'niche-leads', niche });
    }
  }

  function openTodaysLeads() {
    setView({ kind: 'today-leads' });
  }

  function openLead(leadId: string, origin: LeadDetailOrigin) {
    setView({ kind: 'lead-detail', leadId, origin });
  }

  let content: React.ReactNode;
  switch (view.kind) {
    case 'dashboard':
      content = <DashboardPage onOpenNiche={openNiche} onOpenTodaysLeads={openTodaysLeads} />;
      break;
    case 'today-leads':
      content = (
        <TodaysLeadsPage
          onBack={() => setView({ kind: 'dashboard' })}
          onOpenLead={(id) => openLead(id, { kind: 'today-leads' })}
        />
      );
      break;
    case 'niche-dates':
      content = (
        <NicheDatesPage
          niche={view.niche}
          onBack={() => setView({ kind: 'dashboard' })}
          onOpenDate={(date) => setView({ kind: 'niche-date-leads', niche: view.niche, date })}
        />
      );
      break;
    case 'niche-date-leads':
      content = (
        <NicheDateLeadsPage
          niche={view.niche}
          date={view.date}
          onBack={() => setView({ kind: 'niche-dates', niche: view.niche })}
          onOpenLead={(id) => openLead(id, { kind: 'niche-date-leads', niche: view.niche, date: view.date })}
        />
      );
      break;
    case 'niche-leads':
      content = (
        <NicheLeadsPage
          niche={view.niche}
          onBack={() => setView({ kind: 'dashboard' })}
          onOpenLead={(id) => openLead(id, { kind: 'niche-leads', niche: view.niche })}
        />
      );
      break;
    case 'niche-service-leads':
      content = (
        <NicheServiceLeadsPage
          niche={view.niche}
          serviceType={view.serviceType}
          onBack={() => setView({ kind: 'niche-dates', niche: view.niche })}
          onOpenLead={(id) => openLead(id, { kind: 'niche-service-leads', niche: view.niche, serviceType: view.serviceType })}
        />
      );
      break;
    case 'lead-detail':
      content = (
        <LeadDetailPage
          leadId={view.leadId}
          backLabel={backLabelForOrigin(view.origin)}
          onBack={() => setView(viewFromOrigin(view.origin))}
        />
      );
      break;
    case 'all-leads':
      content = <AllLeadsPage onOpenLead={(id) => openLead(id, { kind: 'all-leads' })} />;
      break;
    case 'outreach-history':
      content = <OutreachHistoryPage onOpenLead={(id) => openLead(id, { kind: 'outreach-history' })} />;
      break;
    default:
      content = assertNever(view);
  }

  if (!isSupabaseConfigured) {
    content = (
      <div className="max-w-xl mx-auto py-16 px-6">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
          <h2 className="text-base font-semibold text-amber-900 mb-2">Supabase not configured</h2>
          <p className="text-sm text-amber-800">
            VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set in your environment to connect this dashboard to its database.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex">
      <div className="fixed inset-y-0 left-0 z-20 hidden sm:block">
        <Sidebar active={viewToSidebarItem(view)} onSelect={selectSidebar} />
      </div>
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-40 sm:hidden">
          <button
            type="button"
            aria-label="Close navigation menu"
            onClick={() => setMobileSidebarOpen(false)}
            className="absolute inset-0 h-full w-full bg-gray-950/50"
          />
          <div className="absolute inset-y-0 left-0 z-10 shadow-xl">
            <Sidebar
              active={viewToSidebarItem(view)}
              onSelect={selectSidebar}
              mobileDrawer
              onClose={() => setMobileSidebarOpen(false)}
            />
          </div>
        </div>
      )}
      <div className="flex-1 min-w-0 sm:ml-16 lg:ml-60">
        <header className="fixed inset-x-0 top-0 z-30 flex h-14 items-center border-b border-gray-200 bg-white px-3 sm:hidden">
          <button
            type="button"
            aria-label="Open navigation menu"
            aria-expanded={mobileSidebarOpen}
            onClick={() => setMobileSidebarOpen(true)}
            className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            <Menu className="h-6 w-6" />
          </button>
          <span className="ml-2 text-sm font-semibold text-gray-900">Hermes Outreach</span>
        </header>
        <main className="p-4 pt-[4.5rem] sm:p-6 lg:p-8 max-w-[1400px] mx-auto">{content}</main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}
