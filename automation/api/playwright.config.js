// @ts-check
import { defineConfig } from '@playwright/test';
import { environment } from './config/environment.js';

/**
 * Pure APIRequestContext suite - no browser projects needed.
 * @see https://playwright.dev/docs/api-testing
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  // 'list' gives fast console feedback while running; 'html' produces a
  // shareable report for debugging failures.
  reporter: [['list'], ['html', { open: 'never' }]],

  use: {
    // Resolved from config/environment.js, so services/tests use
    // relative paths like '/api/part/' instead of hardcoded hosts.
    // The Host header is required because the InvenTree reverse proxy
    // routes by virtual host - see config/environment.js for why.
    baseURL: environment.baseUrl,
    extraHTTPHeaders: { Host: environment.hostHeader }
  }
});
