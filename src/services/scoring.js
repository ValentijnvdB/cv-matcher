// Scoring service - calculates match scores and categories from CV analysis results

export const PRIORITIES = {
  MUST: 'must',
  SHOULD: 'should',
  NICE: 'nice',
}

export const CATEGORIES = {
  EXCELLENT: 'excellent',
  GOOD: 'good',
  FAIR: 'fair',
  NONE: 'none',
}

// Default weights per priority
export const DEFAULT_WEIGHTS = {
  [PRIORITIES.MUST]: 3,
  [PRIORITIES.SHOULD]: 2,
  [PRIORITIES.NICE]: 1,
}

// Default category thresholds (percentage of max possible score)
export const DEFAULT_THRESHOLDS = {
  excellent: 75, // >= 75%
  good: 50,      // >= 50% and < 75%
  fair: 10,      // >= 10% and < 50%
  // below 10% = none
}

/**
 * Calculate the maximum possible weighted score for a set of requirements.
 * Max score = sum of (weight * 1) for each requirement (score 1 = fully present)
 *
 * @param {Array} requirements
 * @param {object} weights
 * @returns {number}
 */
export function calculateMaxScore(requirements, weights = DEFAULT_WEIGHTS) {
  return requirements.reduce((total, req) => {
    const weight = weights[req.priority] ?? 1
    return total + weight * 1
  }, 0)
}

/**
 * Calculate the actual weighted score for a CV's analysis results.
 * Scores per requirement: 1 (present), 0 (partial), -1 (absent)
 *
 * @param {Array} requirements
 * @param {object} scores - { [requirementId]: -1 | 0 | 1 }
 * @param {object} weights
 * @returns {number}
 */
export function calculateActualScore(requirements, scores, weights = DEFAULT_WEIGHTS) {
  return requirements.reduce((total, req) => {
    const weight = weights[req.priority] ?? 1
    const score = scores[req.id] ?? -1
    return total + weight * score
  }, 0)
}

/**
 * Calculate the match percentage relative to the maximum possible score.
 * Clamped to 0–100.
 *
 * @param {number} actual
 * @param {number} max
 * @returns {number} - percentage 0–100
 */
export function calculatePercentage(actual, max) {
  if (max <= 0) return 0
  const raw = (actual / max) * 100
  return Math.max(0, Math.min(100, raw))
}

/**
 * Determine the match category based on percentage and configured thresholds.
 *
 * @param {number} percentage
 * @param {object} thresholds
 * @returns {string} - one of CATEGORIES values
 */
export function determineCategory(percentage, thresholds = DEFAULT_THRESHOLDS) {
  if (percentage >= thresholds.excellent) return CATEGORIES.EXCELLENT
  if (percentage >= thresholds.good) return CATEGORIES.GOOD
  if (percentage >= thresholds.fair) return CATEGORIES.FAIR
  return CATEGORIES.NONE
}

/**
 * Calculate summary counts per priority for a CV.
 *
 * @param {Array} requirements
 * @param {object} scores - { [requirementId]: -1 | 0 | 1 }
 * @returns {{ must: { found: number, total: number }, should: { found: number, total: number }, nice: { found: number, total: number } }}
 */
export function calculateSummary(requirements, scores) {
  const summary = {
    [PRIORITIES.MUST]:   { found: 0, total: 0 },
    [PRIORITIES.SHOULD]: { found: 0, total: 0 },
    [PRIORITIES.NICE]:   { found: 0, total: 0 },
  }

  for (const req of requirements) {
    const priority = req.priority
    if (!summary[priority]) continue
    summary[priority].total++
    const score = scores[req.id] ?? -1
    // score 1 = fully found (1 point), score 0 = partially found (0.5 points), score -1 = absent
    if (score === 1) {
      summary[priority].found += 1
    } else if (score === 0) {
      summary[priority].found += 0.5
    }
  }

  return summary
}

/**
 * Full score evaluation for a CV against a set of requirements.
 *
 * @param {Array} requirements
 * @param {object} scores
 * @param {object} weights
 * @param {object} thresholds
 * @returns {{ actual: number, max: number, percentage: number, category: string, summary: object }}
 */
export function evaluateCv(requirements, scores, weights = DEFAULT_WEIGHTS, thresholds = DEFAULT_THRESHOLDS) {
  const actual = calculateActualScore(requirements, scores, weights)
  const max = calculateMaxScore(requirements, weights)
  const percentage = calculatePercentage(actual, max)
  const category = determineCategory(percentage, thresholds)
  const summary = calculateSummary(requirements, scores)

  return { actual, max, percentage, category, summary }
}

/**
 * Produce a stable hash string from a requirements array.
 * Used to detect when stored CV analyses are out of date.
 * The hash covers each requirement's id, text, and priority — in sorted order
 * so that reordering without content changes does not invalidate analyses.
 *
 * @param {Array} requirements
 * @returns {string}
 */
export function hashRequirements(requirements) {
  const normalized = [...requirements]
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((r) => `${r.id}|${r.text}|${r.priority}`)
    .join('\n')
  // Simple but collision-resistant djb2-style hash
  let h = 5381
  for (let i = 0; i < normalized.length; i++) {
    h = ((h << 5) + h) ^ normalized.charCodeAt(i)
    h = h >>> 0 // keep 32-bit unsigned
  }
  return h.toString(36)
}


export const CATEGORY_LABELS = {
  [CATEGORIES.EXCELLENT]: 'Excellent match',
  [CATEGORIES.GOOD]:      'Good match',
  [CATEGORIES.FAIR]:      'Fair match',
  [CATEGORIES.NONE]:      'No match',
}

/**
 * Map category key to badge letter(s).
 */
export const CATEGORY_LETTERS = {
  [CATEGORIES.EXCELLENT]: 'E',
  [CATEGORIES.GOOD]:      'G',
  [CATEGORIES.FAIR]:      'F',
  [CATEGORIES.NONE]:      'N',
}

/**
 * Map category key to Tailwind CSS class for badge background.
 */
export const CATEGORY_CSS = {
  [CATEGORIES.EXCELLENT]: 'category-excellent',
  [CATEGORIES.GOOD]:      'category-good',
  [CATEGORIES.FAIR]:      'category-fair',
  [CATEGORIES.NONE]:      'category-none',
}

/**
 * Category sort order (for "Match dalend").
 */
export const CATEGORY_ORDER = {
  [CATEGORIES.EXCELLENT]: 0,
  [CATEGORIES.GOOD]:      1,
  [CATEGORIES.FAIR]:      2,
  [CATEGORIES.NONE]:      3,
}
