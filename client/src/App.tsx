import React, { useState, useEffect } from 'react';
import { useAuthStore } from './store/auth';
import { AuthPage } from './pages/AuthPage';
import { BottomNav } from './components/layout/BottomNav';
import { Header } from './components/layout/Header';
import { Timeline } from './components/timeline/Timeline';
import { CalendarView } from './components/calendar/CalendarView';
import { Editor } from './components/editor/Editor';
import { StatsView } from './components/stats/StatsView';
import { SettingsView } from './components/settings/SettingsView';
import { Entry } from './lib/types';
import { getTodayDate } from './lib/utils';

type Tab = 'timeline' | 'calendar' | 'new' | 'stats' | 'settings';
type PageState =
  | { view: 'main'; tab: Tab }
  | { view: 'editor'; entry?: Entry; date?: string };

const PAGE_TITLES: Partial<Record<Tab, string>> = {
  calendar: 'Lịch',
  stats: 'Thống kê',
  settings: 'Cài đặt',
};

export default function App() {
  const { isAuthenticated } = useAuthStore();
  const [page, setPage] = useState<PageState>({ view: 'main', tab: 'timeline' });
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const on = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  if (!isAuthenticated) return <AuthPage />;

  const handleNavigate = (tab: Tab) => {
    if (tab === 'new') {
      setPage({ view: 'editor', date: getTodayDate() });
    } else {
      setPage({ view: 'main', tab });
    }
  };

  const handleSave = (entry: Entry) => {
    setRefreshKey((k) => k + 1);
    setPage({ view: 'main', tab: 'timeline' });
  };

  const handleEditEntry = (entry: Entry) => {
    setPage({ view: 'editor', entry });
  };

  const handleDayClick = (date: string, entry?: Entry) => {
    setPage({ view: 'editor', entry, date });
  };

  if (page.view === 'editor') {
    return (
      <Editor
        entry={page.entry}
        date={page.date}
        onSave={handleSave}
        onBack={() => setPage({ view: 'main', tab: 'timeline' })}
      />
    );
  }

  const activeTab = page.tab;

  return (
    <div className="flex flex-col h-full">
      <Header
        isOnline={isOnline}
        title={PAGE_TITLES[activeTab]}
      />

      <main className="flex-1 overflow-hidden" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 60px)' }}>
        {activeTab === 'timeline' && (
          <Timeline
            onNewEntry={(date) => setPage({ view: 'editor', date })}
            onEditEntry={handleEditEntry}
            refreshKey={refreshKey}
          />
        )}
        {activeTab === 'calendar' && (
          <CalendarView onDayClick={handleDayClick} refreshKey={refreshKey} />
        )}
        {activeTab === 'stats' && <StatsView refreshKey={refreshKey} />}
        {activeTab === 'settings' && <SettingsView />}
      </main>

      <BottomNav active={activeTab} onNavigate={handleNavigate} />
    </div>
  );
}
