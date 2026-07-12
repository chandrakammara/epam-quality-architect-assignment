// @ts-check
import { defineConfig, devices } from '@playwright/test';
import { environment } from './config/environment.js';

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  // 'list' gives fast console feedback while running; 'html' produces a
  // shareable report with traces/screenshots for debugging failures.
  reporter: [['list'], ['html', { open: 'never' }]],

  use: {
    // Resolved from config/environment.js, so tests can use relative
    // paths like page.goto('/web/login') instead of hardcoded hosts.
    baseURL: environment.baseUrl,

    // Capture failure artifacts only, to keep local/CI runs fast and light.
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure'
  },

  // Chromium only for this initial login foundation. Additional browser
  // projects (firefox/webkit) can be added once the core suite is stable.
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ]
});
