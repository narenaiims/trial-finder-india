/**
 * @file api/_lib/eligibilityParser.ts
 * @description AI-powered eligibility parsing using Gemini.
 */

import { Type } from "@google/genai";
import { ai, GEMINI_MODEL } from "./gemini.js";
import { EligibilityCriteria } from "../../src/types/trial.js";

/**
 * Parses raw eligibility text into structured JSON using Gemini.
 */
export async function parseEligibility(rawText: string, cancerType: string): Promise<EligibilityCriteria> {
  const prompt = `
You are a clinical trial eligibility expert specialising in Indian oncology practice.
Parse the following clinical trial eligibility criteria text and return structured JSON.

Cancer type context: ${cancerType}

RAW ELIGIBILITY TEXT:
${rawText}
`;

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        systemInstruction: "You are a clinical trial eligibility expert specialising in Indian oncology practice. Extract structured data from raw eligibility text. Return ONLY valid JSON.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            age_min: { type: Type.NUMBER, description: "Minimum age in years, null if not specified" },
            age_max: { type: Type.NUMBER, description: "Maximum age in years, null if not specified" },
            ecog_max: { type: Type.NUMBER, description: "Maximum ECOG score (0-4)" },
            inclusion: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Concise plain-English inclusion criteria" },
            exclusion: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Concise plain-English exclusion criteria" },
            biomarkers_required: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Required biomarkers (e.g. HER2+, PD-L1)" },
            india_specific_notes: { type: Type.ARRAY, items: { type: Type.STRING }, description: "TB exposure, HBsAg, prior Ayurvedic treatment etc." },
            key_red_flags: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Top 3 most restrictive criteria" }
          },
          required: ["inclusion", "exclusion", "biomarkers_required", "india_specific_notes", "key_red_flags"]
        }
      }
    });

    const result = JSON.parse(response.text || "{}");
    
    return {
      age_min: result.age_min ?? null,
      age_max: result.age_max ?? null,
      ecog_max: result.ecog_max ?? null,
      inclusion: result.inclusion || [],
      exclusion: result.exclusion || [],
      biomarkers_required: result.biomarkers_required || [],
      india_specific_notes: result.india_specific_notes || [],
      key_red_flags: result.key_red_flags || [],
      raw_text: rawText
    };
  } catch (error) {
    console.error("Eligibility Parsing Error:", error);
    // Return safe defaults
    return {
      age_min: null,
      age_max: null,
      ecog_max: null,
      inclusion: [],
      exclusion: [],
      biomarkers_required: [],
      india_specific_notes: [],
      key_red_flags: [],
      raw_text: rawText
    };
  }
}
