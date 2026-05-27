# Security Specification for CryptoSwap Elite

## Data Invariants
1. A user can only read and write their own profile document (`/users/{uid}`).
2. A user can only read and write their own transactions (`/users/{uid}/transactions/{tid}`).
3. KYC status (`isKycVerified`) should ideally be set by a system process, but for this basic app, the user will submit their info. To prevent spoofing, we'll allow the user to write their info but potentially we could have an admin verify later. For now, the user can create their profile.
4. Timestamps (`createdAt`, `updatedAt`) must be strictly validated using `request.time`.
5. Transaction `userId` must match `request.auth.uid`.

## Dirty Dozen Payloads
1. Attempt to create a profile for another user ID.
2. Attempt to read another user's profile.
3. Attempt to read another user's transactions.
4. Attempt to update `isKycVerified` to `true` without going through the form (though here the form is the client).
5. Attempt to create a transaction with a future or past `createdAt` timestamp.
6. Attempt to create a transaction for another user's UID.
7. Attempt to update a transaction's `status` to 'finished' or 'failed' maliciously (terminal state locking).
8. Attempt to update immutable fields like `changellyId` after creation.
9. Attempt to inject very large strings into `fullName` or `documentNumber`.
10. Attempt to create a transaction without required fields like `fromCurrency`.
11. Attempt to update `userId` of a transaction to "steal" it.
12. Attempt to list all users' transactions.

## Firestore Rules Draft
I will now generate the rule set.
