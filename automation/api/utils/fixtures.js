import { test as base, expect } from '@playwright/test';
import { environment, assertCredentialsAvailable, baseRequestOptions } from '../config/environment.js';
import { AuthService } from '../services/AuthService.js';
import { PartService } from '../services/PartService.js';
import { CategoryService } from '../services/CategoryService.js';

// Extends Playwright's base `test` with a ready-to-use, authenticated
// APIRequestContext plus the API service classes built on top of it.
// Specs that need authenticated access import `test`/`expect` from here
// instead of '@playwright/test' directly, so the auth handshake and
// service wiring live in exactly one place.
export const test = base.extend({
  // A fresh authenticated context per test keeps tests independent
  // (mirrors the UI suite's "no shared state across tests" approach).
  apiContext: async ({ playwright }, use) => {
    assertCredentialsAvailable();
    const token = await AuthService.fetchToken(playwright, environment);

    const context = await playwright.request.newContext({
      ...baseRequestOptions({
        Authorization: `Token ${token}`,
        Accept: 'application/json'
      })
    });

    await use(context);
    await context.dispose();
  },

  partService: async ({ apiContext }, use) => {
    await use(new PartService(apiContext));
  },

  categoryService: async ({ apiContext }, use) => {
    await use(new CategoryService(apiContext));
  }
});

export { expect };
