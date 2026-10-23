import React, { useEffect, useState } from 'react';
import { Entry, MOODS } from '../../lib/types';
import { fetchEntries } from '../../lib/api';
import { useAuthStore } from '../../store/auth';
import { getCurrentMonth } from '../../lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarViewProps {
  onDayClick: (date: string, entry?: Entry) => void;
  refreshKey: number;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ onDayClick, refreshKey }) => {
  const { token } = useAuthStore();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [month, setMonth] = useState(getCurrentMonth());

  useEffect(() => {
    if (!token) return;
    fetchEntries(token, month).then(setEntries).catch(() => {});
  }, [token, month, refreshKey]);

  const changeMonth = (delta: number) => {
    const [y, m] = month.split('-').map(Number);
    const d = new Date(y, m - 1 + delta);
    setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  const [year, mon] = month.split('-').map(Number);
  const firstDay = new Date(year, mon - 1, 1);
  const daysInMonth = new Date(year, mon, 0).getDate();
  const startDayOfWeek = firstDay.getDay(); // 0=Sun
  const entryMap = new Map(entries.map((e) => [e.date, e]));
  const today = new Date().toISOString().split('T')[0];

  const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-zinc-800 rounded-xl text-zinc-400">
          <ChevronLeft size={20} />
        </button>
        <h2 className="text-sm font-semibold text-zinc-200">Tháng {mon}, {year}</h2>
        <button onClick={() => changeMonth(1)} className="p-2 hover:bg-zinc-800 rounded-xl text-zinc-400">
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="px-4 py-4">
        {/* Day headers */}
        <div className="grid grid-cols-7 mb-2">
          {days.map((d) => (
            <div key={d} className="text-center text-[11px] text-zinc-500 font-medium py-1">{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-y-1">
          {/* Empty cells */}
          {[...Array(startDayOfWeek)].map((_, i) => <div key={`empty-${i}`} />)}

          {/* Days */}
          {[...Array(daysInMonth)].map((_, i) => {
            const day = i + 1;
            const dateStr = `${year}-${String(mon).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const entry = entryMap.get(dateStr);
            const isToday = dateStr === today;
            const moodOpt = entry ? MOODS.find((m) => m.value === entry.mood) : null;

            return (
              <button
                key={day}
                onClick={() => onDayClick(dateStr, entry)}
                className="flex flex-col items-center py-1 rounded-xl transition-all hover:bg-zinc-800 relative"
              >
                <span className={`text-sm font-medium w-8 h-8 flex items-center justify-center rounded-full transition-all
                  ${isToday ? 'bg-purple-500 text-white' : entry ? 'text-zinc-100' : 'text-zinc-500'}
                `}>
                  {day}
                </span>
                {entry && (
                  <span className="text-xs mt-0.5">{moodOpt?.emoji || '📝'}</span>
                )}
                {!entry && isToday && (
                  <span className="w-1 h-1 rounded-full bg-purple-400 mt-0.5" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Stats for month */}
      <div className="mx-4 mt-2 p-4 bg-zinc-900 rounded-2xl border border-zinc-800">
        <p className="text-xs text-zinc-500 mb-2">Tháng này</p>
        <div className="flex gap-4">
          <div className="text-center">
            <p className="text-xl font-bold gradient-text">{entries.length}</p>
            <p className="text-xs text-zinc-500">bài viết</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold gradient-text">
              {Math.round((entries.length / daysInMonth) * 100)}%
            </p>
            <p className="text-xs text-zinc-500">ngày có nhật ký</p>
          </div>
          <div className="text-center">
            <p className="text-xl">{MOODS.find(m => m.value === entries.sort((a,b) => entries.filter(e=>e.mood===b.mood).length - entries.filter(e=>e.mood===a.mood).length)[0]?.mood)?.emoji || '😊'}</p>
            <p className="text-xs text-zinc-500">cảm xúc chủ đạo</p>
          </div>
        </div>
      </div>
    </div>
  );
};
