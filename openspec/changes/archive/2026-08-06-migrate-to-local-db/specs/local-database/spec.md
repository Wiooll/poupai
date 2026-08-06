## ADDED Requirements

### Requirement: Local data persistence
The system SHALL store all user data (transactions, accounts, credit cards, goals) locally using IndexedDB (Dexie.js).

#### Scenario: App Initialization
- **WHEN** the application starts
- **THEN** it connects to the local IndexedDB database and reads the initial state

#### Scenario: Offline CRUD Operations
- **WHEN** the user creates, updates, or deletes a transaction while offline
- **THEN** the changes are saved to the local IndexedDB database immediately without requiring a network request

### Requirement: Real-time UI updates
The system SHALL update the UI automatically when the underlying local database data changes.

#### Scenario: Transaction insertion reflects in list
- **WHEN** a transaction is inserted into the IndexedDB database
- **THEN** the transaction list UI updates automatically using Dexie live queries
