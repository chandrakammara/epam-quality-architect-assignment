// Centralised environment configuration for the API automation suite.
//
// Mirrors automation/ui/config/environment.js: tests and service classes
// never read `process.env` directly or hardcode secrets/hosts. They import
// the `environment` object below, populated from a local `.env` file (for
// developer machines) or from real environment variables injected by CI.

import dotenv from 'dotenv';
import path from 'path';

// Load automation/api/.env if present. In CI, the real env vars are
// usually already set, so a missing .env file here is not an error.
// Playwright always runs with the working directory set to this
// project's root (automation/api), so the file can be located reliably
// from `process.cwd()`.
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// This InvenTree instance sits behind a reverse proxy that routes by the
// `Host` header - only `Host: inventree.localhost` reaches the app (the
// same host the UI suite's BASE_URL uses); any other Host returns an
// empty 200, not the API. Playwright's APIRequestContext, unlike
// browsers/curl, resolves hosts via Node's dns.lookup, which does not
// special-case "*.localhost" as loopback (confirmed live: ENOTFOUND on
// this environment). So the API suite connects via the literal loopback
// IP (always resolvable, no DNS needed) and sends the required virtual
// host separately via the `Host` header - see `baseRequestOptions()`.
const DEFAULT_BASE_URL = 'http://127.0.0.1';
const DEFAULT_HOST_HEADER = 'inventree.localhost';

export const environment = {
  baseUrl: process.env.BASE_URL || DEFAULT_BASE_URL,
  hostHeader: process.env.HOST_HEADER || DEFAULT_HOST_HEADER,
  username: process.env.INVENTREE_USERNAME,
  password: process.env.INVENTREE_PASSWORD
};

/**
 * Base options for every `playwright.request.newContext(...)` call in
 * this suite, so the loopback/Host-header workaround above lives in
 * exactly one place. Callers merge in their own auth (`httpCredentials`)
 * or extra headers on top.
 * @param {Record<string, string>} [extraHeaders]
 */
export function baseRequestOptions(extraHeaders = {}) {
  return {
    baseURL: environment.baseUrl,
    extraHTTPHeaders: { Host: environment.hostHeader, ...extraHeaders }
  };
}

/**
 * Fails fast with a clear, actionable error if credentials are missing,
 * instead of letting the first authenticated request fail later with a
 * confusing 401/403.
 */
export function assertCredentialsAvailable() {
  if (!environment.username || !environment.password) {
    throw new Error(
      'Missing InvenTree credentials. Set INVENTREE_USERNAME and INVENTREE_PASSWORD ' +
        'as environment variables (see automation/api/.env.example) before running API tests.'
    );
  }
}
