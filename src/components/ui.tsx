import { type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`bg-white rounded-2xl border border-gray-200 shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

export function SectionTitle({ children, subtitle }: { children: ReactNode; subtitle?: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{children}</h1>
      {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
    </div>
  );
}

export function Spinner({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-gray-500">
      <Loader2 className="w-7 h-7 animate-spin text-emerald-600 mb-3" />
      <p className="text-sm">{label}</p>
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-4">
        <span className="text-red-600 text-xl">!</span>
      </div>
      <p className="text-sm font-medium text-gray-900 mb-1">Something went wrong</p>
      <p className="text-sm text-gray-500 max-w-md">{message}</p>
    </div>
  );
}

export function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <span className="text-gray-400 text-xl">·</span>
      </div>
      <p className="text-sm font-medium text-gray-900 mb-1">{title}</p>
      <p className="text-sm text-gray-500 max-w-md">{message}</p>
    </div>
  );
}

type BadgeTone = 'emerald' | 'amber' | 'red' | 'gray' | 'blue';
const toneClasses: Record<BadgeTone, string> = {
  emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  amber: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  red: 'bg-red-50 text-red-700 ring-red-600/20',
  gray: 'bg-gray-100 text-gray-700 ring-gray-600/20',
  blue: 'bg-blue-50 text-blue-700 ring-blue-600/20',
};

export function Badge({ tone = 'gray', children }: { tone?: BadgeTone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset ${toneClasses[tone]}`}
    >
      {children}
    </span>
  );
}

export function statusTone(status: string): BadgeTone {
  switch (status) {
    case 'Sent':
      return 'emerald';
    case 'Failed':
      return 'red';
    case 'Draft':
      return 'amber';
    default:
      return 'gray';
  }
}

export function leadStatusTone(status: string): BadgeTone {
  switch (status) {
    case 'New':
      return 'blue';
    case 'Contacted':
      return 'amber';
    case 'Replied':
      return 'emerald';
    case 'Closed':
      return 'gray';
    default:
      return 'gray';
  }
}

export function BackButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-emerald-700 transition-colors"
    >
      <span className="text-base leading-none">‹</span> {label}
    </button>
  );
}
