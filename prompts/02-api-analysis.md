# Prompt 02 — API (OpenAPI Schema) Analysis

## Objective

Parse the local InvenTree OpenAPI contract for the `Part` and `PartCategory` schemas field-by-field, cross-reference business rules the schema alone cannot express against the backend source, and produce a tiered, risk-prioritized recommendation for API automation scope.

## Context

- Primary source: `source-specifications/inventree-openapi.yaml.yaml` (OpenAPI 3.0.3, `info.version: '511'`), read-only, unmodified.
- Secondary source: `InvenTree/src/backend/InvenTree/part/models.py` (read-only), used only where the schema is silent on a business rule (e.g. deletion guards, revision constraints, structural-category rules).
- Grounding input: `docs/Requirements_And_Coverage_Summary.md` (Prompt 01 output) — the same evidence-tagging convention (`[DOC]`/`[CODE]`/`[LIVE]`/`[ASSUMPTION]`) had to be reused for consistency.
- `automation/api` was empty at this stage — this analysis was the input to Prompt 04, not a description of existing automation.

## Final prompt used

"Read `source-specifications/inventree-openapi.yaml.yaml` and extract the full endpoint inventory for `/api/part/` and `/api/part/category/` plus their adjacent sub-resources (parameters, test templates, related parts). For the `Part` and `PartCategory` schemas, produce a field table (type, writable/read-only, nullable, default, `maxLength`) citing the exact line numbers in the YAML. For any business rule not visible in the schema — deletion guards, revision constraints, structural-category enforcement, FK on-delete behaviour — check `InvenTree/src/backend/InvenTree/part/models.py` and cite file:line, tagging `[CODE]`. Document filters/search/ordering/pagination and the authentication/permission scheme (`tokenAuth`/`basicAuth`/`cookieAuth`/`oauth2`, per-operation OAuth2 scopes). Finish with a tiered automation recommendation: Tier 1 = schema/code-grounded and safe to automate first, Tier 2 = documented but needs a live spike before locking assertions, Tier 3 = secondary/related endpoints. Produce this as `docs/API_Schema_Analysis.md`."

## Expected output

A markdown document with: an endpoint inventory (Part, PartCategory, adjacent parameter/test-template endpoints); a CRUD operations summary; full field tables for `Part` and `PartCategory` with line-number citations; a relational-integrity table (FK targets, nullability, on-delete behaviour); an authentication/permission section (schemes + per-operation OAuth2 scopes); a filters/search/pagination section; and a final "Recommended API automation scope" section split into Tier 1/2/3.

## Notes

- The `PUT`/`PATCH` list-endpoint quirk (bulk-update alias, not a collection replace) and the absence of any documented `4xx` error schema were flagged explicitly rather than assumed — both were later confirmed live during Prompt 04's execution phase.
- The Tier 1 list produced here became the direct scope boundary for the API automation prompt (Prompt 04); nothing in Tier 2/3 was pulled into the initial automation pass.
- Several `[ASSUMPTION]` items from this pass (category circular-parent rejection, `min/max_stock` ordering, exact error-body shape) remained open after automation and are tracked as gaps rather than resolved by inference.
