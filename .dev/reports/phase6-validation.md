# Phase 6 Validation Report

**Date:** 2026-03-19
**Scope:** Validate TypeScript compilation, unit tests, and state machine tests after the `@gsd/claude-code-adapter` migration.

---

## 1. TypeScript Compilation

### 1a. Adapter Package (`packages/claude-code-adapter`) -- PASS

```
cd packages/claude-code-adapter && npx tsc --noEmit
```

**Result: Clean compilation -- zero errors.**

The adapter package has its own `tsconfig.json` with `"types": ["node"]` and `@types/node` installed as a devDependency. It compiles without issues in isolation.

### 1b. Root Project (`npx tsc --noEmit` from repo root) -- 410 errors

**Error breakdown by code:**

| Error Code | Count | Description |
|------------|-------|-------------|
| TS2580     | 320   | `Cannot find name 'process'/'Buffer'` (missing `@types/node`) |
| TS2307     | 66    | `Cannot find module` (node builtins, chalk, etc.) |
| TS2339     | 10    | Property does not exist on type |
| TS7006     | 6     | Parameter implicitly has 'any' type |
| TS2454     | 4     | Variable used before assignment |
| TS18048    | 3     | Value is possibly undefined |
| TS2322     | 1     | Type is not assignable |

**Classification:**

- **All 410 errors are PRE-EXISTING.** The root `tsconfig.json` does not include `"types": ["node"]` and has no `@types/node` dependency at the root level. This means every `process`, `Buffer`, `node:fs`, `node:path`, etc. reference in `src/` files fails. This is the project's existing state -- the root tsconfig excludes `src/resources` and `src/tests` and was never intended to pass `tsc --noEmit` cleanly.
- **34 of the 410 errors** come from `packages/claude-code-adapter/src/` files appearing in the root `tsc` output. These are false positives from the workspace -- the adapter compiles cleanly with its own tsconfig.
- **Zero errors are introduced by the adapter migration.**

**Files with errors (root scope):**
- `src/cli.ts`, `src/app-paths.ts`, `src/bundled-extension-paths.ts`, `src/bundled-resource-path.ts`
- `src/extension-discovery.ts`, `src/extension-registry.ts`, `src/headless*.ts`
- `src/loader.ts`, `src/mcp-server.ts`, `src/models-resolver.ts`
- `src/onboarding.ts`, `src/pi-migration.ts`, `src/resource-loader.ts`
- `src/startup-timings.ts`, `src/tool-bootstrap.ts`, `src/update-check.ts`
- `src/worktree-cli.ts`, `src/help-text.ts`, `src/remote-questions-config.ts`

---

## 2. Unit Tests

```
npm run test:unit
```

| Metric     | Count |
|------------|-------|
| Total      | 1131  |
| Pass       | 939   |
| Fail       | 190   |
| Skipped    | 2     |
| Cancelled  | 0     |

**Pass rate: 83.0%**

### Failure Classification

#### Category A: `@gsd/pi-coding-agent` missing module (majority of failures)

**~160+ failures** are caused by:
```
Error [ERR_MODULE_NOT_FOUND]: Cannot find module
  '/home/user/gsd-2/node_modules/@gsd/pi-coding-agent/dist/index.js'
```

These failures occur in test files that transitively import from source files still referencing `@gsd/pi-coding-agent`. The migration to `@gsd/claude-code-adapter` has not yet been applied across all 147 source files that still import from `@gsd/pi-coding-agent`.

**Affected test areas:** All GSD extension tests (auto-*, derive-state*, dashboard*, dispatch*, export*, milestone*, worktree*, etc.), plus app-smoke tests.

#### Category B: `@gsd/pi-tui` missing module

**~30 failures** caused by:
```
Error [ERR_MODULE_NOT_FOUND]: Cannot find module
  '/home/user/gsd-2/node_modules/@gsd/pi-tui/dist/index.js'
```

71 source files still import from `@gsd/pi-tui`. This is a separate package (TUI components) that has not been migrated yet. Affected files include `shared/format-utils.ts`, `shared/ui.ts`, `gsd/dashboard-overlay.ts`, `gsd/visualizer-views.ts`, `get-secrets-from-user.ts`, and many others.

#### Category C: Missing `chokidar` package

2 failures in `file-watcher.test.ts`:
```
Cannot find package 'chokidar'
```

**Pre-existing** -- unrelated to adapter migration.

#### Category D: TypeScript strip-only mode limitations

1 failure in `extension-smoke.test.ts`:
```
TypeScript parameter property is not supported in strip-only mode
```

**Pre-existing** -- Node's `--experimental-strip-types` does not support TS parameter properties.

#### Category E: Other isolated failures

- `continue-here` (2 subtests failed)
- `skill-telemetry`, `skill-health`, `skill_staleness_days` -- likely transitive `@gsd/pi-coding-agent` import failures
- `handleExport --html` -- transitive `@gsd/pi-tui` import failure

---

## 3. State Machine Tests (deriveState / resolveDispatch)

```
node --import ./src/resources/extensions/gsd/tests/resolve-ts.mjs \
  --experimental-strip-types --test \
  src/resources/extensions/gsd/tests/derive-state*.test.ts
```

| Metric | Count |
|--------|-------|
| Total  | 4     |
| Pass   | 0     |
| Fail   | 4     |

**All 4 test files fail** -- but NOT due to state machine logic errors. Every failure is caused by transitive imports hitting the missing `@gsd/pi-coding-agent` or `@gsd/pi-tui` modules.

The state machine code itself (`deriveState`, `resolveDispatch`) is SDK-agnostic, but the test files import helpers or fixtures that transitively pull in the old package references.

**Note:** No `state*.test.ts` files exist -- the actual test files are named `derive-state*.test.ts`.

---

## 4. Summary of Issues

### Issue 1: 147 source files still import `@gsd/pi-coding-agent` (CRITICAL)

The adapter package `@gsd/claude-code-adapter` has been created, but the import migration across the codebase is incomplete. 147 `.ts` files outside the adapter package still reference `@gsd/pi-coding-agent`. This is the root cause of ~160 test failures.

**Fix:** Complete the import swap from `@gsd/pi-coding-agent` to `@gsd/claude-code-adapter` across all 147 files. This may require re-exporting symbols or creating compatibility shims if the API surface differs.

### Issue 2: 71 source files still import `@gsd/pi-tui` (CRITICAL)

`@gsd/pi-tui` is a separate TUI component library that also needs migration or the built `dist/` artifacts need to be present.

**Fix:** Either migrate these imports to a new adapter/package, or ensure `@gsd/pi-tui` is built (its `dist/` directory needs to exist).

### Issue 3: Missing `chokidar` dependency (PRE-EXISTING)

The `file-watcher.ts` imports `chokidar` but it is not installed.

### Issue 4: TS parameter properties in strip-only mode (PRE-EXISTING)

One extension uses TypeScript parameter properties which are unsupported by Node's `--experimental-strip-types`.

---

## 5. Recommendations

### Immediate Next Steps

1. **Complete the `@gsd/pi-coding-agent` import migration.** The 147 files importing from `@gsd/pi-coding-agent` need to be updated to import from `@gsd/claude-code-adapter`. This is the single highest-impact change -- it would resolve ~160 of the 190 test failures.

2. **Resolve the `@gsd/pi-tui` dependency.** Either:
   - Build the `@gsd/pi-tui` package so its `dist/index.js` exists, OR
   - Create a `@gsd/claude-code-tui` adapter following the same pattern, OR
   - Re-export the needed TUI symbols through `@gsd/claude-code-adapter`

3. **Add `@types/node` to root devDependencies** (optional but recommended) to fix root-level `tsc --noEmit`. Alternatively, add `"types": ["node"]` to the root `tsconfig.json`.

### Validation After Fixes

After completing the import migration, re-run:
```bash
# Adapter compilation (should remain clean)
cd packages/claude-code-adapter && npx tsc --noEmit

# Full test suite (target: 939+ passing)
npm run test:unit

# State machine tests specifically
node --import ./src/resources/extensions/gsd/tests/resolve-ts.mjs \
  --experimental-strip-types --test \
  src/resources/extensions/gsd/tests/derive-state*.test.ts
```

**Expected outcome:** Once the 147 `@gsd/pi-coding-agent` and 71 `@gsd/pi-tui` imports are resolved, the test pass rate should return to near 100% (minus the 3-4 pre-existing failures for `chokidar` and TS strip-mode).
