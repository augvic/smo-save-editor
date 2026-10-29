> 🌳 Part of [Fractal Component Architecture](../../documentation/file.md) — this file materializes the architecture for one language. Read the main document first for the vision and the language-agnostic rules; come here for how it lands in code.

# 16.1 🐍 Python

- **Leaf** → one class, its name the `PascalCase` form of the folder's `snake_case` name, defined in that folder's `__init__.py` (`login/__init__.py` → `class Login`) — never a bare `login.py` sitting beside its siblings. Every component is a folder from birth (§3.1), so nothing has to be renamed or re-`import`ed the day it grows children.
- **Package/folder** → every folder is a package, and every package has an `__init__.py` — no bare grouping directories.
- **Entry point** → `__init__.py`, the construct that JavaScript/TypeScript's `index.ts` and Rust's `mod.rs` (see [javascript-typescript.md](../javascript-typescript/file.md), [rust.md](../rust/file.md)) are themselves modeled after in this document. A container branch's `__init__.py` only re-exports:

  ```python
  # routes/__init__.py — container, no class here
  from .registration import Registration
  from .session import Session

  __all__ = ["Registration", "Session"]
  ```

  An active branch's `__init__.py` holds the class itself, directly — no redundant `api/api.py` repeating the folder's own name:

  ```python
  # api/__init__.py — active branch
  from .routes import Routes

  class Api:
      def __init__(self, routes: Routes) -> None:
          self.routes = routes
  ```

- **Program folder holding several languages** → when all the Python code lives in one child (e.g. `myapp/api/`) next to code in another language (e.g. `myapp/app/`), that child's `__init__.py` is the composition root, and `myapp/` itself can stay a namespace package with no `__init__.py` (§2.3). Entry points for servers use a factory on the root class (`uvicorn myapp.api:Api.serve --factory`).
- **Abstract dependency** → `typing.Protocol`, satisfied structurally with no explicit inheritance — closest in spirit to Go's implicit interfaces (see [go.md](../go/file.md)).
- **Data carrier** → a `@dataclass`.
- **Composition root** → the top-level package's own `__init__.py`, constructing every branch through ordered, explicit steps and injecting dependencies through constructors.
- **Strong typing (§5.3)** → type hints on every function/method signature and every `@dataclass` field, checked by `mypy` or `pyright` in CI — not left as unchecked decoration. `typing.Any` is the escape hatch to avoid; where a value's shape genuinely varies, a `Protocol`, a `TypedDict`, or a `Union`/`|` of concrete types says so honestly instead.
