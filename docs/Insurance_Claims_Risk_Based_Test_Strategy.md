# Risk-Based Test Strategy & Coverage Plan
## Insurance Claims Processing Platform

| | |
|---|---|
| **Prepared for** | QA Leadership / Engineering Steering Group |
| **Prepared by** | Senior QA Architect |
| **Scope** | 8 scrum teams — Auto, Health & Property Claims (product), 3 Platform Services teams, 2 Third-Party Integration teams |
| **Source** | `source-specifications/Problem Statement.pdf` — *Improving Test Coverage and Risk Management for an Insurance Claims Processing Platform* |
| **Status** | Draft v1.0 — for leadership review and sign-off |

> **Note on assumptions:** Every fact below that is not explicitly stated in the problem statement is marked **(assumption — validate)**. Team/service names are illustrative labels for the "3 platform services" and "2 third-party integration" teams, since the problem statement does not name them; they should be relabeled to match the actual org chart before this document is finalized.

---

## 1. Executive Summary

The claims platform runs on **8 scrum teams (16 developers, 8 QA engineers — a 2:1 dev-to-QA ratio with no shared or floating QA capacity)**, releasing bi-weekly with quarterly major releases. Today, **quality is managed uniformly, not by risk**: every feature — from a low-traffic UI label change to a claims-payout calculation — receives the same testing attention. Automation exists only for the 3 platform services teams; the 3 product teams (Auto, Health, Property) and both third-party integration teams ship on **manual regression testing whose coverage is not measured**.

The cost of this is already visible: **50% of production incidents trace back to claims calculation errors and integration failures** — the two areas with the *least* automated coverage and the *highest* business/regulatory impact. Because there is no centralized test strategy or metrics program, leadership cannot currently answer basic questions such as "what % of claims-calculation logic is tested?", "how reliable is our third-party integration layer?", or "where should the next QA hire go?".

This document proposes a **risk-based test strategy** that:

1. Stops treating all 8 teams and all features as equal risk, and instead allocates test depth, automation investment, and release gates by **quantified risk tier** (financial/regulatory impact × likelihood).
2. Closes the automation gap for the 5 teams currently without it, prioritizing **claims calculation logic** and **third-party integration reliability** — the two root causes of half of all production incidents.
3. Introduces **shared metrics, a cross-team QA governance model, and tiered release quality gates** so an 8-QA-engineer organization can punch above its weight without adding headcount as the first lever.

**Target outcome:** reduce claims-calculation/integration production incidents by **40–50% within 3 quarterly release cycles**, while raising automated regression coverage on the 5 currently-manual teams from **0% to ≥70% of Critical/High-risk paths**.

---

## 2. Current Assessment

### 2.1 Team & Coverage Topology

| Team | Type | Domain (as stated / illustrative) | Devs | QA | Automation Today | Risk Exposure |
|---|---|---|---|---|---|---|
| Auto Claims | Product | Auto insurance claims | 2 | 1 | **None** | High — calculation + regulatory |
| Health Claims | Product | Health insurance claims | 2 | 1 | **None** | High — calculation + regulatory + PHI-adjacent |
| Property Claims | Product | Property insurance claims | 2 | 1 | **None** | High — calculation + high-value payouts |
| Platform Svc Team 1 *(illustrative — e.g. Policy/Rating)* | Platform | Shared platform services | 2 | 1 | **Automated** | Medium — shared dependency, mature |
| Platform Svc Team 2 *(illustrative — e.g. Documents/Notifications)* | Platform | Shared platform services | 2 | 1 | **Automated** | Medium |
| Platform Svc Team 3 *(illustrative — e.g. Identity/Core)* | Platform | Shared platform services | 2 | 1 | **Automated** | Medium — blast radius if broken |
| Integration Team 1 | Third-party | Third-party assessors | 2 | 1 | **None** | High — external dependency, no contract tests |
| Integration Team 2 | Third-party | Other third-party integrations *(illustrative)* | 2 | 1 | **None** | High — external dependency, no contract tests |
| **Total** | | | **16** | **8** | **3 of 8 teams (37.5%)** | |

### 2.2 Structural Findings

| # | Finding | Evidence | Implication |
|---|---|---|---|
| F1 | Automation gap covers **5 of 8 teams**, including all 3 product teams and both integration teams | Stated | The highest-financial-impact and highest-external-dependency code is the *least* automated |
| F2 | Manual regression exists but **coverage is not tracked** | Stated | Leadership is release-gating on a number that doesn't exist — effectively flying blind each release |
| F3 | **No risk-based testing** — all features tested equally | Stated | Scarce QA time (1 per team) is spent proportionally, not by impact — low-risk UI gets the same attention as payout math |
| F4 | **No centralized strategy or metrics** for claims accuracy, integration reliability, or customer experience | Stated | The 50% incident figure below cannot even be broken down by root cause today — this is itself a finding, not just a symptom |
| F5 | Legacy + modern microservices mix | Stated | Integration surface is heterogeneous; likely inconsistent error handling, contract drift risk (assumption — validate via architecture review) |
| F6 | 1 QA per team, no cross-team pooling | Stated | Single point of failure per team; no surge capacity ahead of quarterly major releases |
| F7 | Bi-weekly release cadence vs. quarterly "major" release | Stated | Regression window is compressed for routine releases and back-loaded for major ones — classic big-bang risk pattern |

### 2.3 The Central Problem

**50% of production incidents = claims calculation errors + integration failures**, occurring in the exact two domains (product modules, third-party integrations) that have **zero test automation** and are tested with the same uniform, untracked-coverage approach as everything else. This is not a coincidence — it is a direct, measurable consequence of the current testing model. Fixing it requires re-allocating effort by risk, not just "testing more."

---

## 3. Risk Analysis

Risks are scored on a 1–5 scale for **Likelihood** (given current controls) and **Impact** (financial, regulatory, customer, or operational), with a composite score = Likelihood × Impact (max 25).

| ID | Risk | Likelihood | Impact | Score | Primary Owners |
|---|---|---|---|---|---|
| R1 | Claims calculation logic error (wrong payout, wrong premium/deductible math) | 5 | 5 | **25** | Auto, Health, Property Claims teams |
| R2 | Third-party integration failure or silent data mismatch (assessor feeds, external APIs) | 5 | 4 | **20** | Integration Team 1, Integration Team 2 |
| R3 | Regression coverage blind spot — a "tested" release ships with an untested broken path | 4 | 4 | **16** | All 8 teams |
| R4 | Uniform (non-risk-based) test allocation starves high-risk areas of QA time | 5 | 3 | **15** | QA leadership / all teams |
| R5 | Single-QA-per-team bus factor (illness, attrition, leave) removes all quality gating for a team | 3 | 4 | **12** | All 8 teams |
| R6 | Big-bang major release risk (quarterly release accumulates untested change) | 3 | 4 | **12** | All 8 teams |
| R7 | No shared metrics → leadership cannot prioritize QA investment correctly | 4 | 3 | **12** | QA leadership |
| R8 | Legacy/modern microservices mix → inconsistent contracts, versioning drift | 3 | 3 | **9** | Platform Svc teams, Integration teams |
| R9 | Multi-persona surface (agents, customers, third-party assessors) with divergent UX/quality expectations tested identically | 3 | 3 | **9** | Product + Integration teams |
| R10 | Platform services regress and cascade into product/integration teams that depend on them | 2 | 4 | **8** | Platform Svc teams |

---

## 4. Risk Matrix

```
                          IMPACT
              Low(1-2)     Medium(3)      High(4)        Critical(5)
          ┌───────────┬───────────────┬───────────────┬───────────────┐
Very High │           │               │      R2       │      R1       │
  (5)     │           │               │               │               │
          ├───────────┼───────────────┼───────────────┼───────────────┤
  High    │           │      R7       │   R3, R10*    │               │
  (4)     │           │               │               │               │
          ├───────────┼───────────────┼───────────────┼───────────────┤
 Medium   │           │  R8, R9       │   R5, R6      │               │
  (3)     │           │               │               │               │
          ├───────────┼───────────────┼───────────────┼───────────────┤
  Low     │           │               │      R10      │               │
  (2)     │           │               │               │               │
          └───────────┴───────────────┴───────────────┴───────────────┘
LIKELIHOOD (rows, top = highest)          *R10 shown at low likelihood / high impact — cascade risk
```

| Zone | Risk IDs | Testing Posture |
|---|---|---|
| 🔴 **Critical (score ≥ 16)** | R1, R2, R3 | Mandatory automated coverage + manual exploratory + release gate blocker |
| 🟠 **High (score 10–15)** | R4, R5, R6, R7 | Actively managed, tracked in roadmap, gate warning (not hard block yet) |
| 🟡 **Medium (score 6–9)** | R8, R9, R10 | Periodic review, opportunistic automation, monitored via metrics |

---

## 5. Risk-Based Testing Strategy

Replace "test everything equally" with **effort allocated proportionally to risk score**, enforced per team and per release.

| Risk Tier | Example Areas | Target Test Depth | Automation Requirement | Release Gate |
|---|---|---|---|---|
| **Tier 1 — Critical** | Claims calculation engines (Auto/Health/Property); third-party assessor data exchange | Unit + boundary/decision-table + contract + E2E + manual exploratory on edge cases | **Mandatory**, ≥80% of logic paths automated | **Hard block** — release cannot ship without green Tier-1 suite |
| **Tier 2 — High** | Integration retries/timeouts, regression suite health, major-release scope | API/service-level automation + targeted manual regression | **Mandatory** for new/changed code | **Block with documented exception** signed by QA lead + Eng lead |
| **Tier 3 — Medium** | Platform services (already automated), secondary UI flows | Automated regression maintained; manual only for new features | Maintain existing automation | **Warning** — visible in gate report, non-blocking |
| **Tier 4 — Low** | Cosmetic UI, non-customer-facing admin tools | Smoke test only | Optional | Informational only |

**Allocation rule of thumb for the 8 QA engineers' time per sprint:** ~60% Tier 1, ~25% Tier 2, ~10% Tier 3, ~5% Tier 4 — a deliberate inversion of today's flat allocation.

**Risk re-scoring cadence:** every quarterly major release + triggered immediately after any Sev-1/Sev-2 production incident (feeds Section 11).

---

## 6. Test Pyramid

### 6.1 Current State (5 of 8 teams) — the "Ice Cream Cone" anti-pattern

```
   ┌──────────────────────────────────────────┐
   │      MANUAL REGRESSION (untracked)        │   ← dominant effort, slow,
   │      largest layer, unknown coverage      │     not repeatable, no risk weighting
   ├──────────────────────────────────────────┤
   │   Automated UI/API — Platform teams only  │   ← thin, only 3/8 teams
   ├──────────────────────────────────────────┤
   │  Integration/contract tests — near ZERO   │   ← the layer that matters most (R2)
   ├──────────────────────────────────────────┤
   │  Unit tests on calculation logic — thin   │   ← the layer that matters most (R1)
   └──────────────────────────────────────────┘
```

### 6.2 Target State — risk-weighted pyramid (per product/integration team)

```
                         ▲
                        / \        E2E / Cross-team journeys       ~10%
                       /---\       (claims lifecycle: submit→assess→pay)
                      /     \
                     / API / \     Service & contract tests         ~25%
                    /Contract \    (integration mocks, third-party
                   /-----------\    sandbox contracts, calc APIs)
                  /             \
                 /  Unit /       \  Calculation rules, decision      ~60%
                / Component Tests \ tables, boundary values,
               /---------------------\ rating/premium/payout logic
```

Product teams (Auto/Health/Property) should **weight the base even more heavily toward unit + decision-table tests** for calculation rules, since this is the layer that directly addresses R1 (score 25, the single highest risk). Integration teams should weight the middle layer (contract + service virtualization) most heavily to address R2.

---

## 7. Coverage Strategy

| Domain | Coverage Approach | Target Metric | Owner |
|---|---|---|---|
| Claims calculation (Auto/Health/Property) | Decision-table/pairwise coverage of every rating rule, deductible, discount, and payout formula; boundary values at policy limits; golden-record regression datasets per product | ≥90% of documented calculation rules covered by automated test cases; 100% RTM traceability | Product QA + Product Owners |
| Third-party integration | Consumer-driven contract tests against each external interface; service virtualization/sandbox for offline testing; explicit timeout/retry/failure-mode test cases | 100% of external interfaces have a contract test; ≥80% of failure modes (timeout, malformed payload, partial data) tested | Integration QA + Platform Architects |
| Platform services | Maintain existing automated regression; extend to cover downstream cascade scenarios (R10) | Maintain ≥85% regression automation; add cascade/consumer-impact tests | Platform QA |
| Cross-cutting regression | Build a single **Requirements Traceability Matrix (RTM)** spanning all 8 teams, tagged by risk tier | 100% of Tier 1/2 requirements mapped; coverage % published every sprint (currently: unknown) | Central QA Architect function |
| Non-functional | Performance/load on claims submission + payout batch jobs; resilience/chaos testing on integration layer | Defined SLOs per critical journey (assumption — validate SLOs with Product) | Platform + Integration QA |

**Immediate action:** stand up the RTM and a defect taxonomy (root cause × domain × team) in **Phase 0** — without this, "coverage" and "the 50% incident figure" remain unmeasurable, and every subsequent recommendation is unverifiable.

---

## 8. Automation Strategy

| Team Group | Current State | Recommended Framework Direction | Priority Focus |
|---|---|---|---|
| Auto/Health/Property Claims | 0% automated | Shared unit/API test framework (language-aligned with backend, e.g., a single standardized stack across all 3 product teams to avoid tool fragmentation) + decision-table-driven data tests for calculation rules | Calculation engine correctness (R1) |
| Integration Team 1 & 2 | 0% automated | Consumer-driven contract testing (e.g., Pact-style) + service virtualization for third-party sandboxes so tests run without live vendor dependency | Integration reliability (R2), failure-mode simulation |
| Platform Services (1–3) | Automated | Extend existing suites to cover consumer-impact/cascade scenarios; act as the internal reference implementation for the other 5 teams | Prevent regression cascade (R10) |
| All 8 teams | Fragmented / team-local | One shared automation framework, one shared CI test-reporting standard, one shared test-data strategy — do **not** let each of the 5 catching-up teams pick a different tool | Consistency, maintainability, cross-team QA support (mitigates R5) |

**Why standardize now, not team-by-team:** with only 1 QA engineer per team and no floating capacity, a fragmented toolset means QA engineers cannot cover for each other or share test assets. A single framework is what makes the cross-team governance model in Section 12 viable.

**Sequencing (highest risk first):** Pilot automation with the **highest-volume product team + one integration team simultaneously** (see Roadmap, Section 14), not all 5 teams at once — the org has 8 QA engineers total and cannot parallelize 5 build-outs without external support or temporary contractor uplift **(assumption — validate available budget for surge capacity)**.

---

## 9. CI/CD Integration

```
 Commit/PR ──▶ Build ──▶ Unit + Contract Tests (<10 min, blocking)
                                    │
                                    ▼  merge to main
                         Nightly: API/Integration regression
                         (Tier 1 & 2 suites, against sandboxed
                          third-party virtualized services)
                                    │
                                    ▼
              Bi-weekly Release Gate: Risk-tiered regression
              (Tier 1 = hard block, Tier 2 = documented exception,
               Tier 3/4 = report only) + smoke on staging
                                    │
                                    ▼
        Quarterly Major Release Gate: Full regression (Tier 1+2)
        + performance/load + integration resilience/chaos test
        + cross-team sign-off (QA leads from all 8 teams)
```

| Pipeline Stage | Trigger | Test Scope | Gate Type |
|---|---|---|---|
| PR / Commit | Every commit | Unit, contract (fast, <10 min) | Blocking |
| Nightly | Scheduled | Integration, API regression, Tier 1/2 | Reporting → escalation if failing |
| Bi-weekly release | Every 2 weeks | Full Tier 1 + risk-tiered Tier 2/3 | Tier 1 blocking, Tier 2 exception-based |
| Quarterly major release | Every quarter | Full regression + NFR + chaos/resilience on integrations | Cross-team sign-off required |

**Immediate technical debt to retire:** the 5 non-automated teams currently have no CI test stage at all beyond build — they should get a **minimum viable pipeline (unit + smoke)** before deeper automation is built out, so at least *something* gates every commit from Sprint 1 of the rollout.

---

## 10. Metrics & KPIs

Today, none of these are tracked centrally. All targets below are Quarter-over-Quarter (QoQ) against a **Quarter 0 baseline** established in Phase 0.

| Category | Metric | Baseline (Q0) | Target (Q3) | Owner |
|---|---|---|---|---|
| **Claims Accuracy** | % of production incidents caused by calculation errors (of the current combined 50%, once split out) | Unknown — establish via taxonomy | Reduce by 40–50% | Product QA leads |
| | Automated coverage of calculation rules (Auto/Health/Property) | 0% | ≥70% Tier 1 paths | Product QA leads |
| **Integration Reliability** | % of external interfaces with contract tests | 0% | 100% | Integration QA leads |
| | Integration-caused production incident rate | Unknown — establish via taxonomy | Reduce by 40–50% | Integration QA leads |
| **Regression Health** | Regression suite coverage (RTM-mapped %) | Unknown | 100% Tier 1/2 mapped | Central QA function |
| | Automated regression % (org-wide) | 37.5% of teams (3/8) | 100% of teams have ≥1 automated tier | Central QA function |
| **Customer Experience** | Sev-1/Sev-2 incidents affecting claims processing per release | Baseline from Phase 0 | -50% by Q3 | QA leadership + Support |
| | Mean Time to Detect (MTTD) / Mean Time to Resolve (MTTR) for claims-related incidents | Baseline from Phase 0 | -30% MTTR | Platform + Product QA |
| **Process** | Defect leakage rate (prod defects ÷ total defects found) | Unknown | <15% for Tier 1 areas | Central QA function |
| | % releases passing quality gates without exception | Baseline from Phase 0 | ≥90% | Release management |

**Publish cadence:** a single cross-team QA dashboard, updated per bi-weekly release, reviewed by QA leadership every sprint and by engineering leadership every quarter.

---

## 11. Defect Leakage Reduction

| Root Cause (current state) | Contributing Factor | Mitigation |
|---|---|---|
| No automation on highest-risk code (calculation, integration) | Structural gap (Section 2) | Section 8 automation rollout, prioritized by risk score |
| No risk-based prioritization — QA effort spent flat across all features | Process gap | Section 5 risk-tiered allocation |
| Untracked regression coverage — gaps invisible until production | Measurement gap | RTM + coverage metrics (Section 7, 10) |
| No feedback loop from production incidents back into test planning | Governance gap | RCA-to-risk-matrix loop (below) |
| Single QA per team — no peer review of test design | Staffing/structural gap | Cross-team QA guild, paired test-design reviews on Tier 1 changes (Section 12) |

**Closed-loop RCA process (new):**

```
Production Incident (Sev-1/2)
        │
        ▼
Root Cause Analysis within 5 business days
        │
        ▼
Tag: Domain × Team × "escaped test layer" (unit/contract/E2E/manual/untested)
        │
        ▼
Feed into Risk Matrix re-scoring (Section 4) + add regression test
before next release ships
        │
        ▼
Quarterly leakage trend reviewed in QA Leadership retro
```

**Target:** every Sev-1/Sev-2 incident produces exactly one new automated regression test in the relevant Tier-1/2 suite before the next release — this is a leading indicator that should be tracked from Sprint 1, independent of the lagging 40–50% incident-reduction target.

---

## 12. Cross-Team Governance

With 8 isolated QA engineers (one per team, no shared reporting line implied by the structure), governance is the mechanism that turns 8 individuals into one coherent quality function.

| Governance Element | Description | Cadence |
|---|---|---|
| **QA Guild (all 8 QA engineers)** | Shared forum to align on tooling, share test assets (especially calculation test data and integration mocks across Auto/Health/Property), review Tier-1 test design together | Bi-weekly, aligned with release cadence |
| **Central QA Architect / Principal QA role** | Owns the RTM, risk matrix, cross-team metrics dashboard, and quality gate policy; is the escalation point when a team wants a gate exception | Standing role — recommend appointing/formalizing in Phase 0 |
| **Shared Test Data & Environments** | Common synthetic claims datasets (Auto/Health/Property) and shared third-party service virtualization, so no team rebuilds the same mocks independently | Maintained centrally, versioned |
| **Definition of Done (org-wide)** | Every team's "done" includes: RTM entry, risk tier assigned, automated test added for Tier 1/2 change, gate passed | Enforced at PR + sprint review |
| **Cross-team Dependency Review** | Platform Service changes reviewed for downstream impact on Product/Integration teams before release (mitigates R10 cascade) | Every bi-weekly release |
| **Incident Review Board** | Cross-team review of Sev-1/2 incidents feeding the RCA loop (Section 11) | Within 5 business days of incident |

This does **not** require a reorg — it requires a lightweight rotating or dedicated architect function plus a shared cadence, which is achievable within the current 8-QA headcount.

---

## 13. Release Quality Gates

| Release Type | Gate Criteria | Decision Authority |
|---|---|---|
| **Bi-weekly (routine) release** | Tier 1 suite: 100% pass (hard block). Tier 2: pass or documented, time-boxed exception. Tier 3/4: reported, non-blocking. Coverage dashboard shows no regression in Tier 1/2 automation %. | Team QA engineer + Eng lead; escalate exceptions to Central QA Architect |
| **Quarterly major release** | All bi-weekly criteria **plus**: full regression (Tier 1+2) across all 8 teams, performance/load test on claims submission & payout paths, integration resilience/chaos test executed, cross-team sign-off from all 8 QA engineers, zero open Sev-1/Sev-2 defects in scope | QA Leadership + Engineering Steering Group joint sign-off |
| **Hotfix / emergency release** | Targeted regression on affected Tier 1/2 area only; full regression scheduled within 48 hours post-release; RCA opened immediately | Central QA Architect approval, expedited |

**Exception policy:** any Tier 1 gate exception requires written justification, a compensating control (e.g., feature flag, staged rollout), and an auto-generated RCA-style follow-up item — exceptions should be visible on the shared dashboard, not silent.

---

## 14. Implementation Roadmap

Aligned to the existing bi-weekly/quarterly cadence — no new release rhythm is introduced, only new gates and metrics layered onto it.

```
Phase 0        Phase 1 (Q1)         Phase 2 (Q2)              Phase 3 (Q3)            Phase 4 (Q4+)
Wk 1-4         Major Release 1      Major Release 2           Major Release 3        Ongoing
│              │                    │                          │                       │
▼              ▼                    ▼                          ▼                       ▼
Baseline &     Pilot automation:    Scale automation:          Maturity:               Continuous
Discovery      1 product team +     remaining 2 product        Full Tier 1/2           risk
               1 integration team   teams + 1 integration      automated org-wide;     re-scoring,
Defect         Risk matrix v1       team                       gates enforced          RCA loop,
taxonomy       RTM v1 (Tier 1/2)    QA Guild formalized         org-wide;               dashboard
+ RTM setup    Gate v1 (pilot       Shared test data/mocks     leakage KPI review      optimization
               teams only)          live                        vs. Q0 baseline
Coverage       Metrics dashboard    Gate v2 (org-wide,
audit          v1                   Tier 1 blocking)
```

| Phase | Duration | Key Deliverables |
|---|---|---|
| **0 — Discovery & Baseline** | Weeks 1–4 | Defect taxonomy instrumented; coverage audit of current manual suites; risk workshop with all 8 teams to populate Risk Matrix v1; RTM skeleton created; Central QA Architect role assigned |
| **1 — Pilot** | Q1 (1 major release cycle) | Automation pilot on **1 product team + 1 integration team** (choose highest incident volume); Tier 1 gate live for pilot teams only; metrics dashboard v1 (even if partially populated); QA Guild kicked off |
| **2 — Scale** | Q2 | Automation extended to remaining 2 product teams + remaining integration team; shared test data/service virtualization live; org-wide Tier 1 gate enforced; DoD updated org-wide |
| **3 — Maturity** | Q3 | All 8 teams have Tier 1/2 automated coverage; full regression RTM live; leakage KPI formally reviewed against Q0 baseline; resilience/chaos testing added for integrations |
| **4 — Continuous Improvement** | Q4 onward | Risk matrix re-scored every major release automatically from incident data; governance model reviewed and tuned; expand NFR/performance coverage |

**Resourcing note:** rolling out automation to 5 teams within 2 quarters with 8 QA engineers (no dedicated automation engineers stated) is aggressive. Recommend either (a) temporary automation-engineer surge capacity for Phases 1–2, or (b) extending Phase 2 by one additional quarter **(assumption — decision needed from QA leadership based on budget)**.

---

## 15. Expected Outcomes

| Outcome | Baseline | 3-Quarter Target | How Achieved |
|---|---|---|---|
| Claims-calculation/integration production incidents | 50% of all incidents (combined, unsegmented) | **-40–50%** | Tier 1 automated coverage on calculation logic + contract testing on integrations |
| Automated coverage on currently-manual teams | 0% (5 of 8 teams) | **≥70%** of Tier 1 paths | Phased rollout, Sections 8 & 14 |
| Regression coverage visibility | Unknown / untracked | **100%** RTM-mapped for Tier 1/2 | Section 7 |
| Defect leakage rate (Tier 1 areas) | Unknown | **<15%** | Section 11 closed-loop RCA |
| Release gate consistency | None (ad hoc, per team) | **≥90%** of releases pass gates without exception | Section 13 |
| Cross-team quality consistency | 8 independent, ungoverned QA practices | 1 shared framework, shared metrics, shared DoD | Section 12 |
| Leadership visibility | No centralized metrics exist today | Live cross-team dashboard, reviewed every sprint/quarter | Section 10 |

**Bottom line for QA leadership:** this plan does not ask for a QA headcount increase as its first move — it asks for the *existing* 8 QA engineers' effort to be re-pointed at the risks that are demonstrably causing half of all production incidents, backed by the automation, governance, and metrics needed to prove it's working. A headcount or surge-capacity request (Section 14 resourcing note) should be evaluated only after Phase 0 baseline data confirms the scope.
