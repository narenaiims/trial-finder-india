/**
 * @file src/components/FilterPanel.tsx
 * @description Advanced filter UI component for TrialFinder India.
 */

import { RotateCcw, ChevronDown, Filter } from 'lucide-react';
import { FilterState } from '../types/trial';
import { DrugAutocomplete } from './DrugAutocomplete';
import { CANCER_TYPES, PHASES, STATES } from '../constants';

interface Props {
  filters: FilterState;
  setFilters: (filters: FilterState) => void;
  isMobile?: boolean;
  onClose?: () => void;
}

export const FilterPanel: React.FC<Props> = ({ filters, setFilters, isMobile, onClose }) => {
  const updateFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setFilters({ ...filters, [key]: value });
  };

  const resetFilters = () => {
    setFilters({
      query: '',
      is_free_only: false
    });
  };

  const activeFilterCount = Object.entries(filters).filter(([key, val]) => {
    if (key === 'is_free_only') return val === true;
    return !!val;
  }).length;

  const containerClasses = isMobile 
    ? "flex flex-col gap-6 p-6" 
    : "bg-surface2 border border-border rounded-2xl p-5 flex flex-col gap-6 h-fit sticky top-24";

  return (
    <div className={containerClasses}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Filter size={16} className="text-brand-accent" />
          Advanced Filters
          {activeFilterCount > 0 && (
            <span className="bg-brand-accent text-surface text-[10px] px-1.5 py-0.5 rounded-full font-bold">
              {activeFilterCount}
            </span>
          )}
        </h3>
        <button 
          onClick={resetFilters}
          className="text-[10px] text-text-secondary hover:text-brand-accent flex items-center gap-1 transition-colors"
        >
          <RotateCcw size={12} />
          Reset
        </button>
      </div>

      {/* Cancer Type (Hidden on desktop sidebar if we have tabs, but good for mobile) */}
      <div className={isMobile ? "block" : "lg:hidden"}>
        <label className="text-xs text-text-secondary mb-3 block">Cancer Type</label>
        <div className="flex flex-wrap gap-2">
          {CANCER_TYPES.map(type => (
            <button
              key={type}
              onClick={() => updateFilter('cancer_type', filters.cancer_type === type ? undefined : type)}
              className={`px-3 py-1.5 rounded-full text-[11px] font-medium transition-all border ${
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

      {/* Phase Select */}
      <div>
        <label className="text-xs text-text-secondary mb-2 block">Trial Phase</label>
        <div className="grid grid-cols-3 gap-2">
          {PHASES.map(phase => (
            <button
              key={phase}
              onClick={() => updateFilter('phase', filters.phase === phase ? undefined : phase)}
              className={`py-2 rounded-md text-[11px] font-medium transition-all border ${
                filters.phase === phase 
                  ? 'bg-brand-purple border-brand-purple text-white' 
                  : 'bg-surface border-border text-text-secondary hover:border-brand-purple'
              }`}
            >
              {phase}
            </button>
          ))}
        </div>
      </div>

      {/* State Select */}
      <div>
        <label className="text-xs text-text-secondary mb-2 block">Geographic State</label>
        <div className="relative">
          <select 
            value={filters.state || ''}
            onChange={(e) => updateFilter('state', e.target.value || undefined)}
            className="w-full bg-surface border border-border p-2 rounded-md text-sm appearance-none focus:outline-none focus:border-brand-accent"
          >
            <option value="">All India</option>
            {STATES.map(state => (
              <option key={state} value={state}>{state}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" size={14} />
        </div>
      </div>

      {/* Drug Autocomplete */}
      <div>
        <label className="text-xs text-text-secondary mb-2 block">Pharmaceutical Agent</label>
        <DrugAutocomplete 
          value={filters.drug_agent || ''} 
          onChange={(val) => updateFilter('drug_agent', val || undefined)} 
        />
      </div>

      {/* Cost Toggle */}
      <div className="flex items-center justify-between p-3 bg-surface border border-border rounded-xl">
        <div className="flex flex-col">
          <span className="text-xs font-semibold">Free Trials Only</span>
          <span className="text-[10px] text-text-secondary">Treatment/Investigation covered</span>
        </div>
        <button 
          onClick={() => updateFilter('is_free_only', !filters.is_free_only)}
          className={`w-10 h-5 rounded-full relative transition-colors ${
            filters.is_free_only ? 'bg-brand-green' : 'bg-border'
          }`}
        >
          <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${
            filters.is_free_only ? 'left-6' : 'left-1'
          }`} />
        </button>
      </div>

      {!isMobile && (
        <div className="mt-auto pt-4 border-t border-border font-mono text-[10px] text-text-secondary opacity-50 text-center uppercase tracking-widest">
          NCG-A Network
        </div>
      )}

      {isMobile && (
        <button 
          onClick={onClose}
          className="mt-4 w-full py-3 bg-brand-accent text-surface font-bold rounded-xl shadow-lg shadow-brand-accent/20"
        >
          Apply Filters
        </button>
      )}
    </div>
  );
};
