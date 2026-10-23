import React from 'react';
import { BookOpen, Calendar, Plus, BarChart2, Settings } from 'lucide-react';
import { cn } from '../../lib/utils';

type Tab = 'timeline' | 'calendar' | 'new' | 'stats' | 'settings';

interface BottomNavProps {
  active: Tab;
  onNavigate: (tab: Tab) => void;
}

const NAV_ITEMS = [
  { id: 'timeline' as Tab, icon: BookOpen, label: 'Dòng thời gian' },
  { id: 'calendar' as Tab, icon: Calendar, label: 'Lịch' },
  { id: 'new' as Tab, icon: Plus, label: 'Viết mới', isCTA: true },
  { id: 'stats' as Tab, icon: BarChart2, label: 'Thống kê' },
  { id: 'settings' as Tab, icon: Settings, label: 'Cài đặt' },
];

export const BottomNav: React.FC<BottomNavProps> = ({ active, onNavigate }) => {
  return (
    <nav className="bottom-nav">
      <div className="flex items-center justify-around px-2 py-2">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id;

          if (item.isCTA) {
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className="flex flex-col items-center -mt-6"
              >
                <div className={cn(
                  'w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-all',
                  'bg-gradient-to-br from-purple-500 to-indigo-500 shadow-purple-500/40',
                  isActive && 'scale-90',
                  !isActive && 'hover:scale-105'
                )}>
                  <Icon size={24} className="text-white" strokeWidth={2.5} />
                </div>
              </button>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className="flex flex-col items-center gap-1 py-1 px-3 flex-1"
            >
              <Icon
                size={22}
                className={cn(
                  'transition-colors',
                  isActive ? 'text-purple-400' : 'text-zinc-500'
                )}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span className={cn(
                'text-[10px] font-medium transition-colors',
                isActive ? 'text-purple-400' : 'text-zinc-600'
              )}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
