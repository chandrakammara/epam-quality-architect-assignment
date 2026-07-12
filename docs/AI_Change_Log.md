# AI Change Log — Major Corrections

**Scope:** documents the significant AI-generated corrections made to `automation/ui` and `automation/api` during this assignment, each driven by evidence collected from a live InvenTree instance rather than assumed from the generated code or the checked-out frontend/backend source alone.
**Guardrail:** all corrections below are already present in the current, unmodified state of `automation/`; this log is a record of *why* the code looks the way it does, not a proposal for further changes.

Every entry follows the same structure: **Initial implementation → Evidence collected → Root cause → Final correction → Validation result.**

---

## 1. Login diagnostics

**Area:** `automation/ui/pages/LoginPage.js` — `verifyLoginSucceeded()`

| | |
|---|---|
| **Initial implementation** | Assert that the URL had navigated away from `/web/login` after submitting the login form — a single, direct assertion with no handling for a failed submit. |
| **Evidence collected** `[LIVE]` | Running `login.spec.js` and the longer regression specs repeatedly showed an intermittent case where the app rejected a submit — even with valid credentials — and stayed on `/web/login`, surfacing a dismissible Mantine "Login failed" toast. Waiting on the URL alone either timed out with a confusing URL-mismatch message, or hung on retry since there was nothing to navigate to. |
| **Root cause** | A client-side form re-validation/submit race in the app itself (not a credentials problem) can reject a submit attempt. A plain "did the URL change" assertion cannot distinguish this transient failure from a slow-but-successful login, and a generic `role="alert"` locator is not specific enough — InvenTree also uses that role for the "Login successful" toast and for unrelated persistent dashboard banners (e.g. "Superuser Mode"). |
| **Final correction** | `verifyLoginSucceeded()` now polls (`expect.poll`, auto-retrying, no fixed sleeps) for whichever of two outcomes happens first: the URL leaving `/web/login` **and** the authenticated nav-menu button becoming visible, or a visible error toast scoped specifically to `.mantine-Notifications-root .mantine-Notification-root[style*="red-filled"]`. On the error outcome, it throws a descriptive `Login failed: <toast text>` error instead of a bare timeout. |
| **Validation result** | `login.spec.js` and every spec that logs in (`part-category-assignment.spec.js`, `part-cross-functional.spec.js`) now report the real failure reason on the rare transient rejection, and pass reliably on the success path. |

---

## 2. Category locator ambiguity

**Area:** `automation/ui/pages/CategoryPage.js` — `openCategory()`, `openChildCategory()`, `verifyCategoryVisible()`, `verifyChildCategoryUnderParent()`

| | |
|---|---|
| **Initial implementation** | Locate a category's row in the categories table with `page.getByRole('cell', { name: categoryName, exact: true })` and click/assert on it directly, with no disambiguation. |
| **Evidence collected** `[LIVE]` | Running `category-hierarchy.spec.js` produced a Playwright strict-mode violation: more than one cell in the same row matched the category name by accessible text. |
| **Root cause** | For a root category, the table's "Path" column renders the same text as its "Name" column (`pathstring == name` when there are no ancestors) — see `automation/ui/pages/CategoryPage.js` header comment. Both cells therefore match the same exact-text locator in a root category's row. |
| **Final correction** | Every affected locator now appends `.first()`, explicitly matching the "Name" column since InvenTree renders it before "Path" in `PartCategoryTable.tsx`'s column order — any cell in the row navigates to the same detail page regardless, so `.first()` is both correct and stable. |
| **Validation result** | `category-hierarchy.spec.js`, `part-category-assignment.spec.js`, and `part-cross-functional.spec.js` all navigate/verify categories without strict-mode violations, for both root and child categories. |

---

## 3. Stock navigation correction

**Area:** `automation/ui/pages/PartStockPage.js` — `locationField` locator and `verifyPartStockTotal()`

| | |
|---|---|
| **Initial implementation** | (a) The "Location" field on the "Add Stock Item" form was targeted as `tree-field-location`, following the `TreeField` component the checked-out frontend source implies for this field. (b) `verifyPartStockTotal()` returned to the part's Stock tab via `page.goBack()` after creating a stock item. |
| **Evidence collected** `[LIVE]` | (a) Running the live "Add Stock Item" form showed the deployed build instead rendering `location` as a plain related-model combobox with aria-label `related-field-location` — no `tree-field-location` element existed on the rendered form. (b) In `part-cross-functional.spec.js`, which visits the "Parameters" tab before "Stock", `goBack()` after stock creation landed on a malformed, doubly-nested URL observed live as `/web/web/part/<id>/stock/stock`, whose header never rendered the "In Stock" badge — causing the total-stock assertion to time out. |
| **Root cause** | (a) A mismatch between the checked-out frontend source and the actually-deployed build's rendered component for this field. (b) An InvenTree SPA tab-routing quirk: browser history accumulates a nested sub-path once more than one part-detail tab has been visited before navigating back, which only manifests in a multi-tab journey — not in a test that visits Stock first. |
| **Final correction** | (a) `locationField` now targets `combobox[name="related-field-location"]`, i.e. what was actually observed, with a source-note comment explaining the discrepancy for future maintainers. (b) `verifyPartStockTotal(expectedTotal, partUrl)` accepts the part's own canonical detail URL — captured immediately after `verifyPartCreated()`, before any tab navigation — and calls `page.goto(partUrl)` when supplied, bypassing browser history entirely; `goBack()` is kept only as a fallback for callers that don't have the URL handy. |
| **Validation result** | `part-stock.spec.js` (single-tab case, unaffected by the bug) continues to pass; `part-cross-functional.spec.js` (the multi-tab case that originally exposed the bug) now reaches its "In Stock" assertion reliably. |

---

## 4. API authentication

**Area:** `automation/api/services/AuthService.js`

| | |
|---|---|
| **Initial implementation** | Obtain a session by passing Basic-auth credentials via Playwright's built-in `httpCredentials` request-context option when calling `GET /api/user/me/token/`. |
| **Evidence collected** `[LIVE]` | Running the token-fetch against the live instance returned a real `401 Unauthorized` even with correct credentials supplied via `httpCredentials`. |
| **Root cause** | Playwright's `httpCredentials` only resends a request with credentials after the server issues a `WWW-Authenticate: Basic` challenge header. InvenTree's DRF backend advertises multiple simultaneous auth schemes (`tokenAuth`/`basicAuth`/`cookieAuth`/`oauth2` — `docs/API_Schema_Analysis.md` §9) and does not reliably emit that specific challenge, so the credentials were never actually attached to the outgoing request. |
| **Final correction** | `AuthService.basicAuthHeader()` builds the `Authorization: Basic ...` header explicitly (RFC 7617, base64 of `username:password`) and injects it as an explicit `extraHTTPHeaders` entry on a dedicated request context (`AuthService.fetchToken()`), rather than relying on the challenge-response flow. The returned token is then reused as `Authorization: Token <token>` for every subsequent authenticated request via `automation/api/utils/fixtures.js`. |
| **Validation result** | `auth.spec.js`'s four scenarios all pass: valid Basic credentials obtain a token; an invalid password is rejected with `401`; a request with no credentials is rejected with `401`; and the issued token successfully authenticates a protected `GET /api/part/` request (`200`). |

---

## 5. DNS / Host header issue

**Area:** `automation/api/config/environment.js` — `baseUrl`, `hostHeader`, `baseRequestOptions()`

| | |
|---|---|
| **Initial implementation** | Point the API suite's `baseURL` directly at `http://inventree.localhost`, mirroring the UI suite's `BASE_URL` (`automation/ui/config/environment.js`). |
| **Evidence collected** `[LIVE]` | Running any API spec against that base URL failed with `ENOTFOUND` from Playwright's `APIRequestContext`, even though the same host resolves correctly for the browser-driven UI suite. |
| **Root cause** | The InvenTree instance sits behind a reverse proxy that routes by the `Host` header — only `Host: inventree.localhost` reaches the app; any other host returns an empty `200`, not the API. Browsers (and the UI suite's browser-driven `page.goto()`) resolve `*.localhost` as loopback natively, but Playwright's `APIRequestContext` resolves hosts via Node's `dns.lookup`, which does **not** special-case `*.localhost` as loopback — confirmed live by the `ENOTFOUND` failure. |
| **Final correction** | The API suite connects via the literal loopback IP `http://127.0.0.1` (`DEFAULT_BASE_URL`, always resolvable without DNS) and sends the required virtual host separately via an explicit `Host: inventree.localhost` header (`DEFAULT_HOST_HEADER`), centralised in `baseRequestOptions()` so every request-context creation site (config, `AuthService`, `utils/fixtures.js`) applies the same workaround exactly once. |
| **Validation result** | All four API spec files (`auth.spec.js`, `part-crud.spec.js`, `part-validation.spec.js`, `part-search-pagination.spec.js`) connect and pass; the reasoning is preserved as an inline comment in `environment.js` so the workaround is not "re-broken" by a future edit that reverts to the hostname-only URL. |

---

## 6. Cross-functional workflow fixes

**Area:** `automation/ui/tests/regression/part-cross-functional.spec.js`, `automation/ui/tests/categories/part-category-assignment.spec.js`

| | |
|---|---|
| **Initial implementation** | The cross-functional regression chained category creation → part creation → parameter creation → stock creation → re-discovery under its category, using Playwright's default 30-second per-test timeout, and (before the fix in §3) relied on `goBack()` to return to the part after creating a stock item. |
| **Evidence collected** `[LIVE]` | The chained journey's cumulative wall-clock time (six sequential, auto-retrying UI workflows against a resource-constrained local Docker environment) exceeded the default 30s budget, and — because this spec visits the "Parameters" tab before "Stock" — it was the specific spec whose trace first surfaced the malformed `/web/web/part/<id>/stock/stock` URL from Correction 3. |
| **Root cause** | Two independent but compounding issues: (1) a fixed default test timeout too small for a multi-step, real-network business journey, and (2) the tab-order-dependent `goBack()` navigation bug (Correction 3), which this spec — uniquely among the suite — was positioned to trigger by visiting more than one part-detail tab before returning. |
| **Final correction** | `test.setTimeout(120000)` is set explicitly in `part-cross-functional.spec.js` (and `test.setTimeout(90000)` in the shorter but still multi-step `part-category-assignment.spec.js`), both with an inline comment explaining why the default budget doesn't fit. The part's canonical detail URL is captured via `const partUrl = page.url()` immediately after `verifyPartCreated()`, before any tab navigation, and threaded through to `partStockPage.verifyPartStockTotal(stockData.quantity, partUrl)` so the fix from Correction 3 is exercised here specifically. |
| **Validation result** | The full end-to-end chain — root category → child category → part-in-category → parameter → stock → re-discovery under the child category — now completes and passes within the extended timeout, with the stock-total assertion resolved via the canonical-URL navigation instead of browser history. |
