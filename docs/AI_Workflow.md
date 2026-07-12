# AI-Assisted Development Workflow

**Scope:** describes the end-to-end lifecycle actually followed to produce this assignment's artifacts — the requirements/coverage analysis (`docs/Requirements_And_Coverage_Summary.md`), the OpenAPI analysis (`docs/API_Schema_Analysis.md`), the manual test suite (`test-cases/InvenTree_Parts_QA_Test_Cases.xlsx`), and the Playwright UI (`automation/ui`) and API (`automation/api`) automation.
**Audience:** reviewers who need to understand *how* the AI-assisted deliverables were produced, not just *what* they contain.
**Guardrail honoured throughout:** InvenTree application source and the automation code under `automation/` were treated as read-only inputs during analysis; every correction described here was made deliberately, reviewed, and re-validated — not applied silently.

## 1. How to read this document

The same evidence-tagging convention used in `docs/Requirements_And_Coverage_Summary.md` and `docs/API_Schema_Analysis.md` applies here:

| Tag | Meaning |
|---|---|
| `[DOC]` | Sourced from official InvenTree documentation |
| `[CODE]` | Sourced from reading the read-only InvenTree backend source |
| `[LIVE]` | Observed by executing the Playwright suites against a running InvenTree instance |
| `[ASSUMPTION]` | Not verifiable within this exercise; flagged for confirmation |

## 2. The eleven-stage lifecycle

### 2.1 Requirements analysis
Started from `source-specifications/Problem Statement.pdf` (for the risk-based strategy deliverable) and the InvenTree Parts domain (for the automation deliverable). Business rules, attributes, and workflows were catalogued and immediately tagged by evidence source rather than asserted as fact — the discipline that produced `docs/Requirements_And_Coverage_Summary.md` §2. Gaps in the manual test design itself were surfaced at this stage (e.g. no case for `variant_of` self-reference), not deferred to automation.

### 2.2 Documentation ingestion
Each business rule identified in 2.1 was cross-checked against the relevant `docs.inventree.org` page (Part creation, Part attributes, Categories, Parameters, Templates/Variants, Revisions, Test Templates, Views) and tagged `[DOC]`. Where the documentation was silent or ambiguous (e.g. category self-parent prevention, `minimum_stock`/`maximum_stock` ordering), the claim was tagged `[ASSUMPTION]` instead of guessed at — see `docs/Requirements_And_Coverage_Summary.md` §6.

### 2.3 OpenAPI analysis
The local, read-only `source-specifications/inventree-openapi.yaml.yaml` (OpenAPI 3.0.3, schema version `511`) was parsed field-by-field for the `Part` and `PartCategory` schemas — required/optional/nullable/read-only/`maxLength`/defaults — and cross-referenced against `InvenTree/src/backend/InvenTree/part/models.py` for business rules the schema alone can't express (deletion guards, revision constraints, structural-category rules). This produced `docs/API_Schema_Analysis.md`, including the Tier 1/2/3 recommended automation scope in its §10 that directly shaped 2.5 below.

### 2.4 Prompt engineering
Automation and analysis work was decomposed into staged prompts, documented under `prompts/` (`01-requirements-analysis.md`, `02-api-analysis.md`, `03-ui-automation.md`, `04-api-automation.md`) so each generation pass had a single, scoped objective (e.g. "generate the Part-category UI Page Objects and specs" rather than "build the whole suite"), with the OpenAPI/requirements analyses from 2.1–2.3 supplied as grounding context to reduce hallucinated fields or business rules. Each prompt file records its objective, grounding context, the actual prompt used, expected output, and follow-up notes, so the decomposition is auditable after the fact rather than only implied by commit history.

### 2.5 Code generation
Working from the Tier 1 scope in `docs/API_Schema_Analysis.md` §10 and the manual case IDs in `docs/Requirements_And_Coverage_Summary.md` §3–4, the Page-Object-Model UI suite (`automation/ui/pages/*.js`, `automation/ui/tests/**/*.spec.js`) and the service-layer API suite (`automation/api/services/*.js`, `automation/api/tests/*.spec.js`) were generated. Locators were generated against the InvenTree frontend source's own conventions (e.g. `text-field-<name>`, `action-button-<identifierString(tooltip)>`) — a starting hypothesis later corrected where the deployed build diverged from that source (§2.7 below).

### 2.6 Live execution
Every spec was run against a real, running InvenTree instance (Docker, reverse-proxied host `inventree.localhost` for the UI suite; `127.0.0.1` + explicit `Host` header for the API suite — see `automation/api/config/environment.js`) rather than accepted on generation alone. This is what the `[LIVE]` tag throughout the analysis docs refers to, and it is the stage that surfaced every issue logged in `docs/AI_Change_Log.md`.

### 2.7 Failure analysis
Failures were triaged by symptom before being assumed to be automation bugs: a Playwright strict-mode violation (multiple matching locators), a URL-pattern timeout, an unexpected `401`, or an `ENOTFOUND`/DNS error each point at a different layer (locator ambiguity, app-level routing quirk, auth handshake mismatch, network/host configuration respectively). Each failure's raw error text and stack trace was read first, before opening a trace.

### 2.8 Playwright trace analysis
`automation/ui/playwright.config.js` captures `screenshot: 'only-on-failure'` and `trace: 'retain-on-failure'`; `automation/api/playwright.config.js` produces an HTML report. Failing runs were re-inspected via `npx playwright show-trace <trace.zip>` (UI) and the HTML report (API) to confirm the *exact* DOM state, network request/response, and console output at the point of failure — e.g. confirming the doubly-nested `/web/web/part/<id>/stock/stock` URL from the Stock-navigation issue, or the literal `401` body from the DNS/host-header issue, rather than inferring root cause from the assertion message alone.

### 2.9 Human review
Every proposed root cause and fix was reviewed against the live evidence before being accepted — in practice, this meant re-reading the relevant InvenTree frontend source alongside the trace to confirm the fix targeted the actual divergence (e.g. confirming via source that `RelatedModelField.tsx` really does render a combobox, not a `TreeField`, for the deployed build) rather than papering over the symptom with a longer timeout or a broader locator.

### 2.10 AI corrections
Corrections were scoped to the smallest unit that fixed the confirmed root cause — a single locator, a single navigation call, a single header — and always paired with an inline "Source note (confirmed/corrected via live UI)" comment in the affected page object or service, so the next reader inherits the evidence, not just the fix. The six representative corrections are catalogued in detail in `docs/AI_Change_Log.md`.

### 2.11 Final validation
After each correction, the specific failing spec was re-run to confirm the fix, then the full suite (or at minimum every spec sharing the corrected page object/service) was re-run to confirm no regression — e.g. the Stock-navigation fix was validated against both `part-stock.spec.js` (single-tab case, unaffected) and `part-cross-functional.spec.js` (multi-tab case, the one that had exposed the bug). This is also the stage that produced the coverage picture now formalised in `docs/Automation_Coverage_Summary.md`.

## 3. Workflow diagram

```
                    ┌────────────────────────────┐
                    │ 1. Requirements Analysis    │
                    │   Problem Statement / docs  │
                    └──────────────┬─────────────┘
                                   ▼
                    ┌────────────────────────────┐
                    │ 2. Documentation Ingestion  │
                    │   docs.inventree.org  [DOC] │
                    └──────────────┬─────────────┘
                                   ▼
                    ┌────────────────────────────┐
                    │ 3. OpenAPI Analysis         │
                    │   inventree-openapi.yaml    │
                    └──────────────┬─────────────┘
                                   ▼
                    ┌────────────────────────────┐
                    │ 4. Prompt Engineering       │
                    │   prompts/01..04-*.md       │
                    └──────────────┬─────────────┘
                                   ▼
                    ┌────────────────────────────┐
                    │ 5. Code Generation          │
                    │   automation/ui, api        │
                    └──────────────┬─────────────┘
                                   ▼
              ┌───────────────────────────────────────┐
              │ 6. Live Execution against real         │◄────────┐
              │    InvenTree instance            [LIVE]│         │
              └────────────────────┬────────────────────┘         │
                                   ▼                               │
                    ┌────────────────────────────┐                │
                    │ 7. Failure Analysis         │                │
                    │   symptom -> likely layer   │                │
                    └──────────────┬─────────────┘                │
                                   ▼                               │
                    ┌────────────────────────────┐                │
                    │ 8. Playwright Trace Analysis│                │
                    │   trace viewer / HTML report│                │
                    └──────────────┬─────────────┘                │
                                   ▼                               │
                    ┌────────────────────────────┐                │
                    │ 9. Human Review             │                │
                    │   confirm root cause vs.    │                │
                    │   source + evidence         │                │
                    └──────────────┬─────────────┘                │
                                   ▼                               │
                    ┌────────────────────────────┐                │
                    │ 10. AI Corrections          │                │
                    │   minimal fix + source note │                │
                    └──────────────┬─────────────┘                │
                                   ▼                               │
                    ┌────────────────────────────┐                │
                    │ 11. Final Validation        │                │
                    │   re-run spec + full suite  │────────────────┘
                    └──────────────┬─────────────┘   (next spec / endpoint)
                                   ▼
                    ┌────────────────────────────┐
                    │ Coverage & Change-Log docs  │
                    │   (this doc set, docs/)     │
                    └────────────────────────────┘
```

Stages 6–11 form a tight feedback loop: a failure in live execution (6) drives failure analysis (7), trace evidence (8), human review (9), a corrective change (10), and re-validation (11) — which then either passes (moving on to the next spec/endpoint) or is re-analysed if the fix was incomplete.

## 4. Guardrails observed throughout

- No InvenTree application source and no automation source under `automation/` was modified purely to produce analysis documents — only the six corrections in `docs/AI_Change_Log.md` touched automation code, and each was tied to `[LIVE]` evidence of an actual failure.
- Every factual claim in the analysis docs carries an evidence tag (`[DOC]`/`[CODE]`/`[LIVE]`/`[ASSUMPTION]`); this workflow document follows the same convention.
- Corrections were kept minimal and localized (one locator, one navigation call, one header) rather than broad rewrites, to keep the blast radius of an AI-authored change small and reviewable.
