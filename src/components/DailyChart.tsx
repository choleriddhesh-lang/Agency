interface DailyPoint {
  date: string;
  count: number;
}

export function DailyChart({ data }: { data: DailyPoint[] }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <div className="flex items-end gap-2 h-48">
      {data.length === 0 && (
        <div className="flex-1 flex items-center justify-center text-sm text-gray-400">
          No sent messages yet
        </div>
      )}
      {data.map((d) => {
        const heightPct = (d.count / max) * 100;
        const day = new Date(d.date + 'T00:00:00');
        const label = day.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
        return (
          <div key={d.date} className="flex-1 flex flex-col items-center gap-2 min-w-0 group">
            <div className="w-full flex-1 flex items-end">
              <div
                className="w-full bg-emerald-500 rounded-t-md hover:bg-emerald-600 transition-colors relative"
                style={{ height: `${Math.max(heightPct, 2)}%` }}
                title={`${d.count} sent on ${label}`}
              >
                <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-semibold text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity">
                  {d.count}
                </span>
              </div>
            </div>
            <span className="text-[10px] text-gray-500 truncate w-full text-center">{label}</span>
          </div>
        );
      })}
    </div>
  );
}
