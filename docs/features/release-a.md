# Release A: Finish what's scaffolded

Feature work (not refactoring). The goal is to add value using tables and columns that
already exist in every install (migrations v3–v5), so **no database
migration and no new native dependency** is needed.

## Resume protocol

1. Read `AGENTS.md`, `CLAUDE.md`, and this file.
2. Check `git status` and preserve unrelated work.
3. Continue with the first unchecked item below, one feature at a time.
4. Run `npm test`, `npm run typecheck`, and `npm run lint` after each feature.
   Update the checkboxes and the log in the same change.

## Safety rules (live users)

- **Additive only.** Existing calculations stay untouched:
  `getNonSmokingStreak`, the Home "Saved today" formula, stats, the weekly report
  payload (`version: 1`), routes, the SQLite filename, stored values, RevenueCat
  entitlement and offering, and existing UI copy. New metrics sit next to the old ones.
- No `DATABASE_VERSION` bump in Release A.
- Logic goes in `utils/` (pure, unit-tested) or `services/` (SQL via `db/client.ts`).
  Screens never touch the DB.
- Access gating goes only through `FeatureAccess`. Free, legacy, and premium users keep
  everything they have today.
- Scheduled notifications must never be cleared with
  `cancelAllScheduledNotificationsAsync()` once more than one kind exists.

## Progress

| # | Feature | Status |
| --- | --- | --- |
| A5 | Rescue improvements (shared triggers, "your reason", reflection note) | Done: needs device check |
| A1 | Health recovery timeline | Done: needs device check |
| A2 | Lifetime impact and on-target streak | Done: needs device check |
| A3 | Savings goal | Done: needs device check |
| A4 | Personalised plan weeks | Done: needs device check |
| A6 | Milestone and plan notifications | Done: needs device check |

## Details and checklist

### A5. Rescue improvements
- [x] `utils/triggers.ts`: a shared trigger list. Rescue gains social, alcohol, and habit
      (appended, so existing order and labels are unchanged) + tests.
- [x] `fallbackStrategy` covers the new triggers.
- [x] Timer step shows the active plan's motivation, when set.
- [x] Outcome step accepts an optional reflection, saved to `craving_session.note`
      via `COALESCE(?, note)` (an empty note writes nothing).
- [ ] Manual Android check: start Rescue with a new trigger, add a note, finish.

### A1. Health recovery timeline
- [x] `utils/healthMilestones.ts` + tests (stable milestone ids).
- [x] `utils/timestamps.ts#toEpochMs` (epoch or legacy string) + tests.
- [x] `db/queries.ts#getLastSmokingTimestamp` (new, additive; reuses the legacy-safe SQL).
- [x] `services/milestoneService.ts#getRecoveryAnchor`: last cigarette, else the
      first baseline `created_at`.
- [x] `components/RecoveryCard.tsx` on Home, below the metric cards. It loads its own
      data and renders nothing on error.
- [x] New route `app/health.tsx`, registered in `app/_layout.tsx`, with a disclaimer.
- New icons in `AppSymbol`: `check-circle`, `heart-pulse`, `piggy-bank-outline`,
  `target`, `trophy-outline`.
- Note: `.expo/types/router.d.ts` is generated. After adding a route, run Metro once
  (`npm start`) so the local typecheck knows about it. CI has no copy of the file.
- [ ] Manual Android check: the card opens Health; logging a cigarette resets the timer.

### A2. Lifetime impact and on-target streak
- [x] `utils/impact.ts` + tests. Day by day from the first baseline, using the baseline
      in effect on each day (users can re-save it) and the same `max(0, baseline - smoked)`
      rule as "Saved today". The optional `since` parameter is used by goals.
- [x] `computeOnTargetStreak` mirrors the smoke-free streak rules: going over today's
      target makes it 0, otherwise it counts back from yesterday, never before the plan started.
- [x] New additive queries: `getDailySmokingCounts`, `getSmokingSettingsHistory`.
- [x] `services/impactService.ts` (`getLifetimeImpact`, `getOnTargetStreak`: active plans only).
- [x] `components/ImpactSection.tsx` at the end of Home: Total saved, Not smoked, and
      On-target streak (only with an active plan). Self-contained, like the recovery card.
- Existing "Current streak" and "Saved today" cards are untouched.

### A3. Savings goal
- [x] `utils/savingsGoal.ts` (validation, progress) + tests.
- [x] `services/savingsGoalService.ts` (existing `savings_goal` table): active,
      create, complete, delete, and a completed count (for future achievements).
- [x] `'goal'` data domain in `services/dataEvents.ts`.
- [x] Goal card inside `ImpactSection`. Progress counts savings **since the goal was
      created**, so a new goal is not instantly complete for long-time users.
- [ ] Manual Android check: create, progress, mark achieved, remove; the dialog works
      in dark mode and with the keyboard open.

### A4. Personalised plan weeks
- [x] `utils/quitPlan.ts#buildWeekFocus` rotates the top 3 all-time triggers (min 3 logs
      each, `insightService#getTopTriggers`) with `getRecommendedStrategy`. Tested.
- [x] `createQuitPlan` fills `focus_trigger`/`focus_strategy` for **new** plans only. Reads
      run before the transaction (single DB queue); personalisation failure yields
      unfocused weeks, never a failed plan. Existing plans are not rewritten.
- [x] Plan week detail copy for focused weeks now reads "When X shows up, try: <label>."
      Previously this branch was unreachable (all rows were null), so no existing user
      sees a copy change; the fallback copy is unchanged.
- [x] `utils/strategies.ts#STRATEGY_LABELS` is shared by Rescue (identical values) and Plan.
- [ ] Manual Android check: create a new plan with trigger history and expand a week.

### A6. Notifications
- [x] Identifier-based scheduling (`utils/notificationSchedule.ts` + tests). The daily
      check-in keeps the same content, time, and DB writes. It now cancels only
      `daily-check-in` plus unknown (legacy random-id) notifications, which for current
      users is exactly what `cancelAll` did.
- [x] Milestone notifications: the next 3 health milestones of at least 48h (short ones
      skipped to avoid noise for heavy smokers), ids `milestone-<id>`.
- [x] Plan reminders: the next 2 plan-week starts with the new target, ids `plan-week-<index>`.
- [x] **Opt-in only.** The columns default to 1, but reminders count only after the user
      toggles one on (`app_metadata.notification_kinds_opt_in`). No surprise notifications
      for existing users, including Android ≤12 where permission is pre-granted.
- [x] `rescheduleReminders()` never prompts for permission, is a no-op until opted in, and
      runs on Home load and on `history`/`craving`/`plan` data changes (debounced
      subscription in `app/_layout.tsx`).
- [x] Settings → Notifications: "Recovery milestones" and "Plan week reminders" toggles.
- [ ] Manual Android check (see below).
- Deferred: the premium risk-window alert (needs a `FeatureAccess` flag and paywall copy,
  so it belongs with Release C4).

## Release A manual verification (before merging)

Run on a device with an **upgrade install** of the current Play Store build that
has data (logs with triggers, a plan, Rescue sessions, legacy flag,
daily check-in enabled):

1. Home: "Current streak", "Saved today", ring, and weekly total are identical to before.
2. The daily check-in still fires at 8 PM. Toggle it off and on, and confirm there
   is exactly one scheduled (no duplicate from the legacy random id).
3. New cards render: Body recovery (opens `/health`), Your impact, and Savings goal.
4. Rescue: new triggers, "Your reason" on the timer, and the reflection is saved.
5. Create a new plan and check that week details show focus tips; old plans are unchanged.
6. Turn on Recovery milestones and Plan week reminders. Log a cigarette and confirm
   the milestones are rescheduled. Turn both off and confirm they are cancelled.
7. Free, legacy, and premium tiers: gating is unchanged (Rescue 3 per week, stats, export).
8. Light and dark mode; reduced motion.

## Suggested PR split

Each can be its own PR from this branch, in order: A5 → A1 → A2 + A3 → A4 → A6.
No `DATABASE_VERSION` change, no new dependency, and no purchase changes in any of them.

## Log

- 2026-09-26: Tracker created on branch `feature-enhancements`.
- 2026-09-26: A5 implemented. Typecheck and tests pass.
- 2026-09-26: A1 implemented. Typecheck is clean.
- 2026-09-26: A2 and A3 implemented. Typecheck, lint, and tests pass.
- 2026-09-26: A4 implemented. Typecheck and lint are clean.
- 2026-09-26: A6 implemented. `npm test` (18 suites, 111 tests), typecheck, lint, and build:check all pass. Next: manual device verification, then open PRs.
- 2026-09-26: Device feedback on A3. The goal dialog rendered as a blob because MD3 `Dialog` uses theme roundness × 7; fixed with `designTokens.radius.lg`. The amount field now shows the selected currency's symbol (`CURRENCY_SYMBOLS`) instead of the "INR" code, and re-reads the currency preference when the dialog opens. Watch for the same roundness issue if any other Paper `Dialog` is added.
