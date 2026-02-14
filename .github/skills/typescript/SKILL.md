---
name: typescript
description: TypeScript and JavaScript language expert for type-level programming,
  advanced patterns, performance optimization, error handling, and modern
  TS 5.x best practices. Use proactively for any TypeScript/JavaScript work
  including: complex type design, generics, discriminated unions, branded types,
  type guards, conditional types, template literal types, mapped types,
  satisfies operator, as const, using/await using, Result types, tsconfig
  configuration, module systems, migration strategies, and code review.
  Covers TypeScript 5.0 through 5.9+.
---

# TypeScript Expert

Advanced TypeScript expertise focused purely on language features, type system patterns, and idiomatic JavaScript/TypeScript code. No tooling recommendations.

## Core Principles

1. **Type safety over convenience** — prefer `unknown` over `any`, use narrowing
2. **Leverage inference** — let TypeScript infer when it produces the right type; annotate public API return types
3. **Prefer `interface extends`** over intersections for object extension (better errors, better perf)
4. **Default to `type`** for non-extended object shapes (no accidental declaration merging)
5. **Use `satisfies`** to validate values without widening types
6. **Use `as const`** for deep immutability and literal inference
7. **Branded types** for domain primitives at API boundaries
8. **Discriminated unions** for state modeling and error handling
9. **Exhaustive checks** with `never` to catch unhandled cases
10. **Explicit resource management** with `using`/`await using` for cleanup

## Reference Files

Load these as needed based on the task:

- **[Type System Patterns](references/type-system.md)** — Core type system: type guards, discriminated unions (incl. tuples), union tricks (`string & {}`, `as never`), branded types, conditional types, mapped types, template literals, indexed access types, deriving union types, module declarations
- **[Generics & Inference](references/generics-and-inference.md)** — Generic patterns, const type parameters, NoInfer, inference techniques, function overloads vs generics
- **[Patterns & Idioms](references/patterns-and-idioms.md)** — `satisfies`, `as const`, `using`/`await using`, Result types, error handling, ESM patterns, import organization
- **[Utility Types Library](references/utility-types.ts)** — Copy-paste utility types: Brand, Result, Option, Deep*, NonEmptyArray, PathOf, exhaustive checks
- **[TSConfig Reference](references/tsconfig-reference.md)** — Recommended tsconfig for TS 5.9+, option explanations, common configurations

## Quick Reference

### When to Use What

| Need | Use |
|---|---|
| Validate value shape without widening | `satisfies` |
| Deep immutable config/constants | `as const` |
| Literal inference in generic function | `<const T>` parameter |
| Prevent inference on specific param | `NoInfer<T>` |
| Extract union from object/array values | Indexed access: `T[keyof T]`, `Arr[number]` |
| Access nested type from object | `T['key']['nested']` chaining |
| Derive per-key union from object | Mapped type + `[keyof T]` collapse |
| Strip/transform object key prefixes | Mapped type `as` clause + `infer` |
| Domain-safe primitives (UserId, Email) | Branded types |
| Autocomplete-friendly open string union | `'known' \| (string & {})` |
| Union-of-functions with `never` param | `as never` escape hatch |
| Discriminated union over tuple values | Discriminated tuples |
| State machines, API responses | Discriminated unions |
| Object type extension | `interface extends` |
| Union, intersection, conditional types | `type` alias |
| Deterministic cleanup (files, connections) | `using` / `await using` |
| Type-safe error handling | `Result<T, E>` discriminated union |
| Runtime type narrowing | Type guard (`is`) or assertion (`asserts`) |

### Type vs Interface Decision

```
Need union, intersection, conditional, mapped, or template literal types?
  → Use `type`

Need to extend another object type?
  → Use `interface extends` (better errors + perf)

Simple object shape, no extension needed?
  → Use `type` (no accidental declaration merging)
```

### Common Error Patterns

| Error | Likely Cause | Fix |
|---|---|---|
| "Type instantiation is excessively deep" | Recursive/circular types | Limit recursion depth, use `interface extends` instead of `&` |
| "The inferred type of X cannot be named" | Missing type export / circular dep | Export the type explicitly, use `ReturnType<typeof fn>` |
| "Excessive stack depth comparing types" | Deep recursive types | Cap recursion with conditional counter type |
| "Cannot find module" despite file existing | Wrong `moduleResolution` | Match `moduleResolution` to your bundler |

### Code Review Checklist

- [ ] No `any` — use `unknown` + narrowing, or generics
- [ ] Return types declared for public/exported functions
- [ ] `as` type assertions justified and minimal
- [ ] Generic constraints properly bounded
- [ ] Discriminated unions for polymorphic state
- [ ] Exhaustive switch/if with `never` fallback
- [ ] `import type` for type-only imports
- [ ] No circular dependencies between modules
- [ ] `readonly` / `as const` for data that should not mutate

### TypeScript 5.x Feature Summary

| Version | Key Features |
|---|---|
| 5.0 | `const` type parameters, `satisfies`, decorators |
| 5.2 | `using` / `await using` (explicit resource management) |
| 5.4 | `NoInfer<T>`, preserved narrowing in closures |
| 5.5 | `isolatedDeclarations`, config `extends` arrays |
| 5.8 | `--erasableSyntaxOnly` (Node.js strip-types compat) |
| 5.9 | `import defer`, expandable hovers, 11% perf from caching |
