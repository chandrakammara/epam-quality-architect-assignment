import { test, expect } from '../utils/fixtures.js';
import { buildUniquePart, NON_EXISTENT_CATEGORY_ID } from '../data/partData.js';
import { expectFieldError } from '../utils/assertions.js';

// Tier-1 scenarios 7-8: required-field and relational-integrity
// validation. Per the Part schema (source-specifications/
// inventree-openapi.yaml.yaml), `name` is the only field an API client
// must supply, and `category` is a plain FK - DRF's PrimaryKeyRelatedField
// rejects an unknown id with a 400, not a 404 or a silent null.
test.describe('Part API - field validation', () => {
  test('POST /api/part/ rejects a payload with no name', async ({ partService }) => {
    const payload = buildUniquePart();
    delete payload.name;

    const response = await partService.create(payload);

    expect(response.status()).toBe(400);
    const body = await response.json();
    expectFieldError(body, 'name');
  });

  test('POST /api/part/ rejects a blank name', async ({ partService }) => {
    const payload = buildUniquePart({ name: '' });

    const response = await partService.create(payload);

    expect(response.status()).toBe(400);
    const body = await response.json();
    expectFieldError(body, 'name');
  });

  test('POST /api/part/ rejects a category id that does not exist', async ({
    partService
  }) => {
    const payload = buildUniquePart({ category: NON_EXISTENT_CATEGORY_ID });

    const response = await partService.create(payload);

    expect(response.status()).toBe(400);
    const body = await response.json();
    expectFieldError(body, 'category');
  });
});
