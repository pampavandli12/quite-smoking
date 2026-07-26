# Dependency Advisories

The July 2026 audit reports advisories through the Expo SDK 54 and build-tool
dependency graph. Automated fixes were intentionally not applied because npm
proposes breaking Expo or Drizzle changes.

Treat remediation as a separate upgrade project:

1. Capture the full audit report.
2. Separate runtime exposure from development/build tooling.
3. Upgrade within Expo compatibility guidance.
4. Run the complete release and migration checklists.
5. Ship dependency changes separately from behavior-preserving refactors.

Do not use `npm audit fix --force` on the production branch.
