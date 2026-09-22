---
name: code-quality-review
description: Runs a Spring Boot + React + Terraform code quality audit against this repo's deviations from framework defaults (missing global exception handler, missing Spring Security/CORS, missing static analysis tooling, missing test layers, unvalidated free-text fields, inconsistent @Transactional boundaries, missing DB indexes, TypeScript strict mode off, unhandled mutation errors, missing Error Boundary, duplicated types) and infra defaults (hardcoded secrets in .tf files, overly permissive Security Group rules, missing resource tags, unpinned provider versions, state file handling), and cross-checks docs/ (requirements.md, functional-requirements.md, screen-design.md, database-design.md, api-reference.md, infrastructure.md) against the actual implementation. Use this whenever asked to do a code quality review, quality check, standards check, or to audit backend/frontend/infra implementation against Spring Boot/React/Terraform best practices and the design docs.
---

# Code Quality Review

This repo went through a full quality pass (see Issue #24) that found and fixed 15 concrete deviations from Spring Boot / React defaults, plus 3 documentation drifts from the actual implementation. Two items were deliberately deferred (Spring Security — no User entity/auth requirement yet; `window.confirm` for delete — screen-design.md specifies it). Use this checklist to run the same review again on new code, or periodically as a maintenance sweep.

## How to run this review

1. Read the current state of `backend/src/main/java/com/example/taskmanagement/`, `frontend/src/`, and `infra/` (when infra files changed).
2. Walk each checklist item below against the current code — don't assume a past fix still holds; things drift.
3. Read `docs/requirements.md`, `docs/functional-requirements.md`, `docs/screen-design.md`, `docs/database-design.md`, `docs/api-reference.md`, `docs/infrastructure.md` and diff their claims against the actual controllers/entities/components/infra resources.
4. Report findings the same way the original audit did: a table of ✅ already-fixed / ⚠️ regressed / 🆕 new issue, backend/frontend/infra split, docs drift listed separately.
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

## Infra checklist (Terraform)

- **No hardcoded secrets in `.tf` files**: passwords, access keys, and other credentials must never appear as literal values in `.tf` files (`variables.tf`, `main.tf`, etc.) — they belong in `terraform.tfvars` (gitignored) or an external secret store, referenced via `var.xxx` with `sensitive = true` on the variable declaration. Check `infra/*.tf` doesn't have anything `terraform.tfvars` should hold instead.
- **`.gitignore` covers Terraform state and local secrets**: `infra/terraform.tfvars`, `infra/*.tfstate`, `infra/*.tfstate.*`, and `infra/.terraform/` must be gitignored. `.terraform.lock.hcl` is the one exception — that should be committed so provider versions stay pinned across machines.
- **Provider/Terraform version pinning**: `main.tf`'s `terraform` block must have `required_version` and each provider in `required_providers` must have a `version` constraint (not left unpinned). Run `terraform validate` after any `.tf` change — it must pass with no errors.
- **Security Group least-privilege**: any `ingress` rule with `cidr_blocks = ["0.0.0.0/0"]` must be justified by the resource actually needing public access (e.g. Nginx on :80 for a public-facing app). SSH (:22) and any application-internal port (e.g. backend on :8080, DB on :5432) must never have a `0.0.0.0/0` ingress rule — SSH should reference a variable like `var.my_ip_cidr`, and inter-resource access (e.g. RDS from EC2) should reference `security_groups = [aws_security_group.xxx.id]` rather than a hardcoded CIDR or wide-open port.
- **RDS/datastore public accessibility**: any `aws_db_instance` (or equivalent) must have `publicly_accessible = false` unless there's a documented reason otherwise.
- **Resource tagging**: every taggable resource (`aws_instance`, `aws_db_instance`, `aws_vpc`, `aws_subnet`, `aws_security_group`, etc.) should have at least a `Name` tag using `var.project_name` as a prefix, for consistency and to make resources identifiable in the AWS console.
- **user_data / provisioning scripts don't embed secrets**: `infra/user-data.sh` (or any script passed as `user_data`) must not contain DB passwords or other credentials — those get baked into the EC2 instance metadata, which is a broader exposure surface than the instance itself. Secrets should be delivered post-boot (e.g. scp'd into a root-only file consumed via systemd `EnvironmentFile`), not embedded in the boot script.
- **`user_data_replace_on_change` awareness**: if `user_data_replace_on_change = true` is set on an `aws_instance`, flag any change to the referenced script as instance-replacing — call this out explicitly when reviewing a diff that touches `user-data.sh`, since it means the next `terraform apply` destroys and recreates the instance (SSH host key changes, IP changes, any manually-deployed app files are lost).
- **No destructive defaults left over from experimentation**: `skip_final_snapshot = true` and `deletion_protection = false` on `aws_db_instance` are acceptable for this learning/verification project (see `docs/infrastructure.md` — resources are destroyed between sessions), but flag them explicitly in the report as a deliberate tradeoff, not silently pass over them — they'd be a problem in a real production setup.

## Docs-vs-implementation cross-check

When reviewing, actually diff these claims against code — don't trust the doc's prose:

- `docs/screen-design.md` — screen list, wireframes, and the mermaid transition diagram must reflect every implemented UI action (column add/rename/delete, card CRUD, drag-and-drop, sort buttons). A feature description living in one section (e.g. inline column operations at the top) but marked "not implemented" further down in the same file is a known failure mode here — check the whole file, not just the section you're editing.
- `docs/api-reference.md` — must list every `@GetMapping`/`@PostMapping`/`@PutMapping`/`@PatchMapping`/`@DeleteMapping` in `controller/`, including validation rules taken straight from the DTO annotations (not paraphrased).
- `docs/database-design.md` — must mention the actual schema-generation mechanism (`ddl-auto: update`, no Flyway/Liquibase yet) and the `data.sql` seed behavior, not just present the table definitions as if hand-migrated.
- `docs/infrastructure.md` — the architecture diagram and resource table must reflect what's actually declared in `infra/*.tf` (e.g. if a resource like an ALB or a second EC2 instance gets added, the doc's diagram and resource list must be updated too). This doc intentionally omits fine-grained values (CIDR ranges, instance sizes, exact port numbers) since those drift — don't flag their absence as a gap, but do flag a structural mismatch (e.g. doc says "EC2 + RDS", actual code adds an S3 bucket with no doc update).
- If code and docs disagree, treat the **implementation as the source of truth** and update the doc — unless the disagreement reveals a genuine implementation bug (e.g. a documented business rule the API doesn't actually enforce), in which case flag it as a code finding instead of silently rewriting the doc to match a bug.

## Known deferred items (don't re-flag without new context)

- Spring Security / user authentication — deferred, no `User` entity exists.
- `window.confirm` for delete confirmations — deferred, matches `docs/screen-design.md` spec.

If either of these becomes newly relevant (e.g. a `User` entity gets added, or the design doc changes), re-open them as fresh findings rather than assuming the old deferral still applies.
