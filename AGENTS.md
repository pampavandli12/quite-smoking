# Repository Guidelines

## Project Structure & Module Organization

This is an Expo 54 React Native application using TypeScript and Expo Router.

- `app/`: route-driven screens and layouts. Tab screens live in `app/(tabs)/`.
- `components/`: reusable React Native UI components.
- `db/`: Drizzle ORM schema, SQLite client, and query helpers.
- `services/`: integrations such as RevenueCat purchases.
- `utils/`: shared constants and general helpers.
- `assets/`: icons, splash images, and static media.
- `android/`: generated/native Android project. Keep native edits deliberate.

Use the `@/` alias for imports from the repository root, for example `@/db`.

## Build, Test, and Development Commands

- `npm ci`: install the exact lockfile dependencies.
- `npm start`: start the Expo development server.
- `npm run android`: build and launch the Android development client.
- `npm run ios`: build and launch the iOS development client.
- `npm run lint`: run the Expo ESLint configuration.
- `npm run typecheck`: perform strict TypeScript checking.
- `npm test`: run the Jest characterization and regression suite.
- `npm run build:check`: export an Android bundle without signing it.

For local subscription bypass, run `PAYWALL_BYPASS=true npm start`. Use `false` when validating RevenueCat behavior, and restart Metro after changing it.

## Coding Style & Naming Conventions

Write strict TypeScript with two-space indentation, single quotes, and trailing
commas. Use PascalCase for components and React types, camelCase for functions
and variables, and descriptive names such as `TriggerBottomSheet.tsx`. Keep
screen styles local and reusable UI in `components/`. Keep database access out
of screens.

Keep database migrations versioned and idempotent. Preserve compatibility with
legacy timestamp values and use `dbTransactionAsync` for multi-step writes. Run
format-compatible lint and TypeScript checks before submitting changes.

## Testing Guidelines

Jest uses the `jest-expo` preset. Place tests in `__tests__/` and name them
`*.test.ts` or `*.test.tsx`. Add regression coverage for calculation, query,
migration, and purchase-contract changes. Before opening a PR, run `npm test`,
`npm run typecheck`, `npm run lint`, and `npm run build:check`. Manually exercise
affected Android flows; database and RevenueCat changes also require the
checklists in `docs/verification/`.

## Commit & Pull Request Guidelines

History favors imperative Conventional Commit-style subjects with tickets, such
as `fix(KAN-10): handle count fetch errors`. Keep commits focused. Pull requests
must explain the change, link the issue, list verification, and include UI
screenshots when relevant. Call out database, native Android, or purchase-flow
changes explicitly.
