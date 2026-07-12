# Automation Framework Architecture

**Scope:** describes the design of the two automation frameworks under `automation/` — the UI suite (Playwright + Page Object Model) and the API suite (Playwright `APIRequestContext` + service layer) — as they exist in this repository today.
**Audience:** reviewers assessing the automation's design quality, maintainability, and extensibility, independent of the specific test cases it currently covers (see `docs/Automation_Coverage_Summary.md` for coverage).
**Relationship to other docs:** this document describes *how* the automation is built; `docs/AI_Workflow.md` describes *how it was produced*; `docs/AI_Change_Log.md` records the corrections made to it during live validation.

## 1. Design principles

Both suites share the same architectural philosophy, applied to their respective layers:

| Principle | UI suite | API suite |
|---|---|---|
| **Separation of concerns** | Page Objects own locators/interactions; specs describe business flows only | Service classes own endpoint paths/payloads; specs describe request/assertion flows only |
| **Centralised configuration** | `config/environment.js` — single source for `baseUrl`/credentials, loaded from `.env` | `config/environment.js` — single source for `baseUrl`/`hostHeader`/credentials, loaded from `.env` |
| **No hardcoded secrets/hosts** | Tests never read `process.env` or hardcode a host directly | Same — all request contexts route through `baseRequestOptions()` |
| **Deterministic, parallel-safe test data** | `data/*.js` factories generate timestamp+random unique values per run | `data/partData.js` factory, same convention |
| **No fixed sleeps** | Auto-retrying Playwright assertions / `expect.poll` exclusively | Playwright's built-in retrying `expect` on HTTP responses |
| **Fail fast on misconfiguration** | `assertCredentialsAvailable()` throws a clear error before a test can fail confusingly | Same helper, mirrored in `automation/api/config/environment.js` |
| **Evidence-driven locators/behaviour** | Locators and assertions carry inline "source note" comments citing the InvenTree frontend source, corrected against live observation where the two diverge | Assertions grounded in the OpenAPI schema and backend source, corrected against live response evidence where they diverge |

## 2. UI automation architecture (`automation/ui`)

### 2.1 Layers

```
tests/**/*.spec.js        -> business-flow assertions, one scenario per test
        |
        v
pages/*.js                 -> Page Object Model: locators + interactions + verifications
        |
        v
data/*.js                  -> unique test-data factories (timestamp + random suffix)
        |
        v
config/environment.js      -> baseUrl / credentials, sourced from .env
        |
        v
playwright.config.js       -> project/runner configuration (see §2.3)
```

### 2.2 Page Object Model

Each Page Object (`pages/LoginPage.js`, `PartsPage.js`, `CategoryPage.js`, `PartStockPage.js`, `PartParametersPage.js`, `DashboardPage.js`) wraps one functional area of the InvenTree SPA:

- **Locators** are declared in the constructor and are accessibility-role/aria-label-first (`page.getByRole(...)`, `page.getByLabel(...)`), matched against InvenTree's own frontend conventions (e.g. `text-field-<name>` for text inputs, `action-button-${identifierString(tooltip)}`/`action-menu-<name>` for actions — see `components/forms/fields/TextField.tsx`, `lib/components/ActionButton.tsx`). A CSS class selector is used only once, as an explicit last resort for a loading-overlay visibility signal (`CategoryPage.loadingOverlay`), and is commented as such.
- **Interaction methods** (`login()`, `createPart()`, `createRootCategory()`, …) perform a single logical action and return nothing — verification is a separate, explicit step.
- **Verification methods** (`verifyLoginSucceeded()`, `verifyPartCreated()`, `verifyCategoryVisible()`, …) encapsulate the auto-retrying assertions a spec needs, including handling for known application quirks (e.g. `LoginPage.verifyLoginSucceeded()` polls for either success or a scoped error toast rather than asserting a single outcome — see `docs/AI_Change_Log.md §1`).

Specs (`tests/login/`, `tests/parts/`, `tests/categories/`, `tests/regression/`) compose these methods to describe a business flow, and do not contain raw locators themselves.

### 2.3 Runner configuration

`playwright.config.js`: `fullyParallel: true`; `retries: 2` in CI only (`0` locally, so a flaky failure surfaces immediately during development); `reporter: [['list'], ['html', { open: 'never' }]]`; `screenshot: 'only-on-failure'` and `trace: 'retain-on-failure'` so every failure is debuggable from a single HTML report without re-running. Chromium-only for now — additional browser projects (Firefox/WebKit) are a straightforward extension of the existing `projects` array, not a redesign.

### 2.4 Cross-cutting utilities

- `config/environment.js` loads `.env` via `dotenv`, exposes a single `environment` object (`baseUrl`, `username`, `password`), and `assertCredentialsAvailable()` — called at the start of any spec that needs authentication.
- Two-step timeout strategy: the default Playwright per-test timeout is used for single-action specs; multi-step specs that chain several real UI workflows explicitly call `test.setTimeout(...)` with an inline comment explaining why (`part-category-assignment.spec.js`, `part-cross-functional.spec.js` — see `docs/AI_Change_Log.md §6`).

## 3. API automation architecture (`automation/api`)

### 3.1 Layers

```
tests/*.spec.js             -> request/response assertions, one scenario per test
        |
        v
services/*.js                -> service layer: one class per resource (Part, Category, Auth)
        |
        v
services/BaseApiService.js   -> thin wrapper around APIRequestContext (get/post/patch/delete)
        |
        v
utils/fixtures.js            -> authenticated APIRequestContext + wired service instances
        |
        v
config/environment.js        -> baseUrl / hostHeader / credentials, sourced from .env
        |
        v
playwright.config.js         -> runner configuration (no browser projects; pure API context)
```

### 3.2 Service layer

`BaseApiService` centralises how a request is issued (`get`/`post`/`patch`/`delete` over a shared `APIRequestContext`) so every concrete service only describes *which* endpoint and payload it needs — the API-suite equivalent of a Page Object's locator/action layer. `PartService` and `CategoryService` extend it with resource-specific methods (`list`, `create`, `getById`, `update`, `remove`), each documented with the exact HTTP verb/path and any business-rule caveat relevant to it (e.g. `PartService.remove()` notes that deletion is blocked server-side while a part is `active`/`locked`). `AuthService` is deliberately separate: it does not extend `BaseApiService`, since obtaining a token is a pre-authentication concern (`fetchToken()` builds a dedicated, unauthenticated request context and an explicit Basic-auth header — see `docs/AI_Change_Log.md §4`).

### 3.3 Fixtures

`utils/fixtures.js` extends Playwright's base `test` with three fixtures — `apiContext` (a fresh authenticated `APIRequestContext` per test, via `AuthService.fetchToken()`), `partService`, and `categoryService` (both constructed on top of `apiContext`) — so specs import `test`/`expect` from this file rather than `@playwright/test` directly, and never construct a request context or service instance themselves. `CategoryService` is fixture-wired even though no current spec calls it, which is a deliberate, explicit choice recorded (not silently dropped) in `docs/Automation_Coverage_Summary.md` as "scaffolded, not executed."

### 3.4 Environment / connectivity workaround

`config/environment.js` documents and centralises a specific infrastructure constraint of this environment: the InvenTree instance sits behind a reverse proxy that routes by the `Host` header, and Playwright's `APIRequestContext` resolves hosts via Node's `dns.lookup`, which does not treat `*.localhost` as loopback the way a browser does. `baseRequestOptions()` is the single function that applies the resulting workaround (connect via the literal loopback IP, send the virtual host via an explicit `Host` header) — every request-context creation site (`playwright.config.js`, `AuthService`, `utils/fixtures.js`) calls through it, so the workaround exists in exactly one place. Full evidence/root-cause detail: `docs/AI_Change_Log.md §5`.

### 3.5 Runner configuration

`playwright.config.js`: `fullyParallel: true`, `retries: 2` in CI only, `reporter: [['list'], ['html', { open: 'never' }]]`. No browser `projects` array — this is a pure `APIRequestContext` suite, so `use.baseURL` and `use.extraHTTPHeaders` (the `Host` header) are set once at the config level rather than per-project.

## 4. Shared conventions across both suites

- **One `.env.example` per project**, committed; the real `.env` is git-ignored in both `automation/ui` and `automation/api`.
- **Same npm script surface**: `npm test`, `npm run test:headed`, `npm run report` — a contributor familiar with one suite already knows how to run the other.
- **Same dependency set**: `@playwright/test`, `dotenv`, `@types/node` — no additional test framework, assertion library, or HTTP client was introduced, keeping the automation workspace to a single toolchain.
- **Same "evidence over assumption" discipline as the analysis docs**: page objects and services carry inline comments citing *why* a locator/endpoint/header is what it is, and where the implementation was corrected after a live-execution finding, that correction is noted in place (with the fuller record kept in `docs/AI_Change_Log.md`) rather than silently overwritten.

## 5. Extensibility notes

- **Adding a UI flow**: add/extend a Page Object method, then a spec that composes it — no change to `playwright.config.js` or `config/environment.js` is needed unless a new environment variable is introduced.
- **Adding an API resource**: add a service class extending `BaseApiService`, wire it into `utils/fixtures.js` as a new fixture, then add a spec — `CategoryService` already demonstrates this path end-to-end except for the final spec (see `docs/Automation_Coverage_Summary.md`).
- **Adding a browser/platform**: UI suite — add an entry to `playwright.config.js`'s `projects` array; the Page Objects and specs require no change, since they contain no browser-specific logic.
- **CI adoption**: both configs already branch on `process.env.CI` for `retries`/`workers`, so wiring either suite into a pipeline is a matter of setting environment variables/secrets, not changing the framework code.
