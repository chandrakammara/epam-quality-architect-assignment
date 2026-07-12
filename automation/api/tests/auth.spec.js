import { test, expect } from '@playwright/test';
import { environment, assertCredentialsAvailable, baseRequestOptions } from '../config/environment.js';
import { AuthService } from '../services/AuthService.js';
import { PartService } from '../services/PartService.js';

// Tier-1 scenario 1: Authentication / request context.
//
// Uses the base Playwright `test` (not utils/fixtures.js) deliberately:
// these cases exercise the raw authentication handshake itself
// (valid/invalid/missing credentials), so they need direct control over
// how each APIRequestContext is built rather than the pre-authenticated
// fixture every other spec relies on.
test.describe('Part API - authentication / request context', () => {
  test('valid Basic-auth credentials obtain an API token', async ({ playwright }) => {
    assertCredentialsAvailable();

    const token = await AuthService.fetchToken(playwright, environment);

    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(0);
  });

  test('an invalid Basic-auth password is rejected', async ({ playwright }) => {
    const context = await playwright.request.newContext(
      baseRequestOptions({
        Authorization: AuthService.basicAuthHeader(environment.username, 'not-the-real-password')
      })
    );

    try {
      const response = await context.get(AuthService.TOKEN_PATH);
      expect(response.status()).toBe(401);
    } finally {
      await context.dispose();
    }
  });

  test('a request with no credentials is rejected', async ({ playwright }) => {
    const context = await playwright.request.newContext(baseRequestOptions());

    try {
      const response = await context.get(PartService.BASE_PATH, { params: { limit: 1 } });
      expect(response.status()).toBe(401);
    } finally {
      await context.dispose();
    }
  });

  test('the issued token authenticates a protected Part request', async ({ playwright }) => {
    const token = await AuthService.fetchToken(playwright, environment);

    const context = await playwright.request.newContext(
      baseRequestOptions({ Authorization: `Token ${token}` })
    );

    try {
      const partService = new PartService(context);
      const response = await partService.list({ limit: 1 });
      expect(response.status()).toBe(200);
    } finally {
      await context.dispose();
    }
  });
});
