<div align="center">

<img src="../icon/file.png" width="140" alt="FCA icon — a fractal hexagon of components nested at every scale" />

# Fractal Component Architecture (FCA)

Fractal components nested at every scale, composing the software architecture. This document describes a way of thinking about software architecture, and a way of translating that thinking directly into a project's file layout — in any language.

</div>

---

# 1. 🎯 Purpose

The central claim is simple: **a software system is a tree of components**, and that tree should be visible, literally, in the directory structure. Not "the directories loosely reflect the architecture" — the directories *are* the architecture. Reading `ls -R` should be equivalent to reading a component diagram.

The name comes from the one property that makes this different from "component-based design" in general: the same small rule set — what a component is, how it relates to its children, when it becomes a folder, when a folder gets its own code — applies identically **at every depth**, from the whole program down to the smallest leaf. Zoom into any node of the tree and you find the same shape repeating. That self-similarity across scale is the defining property of a fractal, and it is the defining property of this architecture.

This document is deliberately **language-agnostic** in its first half: the vision, the tree, the rules for what becomes a file versus what becomes a folder, naming, dependency injection, error handling, and so on. The second half shows how to *materialize* each idea in specific languages — the concrete file layout, the native construct that plays the role of "a component," and the idioms each language already gives you for free.

## 1.1 🗿 The Underlying Philosophy: Software as a Construct

FCA is not primarily a filesystem convention with a rationale attached after the fact — the convention is a *consequence* of a specific way of thinking about what software is. Naming it explicitly makes the rest of this document easier to apply by intent rather than by rote:

> **Software is a hierarchical construct composed of components, where the filesystem provides a tangible representation of its architecture, and the source code provides the implementation of that structure.**

This is a shift away from treating software primarily as *code that executes*, and toward treating it as a *structure that exists* — one that happens to have an executable implementation. Two questions that are usually tangled together get split apart:

```text
STRUCTURE                        BEHAVIOR
"What exists?"                   "How does it work?"
folders, components,             classes, functions,
relationships                    logic
```

**Structure precedes implementation, the way a sculptor's plan precedes the carving.** The architecture is decided — the components, their names, their parent/child relationships — *before* a meaningful amount of code is written. At that point the system can already be discussed and reasoned about ("there is an API, it has routes; there is a database, it has tables; there is a SAP integration") even though nothing runs yet. Implementation then stops being the place where the shape of the system gets *discovered*, and becomes the place where a shape *already decided* gets *materialized*. This is why a good tree makes implementation feel mechanical rather than exploratory: the hard question ("what is this system?") has already been answered by the time the easier one ("how do I write this part?") comes up.

**The filesystem is the architecture language; the source code is the implementation language.** Historically a codebase's directory layout is treated as an afterthought of the code — organized *around* whatever the code turned out to need. FCA inverts that: the tree is authored first, as the architecture itself, and the code fills the shape the tree already declares. Two people who have never read a line of this project's code can still have an architectural conversation purely from `ls -R` — that is only possible because the tree is not a summary of the architecture, it *is* the architecture.

**A component's external boundary stays fixed while its internal composition grows.** This is the payoff of §3's "every component is born a folder": a leaf growing into a branch never renames or moves anything visible from outside — `api/` is still just `api/` whether it holds one entry point or an entire sub-tree of routes, serializers, and validators nested arbitrarily deep. Each folder is a boundary that can be zoomed into without ever destabilizing what sits above it, exactly like a car remains "the car" whether you're looking at it whole or looking inside its engine at the cooling subsystem. This hierarchical encapsulation — stable boundary, unlimited internal depth — is what makes the tree safe to grow for the lifetime of the project instead of needing periodic reorganization.

The cost of this is real and explicit, not hidden: more nesting, more folders, more clicks to reach a given file, in exchange for a boundary around every component that never needs renegotiating as the system grows. §15 and §17 return to this trade-off in concrete, checkable terms; this subsection just names the reasoning underneath it.

# 2. 🌲 The Project Is a Tree of Components

Zoom all the way out: the whole program is one tree. The root is the top-level component — the composition root (§7) that everything else ultimately gets built from. Every other component is a child of exactly one parent, and a child can have children of its own, as many levels deep as the software genuinely needs.

```text
Program
├── Actions                    ← child of Program
│   └── CreateRegistration     ← child of Actions
└── Api                        ← child of Program
    └── Routes                 ← child of Api
        └── Registration       ← child of Routes
```

A component's children are exactly the things that sit **one level directly beneath it on disk** — nothing more, nothing less. `Actions` is a child of `Program`; `CreateRegistration` is a child of `Actions`, not a child of `Program` directly, even though `Program` ultimately ends up depending on it (through `Actions`, in the composition root). **Depth in the tree is depth on disk. Always.**

This one rule is what makes the architecture readable without documentation: nobody needs a diagram maintained separately from the code, because the diagram *is* the directory tree, and it can never silently drift out of date — the moment a dependency changes, the file it lives in has to move too, or the rule has been broken.

> 🌳 **A component's home on disk is its position in the tree. If you can't answer "who is this component's parent" by looking at which folder it sits in, the tree has already stopped being trustworthy.**

## 2.1 📂 The Repo Root Is Not the Tree's Root

A repository holds more than the software: build configuration, tests, packaging scripts, dependency lockfiles, CI pipelines, generated output. None of that is the tree §2 describes — it is the **development level**, everything that exists to build, verify, package, and ship the software, sitting *around* it. The tree's actual root — the "Program" box at the top of §2's diagram, the composition root (§7) — is one specific folder inside the repo, named after the program itself, and nothing outside that folder is part of the architecture.

```text
myapp/                       ← repo root: the DEVELOPMENT level
├── myapp/                   ← the SOFTWARE itself: the tree's real root (§2's "Program")
│   ├── actions/
│   │   └── create_registration/
│   └── api/
│       └── routes/
├── tests/                   ← verifies the software; is not part of it
├── scripts/                 ← one-off maintenance/ops scripts, not application code
├── migrations/              ← schema history applied separately (by hand/CI); see §2.3 when the software runs them
├── dist/  build/            ← build output, always generated, never authored
├── package.json  requirements.txt  pyinstaller.spec   ← how to build/run it
└── Dockerfile  .gitlab-ci.yml  k8s/                    ← how to ship it
```

Everything at the repo root that is not the program's own folder answers "how is this built, tested, or shipped?" — never "what does this system do?". Mixing the two levels is what makes a repo root feel cluttered and, worse, makes `ls -R` at the top level lie about the architecture: a `tests/` or `dist/` folder sitting as a sibling of `actions/` and `api/` reads as if it were a child of the same "Program" node, when it is not part of the tree at all. Keeping the software confined to its own named folder is what lets §2's rule — *depth on disk is depth in the dependency graph* — stay true starting from the very first level, instead of needing an implicit "ignore these folders" carve-out.

> 📂 **If a file exists to build, test, or ship the software rather than to BE the software, it belongs at the repo root, outside the program's own folder — never mixed in as a sibling of a real component.**

## 2.2 🏗️ The Two Levels, Named

§2.1 draws the line between the repo root and the tree's real root; it's worth naming the two sides of that line explicitly, since every FCA project is organized across exactly these two levels, one nested inside the other, and never mixed:

```text
project/                    ← DEV LEVEL
├── requirements.txt
├── package.json
├── node_modules/
├── make
└── project/                ← SOFTWARE LEVEL (§2's "Program")
        └── ...
```

**The dev level** is the outer folder — the repo root itself. It holds everything that exists to *help build* the software, but is not the software: dependency manifests (`package.json`, `requirements.txt`), installed dependencies (`node_modules/`), build/task automation (`make`, `Makefile`, `Taskfile`), lockfiles, build output (`dist/`, `build/`), CI configuration, and any other tooling a developer needs to work on the project. None of it is ever part of the component tree — it exists *around* the software, not *as* the software.

**The software level** is the inner, program-named folder nested one level down — the tree's actual root, `Program` from §2. Everything the software *is* lives here, and only here: every component, every leaf, every branch, all the way down. This is the folder that answers "what does this system do?" — the dev level only ever answers "how do I build, install, or run it?"

The nesting itself is the signal: the software level sits *inside* the dev level, one level deep, precisely because the software is a thing the dev level exists to serve — never the reverse. A file that could just as easily sit beside `package.json` (a linter config, a `.env.example`, a CI workflow) has already told you which level it belongs to, regardless of what it's named.

> 🏗️ **Two levels, one nesting: the dev level surrounds the software, and the software level *is* the software. A file belongs to whichever question it answers — "how is this built?" places it outside; "what does this system do?" places it inside.**

## 2.3 🧭 Deciding the Level by Use: Worked Cases

§2.1 and §2.2 sort the obvious files. A few kinds of files sit in a gray zone: the same *kind* of thing can belong to either level depending on how the software uses it. The test is always the same — **does the running software read, execute or serve it?** If yes, it is part of the tree, as a component or as a resource of one. If it only helps someone build, check, migrate by hand or ship the software, it belongs to the dev level. The cases below come from a real FCA project (a FastAPI API plus a React app in one program folder), and each one is decided by that single question.

```text
project/
├── .env  .env.example          ← configuration supplied by whoever runs it (dev/deploy level)
├── package.json  requirements.txt  tsconfig.json  vite.config.ts  mypy.ini
├── icon.png                    ← source artwork the shipped icons were made from (not loaded at runtime)
├── tests/
│   └── scan_simulator/         ← dev tool: imports the software, receives its services
├── dist/                       ← build output
└── project/                    ← SOFTWARE
    ├── api/                    ← all the Python code; its entry point is the API's composition root
    │   ├── database/
    │   │   └── migrator/       ← runs `upgrade head` when the API starts…
    │   │       └── migrations/ ← …so the migration scripts are its child (runtime resource)
    │   └── user_data_directory/   ← where runtime data goes (outside the repo)
    └── app/                    ← all the TypeScript code; index.tsx is the app's composition root
        ├── index.html  public/  styles.css   ← served by the software: resources of the app component
        └── ...
```

- **Migrations.** If the software applies them itself at runtime (e.g. the API runs `upgrade head` on start-up), they are part of the running architecture: they live inside the software, as a child of the component that runs them (`database/migrator/migrations/`), right where the dependency is. If they are applied separately — by hand, by a CI job, by an ops tool — they are a dev-level concern and go to `migrations/` at the repo root, as in §2.1's diagram. The scripts are identical in both cases; only *who runs them* decides the level.
- **Files a framework requires inside a resource folder.** A migration tool's environment script and revision template (`env.py`, `script.py.mako`) are not behavioral units, but the tool insists on finding them next to the revisions. They stay with the resource folder that needs them; a resource folder holds data and scripts, not components, so it has no entry point of its own (§4 applies to components, not to resources).
- **Runtime data.** A database file, uploaded files, caches written while the program runs: neither level. They are not the software and not something that builds it — they are the *user's* data. They live outside the repository, in the operating system's per-user data folder (`%LOCALAPPDATA%` on Windows, `$XDG_DATA_HOME` / `~/.local/share` on Linux, `~/Library/Application Support` on macOS), or in a server database named by configuration. Finding that folder is itself a small component (`user_data_directory/`), injected through the composition root like any other dependency.
- **Configuration files.** `.env` / `.env.example` answer "how is this deployment set up?" — dev/deploy level, at the repo root. The software never goes looking for them from deep inside: a configuration component (§14) reads them once, and the composition root passes it the path.
- **Assets served by the software.** An `index.html`, a `public/` folder of images, a global stylesheet: the running program serves them, so they are part of the software — resources of the component that serves them (the app folder), not components of their own.
- **Source artwork and design files.** The full-size image the shipped icons were exported from is never loaded by the program: dev level, even though it looks like an "asset".
- **Type shims and tool hints.** A file that only exists to tell the compiler about a build tool's types (TypeScript's `vite-env.d.ts`) is tooling. Prefer moving it into the tool's configuration at the dev level (`"types": ["vite/client"]` in `tsconfig.json`) over leaving a non-component file inside the software.
- **Dev and test tools that use the software.** A simulator or a fixture generator that exercises the software is dev level (`tests/`). The dependency goes one way only: the tool imports the software, never the reverse, and it receives what it needs through its constructor (the services the composition root already built) instead of reaching into globals.
- **Several languages in one program.** When the program folder holds code in more than one language (an API and a web app), each language's code lives in one child of the program folder, and that child's entry point is the composition root for that runtime. If all the code of one language lives in a single child, that child's entry point *is* the composition root — the program folder needs no entry point of its own just to forward to it (in Python the program folder can stay a namespace package, with no `__init__.py`).

> 🧭 **Same kind of file, different level: decide by use. What the running software reads, executes or serves is part of the tree; what only helps build, check, migrate or ship it is the dev level; what the user produces while using it lives outside the repository altogether.**

# 3. 🍃 The Two Node Shapes: Leaf and Branch

Every node in the tree is a **folder**, without exception, from the moment it is created — even a component with no children yet is a folder holding nothing but its own entry point. What makes a node a **leaf** versus a **branch** is never the filesystem shape (both are folders); it is only whether anything besides the entry point currently lives inside that folder.

## 3.1 Leaves

A component with **no children** is a leaf. It materializes as a folder holding exactly one file: its entry point (§4) — the smallest unit the language gives you for "one behavior, one name, one place." In most languages that unit is a class; in languages without classes, it's whatever construct plays the equivalent role (§16 shows this per language).

```text
Actions
└── CreateRegistration         ← a leaf: a folder holding one entry point
    └── (entry point)              ← one behavioral unit, and nothing else yet
```

## 3.2 Branches

A component **with children** is a branch. Its materialization is identical to a leaf's — a folder holding an entry point — the only difference is that a branch's folder also holds one or more child components beside that entry point.

```text
Api
└── Routes                 ← Api is a branch: a folder, with a child folder beside its entry point
    └── Registration       ← Routes is also a branch, for the same reason
```

> 🌱 **Every component is born a folder.** A leaf and a branch share one shape, so nothing is ever renamed, converted, or has its imports rewritten the day it earns its first child — that child simply appears as a new sibling beside an entry point that was already there. This is a deliberate departure from "start flat, promote to a folder only once a component earns real children": that promotion is exactly the moment a rename/import-rewrite has historically been needed, and paying the folder cost up front — even for a component that may never grow children — buys a tree that never needs that migration at all.

A branch further splits into two flavors, and this is the second thing the tree has to communicate honestly:

- **Container branch** — exists purely to group its children. It has no behavior of its own; its only job is "here is where you find `X`, `Y`, `Z`." Materializes as a folder whose entry point (§4) does nothing but expose its children.
- **Active branch** — is itself a component with real behavior, and *also* has children. Materializes as a folder whose entry point holds the same kind of behavioral unit a leaf would (§3.1), which in turn constructs and uses the children beside it.

```text
api/
├── (entry point)        ← class/struct Api — HAS its own code, and owns Routes
└── routes/              ← Routes, a child of Api — a pure container
    ├── (entry point)    ← nothing but re-exports of its children
    └── registration     ← Registration, a child of Routes — a leaf
```

Neither flavor is more "correct." A branch earns its own behavior exactly when it has something to decide beyond "here are my children" — `Api` decides how to assemble a server and register routes, so it is an active branch. `Routes` has nothing to decide; it is only ever a name for "the group of route handlers," so it stays a container.

> 🧭 **Every branch answers one question honestly: does this folder itself do anything, or does it only tell you where to look? The entry point is where that answer lives.**

## 3.3 Reading the Tree

The payoff: understanding a project built this way never requires more than the directory tree and the willingness to look one level at a time.

```text
Program                        ← root component (composition root, §7)
├── Actions                    ← child: a container (§3.2)
│   └── CreateRegistration     ← leaf: one use case (§9)
└── Api                        ← child: active branch (has its own code) AND has children
    └── Routes                     ← grandchild: a container
        └── Registration              ← great-grandchild: leaf, one route handler
```

Every box is a real behavioral unit or a real package/namespace/module. Every line is a real parent/child relationship, exactly one filesystem level deep. Nothing requires reading past the tree itself to know where a given piece of behavior lives — that is the whole point of building it this way.

# 4. 📦 What Goes in a Branch's Entry Point

Almost every language with a package/module system gives folders some notion of an **entry point** — a file (or declaration) that represents the folder itself, as opposed to any one thing inside it: Python's `__init__.py`, JavaScript/TypeScript's `index.js`/`index.ts`, Rust's `mod.rs` (or the sibling-file form), Ruby's namespace-defining file. Some languages (Go, Java) don't need a dedicated entry-point file because their package system already treats the folder itself as the namespace — §16 covers each case precisely.

Wherever the language provides one, the entry point is where §3.2's two flavors become code:

**Container branch** — the entry point only imports/requires each child and re-exposes it. Nothing else lives there.

```text
routes (entry point)
    exposes: Registration, Session, ...
    (no code of its own)
```

**Active branch** — the entry point *is* the branch's own leaf-equivalent unit (a class, a struct, whatever §3.1 would put in a leaf file), and that unit constructs/uses the children living beside the entry point.

```text
api (entry point)
    defines: class/struct Api
    Api owns and uses: Routes
```

A component does not migrate from a bare file into a folder the day it earns children — it was already a folder, from the moment it was created (§3.1). Growing from zero children to one or more never touches the entry point: the file doesn't move, doesn't get renamed, and nothing that imports it needs to change. The new child simply appears as a new sibling beside the entry point that was already there. There is no `api/api.*` sitting redundantly beside `api/`'s own entry point — the entry point *is* `Api`, on the day it's created and on the day it grows its hundredth child alike.

# 5. 🧱 Every Leaf Is a Behavioral Unit

A leaf is a class, or whatever the language's closest equivalent is — never a bag of loose, unrelated functions floating at module scope. If a piece of logic does something and can reasonably be given a name, it gets a behavioral unit: a constructor/initializer that can receive dependencies, a name another component can depend on through an abstract contract (§8), a natural home for a test to construct and call in isolation, and room to grow into more than one operation later without a disruptive rewrite.

```text
❌  a bare function pretending not to be a component
✅  the same behavior, wrapped as the leaf it actually is —
    one constructor, one clearly named operation
```

This holds even for something "just" used in one place. Wrapping it costs almost nothing and buys everything the rest of this document assumes is available.

## 5.1 The One Exception: Pure Containers

The exception is exactly §3.2's container branch — an entry point whose only job is re-exposing its children has no behavioral unit of its own, because the folder itself is not a component; it is a category **containing** components, each of which is still a proper leaf or active branch.

Do not confuse this exception with "this leaf only has one small operation, so it doesn't need to be a unit." The exception applies only to the container entry point itself, never to the things it collects.

## 5.2 Constants Are Data, Not Components

A file of pure constant/lookup values — enum-like data, a list of allowed strings, default configuration values — is data, not a component with behavior. Nothing about "every leaf is a behavioral unit" implies wrapping a plain constant in a class for its own sake; the naming convention in §6 already treats constants files as the one exception to "file name = unit name."

## 5.3 🏷️ Strong Typing, Always

Every component's public surface is explicitly, strongly typed: a leaf's constructor parameters and method signatures (§5), an abstract dependency's contract (§8), a data carrier's fields (§10) — nothing left as an untyped/dynamic value on the assumption that "it'll obviously be a string" or "the caller knows what to pass." This is not a stylistic preference; it is the same rule as §2's tree, applied to values instead of files. The tree already declares the architecture once, in folder shape; strong typing is a second, mechanically-checked copy of that same declaration, so a wrong dependency wired at the composition root (§7), or a caller passing the wrong data carrier, is caught before the program runs rather than discovered later by a test, or by a user.

Every language here gives you *some* form of this — a real static type system, or a type checker layered on top of a dynamic one — and every language also offers at least one escape hatch that quietly opts back out of it: Python's `Any`, TypeScript's `any`, Go's `interface{}` used as a dumping ground instead of a real `interface`, Java/C#'s raw `object`, C/C++'s `void*` outside the one place it legitimately plays vtable/interface duty (§8). None of these are a convenience to reach for — each one is a hole in the second copy of the architecture that strong typing exists to provide, and should be treated as a defect to fix, not a shortcut to take. §16 shows the idiomatic, strictest-available typing mechanism for each language, including the dynamically-typed ones (Ruby, plain JavaScript), where "the language doesn't enforce this" is not a permanent exemption — it just means the discipline has to be adopted deliberately (a type checker, a typing layer) instead of coming for free.

```text
❌  function createUser(data)                 // data's shape is a mystery until read
✅  function createUser(data: CreateUserInput) // the signature IS the contract
```

> 🏷️ **A component whose signature could accept anything is a component whose contract lives only in a comment, if it lives anywhere at all.**

# 6. 🔤 Naming: The Folder Is the Unit, the Unit Is the Folder

A component's folder name is the natural casing conversion of the one behavioral unit its entry point defines, and nothing else of consequence lives in that entry point besides what the unit needs (a small supporting type, a couple of constants used only inside that file).

```text
create_registration   →  CreateRegistration
api_client             →  ApiClient
```

This is what lets a directory listing communicate the architecture on its own. Combined with §3.1's "every component is born a folder," it is also what makes the leaf → branch transition in §4 a complete non-event: a unit's name — and its folder, and its entry point's file path — never has to change just because it grew children.

# 7. 🏛️ The Composition Root and Explicit Dependency Injection

The root of the tree (§2) is the **composition root**: the one place where every other component is constructed and wired together. A component never decides for itself how to build its own dependencies — it receives them, already built, through its constructor/initializer.

```text
Program
    build Configuration
    build Database(Configuration)
    build HttpClient(Configuration)
    build Actions(Database, HttpClient)
    build Api(Actions)
    run Api
```

Splitting construction into ordered, clearly named groups (configuration → infrastructure → domain logic → the outward-facing adapter) is what keeps a long wiring list navigable as the tree grows. The order documents the dependency layering — a later group may depend on anything built by an earlier one, never the reverse.

A component that constructs its own dependencies internally (reaching for a global, a singleton, an environment variable read from deep inside unrelated code) has broken the tree's honesty: its real dependency is invisible from the composition root, so the tree on disk no longer matches the tree of actual relationships.

> 🔌 **If a dependency isn't visible in the constructor, it isn't visible in the architecture.**

# 8. 🔌 Abstract Dependencies

A component that talks to something outside the current process — a network call, a database, a filesystem, another subsystem — gets an **abstract counterpart**: a description of exactly the operations a caller needs, with nothing about how they're implemented. Every language gives you *some* version of this (an interface, a trait, a protocol, a typed function signature, an abstract base class) — §16 shows the idiomatic form per language.

The concrete implementation lives in the infrastructure layer and satisfies the abstract contract; the consumer — typically an Action (§9) — depends on the **contract**, never on the concrete class directly.

```text
interface Auth
    login(username, password) -> user
    getSessionToken() -> token | null
    logout()

class HttpAuth implements Auth      ← real implementation, talks to the network
class Login
    constructor(auth: Auth, ...)    ← depends on the CONTRACT, not HttpAuth
```

This buys two things. First, the type system (where the language has one) enforces that business logic in `Login` cannot reach for a network-specific detail outside what the contract exposes. Second, testing an Action never needs the real infrastructure: any object honoring the contract's shape is valid in its place, so a lightweight stand-in is a legitimate substitute with no framework involved.

## 8.1 Never Let a Local Decision Trust Unverified External Data

An abstract dependency describes *shape*, not *trust*. If a component's authorization decision — which capability unlocks, which action is allowed — is decided from data an external implementation returned, verify that data is genuinely trustworthy before acting on it. Satisfying the contract's shape is not the same as being safe to believe. When data crosses a real trust boundary (a network response, a locally editable configuration value, anything not produced by this same process), verify it — a cryptographic check against a key you actually control, not just a shape check — before it is allowed to grant anything.

# 9. ⚙️ Actions: One Use Case, One Entry Point

Every discrete business operation is its own leaf. The constructor/initializer receives its dependencies (typed against the abstract contracts of §8); the public surface is a single, clearly named operation — `execute`, `run`, `call`, whatever reads most naturally in the language — that does exactly one thing.

An Action never depends on how it might be invoked — an HTTP framework, a CLI parser, a queue consumer — which is precisely what makes it callable from all of those without modification.

When a use case naturally decomposes into sub-steps, its leaf grows into an active branch with its own container of sub-actions beside it (§4), exactly the same pattern one level deeper.

# 10. 📇 Data Carriers

Data that crosses a boundary — into or out of an Action, over a network call, into a background job's queue — is a plain data-carrying structure: whatever the language's lightest-weight construct for "a named bag of typed fields" is (a dataclass, a record, a struct, a plain interface/type in TypeScript), with no behavior beyond what that construct gives for free. It is not a database model with persistence logic, and not an abstract contract (§8). If a value needs validation, that validation is a separate component that produces or checks the data carrier — it does not live on the carrier itself.

# 11. 🚨 Errors: Public vs. Everything Else

Every raised error a caller might need to distinguish falls into exactly one of two buckets, and the boundary that matters is two-way:

- **Safe to show verbatim** — a validation failure, a business rule the caller violated (a small, named error type per case).
- **Everything else** — an unexpected failure, a library exception, an infrastructure hiccup. Never shown verbatim; logged, and replaced with a generic message before it reaches whoever is on the other side of the boundary.

```text
try:
    result = action.execute(...)
    respond success(result)
except SafeError as error:
    respond failure(error.message)          ← safe, shown as-is
except AnyOtherError as error:
    log(error)
    respond failure("Internal error.")       ← never shown as-is
```

More specific error types exist for callers that genuinely need to branch on failure *kind*, not just on "is this safe to show."

# 12. 🔁 Long-Running Components

A use case that needs to repeat itself in the background — polling, a retry loop, a scheduled cycle — is a thin **runner** wrapping the Action it repeats. The runner owns the lifecycle (start/stop/status); it contains no business logic of its own, only the loop and the decision of when to stop.

The next cycle begins as soon as the previous one finishes — no fixed delay baked in unless the use case genuinely needs one.

# 13. 🌐 The Adapter Layer Is Thin

Whatever faces the outside world — HTTP routes, a CLI's command handlers, a message-queue consumer — translates one inbound request into exactly one Action call and one outbound response. No business rule, no validation beyond what the transport itself requires, lives in the adapter. Every response follows one consistent shape, so a caller never has to guess whether it's looking at a success or a failure.

The top-level adapter component owns *registration* as its one job — the full list of "this path/command/message maps to this handler," visible in one place, rather than scattered across decorators or configuration spread through the codebase.

# 14. ⚙️ Configuration Components

Configuration is not read ad hoc from the environment wherever a value happens to be needed. Each cohesive group of settings is its own small component, computed once, and handed to whatever needs it through the composition root (§7) — never re-read independently by two different components that might disagree.

A value that must never be attacker- or user-editable at runtime (an endpoint an untrusted local actor could otherwise redirect, a secret) is a **constant in this component**, derived from something outside the user's control (a build/packaging flag, a compiled-in default) — never a field read back out of user-writable storage.

# 15. ✅ Language-Agnostic Checklist

- **Is the repo root kept to development-level concerns**, with the software itself confined to its own program-named folder (§2.1)?
- **Is every gray-zone file placed by use** (§2.3)? Runtime-applied migrations and served assets inside the software; separately applied migrations, source artwork, type shims and dev tools at the repo root; user data outside the repository.
- **Does the tree read as parent → child, one level at a time?** Nothing should depend two levels down without going through the level in between.
- **Is every component — leaf or branch — a folder holding its entry point**, never a bare file sitting beside its siblings, even when it has no children yet?
- **Is every leaf one behavioral unit**, not a loose function standing in for a component?
- **Is every component's public surface strongly typed**, with no `Any`/`any`/`interface{}`/raw `object` used as a shortcut where a real type or contract belongs (§5.3)?
- **Does every branch's entry point say honestly whether it's a container or active**, and does the code match that?
- **Does the file/unit name match, in both directions**, the naming convention in §6?
- **Does every external-facing leaf have an abstract contract**, and does its consumer depend on the contract, not the concrete class?
- **Is an authorization/trust decision based on verified data**, not just data that merely satisfies a contract's shape?
- **Is every business operation a single-entry-point Action**, callable the same way regardless of what triggers it?
- **Is data crossing a boundary a plain carrier**, not a loosely-typed bag passed around by convention?
- **Does every error either belong to the safe-to-show bucket, or get caught, logged, and replaced?**
- **Is a repeating use case a thin runner around an Action**, with no business logic of its own?
- **Is the adapter layer thin**, with one consistent response shape?
- **Is configuration a small, injected component**, never read ad hoc from inside unrelated code?
- **Is the composition root the only place that constructs and wires everything**, in explicit, dependency-ordered steps?

---

# 16. 🌍 Materializing FCA by Language

The vision above is the same regardless of language. What changes is which native construct plays each role — the closest thing to "a class," whether the module system already treats a folder as a namespace, and whether the language gives you a dedicated entry-point file at all. Each language gets its own file in [`languages/`](../languages/), so a project in one language never has to load the others' worked examples to find its own.

| # | Language | File | What's distinctive |
|---|---|---|---|
| 16.1 | 🐍 Python | [languages/python.md](../languages/python/file.md) | `__init__.py` as the entry point every other language's own convention is modeled after here |
| 16.2 | 🟨 JavaScript / TypeScript | [languages/javascript-typescript.md](../languages/javascript-typescript/file.md) | `index.ts`, the closest exact parallel to `__init__.py` in any mainstream language |
| 16.3 | ☕ Java | [languages/java.md](../languages/java/file.md) | package-as-folder is compiler-enforced; no dedicated entry-point file needed |
| 16.4 | 🟦 C# / .NET | [languages/csharp.md](../languages/csharp/file.md) | nearly identical to Java's mapping, with .NET's own idioms (`record`, nullable reference types) |
| 16.5 | 🐹 Go | [languages/go.md](../languages/go/file.md) | any file in a folder is already part of that package — no aggregator file exists at all |
| 16.6 | 🦀 Rust | [languages/rust.md](../languages/rust/file.md) | `mod.rs`, a literal direct parallel to `__init__.py` |
| 16.7 | 🔷 C++ | [languages/cpp.md](../languages/cpp/file.md) | header/source pairs and an umbrella header standing in for a real entry-point file |
| 16.8 | 🅲 C | [languages/c.md](../languages/c/file.md) | no package system at all — the tree survives on convention alone |
| 16.9 | 💎 Ruby | [languages/ruby.md](../languages/ruby/file.md) | Zeitwerk autoloading derives the tree from the path automatically |

# 17. 🏁 Final Principles

- 🌲 **A software system is a tree of components.** The directory structure is not a loose approximation of the architecture — it *is* the architecture.
- 📂 **The repo root is the development level; the software lives in its own named folder.** Build, test, and packaging concerns surround the tree — they are never siblings inside it.
- 📏 **Depth on disk is depth in the dependency graph.** A component's children are exactly what sits one level beneath it, never more.
- 🍃 **Leaves and branches share one shape: a folder holding an entry point.** What differs is only whether other components sit beside it yet, and whether that entry point acts or only contains.
- 🏷️ **Every public surface is strongly typed.** The type system is a second, mechanically-checked copy of the tree's shape — `Any`/`any`/`interface{}`/raw `object` is a hole in that copy, not a shortcut.
- 🔁 **The same rule applies at every scale.** The program, a mid-level component, and a three-line leaf are all built from the identical shape — that repetition across depth is what makes this *fractal*.
- 💉 **Dependencies are received, never self-constructed**, wired explicitly from one composition root.
- 🔌 **External-facing components are consumed through abstract contracts**, never through their concrete implementation.
- 🌍 **The vision doesn't change per language. Only the materialization does** — the same tree, expressed through whatever native construct each language already gives you for classes, modules, and packages.

> **You should be able to look at the project tree, in any language, and see the software itself.** 🌳

---

<div align="center">

Fractal Component Architecture (FCA) © 2026 Augusto Viceli, licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) (see [LICENSE](../LICENSE)).

</div>
