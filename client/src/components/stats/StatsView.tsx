import React, { useEffect, useState } from 'react';
import { Entry, MOODS } from '../../lib/types';
import { fetchEntries } from '../../lib/api';
import { useAuthStore } from '../../store/auth';

interface StatsViewProps { refreshKey: number; }

export const StatsView: React.FC<StatsViewProps> = ({ refreshKey }) => {
  const { token } = useAuthStore();
  const [allEntries, setAllEntries] = useState<Entry[]>([]);

  useEffect(() => {
    if (!token) return;
    fetchEntries(token).then(setAllEntries).catch(() => {});
  }, [token, refreshKey]);

  const moodCounts = MOODS.map((m) => ({
    ...m,
    count: allEntries.filter((e) => e.mood === m.value).length,
  }));
  const total = allEntries.length;
  const maxCount = Math.max(...moodCounts.map((m) => m.count), 1);

  // Streak calculation
  const streak = (() => {
    if (!allEntries.length) return 0;
    const dates = [...new Set(allEntries.map((e) => e.date))].sort().reverse();
    let s = 0;
    let cur = new Date();
    for (const date of dates) {
      const d = new Date(date + 'T00:00:00');
      const diff = Math.round((cur.getTime() - d.getTime()) / 86400000);
      if (diff <= 1) { s++; cur = d; }
      else break;
    }
    return s;
  })();

  return (
    <div className="content-area px-4 py-4 pb-safe space-y-5">
      {/* Overview cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Tổng bài viết', value: total, icon: '📖' },
          { label: 'Ngày liên tiếp', value: streak, icon: '🔥' },
          {
            label: 'Tuần này',
            value: allEntries.filter(e => {
              const d = new Date(e.date + 'T00:00:00');
              const now = new Date();
              const weekAgo = new Date(now.getTime() - 7 * 86400000);
              return d >= weekAgo;
            }).length,
            icon: '📅'
          },
        ].map((card) => (
          <div key={card.label} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3 text-center">
            <p className="text-2xl mb-1">{card.icon}</p>
            <p className="text-xl font-bold gradient-text">{card.value}</p>
            <p className="text-[11px] text-zinc-500 mt-0.5">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Mood distribution */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
        <p className="text-sm font-semibold text-zinc-200 mb-4">Phân bổ cảm xúc</p>
        <div className="space-y-3">
          {moodCounts.map((m) => (
            <div key={m.value} className="flex items-center gap-3">
              <span className="text-lg w-7">{m.emoji}</span>
              <div className="flex-1">
                <div className="flex justify-between mb-1">
                  <span className="text-xs text-zinc-400">{m.label}</span>
                  <span className="text-xs text-zinc-500">{m.count} bài</span>
                </div>
                <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${(m.count / maxCount) * 100}%`,
                      background: m.color,
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Writing frequency */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
        <p className="text-sm font-semibold text-zinc-200 mb-3">Tần suất viết (12 tuần gần đây)</p>
        <div className="grid grid-cols-12 gap-1">
          {[...Array(84)].map((_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - (83 - i));
            const dateStr = date.toISOString().split('T')[0];
            const hasEntry = allEntries.some((e) => e.date === dateStr);
            return (
              <div
                key={i}
                className="aspect-square rounded-sm"
                style={{ background: hasEntry ? '#a855f7' : '#27272a' }}
                title={dateStr}
              />
            );
          })}
        </div>
        <p className="text-[11px] text-zinc-600 mt-2">Mỗi ô = 1 ngày. Màu tím = có nhật ký.</p>
      </div>
    </div>
  );
};
