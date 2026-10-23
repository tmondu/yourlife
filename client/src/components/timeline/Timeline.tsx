import React, { useEffect, useState, useCallback } from 'react';
import { Entry, MOODS } from '../../lib/types';
import { fetchEntries } from '../../lib/api';
import { cacheEntries, getCachedEntries } from '../../lib/db';
import { useAuthStore } from '../../store/auth';
import { getCurrentMonth, formatDateVi, formatDateShort } from '../../lib/utils';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';

interface TimelineProps {
  onNewEntry: (date?: string) => void;
  onEditEntry: (entry: Entry) => void;
  refreshKey: number;
}

export const Timeline: React.FC<TimelineProps> = ({ onNewEntry, onEditEntry, refreshKey }) => {
  const { token } = useAuthStore();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [month, setMonth] = useState(getCurrentMonth());
  const [loading, setLoading] = useState(true);

  const loadEntries = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await fetchEntries(token, month);
      setEntries(data);
      await cacheEntries(data);
    } catch {
      const cached = await getCachedEntries(month);
      setEntries(cached);
    } finally {
      setLoading(false);
    }
  }, [token, month]);

  useEffect(() => { loadEntries(); }, [loadEntries, refreshKey]);

  const changeMonth = (delta: number) => {
    const [y, m] = month.split('-').map(Number);
    const d = new Date(y, m - 1 + delta);
    setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  const monthLabel = (() => {
    const [y, m] = month.split('-').map(Number);
    return `Tháng ${m}, ${y}`;
  })();

  const getMoodOption = (mood: string) => MOODS.find((m) => m.value === mood) || MOODS[1];

  return (
    <div className="flex flex-col h-full">
      {/* Month Selector */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-zinc-800 rounded-xl text-zinc-400 hover:text-zinc-100">
          <ChevronLeft size={20} />
        </button>
        <h2 className="text-sm font-semibold text-zinc-200">{monthLabel}</h2>
        <button onClick={() => changeMonth(1)} className="p-2 hover:bg-zinc-800 rounded-xl text-zinc-400 hover:text-zinc-100">
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Entries */}
      <div className="flex-1 overflow-y-auto content-area px-4 py-4 space-y-3 pb-safe">
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-28 bg-zinc-900 rounded-2xl animate-pulse-soft" />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="text-5xl mb-4">📖</div>
            <p className="text-zinc-400 font-medium mb-1">Chưa có nhật ký nào</p>
            <p className="text-zinc-600 text-sm mb-6">Hãy bắt đầu ghi lại khoảnh khắc đầu tiên!</p>
            <button
              onClick={() => onNewEntry()}
              className="flex items-center gap-2 px-5 py-2.5 bg-purple-500 text-white rounded-xl text-sm font-medium"
            >
              <Plus size={16} /> Viết nhật ký ngay
            </button>
          </div>
        ) : (
          entries.map((entry, index) => {
            const moodOpt = getMoodOption(entry.mood);
            return (
              <div
                key={entry.id}
                className="entry-card animate-fade-in"
                style={{ animationDelay: `${index * 30}ms` }}
                onClick={() => onEditEntry(entry)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{moodOpt.emoji}</span>
                    <div>
                      <p className="text-xs text-zinc-500">{formatDateVi(entry.date)}</p>
                      {entry.title && <p className="text-sm font-semibold text-zinc-100 mt-0.5">{entry.title}</p>}
                    </div>
                  </div>
                  {entry.images.length > 0 && (
                    <div className="flex -space-x-2">
                      {entry.images.slice(0, 3).map((img, i) => (
                        <img key={i} src={img} alt="" className="w-8 h-8 rounded-lg object-cover border-2 border-zinc-900" />
                      ))}
                    </div>
                  )}
                </div>
                <p className="text-sm text-zinc-400 leading-relaxed line-clamp-3">{entry.content}</p>
                {entry.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {entry.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="text-[11px] text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
