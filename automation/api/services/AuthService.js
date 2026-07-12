import { baseRequestOptions } from '../config/environment.js';

// Handles the authentication handshake against InvenTree's REST API.
//
// InvenTree's OpenAPI schema (source-specifications/inventree-openapi.yaml.yaml,
// components.securitySchemes) offers tokenAuth/basicAuth/cookieAuth/oauth2
// simultaneously on every Part/Category operation. This framework
// standardises on the token workflow documented directly on
// `GET /api/user/me/token/`: authenticate once with HTTP Basic
// credentials, then reuse the returned token
// ("Authorization: Token <token>") for every subsequent request.
export class AuthService {
  static TOKEN_PATH = '/api/user/me/token/';

  /**
   * Builds a raw `Authorization: Basic ...` header (RFC 7617). Built
   * explicitly rather than via Playwright's `httpCredentials` option:
   * that option only resends a request with credentials after the
   * server issues a `WWW-Authenticate: Basic` challenge, and InvenTree's
   * DRF backend - which advertises multiple simultaneous auth schemes -
   * does not reliably emit that specific challenge header, confirmed
   * live (a real 401 was returned even with correct credentials
   * supplied via `httpCredentials`).
   * @param {string} username
   * @param {string} password
   */
  static basicAuthHeader(username, password) {
    return `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;
  }

  /**
   * Exchanges HTTP Basic credentials for an API token.
   * @param {import('@playwright/test').PlaywrightWorkerArgs['playwright']} playwright - the `playwright` fixture, used to open a short-lived Basic-auth context
   * @param {{ baseUrl: string, username: string, password: string }} environment
   * @returns {Promise<string>} the issued token
   */
  static async fetchToken(playwright, environment) {
    const basicAuthContext = await playwright.request.newContext(
      baseRequestOptions({
        Authorization: AuthService.basicAuthHeader(environment.username, environment.password)
      })
    );

    try {
      const response = await basicAuthContext.get(AuthService.TOKEN_PATH, {
        params: { name: `playwright-api-${Date.now()}` }
      });

      if (!response.ok()) {
        throw new Error(
          `Failed to obtain an auth token (status ${response.status()}): ${await response.text()}`
        );
      }

      const body = await response.json();
      return body.token;
    } finally {
      await basicAuthContext.dispose();
    }
  }
}
