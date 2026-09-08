# SDD ledger — plan: docs/superpowers/plans/2026-09-08-release-2-lembretes.md

## Setup

- Branch: `release-2`.
- Baseline: API 46/46 and web 34/34 passed with `postgres-test` active.
- Existing unrelated working-tree changes: `README.md` and `package.json`; they must remain outside Release 2 commits.
- Plan/spec commit: `a9c811e` (`docs(release): define release 2 scope`).
- The skill's `task-brief` helper could not run because its nested `sdd-workspace` script is not executable; Task 1 uses the manually extracted brief at `task-1-brief.md` instead.

## Pre-flight scan

| Task  | Shared file/interface                                                              | Result                                                                                                                                               |
| ----- | ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 ↔ 2 | `packages/contracts/src/index.ts`, patient fields consumed by reminder eligibility | Task 1 produces contact/consent fields; Task 2 consumes them. No contradiction.                                                                      |
| 1 ↔ 3 | patient fields and `clinicaId`                                                     | Task 3 consumes Task 1 data through Task 2; no direct write conflict intended.                                                                       |
| 2 ↔ 3 | `lembretes` domain/application/infra and contracts/schema                          | Task 2 produces transport, persistence and manual service; Task 3 extends the same interfaces for idempotent windows. Sequential execution required. |
| 2 ↔ 4 | web agenda/tests and docs                                                          | Task 4 only closes integration/DoD gaps after Task 2/3. No contradiction.                                                                            |
| 3 ↔ 4 | `package.json`, tests and operational docs                                         | Task 3 owns the worker command; Task 4 documents and verifies it. No contradiction.                                                                  |
| 1     | patient contact/consent tests vs files                                             | Tests cover validation, revocation, permission and response; implementation files match.                                                             |
| 2     | reminder manual tests vs files                                                     | Tests cover message minimization, eligibility, simulator, failure, duplicate and permission; implementation files match.                             |
| 3     | worker tests vs files                                                              | Tests cover 24h/48h selection, window, cancelled/no-consent and idempotency; implementation files match.                                             |
| 4     | final integration/DoD vs files                                                     | Verification and release documentation are scoped to the implemented release.                                                                        |

Ruling: keep implementation tasks sequential because Tasks 2 and 3 share the new reminder module; parallel implementation would create merge conflicts and weaken review boundaries.

Task 1: fix round 1/5 — reviewer found one Important gap: PATCH `{ consentimentoAtivo: true }` is rejected by the contract even when persisted phone/channel make the effective patient state valid. Resume the original implementer; fix with a regression test and domain/application validation.

Task 1: fix round 1/5 (1 addressed, 0 open; commit `6a8ba22`). Re-review approved the fix; the effective persisted state is now validated for partial consent reactivation.
Task 1: complete (commits `9e695dd`..`6a8ba22`, review clean). Minor deferred: generated Release 2 migration filenames duplicate historical numeric prefixes (`0004`/`0005`) that are not journaled on the base branch; final integration must decide whether a safe migration naming cleanup is required.

Task 2: fix round 1/5 — reviewer found five Important findings (concurrent/persistence-safe idempotency, real cross-clinic/pending isolation tests, failure sanitization, dependency injection, and transactional failure/audit integration coverage) plus three Minor findings (unused request schema, missing UI failure feedback test, report provenance). Resume the original implementer and address all findings.

Task 2: fix round 2/5 — independent re-review found four Important gaps: expired claims were
hidden from pending listings, failure-code sanitization accepted inherited properties, the web
retry test did not exercise the click/second request/success path, and no integration test covered
finalization persistence failure after transport success. Resume the original implementer; all four
must be addressed before Task 2 can complete.

Task 2: fix round 2/5 (4 addressed, 0 open; commits `21452eb`, `ea8ac96`, `5285b8d`). Re-review
approved: expired claims are visible/recoverable, sanitization uses own-property whitelist,
browser retry is exercised end-to-end, and finalization persistence failure has PostgreSQL coverage.
Task 2: complete (commits `746e22c`..`5285b8d`, review clean). Minor deferred: generated Release 2
migration filenames still include historical duplicate numeric prefixes (`0004`/`0005`) that are not
journaled on the base branch; final integration must decide whether a safe naming cleanup is needed.

Task 3: complete (commits `45b6e7e`, `4f95d14`, review clean). Worker 24/48h uses clinic timezone,
configurable operational window/tolerance/batch, shared transactional claims, safe simulator and
PII-free summary. PostgreSQL command smoke test returned `CONCLUIDO` with zero counts.

Task 4 baseline (commit `09897d1`) added the PostgreSQL E2E flow, release documentation and DoD
evidence. The final review then identified three Important and three Minor findings. The current
fix round adds real pending pagination, persisted-window retry, strict persisted-hour validation,
and removes test definite-assignment assertions. Baseline evidence was API 87/87 and Web 42/42;
current evidence is API 92/92 and Web 43/43, with focused lint/Prettier, type-check, build,
coverage, audit, migration and worker checks passing. Independent final review approved the fix
round with 0 Critical and 0 Important findings; only the pre-existing README formatting remains.
