> 🌳 Part of [Fractal Component Architecture](../../documentation/file.md) — this file materializes the architecture for one language. Read the main document first for the vision and the language-agnostic rules; come here for how it lands in code.

# 16.7 🔷 C++

- **Leaf** → a folder — even before it has any children — holding one header/source pair (`api_client/api_client.hpp` / `api_client/api_client.cpp`), the closest analogue to "file name = class name" that a two-file-per-unit language allows, applied to a same-named folder from birth (§3.1) rather than sitting bare beside its siblings.
- **Namespace/folder** → folder-per-namespace by convention (not enforced by the compiler); a build system (CMake target, module) is what actually groups files into a component in practice.
- **Entry point** → no compiler-enforced equivalent to `__init__.py`, but an umbrella header (`api.hpp`, including/declaring its children) can play the container-branch role, and a free class in that same header/its `.cpp` can play the active-branch role — the same two shapes, expressed through convention rather than language guarantee. C++20 modules (`export module api;`, with `export import routes;` to re-export children) are the more modern, closer equivalent to a real entry-point file where the toolchain supports them.
- **Abstract dependency** → an abstract base class with pure virtual methods (classic), or a `concept` (C++20) for structural/compile-time-checked contracts without inheritance.
- **Data carrier** → a plain `struct` with public members and no invariants to maintain.
- **Composition root** → `main.cpp`, or a dedicated `App`/`Bootstrap` class, constructing the tree explicitly (often via `std::unique_ptr` ownership to make the parent/child relationship visible in the type system too).
- **Strong typing (§5.3)** → C++'s static typing already covers most of this; the discipline this document adds is avoiding `void*` outside the one place it legitimately plays vtable/interface duty (§8), and preferring a `concept` or an abstract base class over `std::any`/a raw union used as an untyped dumping ground.
