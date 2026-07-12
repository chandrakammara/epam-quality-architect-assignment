// Test data factory for InvenTree "Stock Item" create-form scenarios.
//
// Why this exists: generating unique data here (instead of inlining
// literals in the spec) means every test run creates a fresh, distinctly
// -identified stock item, so tests stay independent and repeatable and
// never collide with stock left over from previous runs or other
// parallel workers.
//
// Source note (corrected via live UI): InvenTree's own frontend source
// (forms/StockForms.tsx's `useStockFields`) defines `location` without a
// `required` flag - it is optional at both the form and API level (the
// backend even auto-assigns the part's own `default_location` when it is
// omitted - see stock/api.py). Live execution against a running InvenTree
// instance confirmed this: submitting "Add Stock Item" with only a
// `part` and `quantity` succeeds, and the part's own "In Stock" total
// updates correctly with no location selected. Because of this, `location`
// defaults to `undefined` below rather than a name that would need a
// stock location to already exist (this test suite creates no stock
// locations through the API, and none exist by default) - callers that
// specifically want to exercise a location-scoped stock item can still
// override it with a location name that already exists (or has been
// created via `PartStockPage`), keeping this factory backward-compatible.
//
// `batch`/`serial` are likewise left `undefined` by default: `serial` is
// only meaningful (and only enabled on the form) for trackable parts, and
// this suite's part-stock test deliberately creates a non-trackable part,
// so no default value is supplied for either field.

/**
 * Builds a unique, valid payload for the "Add Stock Item" form.
 *
 * Only `quantity` is required by `PartStockPage.createStock` - the rest
 * are optional fields included for completeness/extensibility, mirroring
 * `data/parts.js`'s inclusion of fields that aren't all exercised by
 * every test.
 *
 * @param {Partial<{
 *   quantity: number,
 *   location: string,
 *   batch: string,
 *   serial: string
 * }>} [overrides] - Optional field overrides, merged over the generated defaults.
 * @returns {{
 *   quantity: number,
 *   location: string | undefined,
 *   batch: string | undefined,
 *   serial: string | undefined
 * }}
 */
export function createUniqueStockData(overrides = {}) {
  // A random 1-100 quantity is always a valid positive value for the
  // "Stock Quantity" field, and keeps repeated calls within the same test
  // (e.g. two separate stock items for the same part) distinguishable.
  const quantity = Math.floor(Math.random() * 100) + 1;

  return {
    quantity,
    location: undefined,
    batch: undefined,
    serial: undefined,
    ...overrides
  };
}
