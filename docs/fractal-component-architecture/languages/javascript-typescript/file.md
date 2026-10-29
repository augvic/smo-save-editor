> 🌳 Part of [Fractal Component Architecture](../../documentation/file.md) — this file materializes the architecture for one language. Read the main document first for the vision and the language-agnostic rules; come here for how it lands in code.

# 16.2 🟨 JavaScript / TypeScript

- **Leaf** → one class, defined in a same-named folder's `index.js`/`index.ts` (`login/index.ts` → `class Login`), never a bare `login.ts` sitting beside its siblings — every component is a folder from birth (§3.1). TypeScript especially benefits (a class gives you the constructor for dependency injection and, combined with `interface`, a real abstract-contract mechanism); plain JavaScript can use a class the same way, with the contract in §8 enforced by convention/JSDoc rather than the compiler.
- **Entry point** → `index.js` / `index.ts`, the closest exact parallel to Python's `__init__.py` that exists in any mainstream language. A container branch's `index.ts` only re-exports:

  ```typescript
  // routes/index.ts — container, no class here
  export { Registration } from './registration';
  export { Session } from './session';
  ```

  An active branch's `index.ts` holds the class itself:

  ```typescript
  // api/index.ts — active branch
  import { Routes } from './routes';

  export class Api {
    constructor(private routes: Routes) {}
  }
  ```

- **Abstract dependency** → TypeScript `interface`; plain JavaScript relies on structural/duck typing without compiler enforcement.
- **Data carrier** → a TypeScript `interface`/`type`, or a class with only public readonly fields.
- **Composition root** → the top-level `index.ts` (or the app's designated entry file), constructing every branch and injecting dependencies through constructors, exactly like Python's top-level `__init__.py`.
- **UI frameworks (React and similar)** → a screen or widget's idiomatic unit is the framework's own (a React function component with hooks), not a class: it still gets its own folder and `index.tsx`. Logic does not live in the component — it lives in classes built by the composition root and handed down through the framework's dependency mechanism (a React context provider at the root, read with a hook such as `useServices()`), which plays the constructor's role for components. A component-private helper class (selection math, geometry of one screen) is a child folder of that component, constructed by it.
- **Build-tool type shims** → declarations like `vite-env.d.ts` are dev-level tooling: prefer `"types": ["vite/client"]` in the root `tsconfig.json` over a file inside the software (§2.3).
- **Strong typing (§5.3)** → TypeScript, in `strict` mode, with `noImplicitAny` on — every constructor parameter, method signature and data carrier explicitly typed, `any` treated as a defect to fix rather than a convenient shortcut (`unknown` plus a narrowing check is the honest alternative when a shape genuinely isn't known yet). Plain JavaScript without TypeScript is the one place this document accepts JSDoc `@param`/`@returns` annotations (optionally checked via `// @ts-check` or a `.d.ts` layer) as the closest available substitute — real static types are still the goal the moment the project can afford the migration.
