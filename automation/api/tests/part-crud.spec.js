import { test, expect } from '../utils/fixtures.js';
import { buildUniquePart } from '../data/partData.js';
import { expectPaginatedShape } from '../utils/assertions.js';

// Tier-1 scenarios 2-6: GET list, POST create, GET created, PATCH
// update, DELETE inactive Part. Run as a serial lifecycle (shared
// `createdPartId`) so each step verifies the real outcome of the
// previous one, the same way a manual API CRUD walkthrough would.
test.describe.serial('Part API - CRUD lifecycle', () => {
  let createdPartId;
  let originalPartData;

  test('GET /api/part/ returns a paginated list of parts', async ({ partService }) => {
    const response = await partService.list({ limit: 5 });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expectPaginatedShape(body);
  });

  test('POST /api/part/ creates a new part with only the required field populated', async ({
    partService
  }) => {
    originalPartData = buildUniquePart();

    const response = await partService.create(originalPartData);

    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body).toHaveProperty('pk');
    expect(body.name).toBe(originalPartData.name);
    expect(body.IPN).toBe(originalPartData.IPN);
    expect(body.description).toBe(originalPartData.description);
    // Business rule: `active` defaults true unless explicitly set.
    expect(body.active).toBe(true);

    createdPartId = body.pk;
  });

  test('GET /api/part/{id}/ retrieves the part just created', async ({ partService }) => {
    const response = await partService.getById(createdPartId);

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.pk).toBe(createdPartId);
    expect(body.name).toBe(originalPartData.name);
    expect(body.IPN).toBe(originalPartData.IPN);
  });

  test('PATCH /api/part/{id}/ updates only the targeted field', async ({ partService }) => {
    const updatedDescription = 'Updated by Playwright API automation.';

    const response = await partService.update(createdPartId, {
      description: updatedDescription
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.description).toBe(updatedDescription);
    // Fields not sent in the PATCH body must remain untouched.
    expect(body.name).toBe(originalPartData.name);
    expect(body.IPN).toBe(originalPartData.IPN);
  });

  test('DELETE /api/part/{id}/ removes the part once it is inactive', async ({
    partService
  }) => {
    // Business rule (part/models.py:581-599): deletion is blocked while
    // a part is `active`, so it must be deactivated first.
    const deactivateResponse = await partService.update(createdPartId, { active: false });
    expect(deactivateResponse.status()).toBe(200);
    expect((await deactivateResponse.json()).active).toBe(false);

    const deleteResponse = await partService.remove(createdPartId);
    expect(deleteResponse.status()).toBe(204);

    const getAfterDelete = await partService.getById(createdPartId);
    expect(getAfterDelete.status()).toBe(404);
  });
});
