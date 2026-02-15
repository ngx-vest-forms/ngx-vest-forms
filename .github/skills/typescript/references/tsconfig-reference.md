# TSConfig Reference

Recommended configurations for TypeScript 5.9+ projects. No tooling opinions — only compiler options.

---

## Base Options (Every Project)

```jsonc
{
  "compilerOptions": {
    // Modern JS target — covers 99%+ of environments
    "target": "es2022",

    // Proper ESM interop
    "esModuleInterop": true,

    // Skip type-checking node_modules declarations
    "skipLibCheck": true,

    // Enforce consistent import/export syntax
    // Replaces allowSyntheticDefaultImports, importsNotUsedAsValues
    "verbatimModuleSyntax": true,

    // Required for single-file transpilers (esbuild, swc, etc.)
    "isolatedModules": true,

    // Include modern JS APIs (Map, Set, Promise, etc.)
    "lib": ["es2022"]
  }
}
```

### Why These Defaults

| Option | Reason |
|---|---|
| `target: es2022` | Top-level await, `cause` on Error, `.at()`, `structuredClone` |
| `esModuleInterop` | Correct default/namespace import behavior |
| `skipLibCheck` | Faster builds, avoids third-party declaration conflicts |
| `verbatimModuleSyntax` | Forces `import type` syntax, ensures tree-shaking |
| `isolatedModules` | Required for modern bundlers that transpile per-file |

---

## Strictness Options

```jsonc
{
  "compilerOptions": {
    // Enable all strict checks (umbrella flag)
    "strict": true,

    // Array/object indexing returns T | undefined
    "noUncheckedIndexedAccess": true,

    // Require 'override' keyword when overriding base class members
    "noImplicitOverride": true,

    // Error on unused locals and parameters
    "noUnusedLocals": true,
    "noUnusedParameters": true,

    // Ensure functions with code paths return consistently
    "noImplicitReturns": true,

    // Ensure switch cases have break/return
    "noFallthroughCasesInSwitch": true
  }
}
```

### What `strict: true` Enables

The `strict` flag is an umbrella that turns on:

- `strictNullChecks` — `null`/`undefined` excluded from types unless explicit
- `strictFunctionTypes` — Contravariant function parameter checking
- `strictBindCallApply` — Correct types for `bind`, `call`, `apply`
- `strictPropertyInitialization` — Class properties must be initialized
- `noImplicitAny` — Error on inferred `any`
- `noImplicitThis` — Error on `this` with implicit `any` type
- `alwaysStrict` — Emit `"use strict"` in every file
- `useUnknownInCatchVariables` — Catch clause variables are `unknown` (not `any`)

> Always use `strict: true` rather than individual flags — new strict checks added in
> future TS versions are automatically picked up.

---

## Module Resolution Profiles

### Profile A: Transpiling (Emit JS)

For projects that compile TS → JS (apps, CLIs, servers):

```jsonc
{
  "compilerOptions": {
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "dist"
  }
}
```

### Profile B: Not Transpiling (Bundler Handles It)

For projects where a bundler (Vite, esbuild, webpack) handles emit:

```jsonc
{
  "compilerOptions": {
    "module": "preserve",
    "moduleResolution": "bundler",
    "noEmit": true
  }
}
```

### Profile C: Library (Emit Declarations)

For publishable libraries:

```jsonc
{
  "compilerOptions": {
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "dist",

    // Speeds up downstream consumers
    "isolatedDeclarations": true
  }
}
```

> `isolatedDeclarations` (TS 5.5+) requires all exports to have explicit
> return types and type annotations. Enables parallel declaration emit.

### When to Choose

| Scenario | Module | ModuleResolution | Emit |
|---|---|---|---|
| Node.js app / CLI | `NodeNext` | `NodeNext` | `outDir` |
| Frontend (Vite/webpack) | `preserve` | `bundler` | `noEmit` |
| Angular library | `preserve` | `bundler` | via `ng-packagr` |
| NPM package | `NodeNext` | `NodeNext` | `outDir` + `declaration` |
| Monorepo package | per package | per package | varies |

---

## DOM vs Non-DOM

### Browser / DOM projects

```jsonc
{
  "compilerOptions": {
    "lib": ["es2022", "dom", "dom.iterable"]
  }
}
```

### Node.js / Server (no DOM)

```jsonc
{
  "compilerOptions": {
    "lib": ["es2022"]
    // Use @types/node for Node APIs
  }
}
```

---

## Path Aliases

```jsonc
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@app/*": ["src/app/*"],
      "@lib/*": ["src/lib/*"],
      "@shared/*": ["src/shared/*"]
    }
  }
}
```

> Path aliases are a TS-only resolution feature. Your bundler or runtime must
> also be configured to resolve them (e.g., Vite `resolve.alias`, `tsconfig-paths`).

---

## Monorepo / Project References

```jsonc
// Root tsconfig.json
{
  "files": [],
  "references": [
    { "path": "packages/core" },
    { "path": "packages/utils" },
    { "path": "apps/web" }
  ]
}
```

Each referenced project needs:

```jsonc
{
  "compilerOptions": {
    "composite": true,
    "declaration": true,
    "declarationMap": true
  }
}
```

Build with `tsc --build` for incremental, dependency-aware compilation.

---

## Quick Decisions

| Question | Answer |
|---|---|
| Start a new project? | `strict: true` + `noUncheckedIndexedAccess` from day one |
| Migrate legacy JS? | Start with `allowJs`, `checkJs`, enable strict flags incrementally |
| Monorepo? | Project references + `composite` per package |
| Target older runtimes? | Lower `target` (e.g., `es2020`) and add polyfills |
| Emitting declarations? | Add `isolatedDeclarations` for faster, parallelizable emit |
| Using `import type`? | `verbatimModuleSyntax` enforces it automatically |
