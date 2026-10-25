# Projektplan: Algorithm Lab mit Bioinformatik

Erweiterte und korrigierte Fassung mit 19 Basis-Showcases und 11 Bioinformatikmodulen.

- **Stand des fachlichen Plans:** 24. Oktober 2026
- **Markdown-Fassung mit Techstack-Empfehlungen:** 25. Oktober 2026

Die Abschnitte 1–9 übernehmen den vollständigen fachlichen Projektplan. Abschnitt 10 konkretisiert den Techstack anhand der ergänzenden Empfehlungen.

## 1. Ziel und Umfang

Eine gemeinsame Anwendung verbindet:

- Kopec: grundlegende Algorithmen implementieren, visualisieren und vergleichen.
- Compeau/Pevzner: algorithmische Konzepte auf biologische Fragestellungen übertragen.
- Just Use Postgres! und DDIA: Datenmodelle, Transaktionen, Indizes, Hintergrundverarbeitung und abgeleitete Daten untersuchen.

Alle bisherigen Showcases bleiben erhalten. Bioinformatik ergänzt bestehende Ansichten oder erhält eigenständige Module. Der Katalog lässt sich nach Algorithmusfamilie und Anwendungsgebiet durchsuchen. Jeder Showcase funktioniert unabhängig; gemeinsame Datensätze und Darstellungen können wiederverwendet werden. Grundlage der Bioinformatikmodule sind die elf Kapitelzusammenfassungen. Geplant sind zentrale Verfahren und ausgewählte Vertiefungen, keine vollständige Implementierung sämtlicher Buchaufgaben.

## 2. Architektur

| Komponente | Verantwortung |
| --- | --- |
| React / TypeScript | Szenarioeditoren, Visualisierungen, Wiedergabe, Vergleiche und ausgewählte lokale Algorithmen |
| FastAPI | Algorithmus-API, Eingabeprüfung, Ausführungsaufträge, Fortschritt und Ergebnisse |
| Python-Worker | Längere Berechnungen, Indexaufbau, Training und Checkpoints |
| Kotlin / Spring Boot | Szenario-/Datensatzkatalog, Importe, Versionierung, Buchungen, Outbox und Speicherprojektionen |
| Webserver / Reverse Proxy | React ausliefern und Anfragen an die privaten APIs weiterleiten |

Webserver, FastAPI, Python-Worker und Spring bilden vier Deployment-Komponenten. Eine fünfte Komponente kann später zeitgesteuerte Spring-Batch-Läufe übernehmen. Python bleibt der hauptsächliche Implementierungsort der Algorithmen. Spring übernimmt transaktionale Fachlogik und Datenverarbeitung. FastAPI und Worker verwenden dasselbe, von Webframework und Persistenz getrennte Algorithmuspaket. React greift über einen gemeinsamen öffentlichen Einstieg auf beide APIs zu:

- /api/algorithms: FastAPI
- /api/data: Spring

Fortschritt wird zunächst per Polling geliefert. Server-Sent Events können später ergänzt werden.

## 3. Datenspeicher und Datenverantwortung

| Speicher | Einsatz |
| --- | --- |
| PostgreSQL | Führender Katalog, Versionen, Aufträge, Ergebnisse, Buchungen, Ereignisse und Outbox |
| RustFS / S3 | Sequenzdateien, Expressionsmatrizen, Spektren, größere Replays, Indizes und Modellstände |
| Apache AGE | Ausgewählte wiederaufbaubare Graphprojektionen |
| Neo4j Community | Vergleich von Graphmodellierung und Abfragen |
| pgvector | Ähnlichkeitssuche auf versionierten Merkmalsvektoren |
| Qdrant | Vergleich mit pgvector |
| OpenSearch | Dokument-, Beschreibungs- und Annotationssuche |

Postgres ist die Basis. Zusätzliche Provider werden erst für die jeweiligen Experimente aktiviert. Spring besitzt Katalog, Datensatzversionen, Artefaktmetadaten, Importe, Buchungen und Projektionsstände. Python besitzt Ausführungsaufträge, Schritte, Checkpoints und Ergebnisse. Jede Tabellenfamilie hat einen Verantwortlichen für Schreibzugriffe und Migrationen. Zum Einstieg genügt eine benannte Postgres-Ressource mit getrennten Schemas. Diese Trennung organisiert Zuständigkeiten; sie stellt keine harte Zugriffsisolation her. Grenzen der Speichervergleiche:

- Read-Mapping verwendet eigene Sequenzindizes.
- Vektorsuche ergänzt Clustering und ersetzt kein Alignment.
- Graphdatenbanken ergänzen die Python-Referenzalgorithmen.
- PostGIS, TimescaleDB und pgmq werden nicht vorausgesetzt.

## 4. Gemeinsame Verträge ab Phase 0

### 4.1 Szenarien und Ausführungen

Jede Ausführung referenziert unveränderliche Eingaben und enthält:

- Algorithmuskennung und Implementierungsversion
- Szenario-/Datensatzversionen
- Parameter und gegebenenfalls Zufallsseed
- Status, Versuch und Zeitpunkte
- Ergebnis, Messwerte und Artefaktreferenzen
- Version des Ereignisformats

Messungen trennen Berechnung, Datenzugriff, Übertragung und Darstellung. Für große Läufe werden Ereignisse begrenzt oder zusammengefasst. Ein vollständiger Animationstrace ist ein gesonderter Ausführungsmodus.

### 4.2 Gemeinsamer Dateivertrag

Der Vertrag gilt für Sequenzen, Matrizen, Spektren, Replays, Indizes und Modelle.

| Feld | Bedeutung |
| --- | --- |
| Artefakt-ID | Stabile Identität |
| Objektschlüssel | Unveränderlicher Speicherort |
| Typ und Formatversion | Beispielsweise FASTA, Expressionsmatrix oder Indexformat |
| Größe und Prüfsumme | Integrität und Ressourcenplanung |
| Erzeuger | Import, Algorithmusausführung oder Modelllauf |
| Quellversionen | Datensätze und Parameter, aus denen das Artefakt entstand |
| Zustand | Reserviert, hochgeladen, geprüft, verfügbar oder fehlgeschlagen |

Verarbeitungsablauf:

1. Spring legt einen Artefaktdatensatz und einen eindeutigen Objektschlüssel an.
2. Der zuständige Import- oder Berechnungsprozess lädt die Datei hoch.
3. Größe, Prüfsumme und fachliches Format werden geprüft.
4. Spring gibt das Artefakt als verfügbar frei.
5. Nachgelagerte Prozesse verwenden ausschließlich verfügbare Artefakte.

Fehlgeschlagene Uploads werden erneut versucht oder als fehlgeschlagen markiert. Ein Abgleich erkennt verwaiste Objekte und fehlende Dateien. Freigegebene Dateien werden durch neue Versionen ersetzt, nicht überschrieben. In Phase 0 werden Vertrag und Schnittstellen umgesetzt. Phase 2 bringt RustFS und den vollständigen Ablauf hinzu.

### 4.3 Outbox-Vertrag

Die technische Grundlage entsteht in Phase 0:

- Fachliche Änderung und Outbox-Eintrag werden in derselben Postgres-Transaktion gespeichert.
- Ereignisse enthalten ID, Typ, Schemaversion, fachliche ID und fachliche Version.
- Große Nutzdaten bleiben in Datensätzen oder Artefakten; Ereignisse referenzieren sie.
- Verbraucher speichern ihren Verarbeitungsstand und behandeln Wiederholungen idempotent.
- Fehlgeschlagene Zustellungen bleiben mit Fehler, Versuchszahl und nächstem Versuch sichtbar.
- Projektionen verhindern, dass verspätete ältere Ereignisse einen neueren Stand überschreiben.

Die Zustellung darf mehrfach erfolgen. Eine erfolgreiche externe Änderung kann vor dem Speichern ihrer Bestätigung bereits abgeschlossen sein. Einführung:
- Phase 0: Transaktionsmuster, Dispatcher und Wiederholungstests.
- Phase 2: Erste produktive Ereignisse wie DatasetVersionReady.
- Phase 3: Verbraucher für eine wiederaufbaubare Katalogübersicht in Postgres.
- Phase 4c: Erste externe Graphprojektionen.
- Phase 7/8: Wiederverwendung für Vektor- und Suchprojektionen.

Spring besitzt die Outbox für seine fachlichen Daten. Python meldet fertige Artefakte über definierte Schnittstellen. Ein später benötigtes Python-Outbox-Muster würde dessen eigene Transaktionen und Tabellen betreffen.

## 5. Vollständiger Showcase-Katalog

K bezeichnet die bisherigen Showcases, B die Bioinformatikergänzungen. Die Kennungen bleiben unabhängig von der Reihenfolge stabil.

### 5.1 Kopec und bisherige Transferaufgaben

#### K01 – Fibonacci: Rekursion, Memoization, Iteration

| Bereich | Umsetzung |
| --- | --- |
| React | Aufrufbaum, Kurven, TS-Vergleich |
| FastAPI / Python | Varianten und Benchmarks |
| Kotlin / Spring | Vorlagen |
| Speicher | Postgres |

#### K02 – Labyrinth: DFS, BFS, A*

| Bereich | Umsetzung |
| --- | --- |
| React | Raster, Suchfront, Replay |
| FastAPI / Python | Suche und Ereignisse |
| Kotlin / Spring | Szenarien |
| Speicher | Postgres; später RustFS |

#### K03 – Türme von Hanoi

| Bereich | Umsetzung |
| --- | --- |
| React | Türme und Rekursion |
| FastAPI / Python | Zugfolge und Prüfung |
| Kotlin / Spring | Vorlagen |
| Speicher | Postgres |

#### K04 – Missionare und Kannibalen

| Bereich | Umsetzung |
| --- | --- |
| React | Zustandsgraph |
| FastAPI / Python | Zustandsraumsuche |
| Kotlin / Spring | Szenarien |
| Speicher | Postgres/JSONB |

#### K05 – CSP: Kartenfärbung, Damen, Wortsuche, Kryptarithmetik; später Platinenlayout

| Bereich | Umsetzung |
| --- | --- |
| React | Kandidaten und Backtracking |
| FastAPI / Python | CSP-Framework |
| Kotlin / Spring | Problemversionen |
| Speicher | Postgres/JSONB |

#### K06 – Stundenplan und Buchungen

| Bereich | Umsetzung |
| --- | --- |
| React | Planung, konkurrierende Sitzungen |
| FastAPI / Python | CSP-Vorschläge |
| Kotlin / Spring | Verbindliche Buchungen |
| Speicher | Postgres |

#### K07 – DNA-Suche und Zwei-Bit-Kompression

| Bereich | Umsetzung |
| --- | --- |
| React | Sequenzen, Codons und Bits |
| FastAPI / Python | Suche und Kompression |
| Kotlin / Spring | Importe und Katalog |
| Speicher | Postgres + RustFS |

#### K08 – π-Konvergenz

| Bereich | Umsetzung |
| --- | --- |
| React | Fehlerkurve |
| FastAPI / Python | Näherung und Messreihen |
| Kotlin / Spring | Vorlagen |
| Speicher | Postgres |

#### K09 – XOR-/One-Time-Pad

| Bereich | Umsetzung |
| --- | --- |
| React | Bitoperationen |
| FastAPI / Python | Buchverfahren |
| Kotlin / Spring | Demo-Vorlagen |
| Speicher | Vorlagen in Postgres; Schlüssel flüchtig |

#### K10 – Routen: BFS, Dijkstra

| Bereich | Umsetzung |
| --- | --- |
| React | Netz und Routen |
| FastAPI / Python | Referenzalgorithmen |
| Kotlin / Spring | Graphversionen |
| Speicher | Postgres; später AGE/Neo4j |

#### K11 – Spannbaum: Prim/Jarník

| Bereich | Umsetzung |
| --- | --- |
| React | Aufbau und Kosten |
| FastAPI / Python | Minimaler Spannbaum |
| Kotlin / Spring | Graphkatalog |
| Speicher | Postgres; später AGE/Neo4j |

#### K12 – Minimax und Alpha-Beta

| Bereich | Umsetzung |
| --- | --- |
| React | Tic-Tac-Toe, Vier gewinnt, Spielbaum |
| FastAPI / Python | KI und Spielzustand |
| Kotlin / Spring | Spielvorlagen |
| Speicher | Postgres |

#### K13 – Rucksackproblem

| Bereich | Umsetzung |
| --- | --- |
| React | Gegenstände und DP-Tabelle |
| FastAPI / Python | Optimierung |
| Kotlin / Spring | Gegenstandskatalog |
| Speicher | Postgres |

#### K14 – Traveling Salesperson

| Bereich | Umsetzung |
| --- | --- |
| React | Rundreisen und Aufwand |
| FastAPI / Python | Exakte Suche kleiner Instanzen |
| Kotlin / Spring | Distanzmatrizen |
| Speicher | Postgres |

#### K15 – Telefonnummern-Wörter

| Bereich | Umsetzung |
| --- | --- |
| React | Kombinationen und Treffer |
| FastAPI / Python | Kombinationserzeugung |
| Kotlin / Spring | Wörterbuchimporte |
| Speicher | Postgres |

#### K16 – Genetische Algorithmen

| Bereich | Umsetzung |
| --- | --- |
| React | Population und Fitness |
| FastAPI / Python | Funktion, Kryptarithmetik, Listenkompression |
| Kotlin / Spring | Experimente |
| Speicher | Postgres + RustFS |

#### K17 – Cluster-/Vektorlabor

| Bereich | Umsetzung |
| --- | --- |
| React | Punkte, Zentren und Nachbarn |
| FastAPI / Python | K-Means |
| Kotlin / Spring | Importe und Projektionen |
| Speicher | Postgres, RustFS, pgvector, Qdrant |

#### K18 – Neuronales Lernlabor

| Bereich | Umsetzung |
| --- | --- |
| React | Gewichte, Fehler, Vorhersagen |
| FastAPI / Python | Training und Inferenz |
| Kotlin / Spring | Daten-/Modellkatalog |
| Speicher | Postgres + RustFS |

#### K19 – Suchwerkstatt

| Bereich | Umsetzung |
| --- | --- |
| React | Treffer und Indexstände |
| FastAPI / Python | Referenzsuche |
| Kotlin / Spring | Volltextsuche und OpenSearch-Projektion |
| Speicher | Postgres + OpenSearch + RustFS |

### 5.2 Bioinformatik

#### B01 – Pattern Matching, Häufigkeitstabellen, reverses Komplement, Hamming-Distanz, Minimum-Skew; anschließend Clumps und d-Nachbarschaften

| Bereich | Umsetzung |
| --- | --- |
| React | Sequenz, Fenster, Häufigkeiten und Skew |
| FastAPI / Python | Algorithmen und Vergleiche |
| Kotlin / Spring | FASTA-Import und Referenzversionen |
| Speicher / Datenexperiment | Postgres + RustFS; vorberechnete Häufigkeiten gegen Neuberechnung |

#### B02 – Motif Enumeration, Median String, Profile, Greedy-Suche; später Randomized Motif Search und Gibbs Sampling

| Bereich | Umsetzung |
| --- | --- |
| React | Motivfenster, Profil, Logo und Scoreverlauf |
| FastAPI / Python | Exakte und heuristische Verfahren |
| Kotlin / Spring | Sequenzsammlungen und Experimente |
| Speicher / Datenexperiment | Postgres + RustFS; Seeds, Parameter und mehrere Starts |

#### B03 – Überlappungs-/de-Bruijn-Graph, Hierholzer, Rekonstruktion; anschließend Contigs und gepaarte Reads

| Bereich | Umsetzung |
| --- | --- |
| React | Graphaufbau, Kantenverbrauch und Sequenz |
| FastAPI / Python | Assembly und Multigraphen |
| Kotlin / Spring | Read-Katalog und Projektionen |
| Speicher / Datenexperiment | Postgres + RustFS; später AGE/Neo4j; Multiplizität und Wiederaufbau |

#### B04 – Translation, Peptid-Encoding, lineare/zyklische Spektren, Branch-and-Bound; später Leaderboard und Faltung

| Bereich | Umsetzung |
| --- | --- |
| React | Peptidring, Peaks und Suchbaum |
| FastAPI / Python | Spektren und Kandidatensuche |
| Kotlin / Spring | Spektren und Massentabellen |
| Speicher / Datenexperiment | Postgres + RustFS; Multimengen und begrenzte Suche |

#### B05 – Wechselgeld, DAG-Pfade, LCS, Edit-Distanz, globales/lokales Alignment; später affine Lücken und linearer Speicher

| Bereich | Umsetzung |
| --- | --- |
| React | Matrix, Übergänge und Traceback |
| FastAPI / Python | DP und Rekonstruktion |
| Kotlin / Spring | Sequenzpaare und Scoringversionen |
| Speicher / Datenexperiment | Postgres + RustFS; vollständige Tabellen gegen kompakte Ergebnisse |

#### B06 – Greedy-Reversals, Breakpoints; anschließend 2-Break-Distanz/-Sortierung und Dotplots

| Bereich | Umsetzung |
| --- | --- |
| React | Blöcke, Operationen und Zyklen |
| FastAPI / Python | Umlagerungsalgorithmen |
| Kotlin / Spring | Blockversionen und Historie |
| Speicher / Datenexperiment | Postgres/JSONB; optional AGE; Ereignisse gegen Snapshots |

#### B07 – Blattdistanzen, Limb Length, additive Phylogenie, UPGMA, Neighbor Joining; später Small Parsimony und NNI

| Bereich | Umsetzung |
| --- | --- |
| React | Distanzmatrix und Baum |
| FastAPI / Python | Rekonstruktion und Parsimony |
| Kotlin / Spring | Taxa, Matrizen und Herkunft |
| Speicher / Datenexperiment | Postgres + RustFS; optional Graphprojektion |

#### B08 – Farthest First, Lloyd, K-Means++; später Soft K-Means und Average Linkage

| Bereich | Umsetzung |
| --- | --- |
| React | Expressions-Heatmap, Verläufe und Dendrogramm |
| FastAPI / Python | Transformationen und Clustering |
| Kotlin / Spring | Matriximporte und Vektorprojektionen |
| Speicher / Datenexperiment | RustFS, Postgres, pgvector, Qdrant; Normalisierung und Distanzmaße |

#### B09 – Trie, Suffixarray/-baum, BWT, Inversion und FM-Suche; später Checkpoints und Seed-and-Extend

| Bereich | Umsetzung |
| --- | --- |
| React | Indexaufbau, Intervalle und Treffer |
| FastAPI / Python | Sequenzindizes und Mapping |
| Kotlin / Spring | Indexmanifest und Freigabe |
| Speicher / Datenexperiment | RustFS + Postgres; Indexbau, Anfragekosten und Versionswechsel |

#### B10 – HMM-Pfade, Viterbi, Forward-Backward; später Parameterschätzung, Baum-Welch und Profil-HMM

| Bereich | Umsetzung |
| --- | --- |
| React | Zustandseditor, Trellis und Posterioren |
| FastAPI / Python | Inferenz und Lernen |
| Kotlin / Spring | Modell-/Trainingsversionen |
| Speicher / Datenexperiment | Postgres + RustFS; Stabilität und Modellherkunft |

#### B11 – Spektralgraph, Peptidvektor, gewichtete Pfade und Datenbankidentifikation; später Wörterbücher, Modifikationen und Target-Decoy

| Bereich | Umsetzung |
| --- | --- |
| React | Peaks, Kandidaten und Scoreverteilungen |
| FastAPI / Python | Spektral-DP und Bewertung |
| Kotlin / Spring | Proteinkatalog und Suchraumversionen |
| Speicher / Datenexperiment | Postgres + RustFS; Datenbankgröße und Fehlerabschätzung |

B01 erweitert K07, B08 erweitert K17. Beide erhalten gemeinsame Ansichten mit ihren Grundlagen.

## 6. Korrigierte Umsetzungsreihenfolge

### Phase 0 - Fundament und Verträge

**Umfang**

- Vier Komponenten und gemeinsamer öffentlicher Einstieg.
- Postgres-Bindings und getrennte Migrationsverantwortung.
- Versionierte Szenarien, Aufträge und Ergebnisse.
- Dateivertrag einschließlich Zuständen, Prüfsummen und Herkunft.
- Outbox-Tabelle, Dispatcher, Ereignisversionierung und idempotenter Testverbraucher.
- Gemeinsame Fehlerformate, Größenlimits und grundlegende Telemetrie.

**Abnahme**

Ein Beispielauftrag übersteht einen Neustart. Fachliche Änderung und Outbox-Ereignis werden gemeinsam gespeichert oder gemeinsam zurückgerollt. Doppelte Zustellung erzeugt keine doppelte Wirkung.

### Phase 1 - Ausführung sichtbar machen

Showcases: K01-K04.

**Umfang**

- Gemeinsame Steuerung für Start, Abbruch, Pause, Einzelschritt und Replay.
- Dauerhafte Python-Aufträge mit zeitlich begrenzter Reservierung.
- Versuchserkennung gegen verspätete Worker-Ergebnisse.
- Erste Graph- und Kurvendarstellungen.

**Abnahme**

Ein Labyrinth lässt sich erstellen, lösen, abbrechen und nach erneutem Öffnen wiedergeben.

### Phase 2 - DNA, Dateien und erste produktive Ereignisse

Showcases: K07 + B01, K08, K09 und K15.

**Umfang**

- RustFS anbinden und Dateivertrag vollständig umsetzen.
- FASTA und zunächst begrenzte FASTQ-Importe.
- Format-, Größen-, Alphabet- und Prüfsummenprüfung.
- Ereignisse für verfügbare Datensatzversionen.
- Wiederholbare Importnachverarbeitung und Abgleich verwaister Dateien.
- Kompression, Suche, k-mer-Analyse und Skew.

**Abnahme**

Ein fehlgeschlagener Import wird nicht als nutzbarer Datensatz angezeigt. Wiederholung erzeugt keine versehentlich doppelte Freigabe. Berechnungen referenzieren geprüfte Dateien mit festen Versionen.

### Phase 3 - Constraints und Transaktionen

Showcases: K05, K06 und B02 zunächst exakt/greedy.

**Umfang**

- Gemeinsames CSP-Framework.
- Spring übernimmt verbindliche Buchungen.
- Konkurrenzexperimente mit Versionsprüfung und Isolation.
- Erster fachlicher Outbox-Verbraucher: wiederaufbaubare Katalogübersicht in Postgres.
- Motivprofile und kleine exakte Vergleichsfälle.

**Abnahme**

Zwei konkurrierende Buchungen ergeben ein nachvollziehbares Ergebnis ohne Doppelbelegung. Die Katalogübersicht lässt sich neu aufbauen und erreicht nach einem Verbraucherausfall den aktuellen Stand.

### Phase 4a - Graphgrundlagen

Showcases: K10 und K11.

**Umfang**

- Gerichtete/ungerichtete Graphen, Gewichte und stabile Identitäten.
- Wiederverwendbare Graphansicht.
- BFS, Dijkstra und Prim auf versionierten Graphen.
- Zunächst ausschließlich Postgres und Python.

**Abnahme**

Bekannte Referenzgraphen liefern korrekte Wege und Spannbäume. Ladezeit und Algorithmuszeit werden getrennt gemessen.

### Phase 4b - Biologische Graphmodelle

Showcases: B03 und B06.

**Umfang**

- Multikanten und Kantenmultiplizitäten.
- Assembly zunächst mit idealen k-mer-Eingaben.
- Contigs als anschließende Erweiterung.
- Blockfolgen, Reversals und Breakpoint-Graphen.
- Noch keine zusätzliche Graphdatenbank erforderlich.

**Abnahme**

Assembly berücksichtigt jede k-mer-Instanz. Für 2-Break-Verfahren werden die unterstützten Modellannahmen geprüft.

### Phase 4c - Graphprojektionen und Speichervergleich

**Umfang**

- AGE-Projektion für ausgewählte Graphen.
- Danach optional Neo4j als Vergleich.
- Vorhandene Outbox für Aufbau, Änderung und Löschung nutzen.
- Projektionsstände, Wiederholungen und vollständigen Neuaufbau anzeigen.
- Versionsschutz gegen verspätete Ereignisse.

**Abnahme**

Ein Zielspeicherausfall verliert keine führenden Daten. Nach Wiederanlauf holt die Projektion auf. Ein vollständiger Neuaufbau erzeugt denselben fachlichen Graphstand.

### Phase 5 - Dynamische Programmierung und Spielbäume

Showcases: K13, B05 und K12.

**Umfang**

- Gemeinsame Matrix- und Traceback-Darstellung.
- Rucksackproblem, LCS, Edit-Distanz und Alignment.
- Anschließend affine Lücken und Speichervergleich.
- Minimax und Alpha-Beta mit sichtbaren Teilbäumen.

**Abnahme**

Rekonstruierte Lösungen ergeben den gemeldeten Score. Spielzüge werden atomar und wiederholungssicher angenommen.

### Phase 6 - Suchräume und Optimierung

Showcases: K14, K16, B02 randomisiert und B04.

**Umfang**

- Exakte Enumeration, genetische Verfahren und randomisierte Motivsuche.
- Peptidsequenzierung mit Abschneiden und Leaderboard.
- Experimentserien und Checkpoints über den bestehenden Dateivertrag.
- Vergleich von Laufzeit und Ergebnisqualität über mehrere Starts.

**Abnahme**

Kleine Instanzen werden gegen exakte Lösungen geprüft. Unterbrechung und Wiederaufnahme sind für ausgewählte längere Verfahren nachgewiesen.

### Phase 7 - Cluster, Vektoren und Bäume

Showcases: K17 + B08; anschließend B07.

**Umfang**

- Expressionsmatriximport und versionierte Transformationen.
- K-Means, Initialisierung, Soft Clustering und Hierarchien.
- pgvector, danach Qdrant über bestehende Projektionsmechanismen.
- Distanzmatrizen und phylogenetische Rekonstruktion.

**Abnahme**

Jeder Merkmalsvektor verweist auf Daten- und Transformationsversion. Suchvergleiche verwenden denselben Vektorbestand. Additive Testmatrizen lassen sich korrekt rekonstruieren.

### Phase 8 - Dokument- und Sequenzindizes

Showcases: K19 und B09.

**Umfang**

- Postgres-Volltextsuche und OpenSearch-Projektion.
- Trie, Suffixstrukturen, BWT und FM-Suche.
- Indexmanifeste mit Prüfsummen und Referenzversion.
- Neue Indizes im Hintergrund bauen und erst nach Prüfung freigeben.
- Seed-and-Extend zunächst mit Substitutionen; Indels über Alignment ergänzen.

**Abnahme**

Exakte Sequenztreffer stimmen mit naiver Suche überein. Referenz und Index passen zwingend zusammen. Ein fehlgeschlagener Indexbau verdrängt keinen funktionsfähigen Stand.

### Phase 9 - Lernen und Evidenz

Showcases: K18, B10 und B11.

**Umfang**

- Neuronales Netz, HMM-Inferenz und Parameterschätzung.
- Versionierte Trainingsdaten und Modelle.
- Spektral-DP und Peptididentifikation.
- Definiertes Target-Decoy-Experiment.
- Profil-HMMs und Modifikationsalignment als Vertiefungen.

**Abnahme**

Kleine HMMs werden durch Enumeration geprüft. Trainings- und Suchraumversionen sind nachvollziehbar. Score, Gesamtwahrscheinlichkeit und geschätzte Fehlerrate werden passend zum jeweiligen Modell dargestellt.

### Phase 10 - Übergreifende Abnahme

**Umfang**

- Gemeinsame Vergleichsansichten und Dokumentation.
- Ressourcenmessung und verbindliche Eingabegrenzen.
- Wiederherstellung von Postgres und RustFS.
- Neuaufbau ausgewählter Graph-, Vektor- und Suchprojektionen.
- Noch offene Vertiefungen nach Priorität.

**Abnahme**

Alle geplanten Showcases sind über denselben Katalog nutzbar. Wiederherstellung und Projektionsaufbau wurden praktisch geprüft.

## 7. Bioinformatik-Konventionen

Diese Festlegungen entstehen mit den Verträgen und werden spätestens vor Phase 2 umgesetzt:

- Intern nullbasierte Koordinaten und halboffene Intervalle.
- Explizite Konvertierung abweichender Import-/Exportformate.
- Eindeutige Abbildung von Strang und Orientierung auf Referenzkoordinaten.
- Definierter Umgang mit mehrdeutigen Basen wie N.
- Versionierte Codon-, Massen- und Substitutionsmatrizen.
- Dokumentierte Gleichstandsregeln und Lückenkonventionen.
- Erhalt von Multiplizitäten bei Reads und Spektren.
- Explizite Annahmen für Genomumlagerungen und phylogenetische Verfahren.

Die Ergebnisse werden entsprechend dem Modell bezeichnet: Kandidatenregion, gefundene Heuristiklösung, Alignment oder geschätzte Fehlerrate.

## 8. Wiederverwendbare Visualisierung und TypeScript

Gemeinsame React-Bausteine:

- Sequenzansicht mit Markierungen und Koordinaten
- Graphansicht einschließlich Multikanten und Bäumen
- Matrixansicht für DP, Profile, Distanzen und Expression
- Suchbaum mit verworfenen Kandidaten
- Kurven für Fitness, Fehler, Skew und Scores
- Versions- und Projektionsstatus

TypeScript-Portierungen beginnen mit Fibonacci, Hanoi, Labyrinthsuche, Hamming-Distanz, reversem Komplement und kleinen Alignments. Aufwendigere lokale Berechnungen laufen in Web Workern. Gemeinsame Testdaten prüfen die fachliche Übereinstimmung. Für identische randomisierte Abläufe werden Startzustände oder Zufallsentscheidungen vorgegeben.

## 9. Qualitätskriterien und Meilensteine

Ein Showcase ist fertig, wenn:

- Referenzfälle, Randfälle und zentrale Invarianten geprüft sind.
- Visualisierung und tatsächliche Berechnung übereinstimmen.
- Eingaben, Versionen und Messbedingungen nachvollziehbar sind.
- Abbruch, Zeitlimit und Fehler verständlich behandelt werden.
- Das Speicherexperiment einen konkreten Trade-off sichtbar macht.

Algorithmusmesswerte werden in Postgres ausgewertet. HTTP-/JVM-Metriken und Traces nutzen die Plattform.

| Meilenstein | Erreicht nach |
| --- | --- |
| M1 – Nutzbare Visualisierungsplattform | Phase 1 |
| M2 – Zuverlässige Dateien und erste Bioinformatik | Phase 2 |
| M3 – Fachliche Zusammenarbeit von Python und Spring | Phase 3 |
| M4 – Graphalgorithmen mit wiederaufbaubaren Projektionen | Phase 4c |
| M5 – Suche, Graphen und dynamische Programmierung vollständig verbunden | Phase 6 |
| M6 – Vektoren, Bäume und versionierte Indizes | Phase 8 |
| M7 – Erweiterter Gesamtkatalog und Betriebsabnahme | Phase 10 |

Die Phasen sind fachliche Lieferabschnitte unterschiedlicher Größe. Eine zeitliche Schätzung erfolgt auf Ebene der einzelnen Showcases und Infrastrukturaufgaben.

## 10. Konkretisierung des Techstacks

Die folgenden Empfehlungen ergänzen die Architektur und Umsetzungsreihenfolge des Plans. Sie unterscheiden den Einstieg von späteren Erweiterungen. Python bleibt der hauptsächliche Implementierungsort der Lernalgorithmen; Spring übernimmt transaktionale Fachlogik und Datenverarbeitung.

### 10.1 React und TypeScript

Das Frontend wird als React-Anwendung mit TypeScript und Vite gebaut. Der Reverse Proxy liefert die erzeugten statischen Dateien aus. Szenarioeditoren, Replay und Vergleichsansichten stehen im Vordergrund; serverseitiges Rendering ist für den Einstieg nicht erforderlich.

| Aufgabe | Empfehlung | Verwendung im Algorithm Lab |
| --- | --- | --- |
| Build und Entwicklung | React, TypeScript, Vite | Gemeinsame Laboroberfläche als Single-Page-Anwendung |
| Navigation | React Router | Verlinkbare Ansichten für Katalog, Showcase, Datensatzversion und Ausführung |
| Serverdaten | TanStack Query | Laden, Caching, Mutationen und Polling des Ausführungsfortschritts |
| Lokaler Zustand | Zustand | Editorzustand, ausgewählter Schritt, Wiedergabegeschwindigkeit und Markierungen |
| Formulare | React Hook Form und Zod | Algorithmusparameter, Scoring-Einstellungen und clientseitige Eingabeprüfung |
| UI-Komponenten | MUI / Material UI | Formulare, Dialoge, Tabs und Navigation |
| API-Verträge | openapi-typescript und openapi-fetch | Generierte TypeScript-Typen und typisierte Clients für beide APIs |
| Lokale Berechnung | Web Workers; optional Comlink | TypeScript-Algorithmen ohne Blockierung der Oberfläche |
| Große Listen und Sequenzen | TanStack Virtual, bei Bedarf Canvas | Sichtbare Ausschnitte großer Datenbestände darstellen |

TanStack Query hält die vom Server stammenden Daten einschließlich Auftragsstatus. Zustand verwaltet den lokalen Bedienzustand. Die API-Eingabeprüfung bleibt unabhängig von der clientseitigen Validierung verbindlich.

### 10.2 Visualisierung und Replay

| Darstellung | Empfehlung | Beispiele |
| --- | --- | --- |
| Graphen und Bäume | Cytoscape.js | Zustandsgraphen, Dijkstra, Spannbäume, Suchbäume und de-Bruijn-Multigraphen |
| Kurven und numerische Vergleiche | Apache ECharts | Laufzeit, Fitness, Fehler, Skew, Scores und Scatterplots |
| Heatmaps | Apache ECharts; interaktive kleine Matrizen als eigene Komponenten | Expression, Distanzen und Profile |
| Ansichten mit spezieller Interaktion | Eigene React-/SVG-Komponenten | Labyrinth, Hanoi, Sequenzmarkierungen und DP-Traceback |
| Große dichte Darstellungen | Canvas nach Bedarf | Sequenzen oder Matrizen mit vielen sichtbaren Elementen |

Cytoscape.js wird in eine eigene React-Komponente gekapselt. Gerichtete Kanten, Schleifen und Multikanten müssen im gemeinsamen Graphmodell explizit erhalten bleiben.

Die Wiedergabe basiert auf versionierten Ereignissen der tatsächlichen Berechnung, beispielsweise „Knoten besucht“, „Distanz verbessert“ oder „Matrixzelle berechnet“. Eine gemeinsame Wiedergabesteuerung bedient Start, Pause, Einzelschritt, Geschwindigkeit und Replay.

Die Pause eines Replays ist von der Pause einer laufenden Berechnung zu unterscheiden. Berechnungspausen, Abbruch und Wiederaufnahme benötigen eigene Prüfpunkte beziehungsweise Checkpoints im Algorithmus. Große Läufe begrenzen oder aggregieren Ereignisse; vollständige Traces sind ein eigener Ausführungsmodus.

### 10.3 FastAPI und Python-Infrastruktur

| Aufgabe | Empfehlung | Verwendung |
| --- | --- | --- |
| HTTP-API und Validierung | FastAPI und Pydantic | Eingaben prüfen, Aufträge starten, Status und Ergebnisse ausliefern |
| HTTP-Server | Uvicorn | FastAPI betreiben |
| Konfiguration | pydantic-settings | Umgebungsabhängige Einstellungen und Verbindungsparameter |
| PostgreSQL-Zugriff | SQLAlchemy und psycopg 3 | Ausführungen, Schritte, Checkpoints und Ergebnisse |
| Migrationen | Alembic | Ausschließlich die von Python verantworteten Tabellen |
| Interne HTTP-Aufrufe | HTTPX | Spring-Schnittstellen für Katalog und Artefakte aufrufen |
| Objektspeicher | boto3 | RustFS über dessen S3-kompatible Schnittstelle anbinden |
| Tests | pytest und Hypothesis | Referenzfälle, Randfälle und algorithmische Invarianten |
| Codequalität | Ruff und mypy | Formatierung, Linting und statische Typprüfung |

FastAPI und Worker verwenden dasselbe eigenständige Algorithmuspaket. Der Algorithmuskern kennt keine HTTP-Routen, Datenbanksessions oder S3-Clients. Er arbeitet mit fachlichen Eingaben und liefert Ergebnisse sowie optionale Schritt-Ereignisse. Adapter übernehmen Persistenz, Transport und Artefaktzugriff.

Für Auftragsreservierung und spezielle PostgreSQL-Abfragen werden SQLAlchemy Core beziehungsweise explizite SQL-Anweisungen eingesetzt. CPU-intensive Berechnungen laufen in separaten Worker-Prozessen.

### 10.4 Dauerhafte Aufträge und Python-Worker

Der Einstieg verwendet die im Plan vorgesehenen PostgreSQL-Aufträge. Eine eigene, kleine Worker-Schleife reserviert und verarbeitet sie. Ein zusätzlicher Broker wird dafür zunächst nicht eingeführt.

1. FastAPI prüft die Anfrage und speichert den Auftrag mit unveränderlichen Eingabereferenzen, Parametern und gegebenenfalls Seed.
2. Ein Worker reserviert einen Auftrag in einer kurzen Transaktion, beispielsweise mit `SELECT ... FOR UPDATE SKIP LOCKED`.
3. Eine zeitlich begrenzte Reservierung und Heartbeats machen ausgefallene Worker erkennbar. Während der Berechnung bleibt keine lange Reservierungstransaktion offen.
4. Eine Versuchskennung schützt vor verspäteten Fortschrittsmeldungen und Ergebnissen eines früheren Versuchs.
5. Fortschritt, Abbruchwunsch und Checkpoints werden an definierten Prüfpunkten behandelt.
6. Ergebnis, Messwerte und Artefaktreferenzen werden dauerhaft gespeichert; nach einem Ausfall kann ein neuer Versuch gestartet werden.

Die Reservierung, Wiederholung und Versuchserkennung sind Anwendungslogik und müssen durch Ausfall- und Konkurrenztests abgesichert werden. Reproduzierbarer Neustart und Fortsetzung ab Checkpoint sind unterschiedliche Fähigkeiten; Fortsetzung wird nur für dafür vorbereitete Algorithmen angeboten.

FastAPI-`BackgroundTasks` übernimmt keine dauerhaften Algorithmusaufträge. Celery wäre eine spätere Alternative bei größerem Bedarf an verteilter Auftragssteuerung; seine Einführung würde den Ausführungs- und Infrastrukturentwurf erweitern und gehört nicht zum Einstieg.

### 10.5 Numerik, Graphen und Bioinformatik

| Bibliothek | Rolle | Einführung |
| --- | --- | --- |
| NumPy | Matrizen, numerische Daten und reproduzierbare Zufallszahlengeneratoren | Wenn die ersten numerischen beziehungsweise Matrixmodule sie benötigen |
| SciPy | Numerische Hilfsverfahren und unabhängige Vergleichsergebnisse | Mit passenden fortgeschrittenen Modulen |
| NetworkX | Vergleichsergebnisse und Hilfswerkzeuge für Graphen | Erste Graphvergleiche; spätestens Phase 4a |
| Biopython, insbesondere Bio.SeqIO | FASTA-/FASTQ-Verarbeitung und biologische Formate | Phase 2 |
| scikit-learn | Vergleich für K-Means, Vorverarbeitung und Clustering | Phase 7 |
| PyTorch | Vergleich zum selbst implementierten neuronalen Netz | Optional in Phase 9 |

Die Lernalgorithmen werden selbst implementiert, damit ihre Schritte sichtbar und erklärbar bleiben. Bibliotheken übernehmen unterstützende Funktionen und dienen als unabhängige Referenz. Beispielsweise wird das Ergebnis der eigenen Dijkstra-Implementierung gegen NetworkX geprüft; eine eigene K-Means-Implementierung wird unter passenden Vergleichsbedingungen gegen scikit-learn ausgewertet.

Biopython unterstützt das Einlesen von Sequenzformaten. Fachliche Regeln wie zulässige Alphabete, Mehrdeutigkeiten, Größenlimits, Koordinaten und Datensatzfreigabe werden zusätzlich gemäß Abschnitt 7 geprüft.

Vergleichsverfahren müssen dieselben Modellannahmen, Distanzmaße, Scoringregeln und Eingaben verwenden. Die Bibliotheksausführung ersetzt den instrumentierten Lernalgorithmus nicht.

### 10.6 Kotlin und Spring Boot

| Aufgabe | Empfehlung | Verwendung |
| --- | --- | --- |
| Sprache und Framework | Kotlin und Spring Boot | Fachlicher Datendienst |
| REST-API | Spring Web MVC | Katalog, Versionen, Importe, Artefakte und Buchungen |
| Eingabeprüfung | Jakarta Bean Validation | Serverseitige Prüfung fachlicher API-Eingaben |
| PostgreSQL-Zugriff | Spring JDBC mit JdbcClient | Explizites SQL für Katalog, Buchungen, Outbox und Projektionen |
| Transaktionen | Spring Transactions, insbesondere `@Transactional` | Fachänderung und Outbox-Ereignis gemeinsam speichern |
| Migrationen | Flyway | Ausschließlich die von Spring verantworteten Tabellen |
| OpenAPI | springdoc-openapi | API-Dokumentation und Grundlage für Frontend-Clienttypen |
| Objektspeicher | AWS SDK for Java v2, S3-Client | RustFS, Artefaktmetadaten und Uploadabläufe |
| Betrieb und Metriken | Spring Boot Actuator und Micrometer | Zustandsprüfungen und Plattformmetriken |
| Tests | JUnit 5 und Testcontainers | Transaktionen, Konkurrenz, Datenbankzugriffe und Integrationen |
| Größere Importserien | Spring Batch | Spätere wiederholbare Batch-Verarbeitung |

JdbcClient ist der empfohlene Einstieg: SQL, Sperren, Indizes, JSONB und Transaktionen bleiben direkt nachvollziehbar. Das passt zu den Datenexperimenten des Labs.

jOOQ ist eine spätere Alternative, wenn komplexere Abfragen und generierte typsichere Tabellenzugriffe den zusätzlichen Build-Aufwand rechtfertigen. Es wird nicht parallel zu JdbcClient als weitere Standardschicht eingeführt.

Die Spring-Outbox verwendet zunächst eine eigene PostgreSQL-Tabelle und einen Dispatcher. Dieser kann zeitgesteuert laufen. Er benötigt sichtbare Versuche, Wiederholungszeitpunkte und Fehler sowie idempotente Verbraucher. Ein Scheduler allein stellt keine dauerhafte Zustellung sicher; dafür sind die gespeicherten Outbox-Zustände und Verarbeitungsregeln maßgeblich.

### 10.7 Schnittstellen und Datenverantwortung

| Datenbereich | Schreibverantwortung | Migrationen |
| --- | --- | --- |
| Szenarien, Katalog, Datensatzversionen und Artefaktmetadaten | Spring | Flyway |
| Importe, Buchungen, Outbox und Projektionsstände | Spring | Flyway |
| Ausführungsaufträge, Schritte, Checkpoints und Ergebnisse | Python | Alembic |
| Große Dateien, Replays, Indizes und Modelle | Zuständiger Prozess gemäß Artefaktvertrag; Freigabe durch Spring | Dateiformate und Metadaten versionieren |

Zum Einstieg wird eine PostgreSQL-Ressource mit getrennten Schemas verwendet. Flyway und Alembic verwalten ausschließlich ihre jeweiligen Tabellen und Migrationstabellen. Der Worker schreibt keine Spring-Katalogtabellen direkt.

Beide APIs veröffentlichen eigene OpenAPI-Beschreibungen. Daraus werden getrennte TypeScript-Clienttypen generiert. Gemeinsame Konventionen betreffen Fehlerformate, IDs, Versionsreferenzen, Zeitangaben und Ereignisschemata; fachliche Vertragstests sichern das Zusammenspiel.

Ein typischer Ablauf:

1. React lädt eine unveränderliche Szenarioversion über `/api/data`.
2. React startet eine Ausführung mit Versionsreferenzen, Parametern und Seed über `/api/algorithms`.
3. Der Python-Worker berechnet Ergebnis und Schrittfolge.
4. React fragt den Fortschritt per Polling ab und steuert die Wiedergabe.
5. Größere Dateien werden nach Einführung von RustFS über den gemeinsamen Artefaktvertrag hochgeladen und geprüft.
6. Spring gibt geprüfte Artefakte frei und erzeugt gegebenenfalls fachliche Outbox-Ereignisse für nachgelagerte Projektionen.

### 10.8 Deployment und Observability

Nginx ist eine geeignete erste Wahl für den Webserver und Reverse Proxy. Er liefert das Vite-Build aus und leitet `/api/algorithms` an FastAPI sowie `/api/data` an Spring weiter. Der Python-Worker benötigt keinen öffentlichen Endpunkt.

Die vier Anwendungskomponenten bleiben getrennt deploybar:

- Webserver mit statischem React-Build
- FastAPI
- Python-Worker
- Spring Boot

PostgreSQL und spätere zusätzliche Speicher sind ergänzende Infrastrukturressourcen. Ein späterer Spring-Batch-Prozess kann als fünfte Anwendungskomponente hinzukommen.

Algorithmische Messwerte werden mit Eingabeversionen, Implementierungsversion und Messbedingungen in PostgreSQL gespeichert. HTTP-/JVM-Metriken sowie Traces verwenden die bestehende Plattform. Spring liefert Zustandsprüfungen und Metriken über Actuator und Micrometer; Python kann über OpenTelemetry instrumentiert werden. API-Aufrufe und Worker-Ausführungen müssen über Ausführungs-ID und Trace-Kontext zuordenbar sein.

### 10.9 Einführung entlang der Projektphasen

| Phase | Technische Ergänzungen |
| --- | --- |
| 0 – Fundament | React/Vite, Router, MUI, API-Clients, FastAPI/Pydantic, SQLAlchemy/psycopg, Alembic, Spring MVC/JdbcClient, Flyway, PostgreSQL, Reverse Proxy, Outbox-Grundlage und grundlegende Telemetrie |
| 1 – Ausführung sichtbar machen | Dauerhafte Worker-Reservierung, TanStack Query für Polling, Zustand für Replay, erste Cytoscape.js- und ECharts-Ansichten sowie eigene SVG-Komponenten |
| 2 – DNA und Dateien | RustFS, boto3, Java-S3-Client, Biopython und vollständiger Artefaktablauf |
| 3 – Constraints und Transaktionen | Konkurrenz- und Isolationstests, erster fachlicher Projektionsverbraucher und bei Bedarf Batch-Importverarbeitung |
| 4a/4b – Graphen | Gemeinsames Graphmodell einschließlich Multikanten und NetworkX-Vergleiche |
| 4c – Graphprojektionen | AGE, danach optional Neo4j; Anbindung über bestehende Outbox und Projektionsverträge |
| 5/6 – DP und Optimierung | Matrix-/Traceback-Komponenten, numerische Hilfen nach Bedarf, Experimentserien und Checkpoints |
| 7 – Cluster und Vektoren | scikit-learn-Vergleiche, passende SciPy-Verfahren, pgvector und danach Qdrant |
| 8 – Indizes | OpenSearch-Anbindung, Indexmanifeste und Hintergrundaufbau |
| 9 – Lernen und Evidenz | Optional PyTorch als Vergleich, versionierte Trainings- und Modellartefakte |
| 10 – Abnahme | Wiederherstellung, Wiederaufbau und übergreifende Ressourcenmessung |

### 10.10 Empfohlener Einstieg

Der erste nutzbare Stand kombiniert React/Vite mit MUI, TanStack Query und Zustand; FastAPI mit SQLAlchemy, psycopg und Alembic; einen separaten PostgreSQL-Worker; Spring MVC mit JdbcClient und Flyway; PostgreSQL und Nginx.

Cytoscape.js, ECharts und eigene React-/SVG-Komponenten decken die ersten Visualisierungen ab. Weitere wissenschaftliche Bibliotheken und zusätzliche Speicher werden erst mit den jeweiligen Showcases ergänzt.

