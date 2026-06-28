import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { DEFAULT_WEIGHTS, DEFAULT_THRESHOLDS, PRIORITIES } from '@/services/scoring'
import { PROVIDERS } from '@/services/llm'

const STORAGE_KEY = 'cv-matcher-settings'

const DEFAULT_VACANCY_PROMPT = `You are an expert HR analyst. Analyze the following job vacancy and extract a comprehensive list of requirements for the ideal candidate.

Return ONLY a valid JSON array. Each item must have:
- "id": a unique short string (e.g. "req_1", "req_2")  
- "text": the requirement in clear, concise language (in the same language as the vacancy)
- "priority": either "must", "should", or "nice"

Classify as "must" for hard requirements (education, certifications, mandatory skills), "should" for strongly preferred skills, and "nice" for bonus attributes.

Return nothing but the raw JSON array. No markdown, no explanation.`

const DEFAULT_CV_PROMPT = `You are an expert HR analyst. Analyze the candidate's CV and score each requirement from the job vacancy.

Requirements to score:
{{REQUIREMENTS}}

For each requirement, return a score and a reason:
- score 1: Clearly present in the CV — include a short reason (1–2 sentences, e.g. a direct quote or reference from the CV)
- score 0: Partially present or implied — include a short reason explaining what was found and what is missing
- score -1: Not found in the CV — include a short reason explaining why (e.g. what related evidence was looked for but not found)

Return ONLY a valid JSON object where keys are the requirement IDs and values are objects with a "score" field and a "reason" field.
Example: {"req_1": {"score": 1, "reason": "Candidate lists 5 years of experience with Python in their work history."}, "req_2": {"score": -1, "reason": "No mention of project management experience or certifications anywhere in the CV."}, "req_3": {"score": 0, "reason": "Mentions familiarity with Agile but no formal certification."}}

Return nothing but the raw JSON object in the language of the the vacancy. No markdown, no explanation.`

// Default settings per provider
const PROVIDER_DEFAULTS = {
  [PROVIDERS.OPENAI]: {
    apiKey: '',
    model: '',
    ollamaBaseUrl: '',
  },
  [PROVIDERS.OLLAMA]: {
    apiKey: '',
    model: '',
    ollamaBaseUrl: 'http://localhost:11434',
  },
  [PROVIDERS.ANTHROPIC]: {
    apiKey: '',
    model: '',
    ollamaBaseUrl: '',
  },
}

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    // ignore parse errors
  }
  return null
}

function saveToStorage(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    // ignore quota errors
  }
}

/**
 * Migrate legacy flat settings (single apiKey/model) to per-provider format.
 * Runs once on load when the stored data lacks a `providerSettings` key.
 */
function migrateStoredSettings(stored) {
  if (!stored || stored.providerSettings) return stored

  return {
    ...stored,
    providerSettings: {
      [PROVIDERS.OPENAI]:    { apiKey: stored.apiKey ?? '', model: stored.model ?? '', ollamaBaseUrl: '' },
      [PROVIDERS.OLLAMA]:    { apiKey: '', model: stored.model ?? '', ollamaBaseUrl: stored.ollamaBaseUrl ?? 'http://localhost:11434' },
      [PROVIDERS.ANTHROPIC]: { apiKey: '', model: '', ollamaBaseUrl: '' },
    },
  }
}

export const useSettingsStore = defineStore('settings', () => {
  const raw = loadFromStorage()
  const stored = migrateStoredSettings(raw)

  // Active provider
  const provider = ref(stored?.provider ?? PROVIDERS.OPENAI)

  // Per-provider settings: { [providerId]: { apiKey, model, ollamaBaseUrl } }
  const providerSettings = ref(
    Object.fromEntries(
      Object.values(PROVIDERS).map((p) => [
        p,
        {
          apiKey:        stored?.providerSettings?.[p]?.apiKey        ?? PROVIDER_DEFAULTS[p].apiKey,
          model:         stored?.providerSettings?.[p]?.model         ?? PROVIDER_DEFAULTS[p].model,
          ollamaBaseUrl: stored?.providerSettings?.[p]?.ollamaBaseUrl ?? PROVIDER_DEFAULTS[p].ollamaBaseUrl,
        },
      ]),
    ),
  )

  // Scoring weights
  const weights = ref({
    [PRIORITIES.MUST]:   stored?.weights?.[PRIORITIES.MUST]   ?? DEFAULT_WEIGHTS[PRIORITIES.MUST],
    [PRIORITIES.SHOULD]: stored?.weights?.[PRIORITIES.SHOULD] ?? DEFAULT_WEIGHTS[PRIORITIES.SHOULD],
    [PRIORITIES.NICE]:   stored?.weights?.[PRIORITIES.NICE]   ?? DEFAULT_WEIGHTS[PRIORITIES.NICE],
  })

  // Category thresholds (percentages)
  const thresholds = ref({
    excellent: stored?.thresholds?.excellent ?? DEFAULT_THRESHOLDS.excellent,
    good:      stored?.thresholds?.good      ?? DEFAULT_THRESHOLDS.good,
    fair:      stored?.thresholds?.fair      ?? DEFAULT_THRESHOLDS.fair,
  })

  // Prompts
  const vacancyPrompt = ref(stored?.vacancyPrompt ?? DEFAULT_VACANCY_PROMPT)
  const cvPrompt = ref(stored?.cvPrompt ?? DEFAULT_CV_PROMPT)

  // Convenience accessors for the active provider's settings
  function currentSettings() {
    return providerSettings.value[provider.value]
  }

  // Persist to localStorage on any change
  function persist() {
    saveToStorage({
      provider: provider.value,
      providerSettings: providerSettings.value,
      weights: weights.value,
      thresholds: thresholds.value,
      vacancyPrompt: vacancyPrompt.value,
      cvPrompt: cvPrompt.value,
    })
  }

  watch(
    [provider, providerSettings, weights, thresholds, vacancyPrompt, cvPrompt],
    persist,
    { deep: true },
  )

  function resetPrompts() {
    vacancyPrompt.value = DEFAULT_VACANCY_PROMPT
    cvPrompt.value = DEFAULT_CV_PROMPT
  }

  function resetThresholds() {
    thresholds.value = { ...DEFAULT_THRESHOLDS }
  }

  function resetWeights() {
    weights.value = { ...DEFAULT_WEIGHTS }
  }

  // Build provider settings object for llmChat() calls
  function getProviderSettings() {
    return { ...currentSettings() }
  }

  return {
    provider,
    providerSettings,
    weights,
    thresholds,
    vacancyPrompt,
    cvPrompt,
    currentSettings,
    resetPrompts,
    resetThresholds,
    resetWeights,
    getProviderSettings,
  }
})
