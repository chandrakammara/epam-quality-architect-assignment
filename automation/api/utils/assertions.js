import { expect } from '@playwright/test';

// Shared assertion helpers, kept here so every spec asserts business
// rules and response shapes the same way instead of re-deriving them.

/**
 * Confirms a response body matches the shared DRF LimitOffsetPagination
 * shape (`PaginatedPartList` / `PaginatedCategoryList` in the schema):
 * `count`, `next`, `previous`, `results[]`.
 */
export function expectPaginatedShape(body) {
  expect(body).toHaveProperty('count');
  expect(body).toHaveProperty('next');
  expect(body).toHaveProperty('previous');
  expect(Array.isArray(body.results)).toBe(true);
  expect(body.count).toBeGreaterThanOrEqual(body.results.length);
}

/** Confirms a DRF validation-error body flags the given field with a non-empty message list. */
export function expectFieldError(body, fieldName) {
  expect(body).toHaveProperty(fieldName);
  expect(Array.isArray(body[fieldName])).toBe(true);
  expect(body[fieldName].length).toBeGreaterThan(0);
}
