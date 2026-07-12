# EPAM Quality Architect Assignment

**Candidate:** Chandrasekhar Kammara
**Subject under test:** InvenTree (open-source inventory/parts management system) — Parts & Part Category domain
**Status:** Complete for architect review — all analysis, manual design, and automation artifacts described below are present in this repository as committed.

---

## 1. Project Overview

### 1.1 Assignment Objective

This repository is a solution to the EPAM Quality Architect AI Case Study. The exercise asks a candidate to demonstrate senior QA-architecture judgment across the full quality lifecycle — requirements analysis, manual test design, automation (UI and API), and strategic risk-based test planning — while using AI assistance transparently and verifiably rather than as an unreviewed black box.

Two independent problems are addressed:

1. **A hands-on QA engineering exercise** against a real, running application (InvenTree): analyze the Parts/Part Category domain from documentation, source code, and the OpenAPI schema; design a manual test suite; and build automated UI and API regression suites validated against a live instance.
2. **A strategic QA leadership exercise**: produce a risk-based test strategy for a hypothetical 8-team insurance claims platform, from a supplied problem statement (`source-specifications/Problem Statement.pdf`).

### 1.2 Repository Purpose

The repository serves as the single source of truth a reviewer can use to assess:

- How requirements and API contracts were analyzed and evidence-tagged (documentation vs. source code vs. live observation vs. assumption).
- How a manual test suite was scoped and traced back to those requirements.
- How Playwright automation (UI + API) was designed, executed against a live InvenTree instance, and iteratively corrected using real failure evidence (trace files, HTML reports).
- How AI assistance was used at each stage, with a full change log of AI-proposed corrections and the live evidence that justified each one.
- How the same architect would approach a much larger, organizational-scale risk-based test strategy problem.

### 1.3 High-Level Deliverables

| # | Deliverable | Location |
|---|---|---|
| 1 | Requirements & OpenAPI schema analysis | `docs/Requirements_And_Coverage_Summary.md`, `docs/API_Schema_Analysis.md` |
| 2 | Manual test case suite (96 UI + 70 API cases) with RTM | `test-cases/InvenTree_Parts_QA_Test_Cases.xlsx` |
| 3 | UI automation (Playwright, Page Object Model) | `automation/ui/` |
| 4 | API automation (Playwright `APIRequestContext`, service layer) | `automation/api/` |
| 5 | Risk-based test strategy for an insurance claims platform | `docs/Insurance_Claims_Risk_Based_Test_Strategy.md` |
| 6 | AI-assisted workflow documentation | `docs/AI_Workflow.md` |
| 7 | AI change log (evidence-driven corrections) | `docs/AI_Change_Log.md` |
| 8 | Automation coverage / traceability summary | `docs/Automation_Coverage_Summary.md` |
| 9 | Automation framework architecture (design of the UI/API suites) | `docs/Framework_Architecture.md` |

---

## 2. Repository Structure

```
epam-quality-architect-assignment/
├── docs/                     # All analysis, strategy, and AI-process documentation (see §3)
├── automation/
│   ├── ui/                   # Playwright UI automation (Page Object Model)
│   └── api/                  # Playwright API automation (service-layer pattern)
├── test-cases/                # Manual QA test suite (Excel workbook) + RTM
├── source-specifications/     # Read-only inputs: OpenAPI spec, assignment Problem Statement PDF
├── prompts/                # Staged prompt files tracking the AI generation lifecycle
├── architecture/           # Reserved for architecture diagrams (placeholder)
├── presentation/           # Reserved for the reviewer presentation deck (placeholder)
├── images/                 # Reserved for supporting screenshots (placeholder)
├── video/                  # Reserved for a demo recording (placeholder)
├── api-tests/              # Empty placeholder folder, superseded by automation/api/
└── README.md
```

| Folder | Purpose |
|---|---|
| **`docs/`** | The analytical core of the submission — requirements/coverage analysis, OpenAPI schema analysis, the risk-based strategy document, the automation coverage traceability matrix, the automation framework architecture, and the two AI-process documents (workflow + change log). Every factual claim in these files is evidence-tagged (`[DOC]` / `[CODE]` / `[LIVE]` / `[ASSUMPTION]`). |
| **`automation/ui/`** | Playwright UI automation for InvenTree's Parts domain. Page Object Model (`pages/`), specs grouped by feature (`tests/login`, `tests/parts`, `tests/categories`, `tests/regression`), test-data factories (`data/`), and environment configuration (`config/environment.js`). |
| **`automation/api/`** | Playwright API automation for the `/api/part/` and `/api/part/category/` REST surface. Service-layer classes (`services/`) wrap raw HTTP calls, specs (`tests/`) consume them, `utils/fixtures.js` centralizes authenticated-context setup, and `config/environment.js` documents the host/DNS workaround needed for this environment. |
| **`test-cases/`** | `InvenTree_Parts_QA_Test_Cases.xlsx` — the manual test design deliverable: 96 UI cases (`UI-PART-001…096`), 70 API cases (`API-PART-001…070`), an RTM sheet mapping cases to `REQ-001…010`, and a Sources sheet. Explicitly marked `Status = Draft` pending live validation, per its own RTM note. |
| **`source-specifications/`** | Read-only inputs supplied for the exercise: `inventree-openapi.yaml.yaml` (OpenAPI 3.0.3 contract, schema version `511`) and `Problem Statement.pdf` (the insurance-claims strategy brief). Neither file was modified during analysis. |
| **`prompts/`** | `01-requirements-analysis.md` … `04-api-automation.md` — one file per stage of the AI-assisted generation work, each recording its objective, grounding context, the actual prompt used, expected output, and follow-up notes; referenced by `docs/AI_Workflow.md §2.4`. |
| **`architecture/`, `presentation/`, `images/`, `video/`** | Reserved output folders (currently containing only a `.gitkeep`) for architecture diagrams, a reviewer presentation deck, supporting screenshots, and a demo recording respectively. Not populated as part of this written submission. |
| **`api-tests/`** | An early placeholder folder (`.gitkeep` only) that predates `automation/api/`; superseded by it and kept only for structural continuity — the actual, executed API automation lives under `automation/api/`. |

---

## 3. Deliverables

### 3.1 Requirements Analysis — `docs/Requirements_And_Coverage_Summary.md`

Catalogues the documented business rules for Part, Part Category, Parameters/Templates, Templates/Variants, Revisions, and Test Templates, each tagged by evidence source (InvenTree documentation, direct source-code inspection with file:line citations, or explicitly flagged as an unverifiable `[ASSUMPTION]`, e.g. category self-parent prevention). Also maps every business area to its manual test-case ID range and calls out gaps *within* the manual suite itself (e.g. no case for `variant_of` self-reference).

### 3.2 Manual Test Design — `test-cases/InvenTree_Parts_QA_Test_Cases.xlsx`

96 UI cases + 70 API cases across 10 requirement areas (`REQ-001…010`), with a dedicated RTM sheet and a Sources sheet. Every row is marked `Status = Draft`, honestly reflecting that the manual suite is an AI-assisted design artifact for architect review, not yet execution-verified end-to-end against the live instance.

### 3.3 UI Automation — `automation/ui/`

Nine Playwright spec files (login, part CRUD/validation/edit/stock/parameters, category hierarchy, category-part assignment, and a full cross-functional regression chain) built on a Page Object Model. Uses accessibility-role/aria-label-first locators, timestamp+random test-data factories (safe for parallel/repeated runs), zero fixed sleeps, and `expect.poll`-based auto-retrying assertions. Every spec was executed against a live, Dockerized InvenTree instance, not merely generated and assumed correct.

### 3.4 API Automation — `automation/api/`

Four Playwright `APIRequestContext` spec files (`auth.spec.js`, `part-crud.spec.js`, `part-validation.spec.js`, `part-search-pagination.spec.js`) built on a service-layer pattern (`AuthService`, `PartService`, `CategoryService`, `BaseApiService`). Covers the full Part CRUD lifecycle, required-field/FK validation, and search/filter/pagination boundaries. `CategoryService` exists and is fixture-wired but has no executed spec yet — tracked honestly as scaffolded, not counted as coverage (see §8).

### 3.5 Risk-Based Test Strategy — `docs/Insurance_Claims_Risk_Based_Test_Strategy.md`

A full leadership-facing strategy for the supplied insurance-claims scenario: current-state assessment, a scored risk register (Likelihood × Impact) and risk matrix, a tiered testing strategy, a target test pyramid, coverage/automation/CI-CD strategy, KPIs, defect-leakage reduction, cross-team governance, release quality gates, and a phased implementation roadmap.

### 3.6 AI Workflow — `docs/AI_Workflow.md`

Documents the eleven-stage lifecycle actually followed — from requirements analysis through documentation ingestion, OpenAPI analysis, prompt engineering, code generation, live execution, failure analysis, trace analysis, human review, AI correction, and final validation — plus the guardrails honoured throughout (no source modified to produce analysis; every correction tied to live evidence).

### 3.7 AI Change Log — `docs/AI_Change_Log.md`

Six representative, evidence-driven corrections applied to the automation during live execution (login-failure diagnostics, category-locator ambiguity, stock-navigation URL bug, API Basic-auth handshake, DNS/Host-header routing, and cross-functional test-timeout/navigation fixes). Each entry follows **Initial implementation → Evidence collected → Root cause → Final correction → Validation result**.

### 3.8 Coverage Summary — `docs/Automation_Coverage_Summary.md`

A traceability matrix mapping every `REQ-001…010` requirement to its manual test IDs, UI automation, and API automation, using an honest four-state coverage model (✅ Automated, 🟡 Partial, 🔴 Gap, ⚪ Scaffolded-not-executed) so no coverage is inferred from naming or intent alone.

### 3.9 Framework Architecture — `docs/Framework_Architecture.md`

Describes *how* the two automation suites are built, independent of what they currently cover: the Page Object Model layering and locator conventions for `automation/ui`, the service-layer/fixture layering for `automation/api`, the shared configuration/test-data/reporting conventions between them, and how each is intended to be extended (new flows, new resources, new browsers, CI adoption).

---

## 4. Technology Stack

| Layer | Technology |
|---|---|
| Automation framework | **Playwright** (`@playwright/test` v1.61) — browser automation for UI, `APIRequestContext` for API |
| Language / runtime | **JavaScript** (ES modules) on **Node.js** |
| Application under test | **Docker**-hosted InvenTree instance, reverse-proxied at `inventree.localhost` |
| AI-assisted engineering | **Cursor AI** — used for staged, prompt-scoped code generation, trace-driven failure analysis, and evidence-gated corrections (see §6) |
| API contract source | **OpenAPI** 3.0.3 (`source-specifications/inventree-openapi.yaml.yaml`) |
| Version control | **Git** |

---

## 5. Running the Project

### 5.1 Prerequisites

- **Node.js** (LTS) and npm.
- A running, Docker-hosted **InvenTree** instance reachable at `http://inventree.localhost` (reverse-proxied), with a valid user account.
  - Login intermittency has been observed locally against this Docker setup — see §8.
- Playwright browsers installed (one-time, per automation project):

```bash
cd automation/ui && npx playwright install
```

### 5.2 Running UI Automation

```bash
cd automation/ui
npm install
copy .env.example .env    # PowerShell: Copy-Item .env.example .env
# then edit .env: set BASE_URL, INVENTREE_USERNAME, INVENTREE_PASSWORD

npm test                  # headless run, all specs
npm run test:headed       # headed (visible browser) run
npx playwright test tests/login/login.spec.js   # run a single spec
```

### 5.3 Running API Automation

```bash
cd automation/api
npm install
copy .env.example .env    # PowerShell: Copy-Item .env.example .env
# then edit .env: set BASE_URL (loopback IP), HOST_HEADER, credentials

npm test                  # all API specs
npx playwright test tests/part-crud.spec.js     # run a single spec
```

> Both `.env` files are git-ignored; only `.env.example` templates are committed. The API suite deliberately connects via a literal loopback IP with an explicit `Host` header rather than `inventree.localhost` directly — see the inline rationale in `automation/api/config/environment.js` and AI Change Log §5.

### 5.4 Generating Reports

Both suites are configured with `reporter: [['list'], ['html', { open: 'never' }]]`, plus `screenshot: 'only-on-failure'` and `trace: 'retain-on-failure'` on the UI project:

```bash
npm run report             # opens the last HTML report (either project)
npx playwright show-trace test-results/<failing-test>/trace.zip   # inspect a failure trace (UI)
```

---

## 6. AI-Assisted Engineering Approach

AI assistance (Cursor AI) was used throughout this assignment as a **reviewed, evidence-gated collaborator**, not an unaudited generator. In practice this meant: decomposing work into small, scoped prompts (`prompts/01…04-*.md`); generating analysis and code grounded in the requirements/OpenAPI findings already produced; treating every AI-generated assertion or locator as a hypothesis to be validated against a **live, running InvenTree instance**; and, when a hypothesis failed, triaging the failure by symptom, inspecting the actual Playwright trace or HTML report, confirming root cause against the InvenTree source, and applying the smallest correction that fixed it — always with an inline source note so the fix's provenance survives for the next reader.

Two documents make this process fully auditable for a reviewer:

- **[`docs/AI_Workflow.md`](docs/AI_Workflow.md)** — the eleven-stage lifecycle (requirements → documentation ingestion → OpenAPI analysis → prompt engineering → code generation → live execution → failure analysis → trace analysis → human review → AI correction → final validation) and the guardrails observed throughout.
- **[`docs/AI_Change_Log.md`](docs/AI_Change_Log.md)** — six concrete, evidence-driven corrections (login-failure diagnostics, category-locator ambiguity, stock-navigation URL bug, API auth handshake, DNS/Host-header routing, cross-functional timeout/navigation fixes), each documented as **Initial implementation → Evidence collected → Root cause → Final correction → Validation result**.

---

## 7. Repository Highlights

- **Evidence-tagged analysis discipline.** Every factual claim across `docs/Requirements_And_Coverage_Summary.md`, `docs/API_Schema_Analysis.md`, and `docs/AI_Workflow.md` is tagged `[DOC]`, `[CODE]` (with file:line citations into the InvenTree backend), `[LIVE]`, or `[ASSUMPTION]` — nothing is asserted as fact without a stated source, and ambiguous or undocumented behaviour is explicitly flagged for confirmation rather than guessed at.
- **Automation validated against a live system, not just generated.** Every UI and API spec was executed against a real, Dockerized InvenTree instance; failures were root-caused via actual Playwright traces/HTML reports before any fix was accepted (`docs/AI_Change_Log.md`).
- **Real, non-trivial defects found and fixed through this discipline**, e.g. a Playwright strict-mode locator collision on category tables, a frontend-source-vs-deployed-build mismatch on the Stock "Location" field, a malformed doubly-nested SPA navigation URL surfaced only by a multi-tab regression journey, and a Node `dns.lookup` vs. browser loopback-resolution mismatch that blocked all API authentication until diagnosed.
- **Honest coverage reporting.** `docs/Automation_Coverage_Summary.md` uses a four-state model (Automated / Partial / Gap / Scaffolded-not-executed) specifically to avoid overstating coverage — e.g. `CategoryService` exists and is fixture-wired but is explicitly *not* counted as covered because no spec calls it yet.
- **Resilient, maintainable automation design.** Page Object Model (UI) and service-layer (API) patterns, accessibility-first locators with inline "source note" comments explaining *why* each locator was chosen, timestamp+random test-data factories for safe parallel execution, and zero fixed sleeps in favor of auto-retrying/`expect.poll` assertions.
- **Strategic breadth beyond hands-on execution.** `docs/Insurance_Claims_Risk_Based_Test_Strategy.md` demonstrates leadership-level QA architecture — quantified risk scoring, a phased automation/governance rollout, and metrics/KPIs tied to a stated business incident rate — for a problem entirely separate from the InvenTree hands-on exercise.

---

## 8. Known Limitations

Only limitations directly verified during this assignment are listed here.

- **Local Docker login intermittency.** Running the UI suite repeatedly against the local Docker-hosted InvenTree instance surfaced an intermittent client-side form re-validation/submit race that occasionally rejects a login attempt even with valid credentials, staying on `/web/login` with a dismissible "Login failed" toast. This was mitigated in automation (`LoginPage.verifyLoginSucceeded()` now polls for either success or a scoped error toast and reports the real reason — see `docs/AI_Change_Log.md §1`), but the underlying intermittency in the local Docker environment itself remains.
- **Category API scaffolding not yet executed.** `automation/api/services/CategoryService.js` implements list/create/getById/remove and is wired into `automation/api/utils/fixtures.js`, but no spec file currently invokes it. This is explicitly tracked as ⚪ *Scaffolded, not executed* in `docs/Automation_Coverage_Summary.md` and is **not** counted as covered category-API automation.
- **Template/Variant/Revisions automation not implemented.** REQ-006 (Part Templates, Variants, and Revisions) has zero automated coverage on either the UI or API layer today. Manual cases exist (`UI-PART-065…076`), but given the `[ASSUMPTION]`-flagged `variant_of` self-reference risk noted in `docs/Requirements_And_Coverage_Summary.md §2.5/§6`, this is identified as the highest-value gap to close next.

---

## 9. Conclusion

This repository demonstrates a complete, evidence-driven QA architecture workflow applied to a real application: business rules and API contracts were analyzed and tagged by source rather than assumed; a manual test suite was designed and traced to those requirements; and Playwright UI and API automation was built, **executed against a live system**, and iteratively corrected using real failure evidence — with every correction documented well enough for another engineer to trust it without re-deriving it. Coverage is reported honestly, including where automation exists but is unproven (Category API) and where it does not exist at all (Templates/Variants/Revisions), rather than inflating the picture. Beyond the hands-on exercise, the accompanying risk-based test strategy shows the same evidence-first, no-invented-facts discipline applied at organizational scale — turning a flat, untracked, incident-prone testing model into a quantified, risk-tiered, metrics-driven program. Taken together, the deliverables show not just the ability to write automation, but the architect-level judgment to know what is verified, what is assumed, what is missing, and why each of those distinctions matters to a reviewer's confidence in the result.
