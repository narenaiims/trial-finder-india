/**
 * @file api/_lib/summaryGenerator.ts
 * @description Generates patient-friendly summaries in English and Hindi.
 */

import { ai, GEMINI_MODEL } from "./gemini.js";
import { Trial, LocalisedSummary } from "../../src/types/trial.js";

/**
 * Generates English and Hindi summaries for a trial.
 */
export async function generateSummaries(trial: Trial): Promise<LocalisedSummary> {
  const is_free = trial.ncg_network ? "Yes (NCG Network)" : "Check with site";
  const drugs = trial.title.match(/[A-Z][a-z]+(?:mab|nib|lib|mib|taxel|platin)/g)?.join(", ") || "Investigational agents";

  const englishPrompt = `
You are a compassionate oncology nurse explaining a clinical trial to an Indian patient in simple English.
Write a 3-sentence summary of this trial that covers:
1. What the trial is testing and why it might help
2. Who is eligible (in plain terms, not medical jargon)
3. What the patient would need to do and whether it is free

Trial title: ${trial.title}
Phase: ${trial.phase}
Drugs: ${drugs}
Key eligibility: ${trial.eligibility?.inclusion?.slice(0, 3).join(", ") || "Standard oncology criteria"}
Is free: ${is_free}

Write ONLY the 3 sentences, no headings, no markdown.
`;

  const hindiPrompt = `
You are a compassionate oncology nurse explaining a clinical trial to an Indian patient in simple Hindi.
Write a 3-sentence summary of this trial that covers:
1. What the trial is testing and why it might help
2. Who is eligible (in plain terms, not medical jargon)
3. What the patient would need to do and whether it is free

Trial title: ${trial.title}
Phase: ${trial.phase}
Drugs: ${drugs}
Key eligibility: ${trial.eligibility?.inclusion?.slice(0, 3).join(", ") || "Standard oncology criteria"}
Is free: ${is_free}

Respond entirely in simple Hindi (Devanagari script). Use language a patient in a government hospital in UP or Bihar would understand.
Write ONLY the 3 sentences, no headings, no markdown.
`;

  try {
    const [enResponse, hiResponse] = await Promise.all([
      ai.models.generateContent({ model: GEMINI_MODEL, contents: englishPrompt }),
      ai.models.generateContent({ model: GEMINI_MODEL, contents: hindiPrompt })
    ]);

    return {
      en: enResponse.text?.trim() || "",
      hi: hiResponse.text?.trim() || ""
    };
  } catch (error) {
    console.error("Summary Generation Error:", error);
    return {
      en: trial.title,
      hi: ""
    };
  }
}
