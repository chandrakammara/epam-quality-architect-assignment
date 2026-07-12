# AI Prompt Catalog

**Scope:** a concise, single-document catalog of every AI-assisted engineering phase in this assignment — what each prompt was for, where its record lives, what it produced, and which deliverable it fed.
**Audience:** reviewers who want to understand the AI-assisted workflow end-to-end without opening every prompt file and every deliverable individually.
**Relationship to other docs:** this catalog is an index. `docs/AI_Workflow.md` describes the lifecycle in depth; `docs/AI_Change_Log.md` records the corrections that came out of live validation; `prompts/*.md` hold the full detail (objective, context, exact prompt text, notes) for the four phases that produced a standalone prompt file.

---

## 1. Introduction

AI (Cursor AI) was used as an engineering assistant throughout this assignment — for requirements and API-contract analysis, for generating the Playwright UI and API automation, and for producing the supporting documentation itself, including this catalog.

AI was not used as an unreviewed generator. Every output — a requirements table, a locator, a service method, an assertion, a documentation claim — was **reviewed, executed where applicable, validated against live evidence, and refined** before being accepted into the repository. Concretely:

- Analysis claims are evidence-tagged (`[DOC]` / `[CODE]` / `[LIVE]` / `[ASSUMPTION]`) rather than asserted outright — see `docs/Requirements_And_Coverage_Summary.md` §1 and `docs/API_Schema_Analysis.md`.
- Generated automation was executed against a real, running InvenTree instance, not accepted on generation alone — every failure was root-caused from an actual trace/HTML report before a fix was applied (`docs/AI_Change_Log.md`).
- No InvenTree application source, and no automation source, was modified purely to produce an analysis document — only the six evidence-driven corrections in `docs/AI_Change_Log.md` touched automation code.

The remainder of this catalog summarizes *which* AI-assisted phase produced *what*, then abstracts the engineering principles and validation lifecycle that were applied consistently across all of them.

---

## 2. Prompt Summary Table

| Phase | Objective | Prompt File | Expected Output | Related Deliverables |
|---|---|---|---|---|
| **Requirements Analysis** | Catalogue InvenTree Parts/Category business rules (creation, attributes, lifecycle, categories, parameters, templates/variants, revisions, test templates), evidence-tagged, mapped to manual test-case IDs. | `prompts/01-requirements-analysis.md` | Evidence-tagged rule tables + business-area → `REQ-00x` → manual-case-ID mapping + explicit manual-suite gaps. | `docs/Requirements_And_Coverage_Summary.md` |
| **API Specification Analysis** | Parse the OpenAPI contract for `Part`/`PartCategory` field-by-field, cross-reference business rules against backend source, produce a tiered automation-scope recommendation. | `prompts/02-api-analysis.md` | Endpoint inventory, field tables with line-number citations, auth/permission scheme, filters/pagination, Tier 1/2/3 automation scope. | `docs/API_Schema_Analysis.md` |
| **UI Automation** | Build a Page-Object-Model Playwright UI suite for the scoped Parts/Category flows, execute it against a live instance, correct it from real failure evidence. | `prompts/03-ui-automation.md` | 9 spec files + 6 Page Objects + data factories, all passing live, with inline source-note comments on corrected locators. | `automation/ui/`, `docs/AI_Change_Log.md` §1–3, §6 |
| **API Automation** | Build a service-layer Playwright `APIRequestContext` suite for `/api/part/` and `/api/part/category/`, scoped to the Tier 1 recommendation, validated live. | `prompts/04-api-automation.md` | 4 spec files + `BaseApiService`/`AuthService`/`PartService`/`CategoryService` + shared auth fixture, all passing live. | `automation/api/`, `docs/AI_Change_Log.md` §4–5 |
| **Documentation Generation** | Produce the reviewer-facing documentation set itself — AI process narrative, change log, framework architecture, repository README, and this catalog — consistent in tone and evidence discipline with the analysis docs. | *No dedicated `prompts/0X-*.md` file* — each document was generated from a direct, single-scope chat instruction rather than a saved prompt artifact. | One markdown document per instruction, cross-referencing the other deliverables it describes rather than duplicating their content. | `docs/AI_Workflow.md`, `docs/AI_Change_Log.md`, `docs/Framework_Architecture.md`, `README.md`, `docs/AI_Prompt_Catalog.md` (this document) |
| **Coverage Analysis** | Build an honest, four-state traceability matrix (Automated / Partial / Gap / Scaffolded-not-executed) mapping every `REQ-00x` to its manual, UI, and API automation — stating only what a direct read of the automation source confirms. | *No dedicated `prompts/0X-*.md` file* — generated from a direct chat instruction, grounded in `docs/Requirements_And_Coverage_Summary.md` and `docs/API_Schema_Analysis.md` §10. | A per-requirement matrix with cited spec files/case-ID ranges, plus an explicit summary of gaps and scaffolded-not-counted coverage. | `docs/Automation_Coverage_Summary.md` |
| **Risk-Based Test Strategy** | Analyze the supplied insurance-claims problem statement and produce a leadership-facing, risk-tiered test strategy (current-state assessment, scored risk register, tiered strategy, roadmap, KPIs) independent of the InvenTree hands-on exercise. | *No dedicated `prompts/0X-*.md` file* — generated from a direct chat instruction against `source-specifications/Problem Statement.pdf`. | Risk register + matrix, tiered testing strategy, target test pyramid, governance model, phased roadmap, KPIs. | `docs/Insurance_Claims_Risk_Based_Test_Strategy.md` |

**Note on the "Prompt File" column:** four phases (Requirements Analysis, API Specification Analysis, UI Automation, API Automation) were deliberately decomposed into standalone prompt files under `prompts/`, each recording its objective, grounding context, exact prompt text, expected output, and follow-up notes — because they were the highest-risk, most-reused generation passes (their outputs grounded every later stage). The remaining three phases were single-pass documentation/analysis instructions issued directly in-session; rather than retroactively inventing a prompt file that was never actually authored as a separate artifact, this catalog states that plainly and points to the resulting deliverable instead — consistent with the repository's rule of not asserting an artifact exists without a real source behind it.

---

## 3. AI Prompt Engineering Principles

The following principles were applied consistently across every phase above, independent of whether a standalone prompt file was kept:

- **Start from requirements.** Every automation or analysis prompt began from an already-catalogued business rule or requirement (`docs/Requirements_And_Coverage_Summary.md`), never from an assumed or invented one.
- **Use official documentation as the source of truth.** Business rules were first checked against `docs.inventree.org`; anything undocumented was escalated to source-code inspection rather than guessed.
- **Ground automation in OpenAPI specifications.** API automation scope came directly from the field-by-field OpenAPI analysis (`docs/API_Schema_Analysis.md`), not from exploring the live API ad hoc.
- **Never invent business rules.** Where neither documentation nor source code confirmed a rule (e.g. category self-parent prevention, `variant_of` self-reference), it was tagged `[ASSUMPTION]` and carried forward as an open item, never silently resolved.
- **Validate generated code through execution.** No generated spec, locator, or service method was accepted on generation alone — every one was run against a real, live InvenTree instance.
- **Use Playwright traces and screenshots for debugging.** Failures were diagnosed from `trace: 'retain-on-failure'` (UI) and the HTML report (API) — the actual DOM state, network call, or response body — not inferred from the assertion message alone.
- **Prefer accessibility-first locators.** `getByRole`/`getByLabel`/aria-label-based locators, matched to InvenTree's own frontend conventions, were used ahead of CSS selectors; a CSS selector appears exactly once, as a documented last resort.
- **Avoid fixed waits.** No `waitForTimeout`-style fixed sleep is used anywhere in `automation/`; auto-retrying `expect`/`expect.poll` assertions are used exclusively.
- **Document assumptions.** Every unresolved or unverifiable claim across the analysis docs carries an explicit `[ASSUMPTION]` tag rather than being smoothed over.
- **Iterate using evidence rather than guesswork.** Every correction in `docs/AI_Change_Log.md` follows the same shape — evidence collected, root cause confirmed against source, minimal targeted fix, re-validation — not a broad rewrite applied on a hunch.

---

## 4. AI Validation Workflow

Every AI-generated artifact in this repository — analysis document, page object, service method, or spec — followed the same lifecycle before acceptance:

```
Requirements
   ↓
Prompt Engineering
   ↓
Generation
   ↓
Execution
   ↓
Evidence Collection
   ↓
Correction
   ↓
Re-validation
   ↓
Final Acceptance
```

- **Requirements → Prompt Engineering:** each generation pass was scoped to a single, bounded objective grounded in already-established requirements/schema findings, not an open-ended "build everything" instruction.
- **Generation → Execution:** generated code was run immediately against the live InvenTree instance rather than reviewed only by reading.
- **Execution → Evidence Collection:** failures were triaged by symptom first (strict-mode violation, timeout, `401`, `ENOTFOUND`), then confirmed via the actual trace or HTML report.
- **Evidence Collection → Correction:** fixes were scoped to the smallest unit that addressed the confirmed root cause, each with an inline source-note comment explaining *why*.
- **Correction → Re-validation → Final Acceptance:** the corrected spec was re-run individually, then alongside every other spec sharing the same page object/service, before being treated as done.

This is the same eleven-stage lifecycle documented in full in `docs/AI_Workflow.md` §2–3; the eight steps above are its condensed form for this catalog.

---

## 5. Repository Mapping

| Artifact | What it contains | How it relates to this catalog |
|---|---|---|
| **`prompts/`** | One markdown file per staged, high-reuse generation pass (`01-requirements-analysis.md` … `04-api-automation.md`), each with objective, grounding context, exact prompt text, expected output, and notes. | The primary source for the "Prompt File" column of §2, rows 1–4. |
| **`docs/AI_Workflow.md`** | The full eleven-stage AI-assisted lifecycle (requirements → documentation ingestion → OpenAPI analysis → prompt engineering → code generation → live execution → failure analysis → trace analysis → human review → AI correction → final validation), plus a workflow diagram and guardrails. | The detailed version of §4's condensed validation workflow. |
| **`docs/AI_Change_Log.md`** | Six representative, evidence-driven corrections applied to the automation, each as Initial implementation → Evidence collected → Root cause → Final correction → Validation result. | The concrete record of the "Correction / Re-validation" steps in §4, and of the "iterate using evidence" principle in §3. |
| **`docs/Automation_Coverage_Summary.md`** | The requirement-by-requirement traceability matrix produced by the Coverage Analysis phase (§2, row 6). | Referenced as the deliverable for that row; not duplicated here. |

---

*This document does not modify any code or any other existing documentation; it is a new, standalone index over artifacts that already exist in this repository.*
