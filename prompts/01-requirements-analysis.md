# Prompt 01 — Requirements Analysis

## Objective

Analyze the InvenTree Parts / Part Category domain (business rules, attributes, lifecycle, categories, parameters, templates/variants, revisions, test templates) and produce an evidence-tagged requirements and coverage summary that the manual test suite and automation stages can be grounded on.

## Context

- Subject under test: InvenTree (open-source inventory/parts management system), Parts & Part Category domain.
- Inputs available: official InvenTree documentation (`docs.inventree.org`), the read-only InvenTree backend source checkout (`InvenTree/src/backend/InvenTree/part/models.py`), and the manual test workbook (`test-cases/InvenTree_Parts_QA_Test_Cases.xlsx`, RTM sheet `REQ-001…010`).
- Assignment guardrail: distinguish documented facts from source-code findings, live observations, and unverifiable assumptions — nothing may be asserted as fact without a stated source.
- No InvenTree source may be modified during analysis.

## Final prompt used

"Read the InvenTree documentation pages for Part creation, Part attributes, Categories, Parameters, Templates/Variants, Revisions, Test Templates, and Views. Cross-check every business rule you catalogue against the read-only backend source under `InvenTree/src/backend/InvenTree/part/models.py`, citing file:line where a rule is confirmed there. Tag every claim as `[DOC]`, `[CODE]`, `[LIVE]`, or `[ASSUMPTION]` — use `[ASSUMPTION]` explicitly for anything neither the docs nor the code confirm (e.g. category self-parent prevention, `variant_of` self-reference, `minimum_stock`/`maximum_stock` ordering). Then map each business area to its corresponding manual test-case ID range from `test-cases/InvenTree_Parts_QA_Test_Cases.xlsx`'s RTM sheet, and call out any gaps within the manual suite itself — not just gaps in automation. Produce this as `docs/Requirements_And_Coverage_Summary.md`."

## Expected output

A single markdown document with: an evidence-tagging legend; per-business-area rule tables (creation/identity, attributes/lifecycle, categories, parameters/templates, templates/variants, revisions, test templates, detail-tab visibility); a coverage-mapping table from each business area to its `REQ-00x` requirement and manual case IDs; an explicit list of manual-suite gaps; and a closing section enumerating every unresolved/unverifiable item flagged as `[ASSUMPTION]`.

## Notes

- Every table row was expected to carry its evidence tag inline — rows without a clear source were rejected and re-derived or explicitly flagged rather than left ambiguous.
- This document became the grounding input for the OpenAPI analysis (Prompt 02) and the automation prompts (Prompts 03–04), so its evidence tags were treated as load-bearing, not decorative.
- Assumptions surfaced here (category circular-parent guard, `variant_of` self-reference, `min/max_stock` ordering) were carried forward unchanged into later stages rather than silently resolved.
