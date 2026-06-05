# Copilot Instructions for `planning_rpg`

## Build, test, and lint commands

Use `npm` scripts from `package.json`:

- Install dependencies: `npm install`
- Start dev server: `npm run start` (Angular dev server)
- Production build: `npm run build`
- Run all tests: `npm test`
- Watch mode tests: `npm run test:watch`
- Coverage: `npm run test:coverage`
- Run a single test file: `npm test -- src/app/core/models/vote.model.spec.ts`
- Run a single test by name: `npm test -- -t "getVoteWeight"`

There is no lint script configured in this repository at the moment.

## High-level architecture

- This is an Angular 21 app with a **root NgModule** (`AppModule`) and **standalone feature components** lazy-loaded via `loadComponent` in `app-routing-module.ts`.
- Firebase is frontend-only: **no custom backend**, with data persisted directly in Firestore and auth in Firebase Auth.
- Firebase initialization is centralized in `src/app/core/services/firebase.service.ts`; other services consume `FirebaseService.db` and `FirebaseService.auth`.
- Data flow pattern:
  - Core services (`AuthService`, `SessionService`, `UserService`, etc.) expose async behavior through Observables/Promises.
  - Firestore real-time reads are implemented with `onSnapshot`.
  - UI components (notably session/dashboard flows) keep local UI state with Angular `signal`/`computed`.
  - Firestore and auth callbacks are wrapped with `NgZone.run(...)` in services so signal/template updates render reliably.
- Core domain model in Firestore:
  - `users/{uid}` for profile/gamification.
  - `users/{uid}/private/azure` for Azure PAT/org/project.
  - `sessions/{sessionId}` with nested `stories/{storyId}` and `votes/{uid}`.
- Azure DevOps integration is handled client-side:
  - `AzureService` calls Azure REST APIs.
  - `azureInterceptor` injects `Authorization: Basic` for `dev.azure.com`.
  - PAT is staged in `AzureAuthStore` for request scope, then cleared.

## Key conventions

- **Do not use `@angular/fire`**. Use Firebase Web SDK directly (`firebase/auth`, `firebase/firestore`).
- **Do not re-initialize Firebase** outside `FirebaseService`.
- For auth in components, prefer `AuthService.currentUser$()` over direct auth SDK wiring.
- Keep Firestore real-time subscriptions in services (`onSnapshot` + Observable wrapper), including unsubscribe cleanup.
- Feature pages are standalone and lazy-loaded; do not add them to `AppModule` declarations.
- `XpLevelPipe` is non-standalone and is declared/exported from `AppModule`.
- `SessionService.getUserSessions()` intentionally avoids Firestore `orderBy`; sorting is performed in UI (`dashboard.component.ts`) by `createdAt.seconds`.
- Environment entry files are re-exports:
  - `src/environments/environment.ts` -> `environment.local.ts`
  - `src/environments/environment.prod.ts` -> `environment.local.prod.ts`
  Keep local environment credential files out of version control.
- Tests use Vitest and currently focus on core model/domain logic under `src/app/core/models/*.spec.ts`.
