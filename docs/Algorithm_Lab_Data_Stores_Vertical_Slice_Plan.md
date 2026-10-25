# Algorithm Lab: Data Stores Vertical Slice

## Goal

Deliver a complete browser workflow for importing DNA sequences, analyzing them, and exploring the results through text search, vector similarity, graph queries, and analytical queries.

This is a second vertical slice after the Fibonacci workflow. It extends the same React, FastAPI, Python worker, and Kotlin / Spring Boot applications while giving each selected data technology a concrete role.

## Platform Scope

The Developer Platform repository documents implementations for named PostgreSQL resources with Apache AGE and pgvector, plus optional RustFS, OpenSearch, Qdrant, and dedicated Neo4j Community providers. Availability and activation in the target installation must be checked during implementation; repository implementation status does not confirm deployed readiness.

DuckDB is an embedded application analytical engine, and Parquet is a file format. Neither requires another database service. TimescaleDB, ClickHouse, Valkey, and MongoDB/CouchDB are deferred platform extensions and are outside this slice.

## Use Case and Initial Limits

Import a small synthetic FASTA file containing several short DNA sequences, sequence identifiers, and descriptions. Compute k-mer frequencies, normalized feature vectors, and a small de Bruijn graph. Expose the results through one shared results page.

Keep the first implementation bounded:

- Use one documented synthetic fixture with known expected results.
- Fix `k = 3` initially.
- Accept unambiguous DNA bases A, C, G, and T; reject unsupported symbols with a clear validation error.
- Define and enforce limits for upload size, sequence count, sequence length, and generated graph size.
- Analyze sequences independently: do not create k-mers across sequence boundaries.
- Preserve repeated k-mer occurrences and graph edge multiplicities.
- Compute a normalized k-mer frequency vector per sequence using a fixed, versioned ordering of all 64 possible 3-mers and a documented normalization rule.
- Use exact vector search initially, with the same distance metric and tie-handling rules in both providers.

K-mer vector similarity describes sequence composition. It does not establish alignment correctness or biological relatedness. The graph is an educational representation of the input; reconstructing a real genome is outside this slice.

## Data Technology Responsibilities

| Technology | Responsibility | Initial comparison |
| --- | --- | --- |
| PostgreSQL | Authoritative catalog, dataset versions, artifact metadata, executions, analysis results, outbox, and projection state | Reference SQL, full-text search, and relational graph queries |
| RustFS / S3 | Immutable FASTA inputs, analysis artifacts, graph exports, and Parquet files | Artifact integrity and versioned retrieval |
| OpenSearch | Search sequence identifiers, descriptions, and annotations when present | PostgreSQL full-text search |
| pgvector | Similarity search over normalized k-mer frequency vectors | Exact vector distances and nearest neighbors |
| Qdrant | Search the same versioned vector collection | Same queries, vectors, and distance metric as pgvector |
| Apache AGE | Rebuildable de Bruijn graph projection | Relational graph queries and Neo4j |
| Neo4j Community | Projection of the same graph | Equivalent graph queries in AGE and PostgreSQL |
| DuckDB + Parquet | Aggregate exported k-mer counts | Equivalent PostgreSQL aggregations |

PostgreSQL and protected RustFS artifacts hold authoritative data. Search, vector, and graph projections are derived and rebuildable. Projection writes are performed only through their designated consumers.

## Application and Data Ownership

- **React** owns the import, execution, and results interfaces, progress polling, provider selection, and visualizations.
- **Spring** owns the catalog, immutable dataset versions, artifact metadata and release, import state, outbox, and projection lifecycle metadata.
- **FastAPI** validates execution requests, resolves immutable input references through Spring, persists jobs, and exposes execution status, results, and analysis queries.
- **Python workers** parse and analyze sequence inputs, produce artifacts, and run the independent algorithm package.
- **Projection consumers** load approved manifests and update their assigned search, vector, or graph projections. They can initially run within existing service processes; additional deployment components are not required by this plan.

Spring and Python own separate PostgreSQL schemas and migrations. Cross-service access uses defined APIs. Native provider access requires explicit platform bindings to the consuming components.

## End-to-End Workflow

1. **Reserve an import.** React asks Spring to create a dataset version and artifact record with a unique object key. The initial version is not yet available for analysis.
2. **Upload and validate.** Upload the FASTA file to RustFS through the agreed upload interface. Validate its size, checksum, FASTA structure, identifiers, alphabet, and resource limits. The responsible import process reports validation through the Spring API.
3. **Release the dataset.** Spring marks the validated dataset version as available and writes `DatasetVersionReady` in the same PostgreSQL transaction. Consumers make its sequence metadata searchable in OpenSearch. Metadata in PostgreSQL supports the reference full-text search.
4. **Start an analysis.** React submits the immutable dataset version and analysis parameters to FastAPI. FastAPI persists a durable execution job with input references, resolved parameters, and implementation version.
5. **Compute results.** A Python worker leases the job, reads the approved FASTA artifact, and computes per-sequence k-mer counts, normalized feature vectors, and the de Bruijn graph. Each edge represents a k-mer from its length-2 prefix to its length-2 suffix, with multiplicities preserved.
6. **Persist and publish artifacts.** Store analysis results in the Python-owned PostgreSQL schema and upload versioned analysis, graph, and Parquet artifacts to RustFS. Release these artifacts through the Spring artifact contract after integrity and format validation.
7. **Release an analysis manifest.** Publish a manifest referencing the dataset version, execution, algorithm and feature format versions, parameters, artifact IDs, and checksums. Spring validates the referenced artifact states and atomically records the manifest release with an event such as `AnalysisArtifactsReady`.
8. **Build projections.** Independent idempotent consumers load the manifest and populate pgvector, Qdrant, AGE, and Neo4j. They record their own processing position, errors, attempts, and completed projection version. Delayed events must not replace newer published state.
9. **Explore results.** React displays the analysis result and provider-specific readiness. Users can compare text search, nearest neighbors, graph neighborhoods, and aggregate k-mer counts. DuckDB reads verified Parquet artifacts for the analytical comparison.

A completed analysis and a fully updated set of projections are separate states. The UI must make pending or failed projections visible while retaining access to completed analysis results.

## Results Page and Comparison Queries

| View | Initial user action | Expected behavior |
| --- | --- | --- |
| Text search | Search a known word from a sequence description | Display expected matches from PostgreSQL and OpenSearch; rankings may differ |
| Vector similarity | Select a sequence and request its five nearest neighbors, excluding itself | Compare exact distances and neighbors from pgvector and Qdrant, accounting for ties and fewer available candidates |
| Graph exploration | Select a node and request outgoing neighbors | PostgreSQL, AGE, and Neo4j return equivalent logical edges and multiplicities |
| Analytics | Request the most frequent k-mers across the dataset | PostgreSQL and DuckDB return the same counts with deterministic ordering for ties |
| Projection status | Inspect the published analysis version | Show source versions, readiness, processing errors, and the last successful projection version |

Use the same immutable dataset and analysis version for every comparison. Record query settings and separate data-loading time from computation or query time. Initial measurements demonstrate the comparison workflow; they are not claims about provider performance at scale.

## Implementation Steps

1. Reuse the deployment, routing, migrations, durable jobs, and polling established by the Fibonacci slice.
2. Add the synthetic FASTA fixture and independent parsing, k-mer counting, vectorization, and graph reference cases.
3. Implement RustFS artifact upload, integrity validation, immutable dataset release, and import failure handling.
4. Implement the transactional Spring outbox, dispatcher, idempotent consumers, retries, and observable projection state.
5. Add PostgreSQL metadata search and the OpenSearch projection.
6. Add the durable DNA analysis job, bounded event reporting, versioned artifacts, and released analysis manifest.
7. Add pgvector and Qdrant consumers and the equivalent exact similarity query.
8. Add relational graph queries and AGE/Neo4j consumers with equivalent neighborhood queries.
9. Export k-mer counts to Parquet and add the equivalent DuckDB and PostgreSQL aggregations.
10. Build the shared results page and verify the complete workflow, retry behavior, and projection rebuilds.

## Acceptance Criteria

- The bounded fixture can be imported and analyzed through the browser across all four application components.
- A failed upload or invalid FASTA file is not exposed as an available dataset.
- Every execution references immutable inputs, parameters, and implementation versions.
- Artifact size and checksum validation succeeds before release, and released objects are not overwritten.
- Known k-mer counts, vectors, graph nodes, edges, and multiplicities match the fixture's reference results.
- PostgreSQL and OpenSearch return the expected text matches; identical ranking is not required.
- pgvector and Qdrant use identical vectors, filters, and distance semantics and return equivalent exact results within documented numerical tolerances and tie rules.
- PostgreSQL, AGE, and Neo4j return equivalent graph neighborhoods with preserved multiplicities.
- PostgreSQL and DuckDB return the same aggregate k-mer counts from the same analysis version.
- Every projection identifies its source manifest and exposes pending, ready, and failed states.
- Duplicate event delivery has no duplicate logical effect, and delayed events cannot overwrite newer published state.
- An unavailable projection provider does not lose authoritative inputs or completed analysis results. Its consumer catches up after recovery.
- Each search, vector, and graph projection can be rebuilt from protected PostgreSQL data and RustFS artifacts.
- Reloading an execution or results URL retrieves the same versioned analysis and its current projection states.

Verification includes independent algorithm fixtures, real provider integration checks, duplicate and delayed event handling, one consumer outage/restart check, rebuild checks, and a complete browser journey. Verify provider activation and component bindings on the target platform before deployed acceptance.

## Deferred Work

Defer approximate vector indexes, adjustable k, ambiguous bases, large real-world datasets, advanced assembly, sequence alignment, semantic embeddings, hybrid search, interactive computation pause/resume, and broad performance benchmarking.

The initial slice demonstrates functional integration and reproducible comparisons across the selected technologies. Production-scale recovery and capacity studies remain separate work.

## Completion

The slice is complete when the browser workflow demonstrates import, analysis, all four comparison views, observable projection status, and successful catch-up and rebuilding for the selected projections, with all acceptance criteria verified.
