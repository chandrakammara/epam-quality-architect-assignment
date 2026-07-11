// Centralised environment configuration for the UI automation suite.
//
// Why this file exists: tests and page objects should never read
// `process.env` directly or hardcode secrets. Instead they import the
// `environment` object below, which is populated from a local `.env`
// file (for developer machines) or from real environment variables
// injected by the CI system.

import dotenv from 'dotenv';
import path from 'path';

// Load automation/ui/.env if present. In CI, the real env vars are
// usually already set, so a missing .env file here is not an error.
//
// Note: this intentionally avoids `import.meta.url` + `fileURLToPath`.
// Playwright's config loader transpiles this file to CommonJS before
// running it, and `import.meta` has no CommonJS equivalent, which is
// what caused "Cannot use 'import.meta' outside a module". Playwright
// always runs with the working directory set to this project's root
// (automation/ui), so the `.env` file can be located reliably from
// `process.cwd()` instead, which works the same under CommonJS or ESM.
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// InvenTree demo/local instance used when BASE_URL is not overridden.
const DEFAULT_BASE_URL = 'http://inventree.localhost';

export const environment = {
  baseUrl: process.env.BASE_URL || DEFAULT_BASE_URL,
  username: process.env.INVENTREE_USERNAME,
  password: process.env.INVENTREE_PASSWORD
};

/**
 * Fails fast with a clear, actionable error if credentials are missing,
 * instead of letting a login test fail later with a confusing
 * "cannot fill null value" style error.
 */
export function assertCredentialsAvailable() {
  if (!environment.username || !environment.password) {
    throw new Error(
      'Missing InvenTree credentials. Set INVENTREE_USERNAME and INVENTREE_PASSWORD ' +
        'as environment variables (see automation/ui/.env.example) before running login tests.'
    );
  }
}
