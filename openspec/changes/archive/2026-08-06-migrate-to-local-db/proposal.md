## Why

The user requested to remove the Cloud Database (Firebase Firestore) and migrate the application to use a Local Database exclusively. This change will eliminate external dependencies, reduce potential costs, ensure data privacy by keeping all financial records local to the user's device, and natively support an offline-first experience.

## What Changes

- **BREAKING**: Removal of Firebase Firestore dependencies (`onSnapshot`, `setDoc`, `updateDoc`, `deleteDoc`) and initialization logic.
- **BREAKING**: Refactoring of `FinanceContext.tsx` to use a local database solution (e.g., IndexedDB via Dexie.js or extending the existing `localStorage` implementation) as the single source of truth, instead of acting just as a backup.
- Removal of real-time syncing mechanisms with the cloud.
- Adaptation of CRUD operations (Transactions, Categories, Contas, Cartões, etc.) to perform synchronous or asynchronous operations directly against the local storage.

## Capabilities

### New Capabilities
- `local-database`: Comprehensive specification on how the data model will be stored, indexed, and retrieved entirely on the client side without a backend.

### Modified Capabilities
- `user-authentication`: If Firebase Auth is retained, it will only serve to identify the user session, but the data will remain local. If it's removed, the app becomes fully anonymous and local. (To be clarified during design).

## Impact

- **Affected Code**: `src/context/FinanceContext.tsx` (major refactor), `src/services/firebase.ts` (removal or reduction), `src/utils/localPersistence.ts`.
- **Dependencies**: Firebase SDK usage will be drastically reduced or entirely removed. A local database library like `dexie` might be introduced to handle complex queries and larger storage limits compared to `localStorage`.
- **Systems**: The app will no longer communicate with Firebase Firestore for data persistence.
