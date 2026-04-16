/**
 * @file api/_lib/scraper.ts
 * @description Shared scraping utilities for TrialFinder India.
 */

import fetch, { RequestInit, Response } from 'node-fetch';

/**
 * Fetch with exponential backoff retry logic.
 */
export async function fetchWithRetry(url: string, options: RequestInit = {}, maxRetries = 3): Promise<Response> {
  let retries = 0;
  while (retries < maxRetries) {
    try {
      const response = await fetch(url, options);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return response;
    } catch (error) {
      retries++;
      if (retries === maxRetries) throw error;
      const delay = Math.pow(2, retries) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

/**
 * Normalise Indian phone numbers to +91-XX-XXXX-XXXX.
 */
export function parseIndianPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10) return `+91-${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6)}`;
  if (digits.length === 12 && digits.startsWith('91')) return `+91-${digits.slice(2, 4)}-${digits.slice(4, 8)}-${digits.slice(8)}`;
  return raw;
}

/**
 * Map common hospital cities to Indian states.
 */
const cityToStateMap: Record<string, string> = {
  'Mumbai': 'Maharashtra',
  'Navi Mumbai': 'Maharashtra',
  'Pune': 'Maharashtra',
  'Delhi': 'Delhi NCR',
  'New Delhi': 'Delhi NCR',
  'Bangalore': 'Karnataka',
  'Bengaluru': 'Karnataka',
  'Chennai': 'Tamil Nadu',
  'Vellore': 'Tamil Nadu',
  'Kolkata': 'West Bengal',
  'Hyderabad': 'Telangana',
  'Chandigarh': 'Chandigarh',
  'Lucknow': 'Uttar Pradesh',
  'Ahmedabad': 'Gujarat',
  'Jaipur': 'Rajasthan',
  'Thiruvananthapuram': 'Kerala',
  'Kochi': 'Kerala',
};

export function parseIndianState(cityOrState: string): string {
  const trimmed = cityOrState.trim();
  if (cityToStateMap[trimmed]) return cityToStateMap[trimmed];
  // Check if it's already a state
  const states = [
    'Maharashtra', 'Karnataka', 'Tamil Nadu', 'Delhi NCR', 'West Bengal', 
    'Telangana', 'Gujarat', 'Uttar Pradesh', 'Rajasthan', 'Kerala', 
    'Punjab', 'Haryana', 'Odisha', 'Bihar', 'Madhya Pradesh'
  ];
  const found = states.find(s => s.toLowerCase() === trimmed.toLowerCase());
  return found || trimmed;
}

/**
 * Extract ECOG Performance Status from text.
 */
export function extractECOGFromText(text: string): number | null {
  const ecogRegex = /ECOG\s*(?:PS|Performance Status)?\s*(?:of)?\s*(\d)(?:\s*-\s*(\d))?/i;
  const match = text.match(ecogRegex);
  if (match) {
    // If range like 0-2, return the max (2)
    return match[2] ? parseInt(match[2]) : parseInt(match[1]);
  }
  return null;
}

/**
 * Detect if a trial is free of cost based on text analysis.
 */
export function detectFreeTrial(text: string): boolean {
  const freePhrases = [
    'free of cost',
    'no charge',
    'provided free',
    'at no cost to participant',
    'investigational drug provided free',
    'all investigations covered',
    'travel allowance available'
  ];
  const lowerText = text.toLowerCase();
  return freePhrases.some(phrase => lowerText.includes(phrase));
}
