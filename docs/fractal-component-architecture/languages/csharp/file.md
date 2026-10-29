> 🌳 Part of [Fractal Component Architecture](../../documentation/file.md) — this file materializes the architecture for one language. Read the main document first for the vision and the language-agnostic rules; come here for how it lands in code.

# 16.4 🟦 C# / .NET

Nearly identical to Java's mapping (see [java.md](../java/file.md)), with .NET's own idioms:

- **Leaf** → a folder — even for a single class, even before it has any children — holding one file, name matching the class (`Login/Login.cs` → `class Login`), never a bare `Login.cs` sitting directly beside its siblings. Modern .NET analyzers and convention already push toward file name = class name; FCA's addition is that this file always lives in its own same-named folder from birth (§3.1).
- **Namespace/folder** → folder-per-namespace is standard .NET convention (and enforced by default in newer project templates via "file-scoped namespaces matching folder structure").
- **Entry point** → same situation as Java: no dedicated file plays `__init__.py`'s role. An active branch is a folder containing a class named after the folder's role, alongside its children's folders.
- **Abstract dependency** → a C# `interface` (`IAuth`, by convention), implemented explicitly.
- **Data carrier** → a `record` (C# 9+) — built exactly for this purpose.
- **Composition root** → `Program.cs`/`Startup.cs`, or, in frameworks with a built-in DI container, the service-registration section — still one explicit place declaring the whole tree.
- **Strong typing (§5.3)** → C#'s static type system enforces this by default; the discipline this document adds is enabling `<Nullable>enable</Nullable>` project-wide and refusing `dynamic`/raw `object` as a substitute for a proper `interface` (§8) or generic constraint.
