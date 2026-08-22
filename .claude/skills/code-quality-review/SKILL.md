---
name: code-quality-review
description: Runs a Spring Boot + React code quality audit against this repo's deviations from framework defaults (missing global exception handler, missing Spring Security/CORS, missing static analysis tooling, missing test layers, unvalidated free-text fields, inconsistent @Transactional boundaries, missing DB indexes, TypeScript strict mode off, unhandled mutation errors, missing Error Boundary, duplicated types) and cross-checks docs/ (requirements.md, functional-requirements.md, screen-design.md, database-design.md, api-reference.md) against the actual implementation. Use this whenever asked to do a code quality review, quality check, standards check, or to audit backend/frontend implementation against Spring Boot/React best practices and the design docs.
---

# Code Quality Review

This repo went through a full quality pass (see Issue #24) that found and fixed 15 concrete deviations from Spring Boot / React defaults, plus 3 documentation drifts from the actual implementation. Two items were deliberately deferred (Spring Security — no User entity/auth requirement yet; `window.confirm` for delete — screen-design.md specifies it). Use this checklist to run the same review again on new code, or periodically as a maintenance sweep.

## How to run this review

1. Read the current state of `backend/src/main/java/com/example/taskmanagement/` and `frontend/src/`.
2. Walk each checklist item below against the current code — don't assume a past fix still holds; things drift.
3. Read `docs/requirements.md`, `docs/functional-requirements.md`, `docs/screen-design.md`, `docs/database-design.md`, `docs/api-reference.md` and diff their claims against the actual controllers/entities/components.
4. Report findings the same way the original audit did: a table of ✅ already-fixed / ⚠️ regressed / 🆕 new issue, backend and frontend split, docs drift listed separately.
5. If asked to fix, follow this repo's CLAUDE.md workflow: one Issue, one branch (`chore/<issue>-...` or `fix/...`), commit each fix separately with `refs #<issue>`, one PR.

## Backend checklist (Spring Boot)

- **Global exception handling**: a `@RestControllerAdvice` (see `exception/GlobalExceptionHandler.java`) must exist and handle `ResponseStatusException`, `MethodArgumentNotValidException`, and a catch-all `Exception`. New controllers/services must not bypass it with ad-hoc error shapes.
- **CORS**: `config/WebConfig.java` must have an explicit `addCorsMappings` for `/api/**`. If the frontend origin changes, update it there — don't add `@CrossOrigin` piecemeal on individual controllers.
- **Authentication/authorization**: currently intentionally absent (no `User` entity, no `spring-boot-starter-security`). Flag this as a known gap in reports, don't silently "fix" it by bolting on auth — that's a separate, larger design decision requiring a dedicated Issue.
- **Static analysis**: Spotless is wired into `build.gradle.kts` and runs via `./gradlew check`. Any new Java file must pass `./gradlew spotlessCheck`; run `./gradlew spotlessApply` before committing if it doesn't. Note: on this Windows machine, freshly-written files can appear as CRLF due to `core.autocrlf`, and Spotless (`lineEndings = PLATFORM_NATIVE`) treats that as canonical — always run `spotlessApply` once after writing/editing Java files, not just `spotlessCheck`.
- **Test coverage**: every new `Controller` needs a `@WebMvcTest` (import `GlobalExceptionHandler` explicitly, use `@MockitoBean` not the deprecated `@MockBean`), every new `Repository` with derived query methods needs a `@DataJpaTest`. Both run against H2 via the `test` Spring profile (`src/test/resources/application-test.yml`) — never require a live Postgres for unit-level tests. Note this repo is on Spring Boot 4.1's modular test packages: `org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest` and `org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest`, not the pre-4.x `org.springframework.boot.test.autoconfigure.*` paths.
- **Free-text fields with an implicit fixed domain**: if a DTO field is documented or used elsewhere as one of a fixed set of values (e.g. `priority` = 高/中/低), it must have `@Pattern`/enum validation at the DTO boundary, not just a `@Size` cap. Check that any `Map`/`Comparator` keyed on such a field (e.g. `ColumnService.PRIORITY_ORDER`) stays in sync with the validation regex — a comment cross-referencing both is fine.
- **Transactional boundaries**: any service method that does read-then-write across multiple rows (recompute `displayOrder`, batch `saveAll`, multi-entity updates) needs `@Transactional`, not just the "obvious" reorder endpoints. Check `CardService`/`ColumnService` create/update paths specifically.
- **DB indexes**: entities queried by a derived method with `WHERE`+`ORDER BY` on the same columns (e.g. `findAllByColumnIdOrderByDisplayOrderAsc`) should have a matching `@Table(indexes = @Index(...))`. Since this repo uses `ddl-auto: update`, a new index is picked up automatically on next boot — verify by checking backend startup logs for `create index ...`.
- **Package placement**: all `@RestController`/`@Service`/`@Repository`/`@Entity` classes belong under their respective subpackage (`controller`, `service`, `repository`, `entity`, `dto`, `exception`, `config`), never loose in the root `com.example.taskmanagement` package.

## Frontend checklist (React + TypeScript)

- **Error Boundary**: `App.tsx` must wrap the main tree (`<Board />`) in `<ErrorBoundary>`. Any new top-level route/screen added later needs the same wrapping.
- **Mutation error handling**: every handler in `Board.tsx` that calls a mutating API function (create/update/delete/move/sort/rename) must be wrapped in try/catch and set a user-visible error state (see `actionError`) — don't let a rejected promise fail silently. Read-then-render initial loads already have this pattern; mutations must match it.
- **TypeScript strict mode**: `tsconfig.app.json` and `tsconfig.node.json` must keep `"strict": true`. Don't add `any` to work around a strict-mode error — fix the underlying type.
- **Shared domain types**: don't duplicate inline object-literal types (e.g. `{ title: string; description: string; priority: string; dueDate: string | null }`) across components — add/extend `types/index.ts` (`Priority`, `TaskFormInput`, etc.) and reuse it.
- **Test coverage**: components with meaningful conditional rendering or user interaction (delete confirmation, validation error display, fallback UI) need a Vitest + Testing Library test. Run `npm run test`. New API-calling components should mock the api layer, not hit the network.
- **Linting/formatting**: `npm run lint` (oxlint) and `npx prettier --check .` must both pass before committing. Don't hand-format — run `npx prettier --write .` and let it settle disputes over quote style/line length.
- **`window.confirm`**: intentionally kept for delete confirmations per `docs/screen-design.md`. Don't replace it with a custom modal without first updating that doc — they must stay in sync.

## Docs-vs-implementation cross-check

When reviewing, actually diff these claims against code — don't trust the doc's prose:

- `docs/screen-design.md` — screen list, wireframes, and the mermaid transition diagram must reflect every implemented UI action (column add/rename/delete, card CRUD, drag-and-drop, sort buttons). A feature description living in one section (e.g. inline column operations at the top) but marked "not implemented" further down in the same file is a known failure mode here — check the whole file, not just the section you're editing.
- `docs/api-reference.md` — must list every `@GetMapping`/`@PostMapping`/`@PutMapping`/`@PatchMapping`/`@DeleteMapping` in `controller/`, including validation rules taken straight from the DTO annotations (not paraphrased).
- `docs/database-design.md` — must mention the actual schema-generation mechanism (`ddl-auto: update`, no Flyway/Liquibase yet) and the `data.sql` seed behavior, not just present the table definitions as if hand-migrated.
- If code and docs disagree, treat the **implementation as the source of truth** and update the doc — unless the disagreement reveals a genuine implementation bug (e.g. a documented business rule the API doesn't actually enforce), in which case flag it as a code finding instead of silently rewriting the doc to match a bug.

## Known deferred items (don't re-flag without new context)

- Spring Security / user authentication — deferred, no `User` entity exists.
- `window.confirm` for delete confirmations — deferred, matches `docs/screen-design.md` spec.

If either of these becomes newly relevant (e.g. a `User` entity gets added, or the design doc changes), re-open them as fresh findings rather than assuming the old deferral still applies.
