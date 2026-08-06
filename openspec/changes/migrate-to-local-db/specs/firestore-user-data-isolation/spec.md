## REMOVED Requirements

### Requirement: Firebase Realtime Sync
**Reason**: Firebase Firestore has been removed in favor of a local database (IndexedDB).
**Migration**: Real-time sync across devices is no longer supported. Local reactivity is handled by Dexie.js live queries.

### Requirement: Firestore Data Isolation
**Reason**: Data is now stored purely locally on the user's device, providing natural isolation per device.
**Migration**: Removed Firestore rules and query filters that depended on `userId`.
