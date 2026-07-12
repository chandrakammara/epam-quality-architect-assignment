# API Schema Analysis — Part & Part Category

**Primary source of truth:** `source-specifications/inventree-openapi.yaml.yaml` (OpenAPI 3.0.3, `info.version: '511'`, local, read-only). All field-level facts (types, `maxLength`, `nullable`, `readOnly`, defaults, enums) are taken directly from this file and cited by line number. Business-rule facts that are **not** visible in the schema (e.g. why a field is rejected) are cross-checked against the read-only `InvenTree/src/backend/InvenTree/part/models.py` source and tagged `[CODE]`; anything neither the YAML nor the code confirms is tagged `[ASSUMPTION]`. No InvenTree or automation source was modified to produce this analysis.

## 1. Endpoint inventory

### 1.1 Part

| Endpoint | Methods | Purpose |
|---|---|---|
| `/api/part/` | `GET`, `POST`, `PUT`\*, `PATCH`\* | List/filter (`GET`), create (`POST`); `PUT`/`PATCH` here are **bulk** operations, not single-record ergonomics — see §2 |
| `/api/part/{id}/` | `GET`, `PUT`, `PATCH`, `DELETE` | Standard single-record CRUD |
| `/api/part/{id}/bom-copy/` | `POST` | Copy a BOM from another part into this one (`PartCopyBOM`) |
| `/api/part/{id}/bom-validate/` | `GET`, `PUT`, `PATCH` | Read/trigger BOM validation status (`PartBomValidate`) |
| `/api/part/{id}/pricing/` | `GET`, `PUT`, `PATCH` | Part pricing summary (`PartPricing`) |
| `/api/part/{id}/requirements/` | `GET` | Build/sales-order requirement rollup (`PartRequirements`) — read-only, deliberately excluded from the default `Part` payload (line 14617-14630) |
| `/api/part/{id}/serial-numbers/` | `GET` | Latest/next serial number info (`PartSerialNumber`) |
| `/api/part/related/` , `/api/part/related/{id}/` | `GET`,`POST` / `GET`,`PUT`,`PATCH`,`DELETE` | "Related Parts" relationship CRUD (`PartRelation`) |
| `/api/part/test-template/` , `/api/part/test-template/{id}/` | `GET`,`POST` / `GET`,`PUT`,`PATCH`,`DELETE` | Test Template CRUD (`PartTestTemplate`) |
| `/api/part/stocktake/`, `/api/part/stocktake/{id}/`, `/api/part/stocktake/generate/` | list/detail/generate | Stocktake records (out of core scope, listed for completeness) |
| `/api/part/internal-price/`, `/api/part/sale-price/` (+ `{id}/`) | CRUD | Price-break tables (out of core scope) |
| `/api/part/thumbs/`, `/api/part/thumbs/{id}/` | `GET` | Image-thumbnail aggregation (out of core scope) |

\* `part_bulk_update` / `part_bulk_partial_update` on the **list** endpoint are documented in the schema itself as: *"Perform a PUT/PATCH operation against this list endpoint... redirects to the PATCH method"* (lines 14166-14233) — i.e. `PUT` on the list endpoint does **not** behave like a REST "replace collection"; it is a bulk-update alias for `PATCH`. This is a documentation-worthy quirk for anyone reading the spec casually.

### 1.2 Part Category

| Endpoint | Methods | Purpose |
|---|---|---|
| `/api/part/category/` | `GET`, `POST`, `PUT`\*, `PATCH`\* | List/filter, create; `PUT`/`PATCH` are bulk aliases, same caveat as Part |
| `/api/part/category/{id}/` | `GET`, `PUT`, `PATCH`, `DELETE` | Standard single-record CRUD |
| `/api/part/category/tree/` | `GET` | Lightweight tree projection (`CategoryTree` — no `default_location`/`default_keywords`, adds `tree_id`) |
| `/api/part/category/parameters/`, `/api/part/category/parameters/{id}/` | `GET`,`POST` / `GET`,`PUT`,`PATCH`,`DELETE` | Category→ParameterTemplate default-value mappings (`CategoryParameterTemplate`) |

### 1.3 Adjacent endpoints relevant to Parts functionality (not under `/api/part/` but load-bearing for Parameters/Templates)

| Endpoint | Purpose |
|---|---|
| `/api/parameter/`, `/api/parameter/{id}/` | Generic `Parameter` CRUD — used for **Part** parameters via `model_type='part'` + `model_id=<part pk>` (polymorphic; see §4) |
| `/api/parameter/template/`, `/api/parameter/template/{id}/` | `ParameterTemplate` CRUD — the template every Parameter must reference |

## 2. CRUD operations summary

| Model | Create | Read (list) | Read (detail) | Update | Delete |
|---|---|---|---|---|---|
| Part | `POST /api/part/` → `201` | `GET /api/part/` → `200`, paginated | `GET /api/part/{id}/` → `200` | `PUT`/`PATCH /api/part/{id}/` → `200` | `DELETE /api/part/{id}/` → `204` |
| PartCategory | `POST /api/part/category/` → `201` | `GET /api/part/category/` → `200`, paginated | `GET /api/part/category/{id}/` → `200` | `PUT`/`PATCH /api/part/category/{id}/` → `200` | `DELETE /api/part/category/{id}/` → `204` |

The schema documents only the success response (`200`/`201`/`204`) for every Part/Category operation — no `400`/`401`/`403`/`404` response bodies are defined anywhere in the spec for these paths. This is consistent with drf-spectacular's default behaviour (it does not auto-document DRF's generic error shapes) and means **exact error-response shape must be confirmed by live execution**, not assumed from the YAML — flagged as `[ASSUMPTION]` until verified (see also `docs/Requirements_And_Coverage_Summary.md §6`).

## 3. Part fields — required / optional / nullable / read-only / defaults

Source: `Part` schema, `source-specifications/inventree-openapi.yaml.yaml:29034-29296`. The schema's own `required:` block (`barcode_hash`, `category_name`, `full_name`, `name`, `pk`, `starred`, `thumbnail`) is drf-spectacular's **response-completeness** list (fields always present in output), not a request-body requirement list. Cross-referencing which fields have neither a `default` nor `nullable: true` shows **`name` is the only field an API client must supply to `POST /api/part/`** — every other writable field is optional (has a default, is nullable, or is a plain boolean that defaults falsy server-side).

| Field | Type | Writable? | Nullable | Default | Max length | Notes |
|---|---|---|---|---|---|---|
| `name` | string | ✅ required | no | — | **100** | Only mandatory input field |
| `IPN` | string | ✅ optional | no | `''` | **100** | Duplicate-allowed policy is a global setting, not a schema constraint — `[CODE]` |
| `description` | string | ✅ optional | no | — | **250** | |
| `revision` | string | ✅ optional | yes | `''` | **100** | See revision constraints in Requirements doc §2.6 |
| `keywords` | string | ✅ optional | yes | — | **250** | |
| `link` | string (uri) | ✅ optional | yes | — | **2000** | |
| `units` | string | ✅ optional | yes | — | **20** | Must be a valid physical unit per docs — not enforced at schema level |
| `category` | integer (FK) | ✅ optional | yes | — | — | See §5 relational integrity |
| `default_location` | integer (FK) | ✅ optional | yes | — | — | |
| `responsible` | integer (FK) | ✅ optional | yes | — | — | |
| `variant_of` | integer (FK) | ✅ optional | yes | — | — | See §5 |
| `revision_of` | integer (FK) | ✅ optional | yes | — | — | See §5 |
| `default_expiry` | integer | ✅ optional | no | — | max **2147483647**, min **0** | |
| `minimum_stock` / `maximum_stock` | number (double) | ✅ optional | no | `0.0` | — | No cross-field constraint in schema — `[ASSUMPTION]` re: enforcement |
| `active`, `assembly`, `component`, `is_template`, `locked`, `purchaseable`, `salable`, `testable`, `trackable`, `virtual` | boolean | ✅ optional | no | not shown in schema (model-level default, not spec-visible) | — | Plain booleans, no enum |
| `image` | string (uri) | ✅ optional (upload) | yes | — | — | |
| `existing_image` | string | ✍️ write-only | no | — | — | Filename of an existing image to reuse |
| `duplicate` | object (`DuplicatePart`) | ✍️ write-only | — | — | — | Triggers server-side "duplicate part" flow (see below) |
| `initial_stock` | object (`InitialStock`) | ✍️ write-only | — | — | — | Optional initial stock creation in the same request |
| `initial_supplier` | object (`InitialSupplier`) | ✍️ write-only | — | — | — | Optional initial supplier/manufacturer link |
| `copy_category_parameters` | boolean | ✍️ write-only | no | `true` | — | |
| `pk`, `barcode_hash`, `category_name`, `full_name`, `starred`, `thumbnail`, `creation_date`, `creation_user`, `revision_count`, `pricing_min`, `pricing_max`, `pricing_updated`, `in_stock`, `total_in_stock`, `unallocated_stock`, `variant_stock`, `external_stock`, `allocated_to_build_orders`, `allocated_to_sales_orders`, `building`, `scheduled_to_build`, `ordering`, `required_for_build_orders`, `required_for_sales_orders`, `stock_item_count`, `category_default_location` | various | 🔒 read-only | mostly yes | — | — | Server-computed; any client-supplied value is ignored, not rejected — `[ASSUMPTION]` on exact server behaviour (silently dropped vs. `400`), pending live verification |

**`DuplicatePart` sub-schema** (`part` required; `copy_image`, `copy_bom`, `copy_parameters` default `false`; `copy_notes` default `true`; `copy_tests` default `false`) — this is the same server-side action the UI's "Duplicate Part" form (used for Revisions and Variants — see Requirements doc §2.5/2.6) drives.

**`InitialStock`** — `quantity` required (decimal, pattern `^-?\d{0,10}(?:\.\d{0,5})?$`), `location` optional/nullable.

## 4. Part Category fields — required / optional / nullable / read-only / defaults

Source: `Category` schema, lines 24383-24453.

| Field | Type | Writable? | Nullable | Max length | Notes |
|---|---|---|---|---|---|
| `name` | string | ✅ required | no | **100** | Only mandatory input field |
| `description` | string | ✅ optional | no | **250** | |
| `default_location` | integer (FK) | ✅ optional | yes | — | |
| `default_keywords` | string | ✅ optional | yes | **250** | |
| `parent` | integer (FK, self) | ✅ optional | yes | — | See §5 relational integrity |
| `structural` | boolean | ✅ optional | no | — | Blocks direct part assignment; `[CODE]` also blocks toggling this on if parts already exist directly under the category (part/models.py:173-185) |
| `icon` | string | ✅ optional | yes | **100** | |
| `pk`, `level`, `part_count`, `subcategories`, `pathstring`, `starred`, `parent_default_location` | various | 🔒 read-only | mostly yes | — | `level`/`pathstring` are MPTT-tree-derived |

`CategoryTree` (list projection for `/api/part/category/tree/`, lines 24485-24531) mirrors most of the same fields but adds `tree_id` (read-only) and omits `default_location`/`default_keywords`/`starred`/`part_count`/`parent_default_location`.

## 5. Related sub-resource fields (Parameters, Test Templates, Related Parts)

| Model | Required fields | Key constraints |
|---|---|---|
| `Parameter` (generic, `/api/parameter/`) | `template`, `model_id`, `data` | `data`: string, **1–500** chars (`minLength: 1`, `maxLength: 500`, lines 28949-28953); `model_type` defaults to `''` (must be set to target a Part); no DB-level FK from `model_id`→target row — it is a generic (polymorphic) reference, so referential integrity for `model_id` is **application-enforced only**, not database-enforced — `[CODE]`/`[ASSUMPTION]` boundary worth testing directly (e.g. orphaned `model_id`) |
| `ParameterTemplate` (`/api/parameter/template/`) | `name` | `name` maxLength **100** (must be unique per `[DOC]`, not visible as a schema-level `unique` flag); `units` maxLength **25**; `choices` maxLength **5000** |
| `PartTestTemplate` (`/api/part/test-template/`) | `part`, `test_name` | `test_name`/`description` maxLength **100**; `choices` maxLength **5000**; `key` is server-derived + read-only (lines 29901-29903); uniqueness of `test_name` per part is `[DOC]`-only, not visible in the schema |
| `CategoryParameterTemplate` (`/api/part/category/parameters/`) | `category`, `template` | `default_value` maxLength **500** |
| `PartRelation` (`/api/part/related/`) | `part_1`, `part_2` | `note` maxLength **500**; self-relation (`part_1 == part_2`) and duplicate-pair rejection are `[DOC]`-only per the manual test suite (`API-PART-050/051`), not visible as schema constraints — must be confirmed live |

## 6. Enums and boolean flags of note

- **`ordering` enum for `/api/part/`** (lines 14009-14039): `id/-id, name/-name, creation_date/-creation_date, IPN/-IPN, in_stock/-in_stock, total_in_stock/-total_in_stock, unallocated_stock/-unallocated_stock, category/-category, default_location/-default_location, units/-units, pricing_min/-pricing_min, pricing_max/-pricing_max, pricing_updated/-pricing_updated, revision/-revision, revision_count/-revision_count`.
- **`ordering` enum for `/api/part/category/`** (lines 14715-14733): `name/-name, pathstring/-pathstring, level/-level, tree_id/-tree_id, lft/-lft, part_count/-part_count`.
- **Boolean attribute filters/fields** on Part: `active, assembly, component, purchaseable, salable, trackable, virtual, testable, is_template, locked, is_variant, is_revision`. None of these are backed by an `enum:` construct in the schema — they are plain OpenAPI `boolean` types.
- No `enum:` list was found on any Part/Category *field* itself (as opposed to query-parameter `ordering`); status/state-style enums used elsewhere in the spec (e.g. `ColorEnum`, `ModelTypeD42Enum`) are not part of the core Part/Category payload.

## 7. Filters, search, ordering, pagination

### 7.1 Pagination

Both list endpoints use the same DRF `LimitOffsetPagination` shape (`PaginatedPartList` / `PaginatedCategoryList`: `count`, `next`, `previous`, `results[]` — lines 28009-28031), matching the Django settings `DEFAULT_PAGINATION_CLASS: LimitOffsetPagination` confirmed in `InvenTree/src/backend/InvenTree/InvenTree/settings.py:521` `[CODE]`.
- `limit` — **required** query parameter per the spec (line 13970-13975: `required: true`); in practice InvenTree's paginator applies a server-side default/max if omitted or excessive — exact default/max page size is not stated in the YAML and must be confirmed live — `[ASSUMPTION]`.
- `offset` — optional, no documented negative-value guard in the schema (`API-PART-031` in the manual suite specifically targets this).

### 7.2 Search

- `/api/part/`: `search` query param — full-text across `IPN, category__name, description, keywords, manufacturer_parts__MPN, name, revision, supplier_parts__SKU, tags__name, tags__slug` (line 14076-14078).
- `/api/part/category/`: `search` — across `description, name, pathstring` (line 14747).
- `/api/part/category/tree/`: `search` — across `description, name` (line 15236).

### 7.3 Key filters — Part list (`/api/part/`, lines 13832-14118)

Grouped for readability:
- **Attribute booleans:** `active, assembly, component, purchaseable, salable, trackable, virtual, testable`\*, `is_template, is_variant, is_revision, locked`.
- **Identity/text:** `IPN` (exact), `IPN_regex`, `name_regex`.
- **Hierarchy/relations:** `category` (accepts numeric id or literal `'null'`), `category_detail`, `cascade` (include child-category items), `ancestor`, `variant_of`, `revision_of`, `related` (show parts related to a given part id), `exclude_related`, `exclude_id[]`, `exclude_tree`, `in_bom_for`, `convert_from`.
- **Stock-derived:** `has_stock, depleted_stock, low_stock, high_stock, unallocated_stock, stock_to_build, has_units, has_ipn, has_pricing, has_revisions`.
- **Date:** `created_after`, `created_before` (both `format: date`).
- **Misc:** `default_location`, `starred`, `bom_valid`.
- **Response-shaping (not filters):** `category_detail`, `location_detail`, `parameters` (parameter expansion), `path_detail`, `price_breaks`, `tags`.

\* `testable` appears as a **filter** on the list endpoint but is also a **field** on the Part payload — both draw from the same underlying model attribute.

### 7.4 Key filters — Category list (`/api/part/category/`, lines 14685-14763)

`cascade`, `depth`, `exclude_tree`, `name`, `parent`, `path_detail`, `starred`, `structural`, `top_level`, plus generic `search`/`ordering`/`limit`/`offset`.

### 7.5 Category-tree-specific filters (`/api/part/category/tree/`, lines 15194-15242)

`level`, `max_level`, `parent`, `tree_id`, plus `search`/`ordering`/`limit`/`offset`.

## 8. Relational integrity constraints

| Relationship | FK target | Nullable | On-delete / restriction behaviour |
|---|---|---|---|
| `Part.category` → `PartCategory` | Part Category | yes | `[CODE]` `on_delete=CASCADE`-style cleanup not directly inspected here; a non-existent `category` id on write is rejected by DRF's `PrimaryKeyRelatedField` (`400`) — schema-level, not custom |
| `Part.default_location` → `StockLocation` | Stock Location | yes | Rejected on unknown id, same DRF mechanism |
| `Part.variant_of` → `Part` | Part | yes | `[CODE]` `limit_choices_to={'is_template': True}`, `on_delete=SET_NULL` (part/models.py:1115-1123) — i.e. only template parts are valid `variant_of` targets, and deleting the template nulls the reference rather than cascading |
| `Part.revision_of` → `Part` | Part | yes | `[CODE]` `on_delete=SET_NULL` (part/models.py:1167-1175); self-reference, revision-of-template, and mismatched-`variant_of` are rejected by `Part.validate_revision()` (part/models.py:774-809) — **model-level `clean()` validation, not visible in the OpenAPI schema itself** |
| `Part` uniqueness | `(name, revision, IPN)` combination + separate `revision_of`+`revision` uniqueness | — | `[CODE]` `Part.validate_unique()` (part/models.py:1013-1057) — likewise not expressible in the OpenAPI schema, since it's a multi-field DB-level check |
| `PartCategory.parent` → `PartCategory` | Part Category (self) | yes | Tree-consistency (no cycles) expected from the MPTT base class; explicit rejection path for self/circular parenting was **not** located in the reviewed code — `[ASSUMPTION]`, flagged for live verification |
| `Part` deletion | — | — | `[CODE]` blocked while `locked` (with `PART_ENABLE_LOCKING`), blocked while `active`, blocked if referenced as a BOM sub-part (unless `PART_ALLOW_DELETE_FROM_ASSEMBLY`) — part/models.py:581-599 |
| `PartCategory` deletion with parts/children | — | — | Behaviour (reassign vs. block) not located in the reviewed code paths within this analysis's time-box — `[ASSUMPTION]`, corresponds to manual case `API-PART-044` |
| `CategoryParameterTemplate.category`/`.template` | Part Category / Parameter Template | no (both required) | Standard FK validation |
| `PartRelation.part_1`/`.part_2` | Part / Part | no (both required) | Self-relation and duplicate-pair rejection are `[DOC]`-only (§5 above) |
| `PartTestTemplate.part` | Part | no (required) | Name-uniqueness-per-part is `[DOC]`-only, not schema-visible |
| `Parameter.model_id` + `model_type` | polymorphic, any model | no (both effectively required to be meaningful) | **Not** a database FK — no referential-integrity guarantee at the DB layer for an orphaned/incorrect `model_id` |

## 9. Authentication & permission considerations

**Authentication schemes** (`components.securitySchemes`, lines 38921-39041), all offered simultaneously on every Part/Category operation:
- `tokenAuth` — API key in the `Authorization` header, **required prefix `"Token"`** (line 39037-39041).
- `basicAuth` — HTTP Basic.
- `cookieAuth` — Django session cookie (`sessionid`).
- `oauth2` — Authorization-Code and Client-Credentials flows, with a fine-grained scope model (see below).

**DRF-level defaults** `[CODE]` (`InvenTree/src/backend/InvenTree/InvenTree/settings.py:515-527`):
- `DEFAULT_AUTHENTICATION_CLASSES`: token, HTTP Basic, Session, extended OAuth2.
- `DEFAULT_PERMISSION_CLASSES`: `IsAuthenticated` **+** InvenTree's own `ModelPermission` and `RolePermission` **+** `InvenTreeTokenMatchesOASRequirements` — i.e. every request must be authenticated *and* pass a model/role-based authorization check; unauthenticated requests are rejected before reaching any Part-specific logic.

**Per-operation OAuth2 scopes** required by the spec (representative, not exhaustive — every Part/Category path declares these consistently):

| Operation | Scope(s) required |
|---|---|
| `GET /api/part/`, `GET /api/part/{id}/` | `r:view:part` (+ `r:view:build` on some views) |
| `POST /api/part/` | `r:add:part` (+ `r:add:build`) |
| `PUT`/`PATCH /api/part/{id}/` | `r:change:part` (+ `r:change:build`) |
| `DELETE /api/part/{id}/` | `r:delete:part` (+ `r:delete:build`) |
| `GET /api/part/category/`, detail | `r:view:part_category` (+ `r:view:build`) |
| `POST /api/part/category/` | `r:add:part_category` |
| `PUT`/`PATCH /api/part/category/{id}/` | `r:change:part_category` |
| `DELETE /api/part/category/{id}/` | `r:delete:part_category` |

The recurring pairing of a Part-specific scope with a **Build**-role scope (e.g. `r:view:build` alongside `r:view:part`) reflects Parts being consumed by the Build/BOM subsystem — worth noting for anyone designing a minimal-privilege API test user, since a "parts read-only" role alone may not be sufficient depending on which nested fields/actions are exercised.

**Read/write asymmetry:** several fields are `readOnly` in the schema but represent business-significant state (`locked`, pricing, stock aggregates) — a test user with only `add`/`change` scope but no deeper permission cannot alter these via the Part endpoints regardless of payload content, which is a defense-in-depth property worth a dedicated negative test (attempt to set a read-only field and confirm it is ignored, not silently trusted).

## 10. Recommended API automation scope

At the time this analysis was written, `automation/api` contained only a placeholder (`.gitkeep`). The scope below, prioritised by risk and grounded in what this analysis could verify directly from the schema/code (vs. what still needs a spike to confirm live behaviour), was subsequently used to build the implemented suite — see `docs/Automation_Coverage_Summary.md` for what was actually automated against this scope, and what remains open:

### Tier 1 — high confidence, schema/code-grounded (safe to automate first)
1. **Part CRUD happy path**: `POST` with only `name` → `201`; `GET` detail → all documented fields present; `PATCH` a subset of fields → only those change; `DELETE` an inactive, unreferenced part → `204` then `404` on re-`GET`.
2. **Required-field validation**: `POST` with `name` omitted/`null` → `400`.
3. **Max-length boundaries**: `name`/`IPN`/`description`/`units`/`keywords`/`link` at and above their documented `maxLength` (§3) → accept at limit, reject above.
4. **Deletion guards** `[CODE]`-grounded: attempt delete of an `active` part → rejected; attempt delete of a `locked` part → rejected; attempt delete of a part referenced in another part's BOM → rejected (unless the `PART_ALLOW_DELETE_FROM_ASSEMBLY` setting is toggled, which is itself a good paired test).
5. **Revision constraints** `[CODE]`-grounded: self-`revision_of` → rejected; duplicate `(revision_of, revision)` pair → rejected; `revision_of` a template part → rejected; mismatched `variant_of` between a part and the one it revises → rejected.
6. **Category CRUD happy path + `structural` guard**: creating a part directly under a `structural` category, and flipping `structural=true` on a category that already has parts, per `[CODE]` in part/models.py:173-185.
7. **Filters/search/ordering/pagination**: at least one representative case per filter family in §7 (attribute boolean, hierarchy, date range, `search`, each `ordering` enum value, `limit`/`offset` boundaries including `offset=-1`).
8. **Authentication/authorization matrix**: unauthenticated request → `401`/`403`; authenticated-but-under-permissioned user → `403` on `POST`/`PATCH`/`DELETE` while `GET` still succeeds (or vice versa) — directly exercises the `ModelPermission`/`RolePermission` stack in §9.

### Tier 2 — documented but needs a live spike before locking in assertions
9. **IPN duplicate policy**: verify `PART_ALLOW_DUPLICATE_IPN` toggling actually flips accept/reject behaviour end-to-end (schema does not show this; `[CODE]`-confirmed logic exists but the live default and toggle path should be exercised once, then locked into a repeatable test).
10. **Category self-parent / circular parenting**: confirm rejection behaviour and exact error shape before writing a hard assertion (currently `[ASSUMPTION]`).
11. **`min/max_stock` relationship**: confirm whether `minimum_stock > maximum_stock` is actually rejected anywhere, or is purely advisory (currently `[ASSUMPTION]`).
12. **Error-body shape**: capture one real `400`/`401`/`403`/`404` payload per endpoint family and lock its shape into a shared assertion helper, since the OpenAPI file defines no error schemas for these paths.

### Tier 3 — secondary/related endpoints (automate after Tier 1/2 are stable)
13. `PartTestTemplate` CRUD + duplicate-name rejection + cascade-to-variants behaviour.
14. `PartRelation` CRUD + self-relation/duplicate-pair rejection.
15. `CategoryParameterTemplate` CRUD + invalid-category/-template rejection.
16. Generic `/api/parameter/` CRUD scoped to `model_type='part'`, including incompatible-unit rejection (per Requirements doc §2.4) and the polymorphic `model_id` integrity gap called out in §8.
17. `/api/part/category/tree/`, `/api/part/{id}/pricing/`, `/api/part/{id}/requirements/`, `/api/part/{id}/serial-numbers/`, `/api/part/{id}/bom-validate/`, `/api/part/{id}/bom-copy/` — one representative read (and, where applicable, write) test each, since these are lower-traffic/derived endpoints rather than core CRUD.

**Suggested tooling note (non-binding):** the existing UI suite is Playwright/JavaScript; a `supertest`- or `pw-api-request`-based API layer inside the same `automation/` workspace would let API tests reuse the existing `.env`/credential plumbing (`automation/ui/config/environment.js` pattern) without introducing a second language/runtime, but this is a recommendation for the architect to confirm, not a requirement inferred from any source reviewed here.
