// Test data factory for InvenTree "Part" create-form scenarios.
//
// Why this exists: generating unique data here (instead of inlining
// literals in the spec) means every test run creates a fresh,
// distinctly-named part, so tests stay independent, repeatable, and
// never collide with parts left over from previous runs or other
// parallel workers.

/**
 * Builds a unique, valid payload for the "Create Part" form.
 *
 * Only `name`, `ipn` and `description` are used by `PartsPage.createPart`
 * today; the boolean attributes are included for completeness/interview
 * readability and mirror InvenTree's own Part model defaults, so callers
 * have valid values ready if the form interaction is extended later.
 *
 * @param {Partial<{
 *   name: string,
 *   ipn: string,
 *   description: string,
 *   active: boolean,
 *   purchaseable: boolean,
 *   component: boolean,
 *   assembly: boolean
 * }>} [overrides] - Optional field overrides, merged over the generated defaults.
 * @returns {{
 *   name: string,
 *   ipn: string,
 *   description: string,
 *   active: boolean,
 *   purchaseable: boolean,
 *   component: boolean,
 *   assembly: boolean
 * }}
 */
export function createUniquePartData(overrides = {}) {
  // Combining a timestamp with a random suffix keeps names unique even
  // across parallel workers/runs without needing a shared counter.
  const uniqueSuffix = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;

  return {
    name: `Automation Part ${uniqueSuffix}`,
    ipn: `AUTO-${uniqueSuffix}`,
    description: 'Part created by Playwright UI automation.',
    active: true,
    purchaseable: true,
    component: true,
    assembly: false,
    ...overrides
  };
}
