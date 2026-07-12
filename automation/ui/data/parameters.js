// Test data factory for InvenTree "Part Parameter" create-form scenarios.
//
// Why this exists: generating unique data here (instead of inlining
// literals in the spec) means every test run exercises a fresh, distinctly
// named parameter *template* as well as a fresh parameter value, so tests
// stay independent and repeatable and never collide with parameters (or
// their templates) left over from previous runs or other parallel workers.
//
// InvenTree parameters are always backed by a global `PartParameterTemplate`
// (the "Template" field on the "Add Parameter" form) - a Part can't have an
// ad-hoc, template-less parameter. Because that template is a shared,
// global object (visible to every part), this factory gives it its own
// unique name too, so the "create a template on the fly" flow driven by
// `PartParametersPage.addParameter()` never collides with a template left
// behind by an earlier run.

/**
 * Builds a unique, valid payload for the "Add Parameter" form (and, since
 * one is required, the global Parameter Template it depends on).
 *
 * `PartParametersPage.addParameter` uses `name`/`templateDescription`/`units`
 * to create the backing template inline (via the form's own "Create New
 * Parameter Template" action), and `value`/`note` to fill in the parameter
 * itself. `verifyParameterAdded` re-uses the same `name`/`units` to confirm
 * the parameter renders correctly.
 *
 * @param {Partial<{
 *   name: string,
 *   templateDescription: string,
 *   units: string,
 *   value: string,
 *   note: string
 * }>} [overrides] - Optional field overrides, merged over the generated defaults.
 * @returns {{
 *   name: string,
 *   templateDescription: string,
 *   units: string,
 *   value: string,
 *   note: string
 * }}
 */
export function createUniqueParameterData(overrides = {}) {
  // Combining a timestamp with a random suffix keeps names unique even
  // across parallel workers/runs without needing a shared counter.
  const uniqueSuffix = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;

  return {
    name: `Automation Parameter ${uniqueSuffix}`,
    templateDescription: 'Parameter template created by Playwright UI automation.',
    units: 'mm',
    value: `${Math.floor(Math.random() * 1000)}`,
    note: 'Parameter created by Playwright UI automation.',
    ...overrides
  };
}
