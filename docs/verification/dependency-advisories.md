# Dependency Advisories

The July 2026 audit reports advisories primarily through the Expo SDK 54,
Metro/React Native, Jest, and build-tool dependency graph. Automated major
version fixes were intentionally not applied because npm proposes unsupported
Expo or Drizzle changes.

Final `npm audit --omit=dev` result: 38 advisories (22 high, 15 moderate,
1 low, 0 critical). The reported paths are framework, bundler, CLI, codegen,
test-transform, and config tooling; no directly exploitable app data flow was
identified during this remediation. Recheck this evidence for every release.

Release remediation already completed:

- `drizzle-kit` is a development dependency.
- npm overrides the transitive `shell-quote` package; the resolved version is
  `1.10.0`, removing the previous critical advisory.
- Production exposure is checked separately with `npm audit --omit=dev`.

Treat remediation as a separate upgrade project:

1. Capture `npm audit` and `npm audit --omit=dev` with the release evidence.
2. Confirm each remaining advisory's dependency path and runtime reachability.
3. Upgrade only within Expo compatibility guidance.
4. Run the complete release and migration checklists.
5. Ship framework dependency changes separately from feature work.

Do not use `npm audit fix --force` on the production branch.
