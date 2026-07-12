// Test data factory for the Part API.
//
// Why this exists: generating unique data here (instead of inlining
// literals in specs) means every test run creates a fresh, distinctly
// named part, so tests stay independent/repeatable and never collide
// with parts left over from previous runs or parallel workers - same
// rationale as automation/ui/data/parts.js.
//
// Only fields present in the `Part` schema
// (source-specifications/inventree-openapi.yaml.yaml) are used; no
// payload fields are invented.

/**
 * Builds a unique, valid payload for `POST /api/part/`.
 * @param {Partial<{ name: string, description: string, IPN: string, active: boolean, category: number|null }>} [overrides]
 */
export function buildUniquePart(overrides = {}) {
  const uniqueSuffix = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;

  return {
    name: `API Automation Part ${uniqueSuffix}`,
    description: 'Part created by Playwright API automation.',
    IPN: `API-AUTO-${uniqueSuffix}`,
    active: true,
    ...overrides
  };
}

/** A search token unique enough to isolate a test run's own data from pre-existing demo data. */
export function buildUniqueSearchToken() {
  return `ApiProbe${Date.now()}${Math.floor(Math.random() * 100000)}`;
}

/** A category id guaranteed not to exist, for negative FK-validation tests. */
export const NON_EXISTENT_CATEGORY_ID = 999999999;
