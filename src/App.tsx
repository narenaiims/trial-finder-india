/**
 * @file src/App.tsx
 * @description Root component for TrialFinder India with Elegant Dark theme layout.
 */

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { 
  Search, 
  LayoutDashboard, 
  Users, 
  Map, 
  Bookmark, 
  UserCircle, 
  Activity
} from 'lucide-react';

import { useSearchStore } from './lib/store';
import { FilterPanel } from './components/FilterPanel';
import { useInfiniteTrials } from './hooks/useInfiniteTrials';
import { Trial, FilterState } from './types/trial';
import { CANCER_TYPES } from './constants';
import { motion, AnimatePresence } from 'motion/react';
import { Filter } from 'lucide-react';

// Navbar Component (Header with Tabs)
const Navbar = ({ onOpenFilters }: { onOpenFilters: () => void }) => {
  const location = useLocation();
  const { filters, setQuery, setFilters } = useSearchStore();
  
  const navItems = [
    { label: 'Active Trials', icon: LayoutDashboard, path: '/' },
    { label: 'Specialist Network', icon: Users, path: '/doctor' },
    { label: 'Institute Maps', icon: Map, path: '/maps' },
    { label: 'Saved Searches', icon: Bookmark, path: '/saved' },
    { label: 'Patient Profiles', icon: UserCircle, path: '/profiles' },
  ];

  const updateFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setFilters({ ...filters, [key]: value });
  };

  return (
    <nav className="sticky top-0 z-40 w-full bg-surface2 border-b border-border shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col">
          {/* Top row: Logo, Search, User */}
          <div className="flex items-center justify-between h-16 gap-4">
            <Link to="/" className="flex items-center gap-3 shrink-0">
              <div className="w-8 h-8 bg-gradient-to-br from-brand-accent to-brand-purple rounded-lg" />
              <span className="font-display font-bold text-xl tracking-tight hidden md:block">TrialFinder IN</span>
            </Link>

            <div className="flex-1 max-w-xl relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
              <input 
                type="text" 
                value={filters.query || ''}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by cancer type, drug agent, or CTRI ID..." 
                className="w-full bg-surface border border-border py-2 pl-12 pr-4 rounded-xl text-sm text-text-secondary focus:outline-none focus:border-brand-accent transition-colors"
              />
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button 
                onClick={onOpenFilters}
                className="lg:hidden p-2 text-text-secondary hover:text-brand-accent transition-colors"
              >
                <Filter size={20} />
              </button>
              <div className="w-8 h-8 rounded-full bg-border border border-brand-accent flex items-center justify-center cursor-pointer">
                <UserCircle size={20} className="text-brand-accent" />
              </div>
            </div>
          </div>

          {/* Bottom row: Tabs (Scrollable) */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-2 border-t border-border/50">
            {navItems.map((item) => (
              <Link 
                key={item.path} 
                to={item.path} 
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                  location.pathname === item.path 
                    ? 'bg-brand-accent/10 text-brand-accent' 
                    : 'text-text-secondary hover:bg-white/5 hover:text-text-primary'
                }`}
              >
                <item.icon size={16} />
                {item.label}
              </Link>
            ))}
          </div>

          {/* Filter row: Cancer Types (Scrollable) */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2 border-t border-border/50">
            <button 
              onClick={() => updateFilter('cancer_type', undefined)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all border ${
                !filters.cancer_type 
                  ? 'bg-brand-accent border-brand-accent text-surface' 
                  : 'bg-surface border-border text-text-secondary'
              }`}
            >
              All Types
            </button>
            {CANCER_TYPES.map(type => (
              <button
                key={type}
                onClick={() => updateFilter('cancer_type', filters.cancer_type === type ? undefined : type)}
                className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all border ${
                  filters.cancer_type === type 
                    ? 'bg-brand-accent border-brand-accent text-surface' 
                    : 'bg-surface border-border text-text-secondary hover:border-brand-accent'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
};

// Trial Card Component
const TrialCard = ({ trial }: { trial: Trial }) => (
  <Link to={`/trial/${trial.ctri_id}`} className="card block hover:border-brand-accent transition-all">
    <div className="font-mono text-xs text-brand-accent mb-2">
      {trial.ctri_id} {trial.nct_id ? `• ${trial.nct_id}` : ''}
    </div>
    <h3 className="text-base font-semibold leading-relaxed mb-3">{trial.title}</h3>
    <div className="flex items-center gap-4 text-xs text-text-secondary">
      <span className="text-brand-purple font-semibold uppercase">{trial.phase}</span>
      <span>{trial.sites?.[0]?.city || 'Multi-center'}</span>
      <span className="text-brand-green flex items-center gap-1">
        <div className="w-1.5 h-1.5 rounded-full bg-brand-green" />
        {trial.status}
      </span>
    </div>
    {trial.summaries?.en && (
      <p className="mt-3 text-xs text-text-secondary line-clamp-2 italic">
        {trial.summaries.en}
      </p>
    )}
  </Link>
);

// Home Component
const Home = ({ onOpenFilters }: { onOpenFilters: () => void }) => {
  const { filters, setFilters } = useSearchStore();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status
  } = useInfiniteTrials(filters);

  const trials = data?.pages.flatMap(page => page.trials) || [];

  const activeFilterCount = Object.entries(filters).filter(([key, val]) => {
    if (key === 'is_free_only') return val === true;
    if (key === 'query') return false; // Don't count search query as an "advanced" filter for the badge
    return !!val;
  }).length;

  return (
    <div className="max-w-7xl mx-auto w-full">
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">
        <div className="hidden lg:block">
          <FilterPanel filters={filters} setFilters={setFilters} />
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-lg font-semibold mb-1">
                {status === 'pending' ? 'Searching...' : `Found ${trials.length} Trials`}
              </h2>
              <p className="text-text-secondary text-sm">
                {filters.query ? `Results for "${filters.query}"` : 'Active oncology trials in India'}
              </p>
            </div>
            
            <button 
              onClick={onOpenFilters}
              className="lg:hidden flex items-center gap-2 px-4 py-2 bg-surface2 border border-border rounded-xl text-sm font-medium text-text-primary hover:border-brand-accent transition-all"
            >
              <Filter size={16} className="text-brand-accent" />
              Filters
              {activeFilterCount > 0 && (
                <span className="bg-brand-accent text-surface text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
          
          {trials.map(trial => (
            <TrialCard key={trial.ctri_id} trial={trial} />
          ))}

          {hasNextPage && (
            <button
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className="py-4 text-sm text-brand-accent font-semibold hover:underline"
            >
              {isFetchingNextPage ? 'Loading more...' : 'Load More Trials'}
            </button>
          )}

          {status === 'success' && trials.length === 0 && (
            <div className="text-center py-20 bg-surface2 rounded-2xl border border-dashed border-border">
              <p className="text-text-secondary">No trials found matching your criteria.</p>
              <button 
                onClick={() => setFilters({ query: '', is_free_only: false })}
                className="mt-4 text-brand-accent text-sm font-semibold"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const TrialDetail = () => <div className="max-w-7xl mx-auto w-full"><h1 className="font-display text-4xl text-brand-purple">Trial Details</h1></div>;
const DoctorPortal = () => <div className="max-w-7xl mx-auto w-full"><h1 className="font-display text-4xl text-brand-green">Doctor Portal</h1></div>;
const SavedSearches = () => <div className="max-w-7xl mx-auto w-full"><h1 className="font-display text-4xl">Saved Searches</h1></div>;

// Global Error Boundary
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('TrialFinder Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-surface text-white p-4">
          <h2 className="text-2xl font-display mb-4">Something went wrong.</h2>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-brand-accent rounded-lg"
          >
            Reload App
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// PWA Install Prompt Hook
const usePWAInstall = () => {
  const [installPrompt, setInstallPrompt] = useState<unknown>(null);

  useEffect(() => {
    const handler = (e: unknown) => {
      (e as { preventDefault: () => void }).preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const install = async () => {
    if (!installPrompt) return;
    (installPrompt as { prompt: () => void }).prompt();
    const { outcome } = await (installPrompt as { userChoice: Promise<{ outcome: string }> }).userChoice;
    if (outcome === 'accepted') setInstallPrompt(null);
  };

  return { canInstall: !!installPrompt, install };
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

export default function App() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  const { canInstall, install } = usePWAInstall();
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const { filters, setFilters } = useSearchStore();

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <Router>
          <div className="flex flex-col min-h-screen bg-surface text-text-primary font-body">
            <Navbar onOpenFilters={() => setIsFilterDrawerOpen(true)} />
            
            <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
              {/* PWA Notifications */}
              {(offlineReady || needRefresh) && (
                <div className="fixed bottom-4 left-4 right-4 z-50 bg-surface2 border border-brand-accent p-4 rounded-xl shadow-2xl flex items-center justify-between max-w-lg mx-auto">
                  <span className="text-sm">
                    {offlineReady ? 'App ready to work offline' : 'New content available, click on reload button to update.'}
                  </span>
                  <div className="flex gap-2">
                    {needRefresh && (
                      <button 
                        onClick={() => updateServiceWorker(true)}
                        className="px-3 py-1 bg-brand-accent text-surface font-bold rounded-md text-sm"
                      >
                        Reload
                      </button>
                    )}
                    <button 
                      onClick={() => { setOfflineReady(false); setNeedRefresh(false); }}
                      className="px-3 py-1 border border-border rounded-md text-sm"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}

              {/* Install Prompt */}
              {canInstall && (
                <div className="fixed bottom-4 right-4 z-50">
                  <button 
                    onClick={install}
                    className="px-4 py-2 bg-brand-purple text-white rounded-full shadow-lg text-sm font-bold flex items-center gap-2"
                  >
                    <Activity size={16} />
                    Install App
                  </button>
                </div>
              )}

              {/* Mobile Filter Drawer */}
              <AnimatePresence>
                {isFilterDrawerOpen && (
                  <>
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setIsFilterDrawerOpen(false)}
                      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
                    />
                    <motion.div 
                      initial={{ x: '100%' }}
                      animate={{ x: 0 }}
                      exit={{ x: '100%' }}
                      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                      className="fixed right-0 top-0 bottom-0 w-[85%] max-w-sm bg-surface z-[70] shadow-2xl overflow-y-auto"
                    >
                      <div className="flex items-center justify-between p-6 border-b border-border">
                        <h2 className="text-lg font-semibold">Filters</h2>
                        <button 
                          onClick={() => setIsFilterDrawerOpen(false)}
                          className="p-2 hover:bg-surface2 rounded-full transition-colors"
                        >
                          <Activity size={20} className="rotate-45" />
                        </button>
                      </div>
                      <FilterPanel 
                        filters={filters} 
                        setFilters={setFilters} 
                        isMobile 
                        onClose={() => setIsFilterDrawerOpen(false)}
                      />
                    </motion.div>
                  </>
                )}
              </AnimatePresence>

              <Routes>
                <Route path="/" element={<Home onOpenFilters={() => setIsFilterDrawerOpen(true)} />} />
                <Route path="/trial/:id" element={<TrialDetail />} />
                <Route path="/doctor" element={<DoctorPortal />} />
                <Route path="/saved" element={<SavedSearches />} />
              </Routes>
            </main>
          </div>
        </Router>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
