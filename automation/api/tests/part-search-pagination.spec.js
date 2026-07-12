import { test, expect } from '../utils/fixtures.js';
import { buildUniquePart, buildUniqueSearchToken } from '../data/partData.js';
import { expectPaginatedShape } from '../utils/assertions.js';

// Tier-1 scenarios 9-10: search/filter and pagination.
//
// Each test creates its own uniquely-named part(s) rather than relying
// on pre-existing demo data, so assertions are exact and independent of
// whatever else is in the database (same isolation approach as
// automation/ui/data/parts.js).
test.describe('Part API - search, filter, pagination', () => {
  test('GET /api/part/?search= finds a part by its unique name', async ({ partService }) => {
    const token = buildUniqueSearchToken();
    const part = buildUniquePart({ name: `${token} Widget` });
    const createResponse = await partService.create(part);
    expect(createResponse.status()).toBe(201);
    const createdPart = await createResponse.json();

    const response = await partService.list({ search: token });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.count).toBe(1);
    expect(body.results[0].pk).toBe(createdPart.pk);
    expect(body.results[0].name).toBe(part.name);
  });

  test('GET /api/part/?active=false filters by the `active` attribute', async ({
    partService
  }) => {
    const token = buildUniqueSearchToken();
    const part = buildUniquePart({ name: `${token} Inactive Widget`, active: false });
    const createResponse = await partService.create(part);
    expect(createResponse.status()).toBe(201);

    const activeResults = await (
      await partService.list({ search: token, active: true })
    ).json();
    expect(activeResults.count).toBe(0);

    const inactiveResults = await (
      await partService.list({ search: token, active: false })
    ).json();
    expect(inactiveResults.count).toBe(1);
    expect(inactiveResults.results[0].name).toBe(part.name);
  });

  test('GET /api/part/ pagination - `limit` caps page size and exposes `next`', async ({
    partService
  }) => {
    const token = buildUniqueSearchToken();
    const parts = await Promise.all(
      [1, 2, 3].map((index) =>
        partService.create(buildUniquePart({ name: `${token} Item ${index}` }))
      )
    );
    parts.forEach((response) => expect(response.status()).toBe(201));

    const firstPageResponse = await partService.list({ search: token, limit: 2, offset: 0 });
    expect(firstPageResponse.status()).toBe(200);
    const firstPage = await firstPageResponse.json();

    expectPaginatedShape(firstPage);
    expect(firstPage.count).toBe(3);
    expect(firstPage.results.length).toBe(2);
    expect(firstPage.next).not.toBeNull();
    expect(firstPage.previous).toBeNull();

    const secondPageResponse = await partService.list({ search: token, limit: 2, offset: 2 });
    const secondPage = await secondPageResponse.json();

    expect(secondPage.results.length).toBe(1);
    expect(secondPage.next).toBeNull();
    expect(secondPage.previous).not.toBeNull();

    // No overlap between pages.
    const firstPageIds = firstPage.results.map((item) => item.pk);
    const secondPageIds = secondPage.results.map((item) => item.pk);
    expect(firstPageIds.some((id) => secondPageIds.includes(id))).toBe(false);
  });
});
