import { LayoutDashboard, Stethoscope, Sparkles, Users, ChevronDown, ChevronRight, Wind } from 'lucide-react';
import type { SidebarItem } from '../lib/navigation';
import { useState } from 'react';

const items: { id: SidebarItem; label: string; icon: typeof LayoutDashboard; hasSubmenu?: boolean }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'dental', label: 'Dental', icon: Stethoscope, hasSubmenu: true },
  { id: 'dermatology', label: 'Dermatology', icon: Sparkles },
  { id: 'hvac', label: 'HVAC', icon: Wind },
  { id: 'all-leads', label: 'All Leads', icon: Users },
];

const dentalSubmenu: { id: SidebarItem; label: string }[] = [
  { id: 'dental-website', label: 'Website' },
  { id: 'dental-voice', label: 'Voice' },
];

export function Sidebar({
  active,
  onSelect,
}: {
  active: SidebarItem;
  onSelect: (item: SidebarItem) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <aside className="w-16 lg:w-60 shrink-0 bg-white border-r border-gray-200 flex flex-col h-full">
      <div className="h-16 flex items-center gap-2 px-3 lg:px-5 border-b border-gray-100">
        <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center shrink-0">
          <span className="text-white font-bold text-sm">H</span>
        </div>
        <span className="hidden lg:block font-semibold text-gray-900 text-sm truncate">Hermes Outreach</span>
      </div>
      <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
        {items.map((it) => {
          const Icon = it.icon;
          const isDental = it.id === 'dental';
          const isDentalActive = active === 'dental' || active === 'dental-website' || active === 'dental-voice';

          return (
            <div key={it.id} className="space-y-1">
              <button
                onClick={() => {
                  if (isDental) {
                    setIsOpen(!isOpen);
                  } else {
                    onSelect(it.id);
                  }
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isDentalActive
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
                title={it.label}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 shrink-0 ${isDentalActive ? 'text-emerald-600' : 'text-gray-400'}`} />
                  <span className="hidden lg:block">{it.label}</span>
                </div>
                {it.hasSubmenu && (
                  <span className="hidden lg:block">
                    {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </span>
                )}
              </button>
              {it.hasSubmenu && isOpen && (
                <div className="hidden lg:block ml-9 space-y-1">
                  {dentalSubmenu.map((sub) => (
                    <button
                      key={sub.id}
                      onClick={() => onSelect(sub.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                        active === sub.id
                          ? 'text-emerald-700 font-semibold'
                          : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      {sub.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
