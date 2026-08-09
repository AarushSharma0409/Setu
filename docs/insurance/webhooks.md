# Provider callbacks

The Sprint I6 data model contains provider event and conversion records with unique provider-event IDs for replay protection and idempotency. No provider in this repository supports callbacks yet, so no generic signature verifier is exposed. A real callback route must verify the exact documented signature over the raw body, enforce any documented timestamp window, persist only safe metadata and payload hashes, and use explicit handoff state transitions.
