// Thin wrapper around Playwright's APIRequestContext, shared by every
// API service class below. Centralises how a request is issued so each
// service only has to describe *which* endpoint/payload it needs - the
// API equivalent of a Page Object's locator/action layer.

export class BaseApiService {
  /** @param {import('@playwright/test').APIRequestContext} apiContext */
  constructor(apiContext) {
    this.apiContext = apiContext;
  }

  get(path, params) {
    return this.apiContext.get(path, { params });
  }

  post(path, data) {
    return this.apiContext.post(path, { data });
  }

  patch(path, data) {
    return this.apiContext.patch(path, { data });
  }

  delete(path) {
    return this.apiContext.delete(path);
  }
}
