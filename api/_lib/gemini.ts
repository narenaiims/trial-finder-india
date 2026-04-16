/**
 * @file api/_lib/gemini.ts
 * @description Gemini SDK initialization for TrialFinder India.
 */

import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("GEMINI_API_KEY is not set in the environment.");
}

export const ai = new GoogleGenAI({ apiKey });

// Use the latest recommended flash model for cost-efficient processing
export const GEMINI_MODEL = "gemini-3-flash-preview";
