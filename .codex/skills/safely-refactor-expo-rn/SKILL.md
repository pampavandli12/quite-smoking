---
name: safely-refactor-expo-rn
description: Safely refactor production React Native Expo applications while preserving behavior. Use when Codex is asked to refactor, simplify, reorganize, clean up, or improve architecture/readability/maintainability in Expo or React Native TypeScript code, especially apps using navigation, databases, RevenueCat subscriptions, Expo APIs, or React Native Paper.
---

# Safely Refactor Expo RN

## Overview

Refactor production Expo React Native code conservatively. Preserve existing functionality, business logic, navigation, database behavior, and RevenueCat subscription behavior unless the user explicitly requests a behavioral change.

Prefer the smallest safe diff that improves readability, maintainability, or architecture. Separate future improvements from the actual refactor.

## Non-Negotiables

- Preserve all functionality unless explicitly requested.
- Preserve business logic, data flow, side effects, user-visible copy, validation rules, feature flags, analytics, and error handling.
- Preserve navigation route names, params, deep links, modal presentation behavior, auth guards, tab/stack structure, and back behavior.
- Preserve database schemas, migrations, queries, transactions, subscriptions/listeners, caching semantics, persistence keys, and offline behavior.
- Preserve RevenueCat product identifiers, entitlement identifiers, offerings, purchase/restore flows, paywall gating, customer info refresh behavior, and platform-specific subscription handling.
- Never introduce breaking changes to public component props, exported functions, route contracts, storage keys, database shapes, API payloads, or environment variable names.
- Prefer Expo APIs over bare React Native/native-module alternatives when a choice exists.
- Prefer React Native Paper components when replacing or consolidating UI primitives in an app that already uses Paper.
- Use strict TypeScript. Avoid `any`; prefer precise types, discriminated unions, typed route params, and explicit return types where they clarify contracts.
- Remove duplication only when the abstraction is obvious, local, and behavior-preserving.
- Produce the smallest safe diff. Avoid drive-by formatting, broad rewrites, dependency swaps, or folder churn.

## Workflow

1. Inspect before editing.
   - Read the touched files and nearby call sites.
   - Search for route names, exported APIs, database helpers, RevenueCat usage, storage keys, and shared types before changing them.
   - Identify tests, typecheck, lint, and Expo scripts from `package.json`.

2. Define the behavior lock.
   - State what must remain identical: screens, props, route params, database reads/writes, subscription gating, side effects, and UI states.
   - Treat unclear behavior as intentional until proven otherwise.
   - Ask only when a refactor cannot be made safely without product intent.

3. Choose the smallest safe move.
   - Prefer renaming locals, extracting pure helpers, narrowing types, consolidating repeated JSX, and moving code only within existing boundaries.
   - Keep component public APIs stable unless every caller is updated and the change is still non-breaking.
   - Avoid replacing libraries, navigation patterns, database clients, state managers, or purchase flows as part of a refactor.

4. Implement conservatively.
   - Preserve import order/style conventions used by the repo.
   - Keep platform-specific branches (`ios`, `android`, `web`) intact.
   - Keep async timing, loading states, cleanup functions, dependency arrays, and subscription/listener lifecycles equivalent.
   - Do not change payment, auth, onboarding, or persistence behavior to make code look cleaner.

5. Verify.
   - Run the narrowest reliable checks available: typecheck, lint, tests, or focused test files.
   - For navigation, database, or RevenueCat changes, explicitly re-check call sites and contracts even if automated tests pass.
   - If a check cannot run, report the exact reason and residual risk.

6. Report clearly.
   - Explain the reasoning behind each change.
   - Distinguish completed refactor changes from future improvement suggestions.
   - Mention validation performed and any remaining risk.

## Safe Refactor Patterns

- Extract pure functions for repeated formatting, validation, mapping, filtering, or derived state.
- Extract small presentational components when repeated JSX has the same props, accessibility behavior, and interaction semantics.
- Replace duplicated inline styles with local `StyleSheet` entries or existing theme tokens without changing layout.
- Consolidate repeated React Native Paper usage into local components only when the visual and behavioral contract is identical.
- Improve TypeScript by typing route params, component props, database rows, API responses, and RevenueCat customer/entitlement checks.
- Move constants near their domain when they are reused and stable: route names, storage keys, query keys, product IDs, entitlement IDs, and theme values.
- Split large components only along existing responsibilities: data loading, subscription gating, form state, and presentation.

## High-Risk Areas

Apply extra scrutiny to these areas:

- Navigation: Route names, param types, nested navigators, `initialRouteName`, linking config, headers, gestures, presentation modes, and auth redirects.
- Database: Schema definitions, migrations, indexes, conflict handling, transaction boundaries, listeners, sync queues, timestamps, nullability, and persistence keys.
- RevenueCat: `Purchases.configure`, product IDs, offering IDs, package selection, entitlement checks, purchase/restore flows, customer info caching, and platform conditionals.
- Expo: Permissions, notifications, secure storage, file system, router/linking, updates, build config, plugins, and platform-specific APIs.
- React hooks: Dependency arrays, cleanup, memoization, stale closures, callback identity passed to children, and effects with side effects.

If a change touches these areas, prefer a smaller local cleanup over architectural movement.

## TypeScript Standards

- Keep `strict` compatibility. Do not silence errors with `any`, `as unknown as`, broad casts, or non-null assertions unless the repo already proves the invariant nearby.
- Preserve exported type names and shapes unless the change is fully internal.
- Prefer `type` for props/data shapes and `interface` when extending existing local conventions.
- Use typed React Navigation params or Expo Router route assumptions consistent with the repo.
- Make impossible states unrepresentable only when it does not change runtime behavior.

## What To Avoid

- Do not combine a refactor with visual redesign, copy changes, UX changes, dependency upgrades, or performance experiments unless requested.
- Do not convert navigation libraries or routing strategies.
- Do not replace database clients, query layers, state managers, form libraries, or purchase libraries.
- Do not normalize data shapes, rename persisted fields, or change migrations as a readability refactor.
- Do not alter entitlement gating, paywall timing, restore behavior, or trial/subscription status interpretation.
- Do not create broad abstractions for one or two call sites unless they remove meaningful risk or duplication.
- Do not leave TODOs in production code unless the repo uses that pattern and the user asked for it.

## Final Response Shape

When reporting a completed refactor, include:

- What changed and why.
- How functionality was preserved, naming any sensitive contracts touched.
- Validation run.
- Future improvements, separately labeled, only if useful and not included in the refactor.

Keep suggestions separate from implemented changes so the user can distinguish safe refactoring from optional product or architecture work.
