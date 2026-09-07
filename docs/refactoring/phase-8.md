# Phase 8: Production Hygiene and CI

Status: Implementation complete; release gates open  
Depends on: Phase 7 complete  
Starting branch/commit: `code-refactor` / `7a3ba6e`

## Goal

Finish the refactor with safer logging, repeatable CI gates, documentation, and
release evidence. Dependency upgrades remain a separate project.

## Behavior Lock

- [x] Preserve user alerts and failure recovery.
- [x] Preserve release build profiles, environment variables, and app identity.
- [x] Preserve RevenueCat behavior while preventing sensitive production logs.
- [x] Do not run automatic audit fixes or dependency upgrades.

## Implementation Checklist

### P8.1 Logging

- [x] Remove full RevenueCat customer-info logging.
- [x] Development-gate successful initialization diagnostics.
- [x] Keep actionable error logs without customer payload serialization.
- [x] Verify no new secrets or customer payloads are logged.

### P8.2 Continuous integration

- [x] Add clean install, test, typecheck, lint, and export/build gates.
- [x] Pin CI to Node 20.19.4 for Expo SDK 54 and use `npm ci`.
- [x] Add credential-free Android export validation.
- [x] Keep signed-build credentials out of the repository.

### P8.3 Cleanup and documentation

- [x] Remove only repository-proven dead styles/constants.
- [x] Update contributor and verification documentation.
- [x] Document database migration and purchase smoke-test procedures.
- [x] Record dependency advisories without applying breaking fixes.

### P8.4 Release verification

- [x] Run the local automated suite and unsigned Android export.
- [ ] Build and test a signed Android release candidate.
- [ ] Exercise upgrade from the current Play Store build with retained data.
- [ ] Verify real Google Play purchase/restore scenarios.
- [x] Document staged rollout and rollback steps.

## Evidence

- Local gates: clean install, 45 tests, TypeScript, lint, diff check, and Android
  export.
- CI run/build URL: pending push/CI authority.
- Release candidate/version: pending signing and store credentials.
- Upgrade-device test: pending current Play Store artifact.
- Staged rollout/rollback owner: assign before release.

## Completion Criteria

Code completion is reached when local/CI protections and documentation are in
place. Shipping remains blocked until the unchecked signed-build, in-place
upgrade, and real billing gates pass.
