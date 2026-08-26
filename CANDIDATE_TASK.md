# Candidate Task

## Scenario

A courier submits delivery completion while offline. The data is stored locally and synchronized when connectivity returns.

Duplicate submissions have been reported after:

- Timeout
- Double tap
- Concurrent synchronization
- Application restart

## Candidate Responsibilities

You must:

1. Understand and explain the failure path.
2. Fix the implementation so one business intent creates at most one server submission.
3. Preserve the same operation identity across retries.
4. Prevent duplicate active queue entries for the same task.
5. Prevent concurrent workers from processing the same item.
6. Distinguish temporary and permanent errors.
7. Preserve queue state across service recreation.
8. Add tests proving the required behavior.
9. Explain assumptions, trade-offs, and remaining risks.

## Acceptance Criteria

- Offline submission is persisted.
- Double tap does not create duplicate active intents.
- Concurrent `sync()` calls do not duplicate delivery submission.
- Timeout after server commit is retried with the same operation identity.
- Temporary failures remain retryable.
- Permanent validation failures do not enter an infinite retry loop.
- Queue state survives service recreation.
- Tests are deterministic.
- Existing tests may not be removed, skipped, or weakened.

## AI Usage

- AI agents, autocomplete, search, and documentation are allowed.
- You remain responsible for the complete diff.
- You must review and verify AI-generated code.
- Explain what you delegated to AI.
- Explain how you validated the AI output.
- Adding external dependencies requires justification.

You are not required to provide private AI conversation transcripts.
