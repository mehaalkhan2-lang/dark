# Security Specification - M Binary Trading Signals

## 1. Data Invariants
- Only authorized admins can create, update, or delete signals.
- Any authenticated user can read (list/get) signals.
- `authorId` must match the creator's UID.
- `createdAt` must be set by the server.
- Document IDs must be valid.

## 2. The Dirty Dozen Payloads
1. **Unauthenticated Write**: Creating a signal without logging in.
2. **Identity Spoofing**: Creating a signal with `authorId` of another user.
3. **Privilege Escalation**: Adding self to `admins` collection.
4. **State Poisoning**: Setting a signal status to 'win' by a non-admin.
5. **Shadow Fields**: Adding an `isVerified: true` field to a signal document.
6. **Large Document Attack**: Pumping a signal's `pair` field with 1MB of text.
7. **Invalid ID Attack**: Using a 2KB junk string as a document ID.
8. **Malicious Enum**: Setting `direction` to "RANDO" instead of "CALL" or "PUT".
9. **Timestamp Fraud**: Setting `createdAt` to a future date from the client.
10. **Admin Bypass**: Attempting to delete a signal as a regular user.
11. **PII Leak**: Unauthorized read of private user data (though not implemented yet).
12. **Orphaned Write**: Creating a signal with a non-existent admin ID in the payload.

## 3. Test Runner (Mock)
- `tests/signals.test.ts` will verify these scenarios using the Firebase Emulator (conceptually).
- We will use `DRAFT_firestore.rules` and verify them manually against these cases.
