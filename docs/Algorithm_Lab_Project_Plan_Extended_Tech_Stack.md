# Project Plan: Algorithm Lab with Bioinformatics

Expanded and corrected edition with 19 core showcases and 11 bioinformatics modules.

- **Functional plan as of:** October 24, 2026
- **Markdown edition with technology stack recommendations:** October 25, 2026

Sections 1–9 contain the complete functional project plan. Section 10 specifies the technology stack based on the supplementary recommendations.

## 1. Goal and Scope

A shared application brings together:

- Kopec: implement, visualize, and compare fundamental algorithms.
- Compeau/Pevzner: apply algorithmic concepts to biological problems.
- Just Use Postgres! and DDIA: explore data models, transactions, indexes, background processing, and derived data.

All existing showcases are retained. Bioinformatics extends existing views or receives standalone modules. The catalog can be browsed by algorithm family and application domain. Each showcase works independently; shared datasets and visualizations can be reused. The bioinformatics modules are based on the eleven chapter summaries. The plan covers core methods and selected advanced topics rather than a complete implementation of every exercise in the books.

## 2. Architecture

| Component | Responsibility |
| --- | --- |
| React / TypeScript | Scenario editors, visualizations, playback, comparisons, and selected local algorithms |
| FastAPI | Algorithm API, input validation, execution jobs, progress, and results |
| Python worker | Longer computations, index building, training, and checkpoints |
| Kotlin / Spring Boot | Scenario/dataset catalog, imports, versioning, bookings, outbox, and storage projections |
| Web server / reverse proxy | Serve React and forward requests to the private APIs |

The web server, FastAPI, Python worker, and Spring form four deployment components. A fifth component may later handle scheduled Spring Batch runs. Python remains the primary implementation language for algorithms. Spring handles transactional business logic and data processing. FastAPI and the worker use the same algorithm package, separated from the web framework and persistence. React accesses both APIs through a shared public entry point:

- /api/algorithms: FastAPI
- /api/data: Spring

Progress is initially delivered through polling. Server-Sent Events can be added later.

## 3. Data Stores and Data Ownership

| Store | Use |
| --- | --- |
| PostgreSQL | Authoritative catalog, versions, jobs, results, bookings, events, and outbox |
| RustFS / S3 | Sequence files, expression matrices, spectra, larger replays, indexes, and model snapshots |
| Apache AGE | Selected rebuildable graph projections |
| Neo4j Community | Compare graph modeling and queries |
| pgvector | Similarity search on versioned feature vectors |
| Qdrant | Comparison with pgvector |
| OpenSearch | Document, description, and annotation search |

Postgres is the foundation. Additional providers are activated only for their respective experiments. Spring owns the catalog, dataset versions, artifact metadata, imports, bookings, and projection states. Python owns execution jobs, steps, checkpoints, and results. Each table family has one owner for writes and migrations. A single named Postgres resource with separate schemas is sufficient initially. This separation organizes responsibilities; it does not enforce strict access isolation. Limits of the storage comparisons:

- Read mapping uses dedicated sequence indexes.
- Vector search complements clustering and does not replace alignment.
- Graph databases complement the Python reference algorithms.
- PostGIS, TimescaleDB, and pgmq are not required.

## 4. Shared Contracts from Phase 0

### 4.1 Scenarios and Executions

Each execution references immutable inputs and contains:

- Algorithm identifier and implementation version
- Scenario/dataset versions
- Parameters and, where applicable, a random seed
- Status, attempt, and timestamps
- Result, measurements, and artifact references
- Event format version

Measurements separate computation, data access, transfer, and rendering. Events are limited or aggregated for large runs. A complete animation trace is a separate execution mode.

### 4.2 Shared File Contract

The contract applies to sequences, matrices, spectra, replays, indexes, and models.

| Field | Meaning |
| --- | --- |
| Artifact ID | Stable identity |
| Object key | Immutable storage location |
| Type and format version | For example, FASTA, expression matrix, or index format |
| Size and checksum | Integrity and resource planning |
| Producer | Import, algorithm execution, or model run |
| Source versions | Datasets and parameters from which the artifact was created |
| State | Reserved, uploaded, validated, available, or failed |

Processing workflow:

1. Spring creates an artifact record and a unique object key.
2. The responsible import or computation process uploads the file.
3. Size, checksum, and domain format are validated.
4. Spring marks the artifact as available.
5. Downstream processes use only available artifacts.

Failed uploads are retried or marked as failed. Reconciliation detects orphaned objects and missing files. Released files are replaced by new versions rather than overwritten. Phase 0 implements the contract and interfaces. Phase 2 adds RustFS and the complete workflow.

### 4.3 Outbox Contract

The technical foundation is established in Phase 0:

- The business change and outbox entry are saved in the same Postgres transaction.
- Events contain an ID, type, schema version, business entity ID, and business entity version.
- Large payloads remain in datasets or artifacts; events reference them.
- Consumers persist their processing position and handle retries idempotently.
- Failed deliveries remain visible with the error, attempt count, and next retry time.
- Projections prevent delayed older events from overwriting newer state.

Delivery may occur more than once. A successful external change may already be complete before its acknowledgment is saved. Rollout:
- Phase 0: Transaction pattern, dispatcher, and retry tests.
- Phase 2: First production events such as DatasetVersionReady.
- Phase 3: Consumer for a rebuildable catalog overview in Postgres.
- Phase 4c: First external graph projections.
- Phase 7/8: Reuse for vector and search projections.

Spring owns the outbox for its business data. Python reports completed artifacts through defined interfaces. A Python outbox pattern, if needed later, would apply to its own transactions and tables.

## 5. Complete Showcase Catalog

K identifies the existing showcases, B the bioinformatics additions. Identifiers remain stable regardless of ordering.

### 5.1 Kopec and Existing Applied Exercises

#### K01 – Fibonacci: Recursion, Memoization, Iteration

| Area | Implementation |
| --- | --- |
| React | Call tree, curves, TypeScript comparison |
| FastAPI / Python | Variants and benchmarks |
| Kotlin / Spring | Templates |
| Storage | Postgres |

#### K02 – Maze: DFS, BFS, A*

| Area | Implementation |
| --- | --- |
| React | Grid, search frontier, replay |
| FastAPI / Python | Search and events |
| Kotlin / Spring | Scenarios |
| Storage | Postgres; later RustFS |

#### K03 – Towers of Hanoi

| Area | Implementation |
| --- | --- |
| React | Towers and recursion |
| FastAPI / Python | Move sequence and validation |
| Kotlin / Spring | Templates |
| Storage | Postgres |

#### K04 – Missionaries and Cannibals

| Area | Implementation |
| --- | --- |
| React | State graph |
| FastAPI / Python | State-space search |
| Kotlin / Spring | Scenarios |
| Storage | Postgres/JSONB |

#### K05 – CSP: Map Coloring, Queens, Word Search, Cryptarithmetic; Later Circuit Board Layout

| Area | Implementation |
| --- | --- |
| React | Candidates and backtracking |
| FastAPI / Python | CSP framework |
| Kotlin / Spring | Problem versions |
| Storage | Postgres/JSONB |

#### K06 – Timetabling and Bookings

| Area | Implementation |
| --- | --- |
| React | Scheduling, concurrent sessions |
| FastAPI / Python | CSP suggestions |
| Kotlin / Spring | Binding bookings |
| Storage | Postgres |

#### K07 – DNA Search and Two-Bit Compression

| Area | Implementation |
| --- | --- |
| React | Sequences, codons, and bits |
| FastAPI / Python | Search and compression |
| Kotlin / Spring | Imports and catalog |
| Storage | Postgres + RustFS |

#### K08 – π Convergence

| Area | Implementation |
| --- | --- |
| React | Error curve |
| FastAPI / Python | Approximation and measurement series |
| Kotlin / Spring | Templates |
| Storage | Postgres |

#### K09 – XOR / One-Time Pad

| Area | Implementation |
| --- | --- |
| React | Bit operations |
| FastAPI / Python | Method from the book |
| Kotlin / Spring | Demo templates |
| Storage | Templates in Postgres; keys kept in memory |

#### K10 – Routes: BFS, Dijkstra

| Area | Implementation |
| --- | --- |
| React | Network and routes |
| FastAPI / Python | Reference algorithms |
| Kotlin / Spring | Graph versions |
| Storage | Postgres; later AGE/Neo4j |

#### K11 – Spanning Tree: Prim/Jarník

| Area | Implementation |
| --- | --- |
| React | Construction and costs |
| FastAPI / Python | Minimum spanning tree |
| Kotlin / Spring | Graph catalog |
| Storage | Postgres; later AGE/Neo4j |

#### K12 – Minimax and Alpha-Beta

| Area | Implementation |
| --- | --- |
| React | Tic-tac-toe, Connect Four, game tree |
| FastAPI / Python | AI and game state |
| Kotlin / Spring | Game templates |
| Storage | Postgres |

#### K13 – Knapsack Problem

| Area | Implementation |
| --- | --- |
| React | Items and DP table |
| FastAPI / Python | Optimization |
| Kotlin / Spring | Item catalog |
| Storage | Postgres |

#### K14 – Traveling Salesperson

| Area | Implementation |
| --- | --- |
| React | Tours and computational effort |
| FastAPI / Python | Exact search for small instances |
| Kotlin / Spring | Distance matrices |
| Storage | Postgres |

#### K15 – Phone Number Mnemonics

| Area | Implementation |
| --- | --- |
| React | Combinations and matches |
| FastAPI / Python | Combination generation |
| Kotlin / Spring | Dictionary imports |
| Storage | Postgres |

#### K16 – Genetic Algorithms

| Area | Implementation |
| --- | --- |
| React | Population and fitness |
| FastAPI / Python | Function optimization, cryptarithmetic, list compression |
| Kotlin / Spring | Experiments |
| Storage | Postgres + RustFS |

#### K17 – Clustering / Vector Lab

| Area | Implementation |
| --- | --- |
| React | Points, centers, and neighbors |
| FastAPI / Python | K-means |
| Kotlin / Spring | Imports and projections |
| Storage | Postgres, RustFS, pgvector, Qdrant |

#### K18 – Neural Learning Lab

| Area | Implementation |
| --- | --- |
| React | Weights, errors, predictions |
| FastAPI / Python | Training and inference |
| Kotlin / Spring | Data/model catalog |
| Storage | Postgres + RustFS |

#### K19 – Search Workshop

| Area | Implementation |
| --- | --- |
| React | Matches and index states |
| FastAPI / Python | Reference search |
| Kotlin / Spring | Full-text search and OpenSearch projection |
| Storage | Postgres + OpenSearch + RustFS |

### 5.2 Bioinformatics

#### B01 – Pattern Matching, Frequency Tables, Reverse Complement, Hamming Distance, Minimum Skew; Then Clumps and d-Neighborhoods

| Area | Implementation |
| --- | --- |
| React | Sequence, windows, frequencies, and skew |
| FastAPI / Python | Algorithms and comparisons |
| Kotlin / Spring | FASTA import and reference versions |
| Storage / data experiment | Postgres + RustFS; precomputed frequencies versus recomputation |

#### B02 – Motif Enumeration, Median String, Profiles, Greedy Search; Later Randomized Motif Search and Gibbs Sampling

| Area | Implementation |
| --- | --- |
| React | Motif windows, profile, logo, and score progression |
| FastAPI / Python | Exact and heuristic methods |
| Kotlin / Spring | Sequence collections and experiments |
| Storage / data experiment | Postgres + RustFS; seeds, parameters, and multiple starts |

#### B03 – Overlap / de Bruijn Graph, Hierholzer, Reconstruction; Then Contigs and Paired Reads

| Area | Implementation |
| --- | --- |
| React | Graph construction, edge consumption, and sequence |
| FastAPI / Python | Assembly and multigraphs |
| Kotlin / Spring | Read catalog and projections |
| Storage / data experiment | Postgres + RustFS; later AGE/Neo4j; multiplicity and rebuilding |

#### B04 – Translation, Peptide Encoding, Linear/Cyclic Spectra, Branch and Bound; Later Leaderboard and Convolution

| Area | Implementation |
| --- | --- |
| React | Peptide ring, peaks, and search tree |
| FastAPI / Python | Spectra and candidate search |
| Kotlin / Spring | Spectra and mass tables |
| Storage / data experiment | Postgres + RustFS; multisets and bounded search |

#### B05 – Coin Change, DAG Paths, LCS, Edit Distance, Global/Local Alignment; Later Affine Gaps and Linear Space

| Area | Implementation |
| --- | --- |
| React | Matrix, transitions, and traceback |
| FastAPI / Python | DP and reconstruction |
| Kotlin / Spring | Sequence pairs and scoring versions |
| Storage / data experiment | Postgres + RustFS; full tables versus compact results |

#### B06 – Greedy Reversals, Breakpoints; Then 2-Break Distance/Sorting and Dot Plots

| Area | Implementation |
| --- | --- |
| React | Blocks, operations, and cycles |
| FastAPI / Python | Rearrangement algorithms |
| Kotlin / Spring | Block versions and history |
| Storage / data experiment | Postgres/JSONB; optional AGE; events versus snapshots |

#### B07 – Leaf Distances, Limb Length, Additive Phylogeny, UPGMA, Neighbor Joining; Later Small Parsimony and NNI

| Area | Implementation |
| --- | --- |
| React | Distance matrix and tree |
| FastAPI / Python | Reconstruction and parsimony |
| Kotlin / Spring | Taxa, matrices, and provenance |
| Storage / data experiment | Postgres + RustFS; optional graph projection |

#### B08 – Farthest First, Lloyd, K-Means++; Later Soft K-Means and Average Linkage

| Area | Implementation |
| --- | --- |
| React | Expression heatmap, trends, and dendrogram |
| FastAPI / Python | Transformations and clustering |
| Kotlin / Spring | Matrix imports and vector projections |
| Storage / data experiment | RustFS, Postgres, pgvector, Qdrant; normalization and distance measures |

#### B09 – Trie, Suffix Array/Tree, BWT, Inversion, and FM Search; Later Checkpoints and Seed and Extend

| Area | Implementation |
| --- | --- |
| React | Index construction, intervals, and matches |
| FastAPI / Python | Sequence indexes and mapping |
| Kotlin / Spring | Index manifest and release |
| Storage / data experiment | RustFS + Postgres; index construction, query costs, and version switching |

#### B10 – HMM Paths, Viterbi, Forward-Backward; Later Parameter Estimation, Baum-Welch, and Profile HMMs

| Area | Implementation |
| --- | --- |
| React | State editor, trellis, and posteriors |
| FastAPI / Python | Inference and learning |
| Kotlin / Spring | Model/training versions |
| Storage / data experiment | Postgres + RustFS; stability and model provenance |

#### B11 – Spectral Graph, Peptide Vector, Weighted Paths, and Database Identification; Later Dictionaries, Modifications, and Target-Decoy

| Area | Implementation |
| --- | --- |
| React | Peaks, candidates, and score distributions |
| FastAPI / Python | Spectral DP and scoring |
| Kotlin / Spring | Protein catalog and search-space versions |
| Storage / data experiment | Postgres + RustFS; database size and error estimation |

B01 extends K07, and B08 extends K17. Both share views with their underlying core showcases.

## 6. Corrected Implementation Order

### Phase 0 - Foundation and Contracts

**Scope**

- Four components and a shared public entry point.
- Postgres bindings and separate migration ownership.
- Versioned scenarios, jobs, and results.
- File contract including states, checksums, and provenance.
- Outbox table, dispatcher, event versioning, and an idempotent test consumer.
- Shared error formats, size limits, and basic telemetry.

**Acceptance criteria**

A sample job survives a restart. The business change and outbox event are saved together or rolled back together. Duplicate delivery produces no duplicate effect.

### Phase 1 - Make Execution Visible

Showcases: K01-K04.

**Scope**

- Shared controls for start, cancellation, pause, single stepping, and replay.
- Durable Python jobs with time-limited leases.
- Attempt tracking to guard against delayed worker results.
- First graph and curve visualizations.

**Acceptance criteria**

A maze can be created, solved, canceled, and replayed after reopening.

### Phase 2 - DNA, Files, and First Production Events

Showcases: K07 + B01, K08, K09, and K15.

**Scope**

- Connect RustFS and fully implement the file contract.
- FASTA imports and initially limited FASTQ imports.
- Format, size, alphabet, and checksum validation.
- Events for available dataset versions.
- Repeatable import postprocessing and reconciliation of orphaned files.
- Compression, search, k-mer analysis, and skew.

**Acceptance criteria**

A failed import is not shown as a usable dataset. Retrying does not accidentally release it twice. Computations reference validated files with fixed versions.

### Phase 3 - Constraints and Transactions

Showcases: K05, K06, and B02, initially exact/greedy.

**Scope**

- Shared CSP framework.
- Spring handles binding bookings.
- Concurrency experiments with version checks and isolation.
- First business outbox consumer: rebuildable catalog overview in Postgres.
- Motif profiles and small exact comparison cases.

**Acceptance criteria**

Two concurrent bookings produce a traceable result without double booking. The catalog overview can be rebuilt and catches up after a consumer outage.

### Phase 4a - Graph Fundamentals

Showcases: K10 and K11.

**Scope**

- Directed/undirected graphs, weights, and stable identities.
- Reusable graph view.
- BFS, Dijkstra, and Prim on versioned graphs.
- Initially only Postgres and Python.

**Acceptance criteria**

Known reference graphs produce correct paths and spanning trees. Loading time and algorithm time are measured separately.

### Phase 4b - Biological Graph Models

Showcases: B03 and B06.

**Scope**

- Parallel edges and edge multiplicities.
- Assembly initially with ideal k-mer inputs.
- Contigs as a subsequent extension.
- Block sequences, reversals, and breakpoint graphs.
- No additional graph database required yet.

**Acceptance criteria**

Assembly accounts for every k-mer instance. Supported model assumptions are validated for 2-break methods.

### Phase 4c - Graph Projections and Storage Comparison

**Scope**

- AGE projection for selected graphs.
- Then optionally Neo4j for comparison.
- Use the existing outbox for creation, updates, and deletion.
- Display projection states, retries, and complete rebuilds.
- Version protection against delayed events.

**Acceptance criteria**

An outage of the target store loses no authoritative data. The projection catches up after recovery. A complete rebuild produces the same logical graph state.

### Phase 5 - Dynamic Programming and Game Trees

Showcases: K13, B05, and K12.

**Scope**

- Shared matrix and traceback visualization.
- Knapsack problem, LCS, edit distance, and alignment.
- Then affine gaps and memory comparison.
- Minimax and alpha-beta with visible subtrees.

**Acceptance criteria**

Reconstructed solutions yield the reported score. Game moves are accepted atomically and safely handle retries.

### Phase 6 - Search Spaces and Optimization

Showcases: K14, K16, randomized B02, and B04.

**Scope**

- Exact enumeration, genetic methods, and randomized motif search.
- Peptide sequencing with pruning and leaderboard.
- Experiment series and checkpoints through the existing file contract.
- Compare runtime and result quality across multiple starts.

**Acceptance criteria**

Small instances are checked against exact solutions. Interruption and resumption are demonstrated for selected longer-running methods.

### Phase 7 - Clusters, Vectors, and Trees

Showcases: K17 + B08; then B07.

**Scope**

- Expression matrix import and versioned transformations.
- K-means, initialization, soft clustering, and hierarchies.
- pgvector, then Qdrant through the existing projection mechanisms.
- Distance matrices and phylogenetic reconstruction.

**Acceptance criteria**

Each feature vector references its data and transformation versions. Search comparisons use the same vector collection. Additive test matrices can be reconstructed correctly.

### Phase 8 - Document and Sequence Indexes

Showcases: K19 and B09.

**Scope**

- Postgres full-text search and OpenSearch projection.
- Trie, suffix structures, BWT, and FM search.
- Index manifests with checksums and reference version.
- Build new indexes in the background and release them only after validation.
- Seed and extend initially with substitutions; add indels through alignment.

**Acceptance criteria**

Exact sequence matches agree with naive search. Reference and index must match. A failed index build does not displace a working version.

### Phase 9 - Learning and Evidence

Showcases: K18, B10, and B11.

**Scope**

- Neural network, HMM inference, and parameter estimation.
- Versioned training data and models.
- Spectral DP and peptide identification.
- Defined target-decoy experiment.
- Profile HMMs and modification alignment as advanced topics.

**Acceptance criteria**

Small HMMs are verified by enumeration. Training and search-space versions are traceable. Score, total probability, and estimated error rate are displayed appropriately for each model.

### Phase 10 - Overall Acceptance

**Scope**

- Shared comparison views and documentation.
- Resource measurements and enforced input limits.
- Recovery of Postgres and RustFS.
- Rebuild selected graph, vector, and search projections.
- Remaining advanced topics in priority order.

**Acceptance criteria**

All planned showcases are accessible through the same catalog. Recovery and projection rebuilding have been tested in practice.

## 7. Bioinformatics Conventions

These conventions are defined alongside the contracts and implemented before Phase 2 at the latest:

- Internally use zero-based coordinates and half-open intervals.
- Explicitly convert import/export formats that use different conventions.
- Unambiguously map strand and orientation to reference coordinates.
- Define handling of ambiguous bases such as N.
- Version codon tables, mass tables, and substitution matrices.
- Document tie-breaking rules and gap conventions.
- Preserve multiplicities in reads and spectra.
- State explicit assumptions for genome rearrangements and phylogenetic methods.

Results are labeled according to the model: candidate region, heuristic solution found, alignment, or estimated error rate.

## 8. Reusable Visualization and TypeScript

Shared React building blocks:

- Sequence view with highlights and coordinates
- Graph view including parallel edges and trees
- Matrix view for DP, profiles, distances, and expression
- Search tree with pruned candidates
- Curves for fitness, error, skew, and scores
- Version and projection status

TypeScript ports begin with Fibonacci, Hanoi, maze search, Hamming distance, reverse complement, and small alignments. More demanding local computations run in Web Workers. Shared test data verifies semantic consistency. Initial states or random decisions are supplied to reproduce identical randomized runs.

## 9. Quality Criteria and Milestones

A showcase is complete when:

- Reference cases, edge cases, and core invariants have been verified.
- Visualization matches the actual computation.
- Inputs, versions, and measurement conditions are traceable.
- Cancellation, timeouts, and errors are handled clearly.
- The storage experiment reveals a concrete trade-off.

Algorithm measurements are analyzed in Postgres. HTTP/JVM metrics and traces use the platform.

| Milestone | Reached after |
| --- | --- |
| M1 – Usable visualization platform | Phase 1 |
| M2 – Reliable files and initial bioinformatics | Phase 2 |
| M3 – Python and Spring working together on domain workflows | Phase 3 |
| M4 – Graph algorithms with rebuildable projections | Phase 4c |
| M5 – Search, graphs, and dynamic programming fully connected | Phase 6 |
| M6 – Vectors, trees, and versioned indexes | Phase 8 |
| M7 – Expanded complete catalog and operational acceptance | Phase 10 |

The phases are functional delivery increments of varying sizes. Time estimates are made at the level of individual showcases and infrastructure tasks.

## 10. Technology Stack Details

The following recommendations supplement the plan's architecture and implementation order. They distinguish the initial setup from later extensions. Python remains the primary implementation language for the educational algorithms; Spring handles transactional business logic and data processing.

### 10.1 React and TypeScript

The frontend is built as a React application with TypeScript and Vite. The reverse proxy serves the generated static files. Scenario editors, replay, and comparison views are the focus; server-side rendering is not required initially.

| Task | Recommendation | Use in Algorithm Lab |
| --- | --- | --- |
| Build and development | React, TypeScript, Vite | Shared lab interface as a single-page application |
| Navigation | React Router | Linkable views for catalog, showcase, dataset version, and execution |
| Server data | TanStack Query | Loading, caching, mutations, and polling execution progress |
| Local state | Zustand | Editor state, selected step, playback speed, and highlights |
| Forms | React Hook Form and Zod | Algorithm parameters, scoring settings, and client-side input validation |
| UI components | MUI / Material UI | Forms, dialogs, tabs, and navigation |
| API contracts | openapi-typescript and openapi-fetch | Generated TypeScript types and typed clients for both APIs |
| Local computation | Web Workers; optional Comlink | TypeScript algorithms without blocking the interface |
| Large lists and sequences | TanStack Virtual, Canvas as needed | Render visible portions of large datasets |

TanStack Query holds server data, including job status. Zustand manages local interaction state. API input validation remains authoritative independently of client-side validation.

### 10.2 Visualization and Replay

| Visualization | Recommendation | Examples |
| --- | --- | --- |
| Graphs and trees | Cytoscape.js | State graphs, Dijkstra, spanning trees, search trees, and de Bruijn multigraphs |
| Curves and numerical comparisons | Apache ECharts | Runtime, fitness, error, skew, scores, and scatter plots |
| Heatmaps | Apache ECharts; custom components for small interactive matrices | Expression, distances, and profiles |
| Views with specialized interaction | Custom React/SVG components | Maze, Hanoi, sequence highlights, and DP traceback |
| Large dense visualizations | Canvas as needed | Sequences or matrices with many visible elements |

Cytoscape.js is wrapped in a dedicated React component. Directed edges, loops, and parallel edges must be explicitly preserved in the shared graph model.

Playback is based on versioned events from the actual computation, such as “node visited,” “distance improved,” or “matrix cell computed.” Shared playback controls support start, pause, single stepping, speed, and replay.

Pausing a replay differs from pausing a running computation. Pausing, canceling, and resuming computations require dedicated control points or checkpoints in the algorithm. Large runs limit or aggregate events; complete traces are a separate execution mode.

### 10.3 FastAPI and Python Infrastructure

| Task | Recommendation | Use |
| --- | --- | --- |
| HTTP API and validation | FastAPI and Pydantic | Validate inputs, start jobs, serve status and results |
| HTTP server | Uvicorn | Run FastAPI |
| Configuration | pydantic-settings | Environment-specific settings and connection parameters |
| PostgreSQL access | SQLAlchemy and psycopg 3 | Executions, steps, checkpoints, and results |
| Migrations | Alembic | Only tables owned by Python |
| Internal HTTP calls | HTTPX | Call Spring interfaces for catalog and artifacts |
| Object storage | boto3 | Connect RustFS through its S3-compatible interface |
| Tests | pytest and Hypothesis | Reference cases, edge cases, and algorithmic invariants |
| Code quality | Ruff and mypy | Formatting, linting, and static type checking |

FastAPI and the worker use the same standalone algorithm package. The algorithm core has no knowledge of HTTP routes, database sessions, or S3 clients. It works with domain inputs and returns results and optional step events. Adapters handle persistence, transport, and artifact access.

SQLAlchemy Core or explicit SQL statements are used for job leasing and specialized PostgreSQL queries. CPU-intensive computations run in separate worker processes.

### 10.4 Durable Jobs and Python Workers

The initial setup uses the PostgreSQL jobs specified in the plan. A small custom worker loop leases and processes them. No additional broker is introduced initially.

1. FastAPI validates the request and stores the job with immutable input references, parameters, and an optional seed.
2. A worker leases a job in a short transaction, for example with `SELECT ... FOR UPDATE SKIP LOCKED`.
3. A time-limited lease and heartbeats make worker failures detectable. No long-running lease transaction remains open during computation.
4. An attempt identifier guards against delayed progress updates and results from an earlier attempt.
5. Progress, cancellation requests, and checkpoints are handled at defined control points.
6. Results, measurements, and artifact references are persisted; a new attempt can be started after a failure.

Leasing, retries, and attempt tracking are application logic and must be covered by failure and concurrency tests. Reproducible restart and resumption from a checkpoint are different capabilities; resumption is offered only for algorithms designed to support it.

FastAPI `BackgroundTasks` does not handle durable algorithm jobs. Celery would be a later alternative if distributed job management requirements grow; introducing it would extend the execution and infrastructure design and is outside the initial setup.

### 10.5 Numerical Computing, Graphs, and Bioinformatics

| Library | Role | Introduction |
| --- | --- | --- |
| NumPy | Matrices, numerical data, and reproducible random number generators | When the first numerical or matrix modules need it |
| SciPy | Numerical utilities and independent comparison results | With suitable advanced modules |
| NetworkX | Comparison results and graph utilities | First graph comparisons; Phase 4a at the latest |
| Biopython, particularly Bio.SeqIO | FASTA/FASTQ processing and biological formats | Phase 2 |
| scikit-learn | Comparison for k-means, preprocessing, and clustering | Phase 7 |
| PyTorch | Comparison with the custom neural network implementation | Optional in Phase 9 |

The educational algorithms are implemented from scratch so that their steps remain visible and explainable. Libraries provide supporting functionality and serve as independent references. For example, the custom Dijkstra implementation is checked against NetworkX; the custom k-means implementation is evaluated against scikit-learn under appropriate comparison conditions.

Biopython supports reading sequence formats. Domain rules such as allowed alphabets, ambiguities, size limits, coordinates, and dataset release are additionally validated according to Section 7.

Comparison methods must use the same model assumptions, distance measures, scoring rules, and inputs. Running the library implementation does not replace the instrumented educational algorithm.

### 10.6 Kotlin and Spring Boot

| Task | Recommendation | Use |
| --- | --- | --- |
| Language and framework | Kotlin and Spring Boot | Domain data service |
| REST API | Spring Web MVC | Catalog, versions, imports, artifacts, and bookings |
| Input validation | Jakarta Bean Validation | Server-side validation of domain API inputs |
| PostgreSQL access | Spring JDBC with JdbcClient | Explicit SQL for catalog, bookings, outbox, and projections |
| Transactions | Spring Transactions, particularly `@Transactional` | Save business changes and outbox events together |
| Migrations | Flyway | Only tables owned by Spring |
| OpenAPI | springdoc-openapi | API documentation and basis for frontend client types |
| Object storage | AWS SDK for Java v2, S3 client | RustFS, artifact metadata, and upload workflows |
| Operations and metrics | Spring Boot Actuator and Micrometer | Health checks and platform metrics |
| Tests | JUnit 5 and Testcontainers | Transactions, concurrency, database access, and integrations |
| Larger import batches | Spring Batch | Later repeatable batch processing |

JdbcClient is the recommended starting point: SQL, locks, indexes, JSONB, and transactions remain directly understandable. This fits the lab's data experiments.

jOOQ is a later alternative if more complex queries and generated type-safe table access justify the additional build effort. It is not introduced alongside JdbcClient as another standard layer.

The Spring outbox initially uses a dedicated PostgreSQL table and a dispatcher. The dispatcher can run on a schedule. It requires visible attempts, retry times, and errors, along with idempotent consumers. A scheduler alone does not ensure durable delivery; persisted outbox states and processing rules provide that guarantee.

### 10.7 Interfaces and Data Ownership

| Data area | Write ownership | Migrations |
| --- | --- | --- |
| Scenarios, catalog, dataset versions, and artifact metadata | Spring | Flyway |
| Imports, bookings, outbox, and projection states | Spring | Flyway |
| Execution jobs, steps, checkpoints, and results | Python | Alembic |
| Large files, replays, indexes, and models | Responsible process according to the artifact contract; release by Spring | Version file formats and metadata |

Initially, one PostgreSQL resource with separate schemas is used. Flyway and Alembic manage only their respective tables and migration tables. The worker does not write directly to Spring catalog tables.

Both APIs publish their own OpenAPI descriptions. Separate TypeScript client types are generated from them. Shared conventions cover error formats, IDs, version references, timestamps, and event schemas; domain contract tests verify interoperability.

A typical workflow:

1. React loads an immutable scenario version through `/api/data`.
2. React starts an execution with version references, parameters, and a seed through `/api/algorithms`.
3. The Python worker computes the result and step sequence.
4. React polls for progress and controls playback.
5. After RustFS is introduced, larger files are uploaded and validated through the shared artifact contract.
6. Spring releases validated artifacts and, where applicable, generates business outbox events for downstream projections.

### 10.8 Deployment and Observability

Nginx is a suitable first choice for the web server and reverse proxy. It serves the Vite build and forwards `/api/algorithms` to FastAPI and `/api/data` to Spring. The Python worker does not need a public endpoint.

The four application components remain independently deployable:

- Web server with the static React build
- FastAPI
- Python worker
- Spring Boot

PostgreSQL and additional stores introduced later are supporting infrastructure resources. A later Spring Batch process may become a fifth application component.

Algorithm measurements are stored in PostgreSQL with input versions, implementation version, and measurement conditions. HTTP/JVM metrics and traces use the existing platform. Spring provides health checks and metrics through Actuator and Micrometer; Python can be instrumented with OpenTelemetry. API calls and worker executions must be correlatable through the execution ID and trace context.

### 10.9 Rollout Along the Project Phases

| Phase | Technical additions |
| --- | --- |
| 0 – Foundation | React/Vite, Router, MUI, API clients, FastAPI/Pydantic, SQLAlchemy/psycopg, Alembic, Spring MVC/JdbcClient, Flyway, PostgreSQL, reverse proxy, outbox foundation, and basic telemetry |
| 1 – Make execution visible | Durable worker leases, TanStack Query for polling, Zustand for replay, first Cytoscape.js and ECharts views, and custom SVG components |
| 2 – DNA and files | RustFS, boto3, Java S3 client, Biopython, and the complete artifact workflow |
| 3 – Constraints and transactions | Concurrency and isolation tests, first business projection consumer, and batch import processing as needed |
| 4a/4b – Graphs | Shared graph model including parallel edges and NetworkX comparisons |
| 4c – Graph projections | AGE, then optionally Neo4j; integration through existing outbox and projection contracts |
| 5/6 – DP and optimization | Matrix/traceback components, numerical utilities as needed, experiment series, and checkpoints |
| 7 – Clusters and vectors | scikit-learn comparisons, suitable SciPy methods, pgvector, then Qdrant |
| 8 – Indexes | OpenSearch integration, index manifests, and background construction |
| 9 – Learning and evidence | Optional PyTorch for comparison, versioned training and model artifacts |
| 10 – Acceptance | Recovery, rebuilding, and overall resource measurements |

### 10.10 Recommended Starting Point

The first usable version combines React/Vite with MUI, TanStack Query, and Zustand; FastAPI with SQLAlchemy, psycopg, and Alembic; a separate worker backed by PostgreSQL; Spring MVC with JdbcClient and Flyway; PostgreSQL and Nginx.

Cytoscape.js, ECharts, and custom React/SVG components cover the first visualizations. Further scientific libraries and additional stores are added only with their respective showcases.
