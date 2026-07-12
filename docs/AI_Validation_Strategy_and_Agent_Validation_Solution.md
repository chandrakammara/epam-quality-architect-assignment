# AI Validation Strategy and Agent Validation Solution

**Prepared for:** HR / hiring-panel requirement — *"Provide an AI Solution, an AI Validation Strategy, and a Solution for validating the agents developed."*
**Scope of this document:** it synthesizes and validates AI-assisted work already produced in this repository, and separately defines a forward-looking framework for validating AI agents this team builds in the future.
**Evidence discipline:** every claim about *this assignment* cites an existing artifact (`docs/`, `automation/`, `prompts/`) and is marked **[Evidence]**. Anything describing a future capability not yet built in this repository is marked **[Recommended]**. No project evidence is invented; where the repository is silent, that is stated explicitly.

---

## 1. Executive Summary

This assignment was completed using AI (Cursor AI) as a **reviewed, evidence-gated engineering collaborator**, not an unaudited generator. AI was used to analyze requirements and an OpenAPI contract, draft a manual test suite, generate Playwright UI and API automation, and produce the documentation set itself — but nothing produced by the AI was accepted on generation alone. Every artifact went through a repeatable validation lifecycle: ground the AI in real sources → generate → execute against a live system → collect evidence (traces, HTML reports, HTTP responses) → root-cause any failure → apply the smallest correction → re-validate. This lifecycle is documented in full in `docs/AI_Workflow.md` and evidenced concretely in `docs/AI_Change_Log.md` **[Evidence]**.

This document has two purposes:

1. **Consolidate the AI Solution and AI Validation Strategy** actually used in this assignment into a single reviewer-facing narrative, citing the existing docs and automation as evidence rather than re-describing them from scratch **[Evidence]**.
2. **Define a Agent Validation Solution** — a practical framework (test strategy, quality metrics, release gates) for validating *future* AI agents this team builds, extrapolated from the discipline already demonstrated here but not yet exercised against a live, autonomous, multi-turn agent in this repository **[Recommended]**.

The underlying principle carried through both halves: **AI output is a hypothesis until it is grounded in a real source and confirmed by execution.** This assignment applied that principle to test design and automation code; §4–§9 apply the same principle prospectively to autonomous agents.

---

## 2. AI Solution Overview

The AI-assisted solution delivered in this assignment followed seven stages, each with a bounded objective and a named artifact **[Evidence — `docs/AI_Workflow.md` §2, `docs/AI_Prompt_Catalog.md` §2]**:

| Stage | What the AI did | Grounding input | Artifact produced |
|---|---|---|---|
| **Requirements ingestion** | Catalogued InvenTree Parts/Category business rules (creation, attributes, lifecycle, categories, parameters, templates/variants, revisions, test templates), tagged by evidence source | `docs.inventree.org`, InvenTree backend source (read-only) | `docs/Requirements_And_Coverage_Summary.md` |
| **OpenAPI analysis** | Parsed the `Part`/`PartCategory` OpenAPI schemas field-by-field (required/optional/nullable/read-only/`maxLength`/defaults), cross-referenced against backend source for rules the schema can't express | `source-specifications/inventree-openapi.yaml.yaml` (read-only) | `docs/API_Schema_Analysis.md` |
| **Manual test generation** | Drafted 96 UI + 70 API test cases across 10 requirement areas with an RTM | Requirements + OpenAPI analysis above | `test-cases/InvenTree_Parts_QA_Test_Cases.xlsx` (marked `Status = Draft`, execution-unverified) |
| **UI automation generation** | Generated a Page-Object-Model Playwright suite (9 spec files, 6 page objects, timestamp+random data factories) | Tier-1 scope + manual case IDs | `automation/ui/` |
| **API automation generation** | Generated a service-layer Playwright `APIRequestContext` suite (4 spec files, `BaseApiService`/`AuthService`/`PartService`/`CategoryService`) | Tier-1 scope in `docs/API_Schema_Analysis.md` §10 | `automation/api/` |
| **Documentation generation** | Produced the reviewer-facing narrative docs describing the above (workflow, change log, coverage matrix, prompt catalog, framework architecture) | The artifacts above | `docs/*.md` |
| **Human review & execution-based refinement** | Every generated locator/assertion/service method was executed against a live, Dockerized InvenTree instance; failures were root-caused from real traces/HTML reports and corrected minimally | Live InvenTree instance | `docs/AI_Change_Log.md` (6 corrections) |

Four of the seven stages have a standalone, auditable prompt record under `prompts/01-requirements-analysis.md` … `04-api-automation.md`, each recording objective, grounding context, the exact prompt text, expected output, and follow-up notes; the remaining three (documentation, coverage analysis, risk strategy) were single-scope, direct chat instructions and are stated as such rather than retrofitted with an invented prompt file **[Evidence — `docs/AI_Prompt_Catalog.md` §2 note]**.

**What makes this an "AI *solution*" rather than "AI-generated code"**: the human role was not passive review at the end — it was active at every stage boundary (accepting/rejecting a business-rule tag, deciding a failure was worth a root-cause investigation vs. a flaky retry, confirming a fix against frontend source before accepting it). §3 formalizes this into a validation strategy.

---

## 3. AI Validation Strategy

This section states *how* every AI-generated artifact in this repository was validated before being trusted, mapped to the specific mechanism used and the evidence that mechanism produced.

| Validation dimension | Mechanism used | Evidence **[Evidence]** |
|---|---|---|
| **Source grounding** | Every requirement/schema claim traced to `docs.inventree.org`, the InvenTree backend source (file:line), or explicitly flagged `[ASSUMPTION]` if neither confirmed it | `docs/Requirements_And_Coverage_Summary.md` §2 (`[DOC]`/`[CODE]`/`[ASSUMPTION]` tags throughout), `docs/API_Schema_Analysis.md` (line-cited OpenAPI facts) |
| **Requirement traceability** | Every manual case and automated spec mapped back to a numbered `REQ-001…010` and, for automation, to the manual case ID it overlaps | `docs/Requirements_And_Coverage_Summary.md` §3–4, `docs/Automation_Coverage_Summary.md` §2 (per-requirement matrix) |
| **Schema validation** | API automation scope derived directly from field-by-field OpenAPI parsing (types, `maxLength`, nullability, defaults), not from ad hoc live exploration | `docs/API_Schema_Analysis.md` §3–5, §10 (Tier 1/2/3 scope feeding `automation/api`) |
| **Code review** | Generated locators/services reviewed against the actual frontend/backend source conventions before being trusted (e.g. accessibility-role locator conventions, service-layer method signatures) | `docs/AI_Workflow.md` §2.5, §2.9 (human review step) |
| **Static checks** | Locator-strategy conventions enforced consistently (accessibility-first, no fixed sleeps, `expect.poll` auto-retry) as a review discipline across all generated specs | `docs/AI_Prompt_Catalog.md` §3 ("Prefer accessibility-first locators", "Avoid fixed waits") |
| **Live execution** | Every UI and API spec was run against a real, Dockerized InvenTree instance — nothing accepted on generation alone | `docs/AI_Workflow.md` §2.6; `[LIVE]` tags throughout `docs/Requirements_And_Coverage_Summary.md` §4 |
| **Positive / negative / boundary / business-rule testing** | Positive: CRUD happy paths (`part-crud.spec.js`). Negative: required-field/FK validation (`part-validation.spec.js`, `auth.spec.js` invalid-password/no-credentials cases). Boundary: pagination `limit`/`offset`, no-overlap-between-pages (`part-search-pagination.spec.js`). Business-rule: deletion-blocked-while-`active` guard (`part-crud.spec.js` `DELETE` after deactivation) | `automation/api/tests/*.spec.js`, cited per-requirement in `docs/Automation_Coverage_Summary.md` §2 |
| **Trace / screenshot / server-log / API-response analysis** | UI failures diagnosed via `trace: 'retain-on-failure'` + `screenshot: 'only-on-failure'` (`automation/ui/playwright.config.js`); API failures diagnosed via the raw HTTP response/status (e.g. the literal `401` on the auth handshake, the `ENOTFOUND` DNS error) | `docs/AI_Change_Log.md` §1–5; `docs/AI_Workflow.md` §2.8 |
| **Regression and repeatability checks** | Corrected specs re-run individually, then alongside every other spec sharing the same page object/service, to confirm no regression; timestamp+random data factories keep repeated/parallel runs collision-free | `docs/AI_Workflow.md` §2.11; `docs/AI_Change_Log.md` §3 validation result (re-run against both `part-stock.spec.js` and `part-cross-functional.spec.js`) |
| **Acceptance and rejection criteria** | Accept: fix targets a confirmed root cause (source-checked), passes the originally-failing spec, and does not regress sibling specs. Reject: any fix that only lengthens a timeout or widens a locator without confirming *why* the original one failed | `docs/AI_Workflow.md` §2.9 (human-review step explicitly names "papering over the symptom with a longer timeout or a broader locator" as a rejected class of fix) |

**Explicit non-goals / stated gaps [Evidence]** — the same validation discipline that produced the above also produced honest gap reporting rather than inflated coverage claims:
- The manual test suite (`test-cases/InvenTree_Parts_QA_Test_Cases.xlsx`) is marked `Status = Draft` on every row — accepted as an AI-drafted design artifact for architect review, **not** claimed as execution-verified.
- `docs/Automation_Coverage_Summary.md` uses an explicit four-state model (✅ Automated / 🟡 Partial / 🔴 Gap / ⚪ Scaffolded-not-executed) specifically so that code existing but unproven (`CategoryService.js`) is never counted as coverage.

---

## 4. Agent Validation Solution

**[Recommended]** — the artifacts in this repository validate AI-assisted *generation* of test designs and automation code. They do not yet include a standalone, autonomous, tool-using AI *agent* (e.g. one that plans multi-step actions, calls external tools/APIs, and acts without a human reviewing every single step). The framework below adapts the grounding-and-evidence discipline demonstrated in §3 to that future class of system, so the same standard of "trust nothing until it's grounded and executed" scales from AI-assisted code generation to AI agents making autonomous decisions.

| Control | Purpose | Practical implementation |
|---|---|---|
| **Agent input validation** | Reject malformed, out-of-scope, or adversarial inputs before they reach the agent's reasoning loop | Schema-validate all inbound requests/parameters; reject inputs exceeding defined length/type/domain bounds; sanitize any user-supplied text that will be interpolated into a prompt |
| **Prompt / version control** | Make every agent behavior change auditable and reversible | Store prompts/system instructions as versioned files (mirroring this repository's `prompts/01…04-*.md` pattern); tag each agent release with the exact prompt/model/tool-config version that produced it; require a diff review before a prompt change ships |
| **Grounding and retrieval checks** | Ensure the agent's claims are backed by a real, inspectable source, not model recall alone | Require every factual or business-rule claim to cite a retrieved document/record/schema field (the same `[DOC]`/`[CODE]`/`[LIVE]`/`[ASSUMPTION]` tagging convention already used in `docs/Requirements_And_Coverage_Summary.md` and `docs/API_Schema_Analysis.md` generalizes directly to agent outputs) |
| **Hallucination detection** | Catch confident-but-unsupported outputs before they reach a user or downstream system | Cross-check generated identifiers (field names, endpoint paths, IDs) against the actual schema/API before use; flag and block any claim with no retrieval citation; sample outputs for human spot-check against source |
| **Output schema validation** | Guarantee the agent's structured output is machine-consumable and within contract | Validate every structured response (JSON, function-call arguments, generated code) against a strict schema before it is passed downstream; reject and retry (bounded) on schema violation |
| **Business-rule compliance** | Prevent the agent from taking an action that violates a known domain constraint | Encode known business rules (the same class of rule catalogued in `docs/Requirements_And_Coverage_Summary.md` §2, e.g. deletion guards, uniqueness constraints) as explicit pre-action checks, not just as prompt instructions the model might ignore |
| **Deterministic / repeatability checks** | Detect non-deterministic drift in agent behavior across runs | Re-run the same input N times (fixed seed/temperature where supported) and diff outputs; flag any semantically different result on identical input for review, mirroring the regression re-run discipline in `docs/AI_Workflow.md` §2.11 |
| **Tool-use validation** | Ensure the agent invokes tools/APIs correctly and only within its intended scope | Validate tool-call arguments against the tool's schema before execution; whitelist which tools an agent may call per task; log every tool call with its arguments and result |
| **Permission and security checks** | Prevent privilege escalation or unauthorized access via the agent | Run the agent under least-privilege credentials scoped to its task (the same minimal-scope principle already surfaced in `docs/API_Schema_Analysis.md` §9's OAuth2 scope analysis); require explicit allow-listing for any destructive action (delete, payment, external send) |
| **Failure handling** | Ensure a failed step degrades safely instead of silently producing a wrong result | Define explicit fallback/retry policy per tool call; surface a descriptive error (not a bare timeout) on failure, the same principle behind the `Login failed: <toast text>` correction in `docs/AI_Change_Log.md` §1 |
| **Audit logging** | Make every agent decision reconstructable after the fact | Log every prompt, retrieved source, tool call, output, and human decision with timestamps and version identifiers; retain logs long enough to support incident review |
| **Human-in-the-loop approval** | Keep an accountable human decision point before high-risk actions ship | Require explicit human sign-off before any agent-proposed change to production data, code, or customer-facing content is applied — mirroring the human-review gate (`docs/AI_Workflow.md` §2.9) already used for every automation correction in this assignment |
| **Production monitoring** | Detect quality regression after release, not just at release time | Track the metrics in §6 (task success rate, hallucination rate, tool-call success rate, etc.) on a live dashboard with alerting thresholds; sample production transcripts for periodic manual audit |

---

## 5. Agent Test Strategy

**[Recommended]** — test categories a future AI-agent test plan should cover, organized the same way `docs/API_Schema_Analysis.md` §10 tiered API automation scope by risk:

| Category | What it verifies | Example test |
|---|---|---|
| **Functional** | The agent completes its intended task correctly on well-formed input | Given a valid request, does the agent produce the expected, schema-valid output? |
| **Negative** | The agent fails safely on invalid/incomplete input | Missing required field, malformed request, unsupported task type — expect a graceful rejection, not a hallucinated answer |
| **Boundary** | Behavior at input/resource limits | Maximum input length, maximum tool-call count per task, empty/near-empty context |
| **Adversarial** | Resistance to prompt injection and manipulation | Inputs containing embedded instructions attempting to override the agent's system prompt or exfiltrate hidden instructions/credentials |
| **Security** | No unauthorized data access or action | Agent attempts an out-of-scope tool call or an action beyond its granted permission — must be blocked and logged |
| **Reliability** | Consistent behavior under repeated/concurrent use | Same task run repeatedly/concurrently produces consistent, non-conflicting results (no shared-state corruption) |
| **Performance** | Acceptable latency and resource use under realistic load | Response time and cost stay within budget as concurrent task volume increases |
| **Fallback / recovery** | Graceful degradation when a dependency fails | Upstream tool/API times out or returns an error — agent retries within policy or reports failure clearly instead of fabricating a result |
| **Multi-turn context** | Correct state/context retention across a conversation | Agent correctly recalls and applies earlier-turn constraints without contradicting itself over a long session |
| **Tool-invocation accuracy** | Correct tool selection and argument construction | Given a task solvable by exactly one available tool, the agent selects that tool and supplies valid, schema-conformant arguments |
| **Data privacy** | No leakage of sensitive data across users/sessions/logs | Agent does not surface another session's data, and logs redact sensitive fields per policy |
| **Regression** | New agent/prompt versions don't break previously-passing behavior | A fixed benchmark suite of prior tasks re-run against every new prompt/model version before release, mirroring the "re-run the full suite after every correction" discipline already used in `docs/AI_Workflow.md` §2.11 |

---

## 6. Agent Quality Metrics

**[Recommended]** — actionable metrics for ongoing agent quality tracking, each with what it should trigger:

| Metric | Definition | Why it matters |
|---|---|---|
| **Task success rate** | % of tasks completed correctly against a defined acceptance check | Primary measure of whether the agent does its job |
| **Grounded-answer rate** | % of factual claims traceable to a cited, retrieved source | Direct extension of this repository's `[DOC]`/`[CODE]`/`[LIVE]` evidence-tagging discipline to agent outputs |
| **Hallucination rate** | % of outputs containing an unsupported or fabricated claim/identifier | Leading indicator of trust erosion; should trend toward zero, not just "low" |
| **Tool-call success rate** | % of tool invocations that succeed on the first well-formed attempt | Signals whether the agent constructs correct tool arguments (§5 tool-invocation accuracy) |
| **False-positive / false-negative rate** | For agents making pass/fail or accept/reject decisions: rate of incorrect accepts vs. incorrect rejects | Distinguishes an agent that is too permissive from one that is too conservative |
| **Response consistency** | Variance in output for repeated identical input | Detects non-determinism that undermines the deterministic/repeatability checks in §4 |
| **Retry / recovery rate** | % of failed steps that self-recover within policy vs. require escalation | Measures resilience of the failure-handling control in §4 |
| **Human override rate** | % of agent outputs a human reviewer rejects or corrects | Direct signal of remaining gap to full autonomy; should be tracked as a trend, not a one-time number |
| **Latency** | Time from task submission to completed response | User-facing quality and cost driver |
| **Cost per successful task** | Total inference/tool cost divided by successfully completed tasks | Ties quality to unit economics, not just correctness |
| **Defect leakage** | % of agent errors first caught in production rather than pre-release validation | Mirrors the "how much slipped past the gate" framing already used for automation coverage honesty in `docs/Automation_Coverage_Summary.md` |

---

## 7. Validation Workflow

The following workflow generalizes the eleven-stage lifecycle actually followed in this assignment (`docs/AI_Workflow.md` §2–3, condensed in `docs/AI_Prompt_Catalog.md` §4 **[Evidence]**) into a form applicable to both AI-assisted code generation and autonomous agent validation **[Recommended for the agent context; Evidence for the code-generation context]**:

```
Requirements
   │
   ▼
Prompt / Agent Design
   │
   ▼
Grounding Validation        (source citation check — [DOC]/[CODE]/[LIVE]/[ASSUMPTION])
   │
   ▼
Generated Output
   │
   ▼
Automated Checks            (schema validation, static checks, business-rule checks)
   │
   ▼
Tool Execution               (live run against a real system / real tool call)
   │
   ▼
Evidence Collection          (traces, screenshots, server logs, API responses)
   │
   ▼
Human Review                 (root-cause confirmation against source)
   │
   ▼
Correction                   (smallest fix that addresses the confirmed root cause)
   │
   ▼
Re-validation                (re-run failing case, then full regression set)
   │
   ▼
Release Approval
```

Every stage from **Tool Execution** through **Re-validation** forms a loop: a failure re-enters at **Grounding Validation** or **Correction** rather than being patched blindly — the same loop already implemented for automation corrections in `docs/AI_Change_Log.md` (§1–6, each following *Initial implementation → Evidence collected → Root cause → Final correction → Validation result*) **[Evidence]**.

---

## 8. Evidence from This Assignment

The following are real, already-documented examples of the validation discipline in §3, cited to their source of record — not illustrative or hypothetical **[Evidence]**:

| Example | What happened | Source of record |
|---|---|---|
| **Login race diagnosis** | Repeated live runs surfaced an intermittent client-side form re-validation/submit race rejecting valid credentials; a bare "URL changed" assertion couldn't distinguish this from a slow success. Corrected to poll for either success or a scoped error toast, surfacing the real failure reason instead of a bare timeout. | `docs/AI_Change_Log.md` §1; `README.md` §8 |
| **Category locator ambiguity** | A Playwright strict-mode violation (multiple matching locators) was traced to the categories table rendering identical "Path" and "Name" column text for root categories. Corrected with `.first()` targeting the Name column, confirmed against `PartCategoryTable.tsx`'s column order. | `docs/AI_Change_Log.md` §2 |
| **Stock navigation correction** | The checked-out frontend source implied a `TreeField` for the stock "Location" field, but the deployed build actually rendered a combobox — a live divergence between source and deployed build. A separate SPA tab-routing bug produced a malformed doubly-nested URL (`/web/web/part/<id>/stock/stock`), only surfaced by a multi-tab regression journey. Both corrected and re-validated against the specific spec that had exposed each bug. | `docs/AI_Change_Log.md` §3 |
| **DNS and Host header issue** | Pointing the API suite's `baseURL` at `inventree.localhost` (mirroring the UI suite) failed with `ENOTFOUND` — Playwright's `APIRequestContext` resolves hosts via Node's `dns.lookup`, which does not special-case `*.localhost` as loopback the way a browser does. Corrected to connect via the literal loopback IP with an explicit `Host` header. | `docs/AI_Change_Log.md` §5 |
| **API authentication correction** | Basic-auth via Playwright's `httpCredentials` silently failed (`401`) because InvenTree's DRF backend doesn't reliably emit the `WWW-Authenticate: Basic` challenge Playwright waits for. Corrected to build and inject the `Authorization: Basic` header explicitly. | `docs/AI_Change_Log.md` §4 |
| **OpenAPI-grounded test generation** | API automation scope (Tier 1/2/3) was derived directly from field-by-field parsing of the `Part`/`PartCategory` OpenAPI schemas — required/optional/nullable/`maxLength`/defaults — rather than ad hoc live exploration, and cross-checked against backend source for constraints the schema alone can't express (e.g. deletion guards, revision rules). | `docs/API_Schema_Analysis.md` §3–5, §10 |

---

## 9. Release Gates for AI Agents

**[Recommended]** — minimum criteria before an AI agent (or, by extension, a new AI-generated automation change in this repository's own model) is approved for release:

1. **Grounding coverage** — every material output claim is source-cited (`[DOC]`/`[CODE]`/`[LIVE]`) or explicitly flagged `[ASSUMPTION]`; zero un-tagged factual claims.
2. **Schema conformance** — 100% of structured outputs validate against their declared schema in a pre-release test batch.
3. **Regression suite pass** — the full existing regression/benchmark suite passes with no new failures introduced.
4. **Hallucination rate below threshold** — measured hallucination rate on a held-out evaluation set is under an agreed ceiling (e.g. the same rigor applied to `docs/Automation_Coverage_Summary.md`'s refusal to count unproven coverage).
5. **Security/permission review** — the agent's tool access is least-privilege-scoped and reviewed; no unreviewed destructive-action capability.
6. **Human sign-off on high-risk paths** — any action class capable of irreversible or customer-facing effect has an explicit human-approval gate.
7. **Audit logging verified** — every prompt/tool-call/output in the release-candidate evaluation run is reconstructable from logs.
8. **Rollback plan defined** — a previous, known-good prompt/model/config version can be restored without code changes.

No release proceeds if any gate is unmet; a gate failure re-enters the workflow in §7 at **Correction**, not at a shortcut around the failing gate.

---

## 10. Limitations and Future Enhancements

**Limitations of this assignment's evidence base [Evidence]:**
- The validation discipline in §3 was exercised on AI-*assisted* generation (test design, automation code, documentation) — a bounded, human-supervised generation loop. It was **not** exercised on an autonomous, multi-turn, tool-calling AI agent, because no such agent was built in this assignment.
- Category API automation exists (`CategoryService.js`) but has zero executed spec cases, and is deliberately **not** counted as validated coverage (`docs/Automation_Coverage_Summary.md`) — an example of the same "don't overstate what's proven" discipline this document asks future agent validation to inherit.
- Several business rules remain `[ASSUMPTION]`-tagged pending live confirmation (e.g. category self-parent prevention, `variant_of` circularity, exact `4xx` error-body shape) — flagged, not resolved, per `docs/Requirements_And_Coverage_Summary.md` §6.

**Future enhancements [Recommended]:**
- Build and validate a reference AI agent (e.g. an automated triage or test-generation agent) against the full framework in §4–§9 to convert those recommendations from a paper framework into a proven one.
- Extend the existing evidence-tagging convention (`[DOC]`/`[CODE]`/`[LIVE]`/`[ASSUMPTION]`) into a machine-checkable citation format so grounding coverage (§9 gate 1) can be measured automatically rather than reviewed manually.
- Stand up the metrics in §6 on a live dashboard once a production agent exists, with alerting thresholds tied to the release gates in §9.
- Close the `[ASSUMPTION]`-tagged items listed above via live verification, and fold the confirmed results back into `docs/Requirements_And_Coverage_Summary.md` and `docs/API_Schema_Analysis.md`.

---

*This document does not modify any automation code or any other existing documentation. It is a new, standalone synthesis document that cites existing repository artifacts as evidence and clearly separates them from forward-looking recommendations for future AI agent work.*
