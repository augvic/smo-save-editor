> 🌳 Part of [Fractal Component Architecture](../../documentation/file.md) — this file materializes the architecture for one language. Read the main document first for the vision and the language-agnostic rules; come here for how it lands in code.

# 16.6 🦀 Rust

- **Leaf** → a `struct` with its `impl` block, plus a `trait` where an abstract dependency is needed, living in its own module — even before it has any children (§3.1). Of the two folder-mapping conventions below, the classic `login/mod.rs` form is the one that actually delivers this: the folder exists from the moment the module does, empty children-wise until it earns some. The modern sibling-file form (`login.rs` next to `login/`) doesn't force a folder to exist for a childless leaf at all — pick it only where the team already prefers that style over strict adherence to §3.1's "always a folder."
- **Module = folder** → Rust's module system maps to folders almost exactly like Python's, and for the same reason: the *classic* convention is a `mod.rs` file living directly inside the folder — a literal, direct parallel to `__init__.py` (see [python.md](../python/file.md)). Modern Rust (2018 edition onward) prefers a sibling `foldername.rs` next to `foldername/` instead of `foldername/mod.rs`, but the role is identical either way: this is where the branch's own code lives, and/or where `pub mod` / `pub use` declarations expose its children.

  ```rust
  // api.rs (or api/mod.rs) — active branch
  mod routes;
  pub use routes::Routes;

  pub struct Api {
      routes: Routes,
  }
  ```

  ```rust
  // routes.rs (or routes/mod.rs) — container branch, no struct of its own
  mod registration;
  pub use registration::Registration;
  ```

- **Abstract dependency** → a Rust `trait`, implemented with `impl Trait for Type`; can be consumed statically (generics + trait bounds) or dynamically (`dyn Trait`) depending on whether runtime polymorphism is actually needed.
- **Data carrier** → a plain `struct` (often `#[derive(Debug, Clone)]`), or an `enum` when the data is naturally one-of-several shapes.
- **Composition root** → `main.rs`, constructing every struct explicitly and passing dependencies through constructor functions (`Api::new(routes)`).
- **Strong typing (§5.3)** → Rust's static, ownership-aware type system already gives you this by default and offers essentially no untyped escape hatch to avoid — the discipline this document adds is preferring a genuine `trait` over reaching for `Box<dyn Any>` to sidestep the type system, the same smell as `Any`/`any`/`interface{}` in the other languages here.
