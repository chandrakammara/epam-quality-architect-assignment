// Test data factory for InvenTree "Part Category" create-form scenarios.
//
// Why this exists: generating unique data here (instead of inlining
// literals in the spec) means every test run creates freshly, distinctly
// named categories, so tests stay independent, repeatable, and never
// collide with categories left over from previous runs, other parallel
// workers, or with each other - a root category and its child category
// created in the same test each get their own unique suffix.

/**
 * Builds a unique, valid payload for the "New Part Category" form.
 *
 * Only `name` and `description` are used by `CategoryPage` today; other
 * fields on the real form (parent, default_location, structural, icon,
 * etc.) are either left at their defaults or, in the case of `parent`,
 * set implicitly by `CategoryPage.createChildCategory` via navigation
 * rather than through this factory.
 *
 * @param {Partial<{ name: string, description: string }>} [overrides] - Optional field overrides, merged over the generated defaults.
 * @returns {{ name: string, description: string }}
 */
export function createUniqueCategoryData(overrides = {}) {
  // Combining a timestamp with a random suffix keeps names unique even
  // across parallel workers/runs, and across multiple calls within the
  // same test (e.g. one for a root category, another for its child),
  // without needing a shared counter.
  const uniqueSuffix = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;

  return {
    name: `Automation Category ${uniqueSuffix}`,
    description: 'Category created by Playwright UI automation.',
    ...overrides
  };
}
