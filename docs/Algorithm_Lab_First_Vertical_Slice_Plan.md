# Algorithm Lab: First Vertical Slice

## Goal

Deliver a complete browser workflow: select Fibonacci from the catalog, start an execution, and display its result. This small algorithm makes it possible to validate collaboration across all application components before adding more complex showcases.

## Scope

The slice includes four independently running application components:

- Web server serving the React frontend and routing API requests.
- FastAPI service accepting execution requests and exposing status and results.
- Python worker processing durable execution jobs.
- Kotlin / Spring Boot service owning the catalog and scenario versions.

PostgreSQL provides separate schemas for Spring-owned and Python-owned data. Flyway manages Spring migrations; Alembic manages Python migrations. The algorithm itself lives in the independent Python algorithm package.

## End-to-End Workflow

1. **Load the catalog and scenario.** Spring provides an initial Fibonacci catalog entry and an immutable scenario version containing `n = 10`. React loads these through `/api/data`.
2. **Show the showcase page.** React displays the description, input, and a Run button. Starting an execution sends the scenario version reference to FastAPI through `/api/algorithms`.
3. **Persist an execution job.** FastAPI retrieves the referenced scenario version through the Spring API, validates the input, and stores a durable job in its own PostgreSQL schema. It returns the execution ID.
4. **Compute the result.** The worker leases the job and calls the iterative Fibonacci function from the algorithm package. It stores the result `55`, computation duration, and completion status. Use the convention `F(0) = 0` and `F(1) = 1`.
5. **Display status and result.** React polls FastAPI for execution status and displays the result when complete. The execution ID is part of the URL so reopening or reloading the page retrieves the same execution.

Spring and Python access each other's data through APIs rather than writing directly to each other's tables.

## Implementation Steps

1. Implement and test the standalone iterative Fibonacci algorithm.
2. Set up PostgreSQL schemas and migrations, including the initial catalog entry and scenario version.
3. Implement Spring endpoints for reading the catalog and immutable scenario version.
4. Implement FastAPI endpoints for creating executions and reading their status and results. Persist scenario references, resolved inputs, and the algorithm implementation version.
5. Implement the worker loop with a time-limited job lease and attempt identifier. Keep computation outside the leasing transaction and reject updates from obsolete attempts.
6. Build the React page, polling, and execution URL.
7. Configure the reverse proxy and local startup for the complete workflow.
8. Verify the acceptance criteria across the running components.

## Acceptance Criteria

- A fresh local startup initializes the database and sample scenario automatically.
- The complete workflow works in the browser across React, Spring, FastAPI, and the worker.
- Input `n = 10` produces `55`.
- Invalid input produces a clear validation error. Define and enforce an initial supported input range.
- Reloading or reopening the execution URL preserves access to its status and result.
- A persisted job is processed even if the worker starts after the job was submitted.
- Each execution records its immutable scenario version and algorithm implementation version.
- The worker persists completion status, result, and computation duration.

Verification should cover algorithm reference and boundary cases, API validation, persistence, and one complete browser workflow. Include a check that a job submitted while the worker is stopped completes after the worker starts.

## Deferred Work

The first slice needs one page, one algorithm implementation, and polling. Replay, interactive charts, computation pause/resume, object storage, and additional databases follow later.

The outbox foundation from Phase 0 of the main project plan is the next infrastructure step. It will support reliable propagation of business events to downstream projections. This first slice does not require an outbox because the worker reads durable jobs directly from PostgreSQL.

## Completion

The slice is complete when all acceptance criteria pass and the browser workflow can be demonstrated from a fresh local startup. It establishes the integration path for subsequent showcases.
