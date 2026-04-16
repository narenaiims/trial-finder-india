/**
 * @file src/components/DrugAutocomplete.tsx
 * @description Drug agent autocomplete component for TrialFinder India.
 */

import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { getDistinctDrugs } from '../api/search';

const COMMON_DRUGS = [
  'Pembrolizumab', 'Nivolumab', 'Bevacizumab', 'Trastuzumab', 'Capecitabine', 
  'Gemcitabine', 'Docetaxel', 'Paclitaxel', 'Carboplatin', 'Cisplatin', 
  'Oxaliplatin', 'Imatinib', 'Sorafenib', 'Lenvatinib', 'Olaparib', 
  'Niraparib', 'Nimotuzumab', 'Pertuzumab', 'Cetuximab'
];

interface Props {
  value: string;
  onChange: (value: string) => void;
}

export const DrugAutocomplete: React.FC<Props> = ({ value, onChange }) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [allDrugs, setAllDrugs] = useState<string[]>(COMMON_DRUGS);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadDrugs = async () => {
      const dbDrugs = await getDistinctDrugs();
      if (dbDrugs.length > 0) {
        setAllDrugs(Array.from(new Set([...COMMON_DRUGS, ...dbDrugs])));
      }
    };
    loadDrugs();
  }, []);

  useEffect(() => {
    if (value.length >= 2) {
      const filtered = allDrugs.filter(d => 
        d.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 8);
      setSuggestions(filtered);
      setIsOpen(filtered.length > 0);
    } else {
      setSuggestions([]);
      setIsOpen(false);
    }
  }, [value, allDrugs]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => value.length >= 2 && setIsOpen(true)}
          placeholder="e.g. Pembrolizumab"
          className="w-full bg-surface border border-border p-2 rounded-md text-sm pr-8"
        />
        {value && (
          <button 
            onClick={() => onChange('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-text-secondary hover:text-white"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-surface2 border border-border rounded-lg shadow-xl overflow-hidden">
          {suggestions.map((drug) => (
            <button
              key={drug}
              onClick={() => {
                onChange(drug);
                setIsOpen(false);
              }}
              className="w-full text-left px-4 py-2 text-sm hover:bg-brand-accent/10 hover:text-brand-accent transition-colors"
            >
              {drug}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
