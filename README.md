# MOMoT MCP — Headless REST Runner & Model Context Protocol Platform

[![Project Page](https://img.shields.io/badge/docs-GitHub%20Pages-blue)](https://jku-win-se.github.io/MOMoT-MCP/)
[![License](https://img.shields.io/badge/license-MIT%2FEPL-green.svg)](#)

MOMoT-MCP combines model transformation (EMF/Henshin) with search-based optimization to solve complex model-driven engineering tasks. This repository hosts the container-first, headless distribution of MOMoT, featuring a robust **Model Context Protocol (MCP)** server and automated agent pipelines designed specifically for LLM-driven optimization and synthesis.

**Project Documentation & Guides:** https://jku-win-se.github.io/MOMoT-MCP/

---

## Key Capabilities

- **Docker REST Server:** Fast zip-in / zip-out job execution (`POST /run`) to compile and solve scripts without any Eclipse IDE dependencies.
- **Model Context Protocol (MCP) Server:** Stdio JSON-RPC bridge that allows LLM agents (like Cursor, Claude, etc.) to perform artifact generation, run local validations, and launch Docker-backed optimization jobs.
- **Smart Agent Coordinator System:** Autonomous human-in-the-loop (HITL) workflow that enables agents to generate metamodels, create instance profiles, write Henshin rules, compose MOMoT scripts, and repair compile/logic errors iteratively.
- **Local CLI Validators:** Lightweight Node-based wrappers for Henshin, MOMoT, Ecore, and XMI that validate files instantly without starting Docker.
- **E2E Test & Benchmark Suite:** Five verified multi-objective benchmarks (T01–T05) with expected Pareto fronts for regression and verification checks.

> ℹ️ **Looking for the Eclipse IDE plugin?** If you need the full Eclipse update site, UI plugins, or the full set of graphical wizards, please visit the parent repository at [jku-win-se/MOMoT2](https://github.com/jku-win-se/MOMoT2).

---

## Zero-Dependency Docker-Only Setup

This workbench is designed to run with **zero local dependencies**. You do **not** need to install Java, EMF, or Python on your host machine. 

- **Docker Desktop** is the only runtime dependency.
- All CLI validators (`henshin-validator`, `momot-validator`, `ecore-validator`, and `xmi-validator`) automatically detect if local Java is missing and seamlessly delegate compile, check, and execution tasks to lightweight Docker containers running `eclipse-temurin:21-jdk` or `maven:3.9-eclipse-temurin-21`.
- All LLM-driven optimization tasks are executed securely via the containerized headless MOMoT REST runner.

---

## Quick Start

### 1. Cold-Start Setup (No Host Dependencies — Recommended)

This repository utilizes ES Modules (ESM) which run directly in Node.js, so **no `npm build` or build steps are required** for the JS/TS code!

To run the entire platform with zero local host dependencies (no local Java, Maven, or libraries needed), we recommend using our pre-built, production-ready images published directly to the **GitHub Container Registry (`ghcr.io`)** (view packages page at **[hadiDHD's Public MOMoT-MCP Packages](https://github.com/hadiDHD?tab=packages&repo_name=MOMoT-MCP)**) for instant setup:

#### A. Run the Headless REST Runner (Docker Registry)
```bash
docker run --rm -p 8080:8080 ghcr.io/hadidhd/momot-headless:latest
```
* **Health Check:** `http://localhost:8080/health` (Returns `{"status": "UP", "health": {"ok": true}}` when ready)
* **Interactive API Docs (Swagger UI):** `http://localhost:8080/docs`

#### B. Run the MCP Server (Docker Registry, includes pre-built validators)
To run the pre-built, fully self-contained MCP server that contains all 4 validators pre-compiled:
```bash
docker run --rm -i ghcr.io/hadidhd/momot-mcp:latest
```

---

### 🛠️ Alternative: Build Images Locally (Takes ~3–5 Minutes)

If you prefer to build the images from source locally:

#### A. Build and Run the REST Headless Runner
```bash
git clone https://github.com/jku-win-se/MOMoT-MCP.git
cd MOMoT-MCP
docker build -t momot-headless -f Dockerfile .
docker run --rm -p 8080:8080 momot-headless
```

#### B. Build and Run the MCP Server
```bash
docker build -t momot-mcp -f mcp/Dockerfile .
docker run --rm -i momot-mcp
```

---

### 2. Local Host Setup (Optional)

If you prefer to run the MCP server and validators directly on your host machine (requires JDK 17+ or JDK 21+):

#### A. Setup and Run the MCP Server
```bash
cd mcp
npm install
node server.js
```

#### B. Pre-Build Local Host Validators (Optional)
On first run, the Node-based CLI validators will automatically compile their corresponding Java components if they are not already compiled. To pre-build all of them at once on your host machine:
```bash
node tools/henshin-validator/validate.mjs --setup
node tools/momot-validator/validate.mjs --setup
node tools/ecore-validator/validate.mjs --setup
node tools/xmi-validator/validate.mjs --setup
```

The MCP server connects via stdio JSON-RPC transport and translates LLM agent tool calls into automated local validations and containerized optimization runs.

---

## 🗺️ Cold-Start Bootstrap & Replication Guide (`cold-start-bootstrap` branch)

This branch contains **no pre-existing data or reference files**. It is designed specifically for academic replication of the cold-start bootstrap scenario (as described in our paper) where all modeling artifacts are synthesized completely from scratch using natural language.

---

### 🚀 Autonomous Replication Procedure

You can instruct any LLM agent (e.g., Claude, Gemini) connected to this workspace via MCP to execute the reproduction steps below. No local Java, EMF, or Python are required, as all setups and validations automatically run on Docker.

#### Step 1: Start the Docker Headless Runner & MCP Server
Before launching the agent, make sure the Docker headless runner and the MCP stdio server are running:
```bash
# 1. Start the headless resting runner
docker build -t momot-headless -f Dockerfile.headless .
docker run --rm -p 8080:8080 momot-headless

# 2. Start the MCP server (on stdio)
cd mcp
npm install
node server.js
```

#### Step 2: Ingest the Domain Natural Language Specifications

Provide the following natural language specifications to the **Coordinator Agent** (or let individual agents synthesize them sequentially) to bootstrap the Class-Responsibility Assignment (CRA) workbench:

##### 1. Ecore Metamodel (Gate 1)
Synthesize `benchmark/model/cra.ecore` using these requirements:
- **ClassModel (Root Container):** Represents the system. Has a required `name` (EString) attribute and containment references to `classes` [0..*] and `features` [0..*].
- **Class:** Represents a class. Has a required `name` (EString) and a bi-directional non-containment reference `encapsulates` [1..*] pointing to Feature (opposite: `isEncapsulatedBy`).
- **Feature (Abstract):** Superclass of attributes and methods. Has a required `name` (EString) and a bi-directional non-containment reference `isEncapsulatedBy` [0..1] pointing to Class (opposite: `encapsulates`).
- **Attribute (extends Feature):** A structural data field.
- **Method (extends Feature):** An executable behavioral element with non-containment references `dataAccess` [0..*] pointing to Attributes, and `methodCall` [0..*] pointing to other Methods.

##### 2. Initial Model Instance (Gate 2)
Synthesize `benchmark/model/cra_input.xmi` conforming to `cra.ecore`:
- **Attributes:** A1, A2, A3, A4, A5 (all initially unassigned).
- **Methods:** M1, M2, M3, M4 (all initially unassigned).
- **Dependencies (Coupling):**
  - Method **M1** accesses Attribute **A1** and Attribute **A2**.
  - Method **M2** accesses Attribute **A2** and Attribute **A3**.
  - Method **M3** accesses Attribute **A3** and Attribute **A4**.
  - Method **M4** accesses Attribute **A4** and Attribute **A5**.
  - Method **M1** calls Method **M2**.
  - Method **M2** calls Method **M3**.
  - Method **M3** calls Method **M4**.

##### 3. Henshin Mutation Rules (Gate 3)
Synthesize `benchmark/model/cra.henshin` with the following mutation rules:
- **`createClass`**: Creates a new Class and assigns an unassigned Feature to it. Has a NAC preventing matching if the Feature is already encapsulated.
- **`deleteClass`**: Deletes an empty Class (a Class with no encapsulated features).
- **`assignFeature`**: Moves a Feature from one Class to another, or assigns an unassigned Feature to it.

##### 4. MOMoT Script & OCL Objectives (Gate 4)
Synthesize `benchmark/src/cra_solve.momot` to configure the NSGA-II algorithm:
- **Configuration:** NSGA-II with population size 200, max evaluations 50,000, and a solution sequence horizon of 12 steps.
- **Objectives:**
  - **Maximize CRA Index:** Sum of cohesion of all classes minus the sum of coupling between distinct classes.
    - **Cohesion:** Sum of dataAccesses and methodCalls between features inside a class, normalized by dividing by $|F_c| \times (|F_c| - 1)$ (with a guard returning 0.0 if $|F_c| \le 1$).
    - **Coupling:** Sum of dataAccesses and methodCalls between features in distinct classes, normalized by dividing by $2 \times |F_{c1}| \times |F_{c2}|$.
  - **Minimize Solution Length:** Minimize the transformation sequence path.

#### Step 3: Run Validation & Execution
Once the files are synthesized, let the coordinator validate each artifact (Tier 1 structure, semantic, and apply dry-run) and launch the MOMoT execution (Tier 2). At the end of the run, the coordinator will parse the final Pareto front (Tier 3) demonstrating convergence to the global optimum of **CRA Index = +0.85** with exactly 3 classes.

---

---

## MCP Tool Surface

MOMoT-MCP exposes 12 highly specialized tools to LLM agents:

| Tool Name | Description |
|-----------|-------------|
| `detect_artifacts` | Scans workspace and user prompts, outputting an ordered Generation Plan. |
| `generate_ecore` | Creates structurally and semantically valid `.ecore` metamodels. |
| `generate_xmi` | Creates valid initial `.xmi` model instances matching any Ecore metamodel. |
| `generate_henshin` | Generates valid `.henshin` transformation rules based on any Ecore metamodel. |
| `generate_momot` | Composes a declarative `.momot` search script wiring rules, models, and objectives. |
| `generate_java_helper` | Builds custom Java fitness modules for complex, non-OCL metrics. |
| `validate_ecore` | Semantically and structurally validates `.ecore` metamodels. |
| `validate_xmi` | Programmatically and semantically validates `.xmi` model instances. |
| `validate_henshin` | Structural, semantic, and dry-run execution validator for Henshin rules. |
| `validate_momot` | Structural, semantic, and compiler check validator for MOMoT scripts. |
| `validate_java_helper` | Verifies packages, structural signatures, and inheritance of custom Java helpers. |
| `execute_momot_job` | Compiles and executes a complete ZIP payload on the Docker REST runner. |

Refer to [mcp/README.md](mcp/README.md) for full JSON schemas and payload examples.

---

## Directory Layout

| Path | Description |
| --- | --- |
| `mcp/` | Model Context Protocol server (Node.js, stdio) |
| `docs/` | Comprehensive architectural wikis, playbooks, and runbooks (GitHub Pages) |
| `tools/` | CLI validators for `.henshin`, `.momot`, `.ecore`, and `.xmi` files |
| `test-suite/` | E2E benchmarks (T01-T05) with reference Pareto fronts |
| `plugins/` | Core MOMoT compiler, MOEA bridge, and headless runner modules |
| `headless/` | Headless runtime wrapper modules |
| `Dockerfile.headless` | Primary production REST headless Docker image |

---

## REST API Summary

| Endpoint | Method | Input | Output |
|---|---|---|---|
| `/health` | `GET` | None | `{ "status": "UP", "health": { "ok": true } }` |
| `/run?script=<path>` | `POST` | Raw Binary `application/zip` | Job completion zip package |

1. **Upload format:** Requests to `/run` must send the zip package as the raw binary request body.
2. **Script parameter:** The `script` query parameter must exactly match the relative path of the `.momot` script inside the uploaded zip.
3. **Response package:** Returns a zip containing the execution output directory (`out/`), compiler logs (`runner/runner.log`), and exit status (`runner/exit_code.txt`).

---

## Authors & Contributors

MOMoT is authored by Martin Fleck ([@martin-fleck](https://github.com/martin-fleck)), Javier Troya ([@javitroya](https://github.com/javitroya)), and Manuel Wimmer ([@manuelWimmer](https://github.com/manuelWimmer)).

The headless REST runner, MCP server, automated local validators, E2E benchmark harness, and the agent coordinator system on the **MOMoT-MCP** platform were developed by MohammadHadi Dehghani ([@hadiDHD](https://github.com/hadiDHD)).
