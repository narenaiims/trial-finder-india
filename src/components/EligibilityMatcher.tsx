/**
 * @file src/components/EligibilityMatcher.tsx
 * @description Client-side eligibility screening component for TrialFinder India.
 */

import React, { useState } from 'react';
import { CheckCircle2, AlertCircle, XCircle, Info, Activity } from 'lucide-react';
import { EligibilityCriteria } from '../types/trial';

interface MatcherProps {
  criteria: EligibilityCriteria;
}

interface MatchResult {
  status: 'eligible' | 'possible' | 'ineligible';
  reasons: string[];
}

export const EligibilityMatcher: React.FC<MatcherProps> = ({ criteria }) => {
  const [patientData, setPatientData] = useState({
    age: '',
    ecog: '0',
    biomarkers: ''
  });
  const [result, setResult] = useState<MatchResult | null>(null);

  const checkEligibility = () => {
    const reasons: string[] = [];
    let status: 'eligible' | 'possible' | 'ineligible' = 'eligible';

    const age = parseInt(patientData.age);
    const ecog = parseInt(patientData.ecog);

    // 1. Age Check
    if (criteria.age_min && age < criteria.age_min) {
      status = 'ineligible';
      reasons.push(`Minimum age required is ${criteria.age_min} years.`);
    }
    if (criteria.age_max && age > criteria.age_max) {
      status = 'ineligible';
      reasons.push(`Maximum age allowed is ${criteria.age_max} years.`);
    }

    // 2. ECOG Check
    if (criteria.ecog_max !== null && ecog > criteria.ecog_max) {
      status = 'ineligible';
      reasons.push(`Maximum ECOG score allowed is ${criteria.ecog_max}. Your score is ${ecog}.`);
    }

    // 3. Biomarker Check
    if (criteria.biomarkers_required.length > 0) {
      const patientBiomarkers = patientData.biomarkers.toLowerCase();
      const missing = criteria.biomarkers_required.filter(b => !patientBiomarkers.includes(b.toLowerCase()));
      if (missing.length > 0) {
        status = 'possible';
        reasons.push(`Trial requires biomarkers: ${missing.join(', ')}. Please confirm with your reports.`);
      }
    }

    setResult({ status, reasons });
  };

  return (
    <div className="bg-surface2 border border-border rounded-2xl p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Activity size={20} className="text-brand-accent" />
        Quick Eligibility Check
      </h3>

      <div className="space-y-4 mb-6">
        <div>
          <label className="text-xs text-text-secondary mb-2 block">Your Age</label>
          <input 
            type="number" 
            value={patientData.age}
            onChange={(e) => setPatientData({ ...patientData, age: e.target.value })}
            className="w-full bg-surface border border-border p-2 rounded-md text-sm"
            placeholder="Enter age..."
          />
        </div>

        <div>
          <label className="text-xs text-text-secondary mb-2 block">ECOG Performance Status</label>
          <select 
            value={patientData.ecog}
            onChange={(e) => setPatientData({ ...patientData, ecog: e.target.value })}
            className="w-full bg-surface border border-border p-2 rounded-md text-sm"
          >
            <option value="0">0 - Fully active</option>
            <option value="1">1 - Restricted in physically strenuous activity</option>
            <option value="2">2 - Ambulatory and capable of all self-care</option>
            <option value="3">3 - Capable of only limited self-care</option>
            <option value="4">4 - Completely disabled</option>
          </select>
        </div>

        <div>
          <label className="text-xs text-text-secondary mb-2 block">Known Biomarkers (Optional)</label>
          <input 
            type="text" 
            value={patientData.biomarkers}
            onChange={(e) => setPatientData({ ...patientData, biomarkers: e.target.value })}
            className="w-full bg-surface border border-border p-2 rounded-md text-sm"
            placeholder="e.g. HER2+, BRCA1..."
          />
        </div>

        <button 
          onClick={checkEligibility}
          className="w-full py-3 bg-brand-accent text-surface font-bold rounded-xl hover:bg-opacity-90 transition-all"
        >
          Check My Eligibility
        </button>
      </div>

      {result && (
        <div className={`p-4 rounded-xl border ${
          result.status === 'eligible' ? 'bg-brand-green/10 border-brand-green/30 text-brand-green' :
          result.status === 'possible' ? 'bg-brand-purple/10 border-brand-purple/30 text-brand-purple' :
          'bg-red-500/10 border-red-500/30 text-red-400'
        }`}>
          <div className="flex items-center gap-2 font-semibold mb-2">
            {result.status === 'eligible' && <CheckCircle2 size={18} />}
            {result.status === 'possible' && <AlertCircle size={18} />}
            {result.status === 'ineligible' && <XCircle size={18} />}
            {result.status === 'eligible' ? 'Likely Eligible' : 
             result.status === 'possible' ? 'Possibly Eligible' : 'Not Eligible'}
          </div>
          
          {result.reasons.length > 0 && (
            <ul className="text-xs space-y-1 list-disc pl-4 opacity-90">
              {result.reasons.map((r, i) => <li key={i}>{r}</li>)}
            </ul>
          )}
          
          {result.status === 'possible' && (
            <p className="text-[10px] mt-2 italic flex items-center gap-1">
              <Info size={10} />
              Check your medical reports for the biomarkers mentioned above.
            </p>
          )}
        </div>
      )}

      <div className="mt-6 p-3 bg-surface border border-border rounded-lg text-[10px] text-text-secondary flex gap-2">
        <Info size={14} className="shrink-0" />
        <p>Disclaimer: This is a guide only based on AI-parsed criteria. Final eligibility must be confirmed by the clinical trial site team at the hospital.</p>
      </div>
    </div>
  );
};
