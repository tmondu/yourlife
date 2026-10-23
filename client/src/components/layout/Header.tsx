import React from 'react';
import { Cloud, CloudOff } from 'lucide-react';
import { formatDateVi, getTodayDate } from '../../lib/utils';

interface HeaderProps {
  isOnline: boolean;
  title?: string;
}

export const Header: React.FC<HeaderProps> = ({ isOnline, title }) => {
  const today = getTodayDate();
  
  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 px-4 pb-3"
      style={{
        background: 'rgba(15, 15, 17, 0.9)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid #27272a',
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)',
      }}
    >
      <div className="flex items-center justify-between">
        <div>
          {title ? (
            <h1 className="text-base font-semibold text-zinc-100">{title}</h1>
          ) : (
            <>
              <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">YourLife</p>
              <h1 className="text-sm font-semibold text-zinc-100 mt-0.5">{formatDateVi(today)}</h1>
            </>
          )}
        </div>
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${isOnline ? 'bg-green-500/15' : 'bg-zinc-800'}`}>
          {isOnline ? (
            <>
              <Cloud size={12} className="text-green-400" />
              <span className="text-[11px] text-green-400 font-medium">Đã đồng bộ</span>
            </>
          ) : (
            <>
              <CloudOff size={12} className="text-zinc-500" />
              <span className="text-[11px] text-zinc-500 font-medium">Ngoại tuyến</span>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
