# First Vertical Slice: Local Acceptance

Date: 2026-11-07

The first vertical slice was accepted locally after a browser run against a freshly initialized, isolated PostgreSQL instance. The user performed and confirmed the browser steps. This record covers the local workflow, not a deployed production environment.

## Browser and persistence check

- A new PostgreSQL container was initialized with the project's database initialization scripts. Alembic was run separately, as documented; starting Spring applied Flyway and created the Fibonacci scenario. The existing local database was not reset.
- React, Spring, FastAPI, and the worker were run locally. A temporary Vite proxy configuration directed the browser to the isolated services on separate ports.
- The user selected Fibonacci, verified `n = 10`, started an execution with the worker stopped, and confirmed that its execution page remained `queued` after a reload.
- After the worker started, the user confirmed that the page automatically displayed the result `55` and that the result and status remained visible after reloading.
- A database query confirmed `succeeded`, input `{"n": 10}`, result `{"value": 55}`, scenario version `00000000-0000-4000-8000-000000000010`, implementation version `1`, and a recorded duration for execution `911f2a8a-c297-44b2-a5f0-12d4b10ed6ef`.
- The isolated services and temporary database were stopped after the check. The execution ID above is an audit reference; its temporary database no longer exists.

## Automated checks

On the same date, the following checks passed:

| Check | Result |
| --- | --- |
| Frontend Vitest suite | 71 tests passed |
| Python default pytest suite | 124 tests passed |
| Python PostgreSQL integration suite | 23 tests passed |
| Spring Gradle test task | Passed |

The automated checks include Fibonacci reference and boundary cases, input validation, database persistence, and worker behavior. Python tests reported a Starlette/HTTPX deprecation warning. Invalid input was covered by automated tests rather than a separate manual browser step.

The fresh-start check used the documented multi-command local startup, including a separate Alembic migration; it did not establish a single-command automatic startup or test a production reverse proxy.
