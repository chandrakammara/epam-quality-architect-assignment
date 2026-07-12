# Requirements & Coverage Summary — InvenTree Parts Module

**Scope:** Part, Part Category, Part Parameters/Templates, Part Templates/Variants, Part Revisions, Part Test Templates.
**Audience:** QA reviewers assessing test coverage and automation scope for the Parts domain.

## 1. How to read this document

Every factual claim below is tagged with its evidence source, per the assignment's requirement to distinguish documented facts from code findings and live observations:

| Tag | Meaning |
|---|---|
| `[DOC]` | Stated in the official InvenTree documentation (`docs.inventree.org/en/stable/...`) |
| `[CODE]` | Confirmed by reading the InvenTree source in the local, read-only `InvenTree/` checkout (file:line cited) |
| `[LIVE]` | Observed by running the Playwright suite against a live InvenTree instance (per source notes already present in `automation/ui`) |
| `[ASSUMPTION]` | Not verifiable from any of the above sources within this exercise; flagged for architect/reviewer confirmation |

Where a documented rule and the source code agree, both tags are shown. No InvenTree or automation code was modified to produce this analysis.

## 2. Documented Parts capabilities and business rules

### 2.1 Part creation & identity

| Rule | Evidence |
|---|---|
| A Part is created via the "Add Parts → Create Part" form or bulk file import; only `name` is truly mandatory on the form/API, `IPN` is optional | `[DOC]` [Creating Parts](https://docs.inventree.org/en/stable/part/create/), `[LIVE]` `PartsPage.createPart`/`verifyRequiredNameValidation` (automation/ui/pages/PartsPage.js) |
| Name + IPN + Revision are together the practical "identity" of a part; duplicate `(name, revision, IPN)` combination is rejected | `[CODE]` `Part.validate_unique`, InvenTree/src/backend/InvenTree/part/models.py:1013-1057 |
| Duplicate IPN values are rejected **unless** the `PART_ALLOW_DUPLICATE_IPN` global setting is enabled (default: **allowed**) | `[CODE]` InvenTree/src/backend/InvenTree/part/models.py:1026-1037, confirmed by `test_part.py:105-138` |
| An optional `PART_IPN_REGEX` global setting can enforce a format on the IPN field | `[CODE]` InvenTree/src/backend/InvenTree/part/models.py:766-772 |
| Parts can be bulk-imported from an external file via the data-import wizard | `[DOC]` [Creating Parts — Import from File](https://docs.inventree.org/en/stable/part/create/) |
| Creating a part requires "add" permission on the Part role; the "Add Parts" action is hidden without it | `[DOC]` [Creating Parts — Permissions](https://docs.inventree.org/en/stable/part/create/) |
| The Create-Part form can optionally add initial stock and/or initial supplier data in the same transaction (`initial_stock`, `initial_supplier` write-only fields) | `[DOC]` same page; corroborated by `Part` schema (`source-specifications/inventree-openapi.yaml.yaml`) |

### 2.2 Part attributes & lifecycle

| Attribute | Effect | Evidence |
|---|---|---|
| `active` | Inactive parts remain in the DB but are restricted from most actions; recommended over deletion for obsolete parts | `[DOC]` [Parts — Active Parts](https://docs.inventree.org/en/stable/part/) |
| `virtual` | Represents a non-physical part (service, license); tracked but not physically stocked in practice | `[DOC]` same page |
| `is_template` | Enables the "Variants" tab and variant-creation workflow | `[DOC]` [Part Templates](https://docs.inventree.org/en/stable/part/template/) |
| `assembly` / `component` | Enable BOM (as parent) / usability as a BOM sub-item (as child), respectively | `[DOC]` [Parts — Part Attributes](https://docs.inventree.org/en/stable/part/) |
| `testable` | Enables Part Test Templates and Stock test-result recording | `[DOC]` [Part Test Templates](https://docs.inventree.org/en/stable/part/test/) |
| `trackable` | Enables batch/serial-number tracking on stock items of this part | `[DOC]` [Parts — Trackable](https://docs.inventree.org/en/stable/part/) |
| `purchaseable` / `salable` | Gate purchase-order / sales-order workflows for the part | `[DOC]` same page |
| `locked` | Blocks deletion, and blocks create/edit/delete of BOM items and Parameters on that part; global toggle `PART_ENABLE_LOCKING` | `[DOC]` [Parts — Locked Parts](https://docs.inventree.org/en/stable/part/), `[CODE]` part/models.py:571-590 |
| Minimum/Maximum stock | User-defined thresholds that flag a part as "low stock" / "overstocked"; the OpenAPI schema does **not** enforce `minimum_stock <= maximum_stock` at the field level | `[DOC]` [Parts — Part Stock](https://docs.inventree.org/en/stable/part/); absence of a cross-field constraint confirmed by inspecting the `Part` schema in `source-specifications/inventree-openapi.yaml.yaml` — treat any UI/API enforcement of this relationship as `[ASSUMPTION]` pending live verification |

**Part deletion rules** `[CODE]` part/models.py:581-599 (matches `[DOC]` narrative that inactive/obsolete parts should be deactivated, not deleted):
- Deletion is blocked if the part is `locked` (and locking is globally enabled).
- Deletion is blocked while the part is `active`.
- Deletion is blocked if the part is used as a sub-part in another part's BOM, unless `PART_ALLOW_DELETE_FROM_ASSEMBLY` is enabled.

### 2.3 Part Categories

| Rule | Evidence |
|---|---|
| Categories are hierarchical (MPTT tree); a category page lists parts in that category and any child categories | `[DOC]` [Parts — Part Category](https://docs.inventree.org/en/stable/part/) |
| A `structural` category cannot have parts assigned directly, only via child categories | `[DOC]` same page, `[CODE]` PartCategory.clean(), part/models.py:173-185 (also blocks turning a category structural once parts already exist under it) |
| Category list/detail supports parametric tables: sorting/filtering parts by parameter value, including unit-aware and multi-filter combinations | `[DOC]` [Concepts — Parametric Tables](https://docs.inventree.org/en/stable/concepts/parameters/) |
| Category tree endpoint (`/api/part/category/tree/`) returns an explicitly acyclic tree structure | `[DOC]`/`[CODE]` inferred from MPTT-backed model + OpenAPI `CategoryTree` schema |
| Self-parent / circular-parent prevention for categories is expected from the underlying MPTT tree implementation, but no explicit `clean()` guard against a category being its own ancestor was located in the reviewed code paths | `[ASSUMPTION]` — must be confirmed by live execution (`API-PART-041`/`042`, `UI-PART-022`/`023`) before treating as a hard guarantee |

### 2.4 Part Parameters & Templates

| Rule | Evidence |
|---|---|
| A Parameter always references a global `Parameter Template` (name unique, optional `units`, optional `Model Type`, optional `Choices`, `Checkbox`, `Selection List`) | `[DOC]` [Concepts — Parameters](https://docs.inventree.org/en/stable/concepts/parameters/), `[LIVE]` `PartParametersPage.createParameterTemplate` (automation/ui/pages/PartParametersPage.js) — there is no template-less/ad-hoc parameter |
| Parameter values must be dimensionally compatible with the template's `units`; incompatible units are rejected unless this check is globally disabled | `[DOC]` [Concepts — Parameter Units](https://docs.inventree.org/en/stable/concepts/parameters/) |
| Parametric filtering supports operators `=`, `>`, `>=`, `<`, `<=`, `!=`, `~` (contains, text only), and multiple simultaneous filters (AND semantics) | `[DOC]` same page |
| Selection-list choices bypass the 5000-character limit on a template's inline `Choices` field | `[DOC]` same page |
| `Category Parameter Templates` let a category pre-associate parameter templates (with optional default values) so new parts under that category can inherit them | `[DOC]`/`[CODE]` corroborated by `/api/part/category/parameters/` and `CategoryParameterTemplate` schema |
| Parameters on a `locked` part cannot be created, edited, or deleted | `[CODE]` part/models.py:571-579 |

### 2.5 Templates & Variants

| Rule | Evidence |
|---|---|
| Any part can be flagged `Template`; variants are then created via the "Variants" tab's "New Variant" action (a duplicate-part flow) | `[DOC]` [Part Templates](https://docs.inventree.org/en/stable/part/template/) |
| Serial numbers must be unique across a template and **all** of its variants combined | `[DOC]` same page |
| A template part's total "stock" reporting aggregates stock across all of its variants | `[DOC]` same page |
| Test Templates defined on a template part cascade automatically to all variant parts | `[DOC]` [Part Test Templates](https://docs.inventree.org/en/stable/part/test/) |
| `variant_of` self-reference / circular chains are not explicitly documented; expect standard FK self-reference protection but this must be confirmed live | `[ASSUMPTION]` |

### 2.6 Part Revisions

| Rule | Evidence |
|---|---|
| A revision is itself a full Part row, linked to its original via `revision_of`; it has its own stock, BOM, parameters | `[DOC]` [Part Revisions](https://docs.inventree.org/en/stable/part/revision/), `[CODE]` `revision_of` FK, part/models.py:1167 |
| A part cannot be a revision of itself | `[DOC]` same page, `[CODE]` `validate_revision`, part/models.py:774-781 |
| A revision **must** carry a non-blank `revision` code | `[CODE]` part/models.py:783-789 (not called out as explicitly in the docs page, so this specific constraint is `[CODE]`-only) |
| Two revisions of the same original part cannot share the same `revision` code | `[DOC]` same page, `[CODE]` `validate_unique`, part/models.py:1039-1049 |
| A **template** part cannot itself have revisions (but its variants can) | `[DOC]` same page, `[CODE]` part/models.py:799-803 |
| A revision of a variant part must point to the same template (`variant_of`) as the original it revises | `[DOC]` same page, `[CODE]` part/models.py:805-809 |
| Global setting `Assembly Revision Only` (`PART_REVISION_ASSEMBLY_ONLY`, default `False`) can restrict revisions to assembly parts only | `[DOC]` same page, `[CODE]` part/models.py:791-797 |
| Global setting `Part Revisions` (default `True`) enables/disables the revision feature entirely | `[DOC]` same page |

### 2.7 Part Test Templates

| Rule | Evidence |
|---|---|
| Only parts flagged `testable` can define test templates | `[DOC]` [Part Test Templates](https://docs.inventree.org/en/stable/part/test/) |
| Test `name` must be unique per part (and across its variant set, since templates cascade) | `[DOC]` same page |
| A normalized, lowercase-alphanumeric `key` is auto-derived from the test name on save (read-only in the API) | `[DOC]` same page, `[CODE]`/schema: `PartTestTemplate.key` is `readOnly` in `source-specifications/inventree-openapi.yaml.yaml` |
| `required`, `requires_value`, `requires_attachment`, `enabled` are independent boolean flags controlling test acceptance semantics | `[DOC]` same page |
| Disabling (rather than deleting) a template preserves historical test results; deleting a template deletes its associated results | `[DOC]` same page |

### 2.8 Part Detail view — tabs (visibility is attribute/permission-dependent)

`[DOC]` [Part Views](https://docs.inventree.org/en/stable/part/views/): **Variants** (only if `is_template`), **Stock**, **Allocations** (only if `component` or `salable`), **Bill of Materials** (only if `assembly`), **Build Orders**, **Used In** (only if `component`), **Suppliers**/**Purchase Orders** (only if `purchaseable`), **Sales Orders**, **Stock History**, **Test Templates** (only if `testable`), **Related Parts** (toggle-able globally), **Parameters**, **Attachments**, **Notes**.

## 3. Coverage mapping: documented rules → manual test suite

Source: `test-cases/InvenTree_Parts_QA_Test_Cases.xlsx` — **96** UI manual cases (`UI-PART-001…096`) + **70** API manual cases (`API-PART-001…070`), cross-referenced by its own `RTM` sheet (`REQ-001…010`) and `Sources` sheet. The RTM sheet's own note flags this as an "AI-generated draft for architect review; validate version-specific rules against the running instance and local OpenAPI YAML" — i.e. the manual suite itself is `[DOC]`-derived and not yet execution-verified (`Status = Draft` on every row).

| Business area (§2) | RTM Req. | Manual UI coverage | Manual API coverage |
|---|---|---|---|
| Creation, IPN, units, import | REQ-001 | UI-PART-001…018 | API-PART-003…009 |
| Detail tabs | REQ-002 | UI-PART-042…052 | Special endpoints (pricing/requirements/serial-numbers/bom-validate) |
| Categories & parametric tables | REQ-003 | UI-PART-019…030 | API-PART-036…048 |
| Attributes & lifecycle | REQ-004 | UI-PART-031…041, 053…056 | API-PART-010…017, 061…068 |
| Parameters & units | REQ-005 | UI-PART-057…064 | API-PART-046…048 (category-parameter mapping only — no direct `/api/part/parameter/` manual cases) |
| Templates, variants, revisions | REQ-006 | UI-PART-065…076 | API-PART-068 (revision-graph only; no dedicated variant/template API cases) |
| Core CRUD | REQ-007 | Supporting UI CRUD cases | API-PART-001…017, 036…044 |
| Filtering/search/sort/pagination | REQ-008 | UI-PART-092…095 | API-PART-018…035 |
| Field constraints / read-only fields | REQ-009 | UI-PART-012…013 | API-PART-005…009 |
| Cross-functional (create→parameter→stock→category) | REQ-010 | Selected high-risk cases across all above | API setup/verification helpers (no single end-to-end API case defined) |

**Manual-suite gaps identified from this mapping** (i.e. gaps *within* the existing manual test design, not yet automation gaps):
- No manual API cases directly target `/api/part-parameter/` or `/api/part/test-template/` **variant cascade** behaviour (only the UI case `UI-PART-069` covers cascade).
- No manual case (UI or API) exercises `variant_of` self-reference/circularity, mirroring the equivalent, well-covered revision cases (`UI-PART-067/068`) — flagged as a documented gap.
- Concurrency (`UI-PART-096`, `API-PART-069`) and malformed-JSON/security cases (`API-PART-070`, `UI-PART-084`) exist but are marked `Automation Candidate = No` for the malformed-JSON case, appropriate given manual/exploratory nature.

## 4. Coverage mapping: manual suite → implemented UI automation

Implemented automation lives under `automation/ui` (Playwright + Page-Object-Model; 9 spec files, read-only reviewed, **not modified**). Automation was written against a live instance and several page objects carry explicit "Source note (confirmed via live UI)" comments — these are `[LIVE]` evidence, distinct from the `[DOC]`/`[CODE]` facts above, and in at least one case (`PartStockPage`'s `location` field locator) **contradict** what the checked-out frontend source implies, which is exactly the kind of discrepancy this document is asked to flag explicitly.

| Automated spec | Business flow exercised | Nearest manual test ID(s) | Evidence tag |
|---|---|---|---|
| `tests/login/login.spec.js` | Login page load; valid-credential login | (prerequisite, not in xlsx) | `[LIVE]` |
| `tests/parts/part-create.spec.js` | Create part (name, IPN, description) | UI-PART-001 (subset — minimum fields only, no category) | `[LIVE]` |
| `tests/parts/part-validation.spec.js` | Reject Create-Part with blank Name; confirm no orphan record by IPN search | UI-PART-003 | `[LIVE]` |
| `tests/parts/part-edit.spec.js` | Search, open, edit name/description; IPN pinned unchanged | UI-PART-053 | `[LIVE]` |
| `tests/parts/part-stock.spec.js` | Create part → add Stock Item (qty only) → verify item + part total | UI-PART-077 (subset — positive path only) | `[LIVE]` |
| `tests/parts/part-parameter.spec.js` | Create part → inline-create Parameter Template → add Parameter → verify | UI-PART-057 + UI-PART-058 (combined) | `[LIVE]` |
| `tests/categories/category-hierarchy.spec.js` | Create root category → create child category → verify hierarchy | UI-PART-019 + UI-PART-020 | `[LIVE]` |
| `tests/categories/part-category-assignment.spec.js` | Create category tree → create part under child category → verify category on detail page → verify part listed under category | UI-PART-020 + part-of-category assignment (no exact UI-PART ID; closest is UI-PART-024 filtering) | `[LIVE]` |
| `tests/regression/part-cross-functional.spec.js` | Full chain: category hierarchy → part-in-category → parameter → stock → re-discover part under category | REQ-010 end-to-end scenario | `[LIVE]` |

**Design characteristics observed in the automation (source-code findings, `[CODE]` on the automation itself):**
- All flows use unique, timestamp+random test data factories (`data/*.js`) — safe for repeated/parallel runs, no fixed sleeps, auto-retrying Playwright assertions throughout.
- Credentials are injected via `automation/ui/config/environment.js` (`.env`, not committed) with a fail-fast `assertCredentialsAvailable()` guard.
- Locator strategy is consistently accessibility-role/aria-label based, with inline comments citing the specific InvenTree frontend source file/component backing each locator convention — a strong resilience signal, though it also means the suite has an implicit dependency on the currently-deployed frontend build matching that convention (already shown to diverge once, per the `PartStockPage` note above).

## 5. Gaps: documented/business rules with **no** automated UI coverage

The following capabilities from §2 are documented and are present as manual test cases, but have **no** corresponding Playwright spec today:

| Area | Uncovered capability | Manual case(s) |
|---|---|---|
| IPN rules | Optional IPN, duplicate-IPN allow/deny setting, IPN regex enforcement | UI-PART-004…007 |
| Units | Unit of measure creation/validation | UI-PART-008…009 |
| Stock thresholds | Min/Max stock boundary and ordering validation | UI-PART-010…011 |
| Text boundaries | Name at/over max length (100 chars per schema, §API doc) | UI-PART-012…013 |
| Import | File import (valid/mixed/invalid/unsupported/empty) | UI-PART-014…018 |
| Categories | Move category, self-parent/circular prevention, delete (empty & non-empty), permissions | UI-PART-021…023, 026…027, 030 |
| Attributes | Virtual/Template/Assembly/Component/Trackable/Purchaseable/Salable/Active toggles and their side-effects | UI-PART-031…041 |
| Detail tabs | Stock, BOM, Allocated, Build Orders, Variants, Revisions, Attachments, Related Parts, Test Templates tabs; cross-tab navigation | UI-PART-042…052 |
| Delete | Delete inactive part, block active-part delete, block referenced-component delete | UI-PART-054…056 |
| Parameters | Incompatible-unit rejection, category-template inheritance, edit/delete, numeric boundaries | UI-PART-059…064 |
| Templates & Variants | Template creation, variant creation, self/circular variant prevention, test-template cascade | UI-PART-065…069 |
| Revisions | All revision creation/uniqueness/circularity/template-restriction/setting cases | UI-PART-070…076 |
| Supporting flows | BOM add/self-reference/validate, attachments (valid/unsafe), related-parts add/duplicate, test-template create/duplicate/disable, permission checks, search/filter/pagination/sort, concurrency | UI-PART-078…096 |

API automation was subsequently implemented against the Tier 1 scope recommended in `docs/API_Schema_Analysis.md §10` (`automation/api` — `auth.spec.js`, `part-crud.spec.js`, `part-validation.spec.js`, `part-search-pagination.spec.js`), covering a slice of the 70 API manual cases (`API-PART-001…070`). It is **not** a 1:1 automation of every manual API case — see `docs/Automation_Coverage_Summary.md` for the authoritative, per-requirement breakdown of what is actually automated vs. still a gap.

## 6. Summary of unresolved / unverifiable items

These are called out explicitly per the "mark anything not verifiable as an assumption" requirement — a reviewer should confirm each against a live instance before relying on it:

1. Whether `minimum_stock > maximum_stock` is actually rejected anywhere (UI or API) — no schema-level or documented constraint found (`[ASSUMPTION]`).
2. Whether category self-parent / deep circular parenting is actively rejected with a clear error, vs. silently prevented by the tree library, vs. not prevented at all (`[ASSUMPTION]`).
3. Whether `variant_of` self-reference/circular chains are rejected the same way `revision_of` self-reference is (`[ASSUMPTION]`) — the documentation only makes the equivalent guarantee explicit for revisions, not variants.
4. Exact wording/shape of 400/401/403/404 error payloads for `/api/part/` and `/api/part/category/` — the local OpenAPI YAML documents only the success (`2xx`) response schemas for these endpoints; error-body shape must be confirmed by live execution (see `docs/API_Schema_Analysis.md §2`).
