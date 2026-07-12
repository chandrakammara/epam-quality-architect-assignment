# Prompt 03 — UI Automation

## Objective

Build a Playwright UI regression suite (Page Object Model) for the InvenTree Parts and Part Category flows scoped in `docs/Requirements_And_Coverage_Summary.md`, execute it against a live InvenTree instance, and correct it using real failure evidence rather than accepting generated code as correct on first pass.

## Context

- Grounding inputs: `docs/Requirements_And_Coverage_Summary.md` (business rules + manual case IDs) and the manual case IDs in `test-cases/InvenTree_Parts_QA_Test_Cases.xlsx`.
- Target application: a Docker-hosted InvenTree instance, reverse-proxied at `inventree.localhost`, with a real user account.
- Tooling: `@playwright/test`, Page Object Model under `automation/ui/pages/`, feature-grouped specs under `automation/ui/tests/{login,parts,categories,regression}/`, timestamp+random test-data factories under `automation/ui/data/`.
- Constraint: locators must be accessibility-role/aria-label-first, matched against the InvenTree frontend's own conventions (e.g. `text-field-<name>`, `action-button-${identifierString(tooltip)}`); no fixed sleeps — auto-retrying assertions / `expect.poll` only.
- Every spec had to be run against the live instance, not merely generated — failures were triaged via Playwright traces (`trace: 'retain-on-failure'`) and HTML reports before any correction was accepted.

## Final prompt used

"Using the business rules and manual case IDs already catalogued in `docs/Requirements_And_Coverage_Summary.md`, build a Page-Object-Model Playwright UI suite under `automation/ui` covering: login, Part create/edit/validation, Category hierarchy (root + child), Part-to-Category assignment, Part stock (add stock item, verify total), Part parameters (inline parameter-template creation + parameter add), and one full cross-functional regression chain (category → part-in-category → parameter → stock → re-discovery under category). Follow InvenTree's own locator conventions from the frontend source rather than generic CSS selectors, and use `data/*.js` factories for unique, parallel-safe test data. Run every spec against the live Docker instance at `inventree.localhost`, and where a spec fails, read the actual error and trace before proposing a fix — do not guess at a root cause from the assertion message alone."

## Expected output

Nine Playwright spec files (`tests/login/login.spec.js`, `tests/parts/part-create.spec.js`, `part-validation.spec.js`, `part-edit.spec.js`, `part-stock.spec.js`, `part-parameter.spec.js`, `tests/categories/category-hierarchy.spec.js`, `part-category-assignment.spec.js`, `tests/regression/part-cross-functional.spec.js`), backed by Page Objects (`LoginPage`, `PartsPage`, `CategoryPage`, `PartStockPage`, `PartParametersPage`, `DashboardPage`) and data factories, all passing against the live instance with inline "source note" comments on any locator confirmed or corrected via live observation.

## Notes

- Live execution surfaced real defects, not automation bugs alone: a Playwright strict-mode locator collision on the category table (root category's "Path" column duplicating its "Name" column text), a frontend-source-vs-deployed-build mismatch on the Stock "Location" field, and a malformed doubly-nested SPA navigation URL only reachable via the multi-tab cross-functional journey — see `docs/AI_Change_Log.md` §1–3, §6 for the full evidence → root cause → correction record.
- REQ-002 (detail-tab visibility) and REQ-006 (templates/variants/revisions) were deliberately left unautomated in this pass — they are recorded as gaps in `docs/Automation_Coverage_Summary.md`, not silently skipped.
- No spec was accepted as "done" on a first green run alone; each corrected spec was re-run individually and then alongside every other spec sharing the same page object, per `docs/AI_Workflow.md` §2.11.
