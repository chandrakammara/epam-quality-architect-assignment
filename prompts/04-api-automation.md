# Prompt 04 — API Automation

## Objective

Build a Playwright `APIRequestContext` service-layer suite for the `/api/part/` and `/api/part/category/` REST surface, scoped to the Tier 1 automation recommendations in `docs/API_Schema_Analysis.md` §10, and validate it against the same live InvenTree instance used for UI automation.

## Context

- Grounding input: `docs/API_Schema_Analysis.md` §10 Tier 1 scope (Part CRUD happy path, required-field validation, deletion guards, authentication handshake, filters/search/ordering/pagination boundaries).
- Target application: the same Docker-hosted InvenTree instance as the UI suite, reached via `/api/` rather than the browser SPA.
- Tooling: `@playwright/test` `APIRequestContext`, service-layer classes under `automation/api/services/` (`BaseApiService`, `AuthService`, `PartService`, `CategoryService`), specs under `automation/api/tests/`, shared authenticated-context fixture in `automation/api/utils/fixtures.js`.
- Constraint: every endpoint call goes through a service class — specs must not build raw HTTP requests inline, so endpoint paths and params live in exactly one place.
- Every spec had to be executed against the live instance; authentication and network failures observed during that execution (not assumed from the schema) determined the final request-context configuration.

## Final prompt used

"Using the Tier 1 scope from `docs/API_Schema_Analysis.md` §10, build a service-layer Playwright API suite under `automation/api`: a `BaseApiService` wrapping common HTTP verbs, an `AuthService` for obtaining an auth token, a `PartService` and `CategoryService` covering list/create/getById/update/remove, and a shared authenticated-context fixture. Write specs for: the auth handshake (valid/invalid credentials, missing credentials, token reuse), the full Part CRUD lifecycle as a serial chain (`GET` list → `POST` create → `GET` detail → `PATCH` update → `DELETE`, honouring the 'blocked while active' deletion guard from `part/models.py`), required-field/FK validation (`400` on missing `name`, unknown `category`), and search/filter/pagination boundaries (unique-token search, `active` boolean filter, `limit`/`offset` including `next`/`previous` and no-overlap between pages). Run every spec against the live instance and resolve any connection or auth failure by inspecting the actual response/error before changing configuration."

## Expected output

Four Playwright spec files (`tests/auth.spec.js`, `tests/part-crud.spec.js`, `tests/part-validation.spec.js`, `tests/part-search-pagination.spec.js`) backed by `services/{BaseApiService,AuthService,PartService,CategoryService}.js`, `utils/fixtures.js`, `utils/assertions.js`, and `data/partData.js`, all passing against the live instance, plus an `environment.js` documenting any host/DNS configuration required to reach it.

## Notes

- Live execution surfaced two infrastructure-layer defects distinct from the automation code itself: Playwright's `httpCredentials` never attached Basic-auth credentials because InvenTree's DRF backend doesn't reliably emit the expected `WWW-Authenticate` challenge (resolved by building the `Authorization: Basic` header explicitly), and Node's `dns.lookup` — unlike a browser — does not resolve `*.localhost` as loopback, causing `ENOTFOUND` (resolved by connecting via `127.0.0.1` with an explicit `Host` header). Full evidence → root cause → correction detail is in `docs/AI_Change_Log.md` §4–5.
- `CategoryService` was implemented and wired into the shared fixture per the prompt's scope, but no spec file was ultimately written to exercise it in this pass — tracked honestly in `docs/Automation_Coverage_Summary.md` as "scaffolded, not executed," not counted as covered.
- Tier 2/3 items from `docs/API_Schema_Analysis.md` (IPN duplicate-policy toggling, category circular-parent rejection, `PartTestTemplate`/`PartRelation`/`CategoryParameterTemplate` CRUD) were intentionally out of scope for this prompt and remain open gaps, not silently deferred.
