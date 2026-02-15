# Generics & Inference

Patterns for writing flexible, type-safe generic code in TypeScript 5.0+.

## Table of Contents

- [Three Generic Patterns](#three-generic-patterns)
- [Const Type Parameters](#const-type-parameters)
- [NoInfer](#noinfer)
- [Generic Constraints](#generic-constraints)
- [Inference Techniques](#inference-techniques)
- [Function Overloads vs Generics](#function-overloads-vs-generics)
- [Common Pitfalls](#common-pitfalls)

---

## Three Generic Patterns

### Pattern 1: Types to Types

Transform one type into another. No runtime values involved.

```typescript
// Extract the element type from an array type
type ElementOf<T extends readonly unknown[]> = T[number];

// Make selected keys optional
type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// Usage
type Item = ElementOf<['a', 'b', 'c']>;  // 'a' | 'b' | 'c'
```

### Pattern 2: Types to Functions

Use generics to create functions that work with many types.

```typescript
function first<T>(arr: readonly T[]): T | undefined {
  return arr[0];
}

const num = first([1, 2, 3]);     // number | undefined
const str = first(['a', 'b']);     // string | undefined
```

### Pattern 3: Inference from Arguments

Let TypeScript infer generic types from function arguments.

```typescript
function groupBy<T, K extends string>(items: T[], key: (item: T) => K): Record<K, T[]> {
  return items.reduce((acc, item) => {
    const k = key(item);
    (acc[k] ??= []).push(item);
    return acc;
  }, {} as Record<K, T[]>);
}

// T and K inferred from arguments
const grouped = groupBy(
  [{ name: 'Alice', role: 'admin' }, { name: 'Bob', role: 'user' }],
  (u) => u.role
);
// Record<'admin' | 'user', { name: string; role: string }[]>
```

---

## Const Type Parameters

TS 5.0+ — infer literal types without requiring callers to write `as const`.

### Problem: Wide Inference

```typescript
function routes<T extends readonly string[]>(paths: T): T {
  return paths;
}

// Without const: T = string[]
const r = routes(['/home', '/about']); // string[]
```

### Solution: `<const T>`

```typescript
function routes<const T extends readonly string[]>(paths: T): T {
  return paths;
}

// With const: T = readonly ["/home", "/about"]
const r = routes(['/home', '/about']); // readonly ["/home", "/about"]
type Route = (typeof r)[number];       // "/home" | "/about"
```

### Practical Use Cases

```typescript
// Config builder — preserves literal keys and values
function defineConfig<const T extends Record<string, unknown>>(config: T): T {
  return config;
}
const cfg = defineConfig({ api: 'https://example.com', retries: 3 });
// { api: "https://example.com"; retries: 3 } — not Record<string, unknown>

// Event map
function createEventMap<const T extends Record<string, (...args: any[]) => void>>(
  events: T
): T {
  return events;
}
const events = createEventMap({
  click: (x: number, y: number) => {},
  submit: (data: string) => {},
});
// Literal types preserved for each handler signature
```

---

## NoInfer

TS 5.4+ — prevent a parameter from contributing to type inference.

### Problem: Unwanted Inference

```typescript
function createFSM<S extends string>(init: S, states: S[]) {}

// 'idle' widens S to include itself — but we only want states to define S
createFSM('idle', ['idle', 'running', 'stopped']);
// S = 'idle' | 'running' | 'stopped' — works by accident
// But if init had a typo: createFSM('idl', ['idle', 'running']) — no error!
```

### Solution: `NoInfer<T>`

```typescript
function createFSM<S extends string>(init: NoInfer<S>, states: S[]) {}

createFSM('idle', ['idle', 'running', 'stopped']); // OK
createFSM('idl', ['idle', 'running', 'stopped']);
//         ~~~~~ Error: '"idl"' is not assignable to '"idle" | "running" | "stopped"'
```

### More Examples

```typescript
// Default value must match inferred type from events, not drive inference
function on<E extends string>(
  event: E,
  handler: (e: E) => void,
  fallback: NoInfer<E>
) {}

// Style tokens — theme drives inference, fallback follows
function style<T extends string>(
  tokens: T[],
  defaults: Record<NoInfer<T>, string>
) {}

style(['primary', 'secondary'], {
  primary: '#000',
  secondary: '#fff',
  // tertiary: '#ccc' — Error: not in token list
});
```

---

## Generic Constraints

### `extends` for Upper Bounds

```typescript
// T must have a length property
function longest<T extends { length: number }>(a: T, b: T): T {
  return a.length >= b.length ? a : b;
}

longest('hello', 'hi');     // string
longest([1, 2, 3], [4, 5]); // number[]
// longest(10, 20);          // Error: number has no length
```

### `keyof` Constraints

```typescript
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

const user = { name: 'Alice', age: 30 };
getProperty(user, 'name'); // string
// getProperty(user, 'email'); // Error: '"email"' not in keyof typeof user
```

### Multiple Constraints

```typescript
// T must be both serializable and have an id
interface Identifiable { id: string }
interface Serializable { toJSON(): unknown }

function save<T extends Identifiable & Serializable>(entity: T): void {
  const json = entity.toJSON();
  // persist using entity.id as key
}
```

### Default Type Parameters

```typescript
interface ApiResponse<T = unknown, E = Error> {
  data: T;
  error: E | null;
  status: number;
}

// Uses defaults
const response: ApiResponse = { data: {}, error: null, status: 200 };
// Override data type only
const typed: ApiResponse<string[]> = { data: ['a'], error: null, status: 200 };
```

---

## Inference Techniques

### `infer` in Conditional Types

```typescript
// Extract Promise inner type
type Awaited<T> = T extends Promise<infer U> ? Awaited<U> : T;

// Extract function parameters
type Params<T> = T extends (...args: infer P) => any ? P : never;

// Extract return type
type Return<T> = T extends (...args: any[]) => infer R ? R : never;

// Extract array element
type Elem<T> = T extends readonly (infer E)[] ? E : never;
```

### Inference from Mapped Types

```typescript
// Infer type from a record of factories
type InstanceMap<T extends Record<string, () => unknown>> = {
  [K in keyof T]: ReturnType<T[K]>;
};

const factories = {
  user: () => ({ name: 'Alice' }),
  post: () => ({ title: 'Hello' }),
};

type Instances = InstanceMap<typeof factories>;
// { user: { name: string }; post: { title: string } }
```

### `typeof` for Value-Driven Types

```typescript
const config = {
  api: 'https://api.example.com',
  timeout: 5000,
  retries: 3,
} as const;

type Config = typeof config;
// { readonly api: "https://api.example.com"; readonly timeout: 5000; readonly retries: 3 }

type ConfigKey = keyof typeof config; // "api" | "timeout" | "retries"
```

### `satisfies` + `as const` for Shape-Validated Literals

```typescript
const palette = {
  red: [255, 0, 0],
  green: '#00ff00',
} as const satisfies Record<string, string | readonly number[]>;

// palette.red is readonly [255, 0, 0] — not widened to number[]
// palette.green is "#00ff00" — not widened to string
// But the overall shape is validated against Record<string, string | readonly number[]>
```

---

## Function Overloads vs Generics

### When to Use Overloads

Use overloads when the return type depends on specific input values and generics can't express the relationship:

```typescript
// Overloads: different return type based on specific input
function createElement(tag: 'div'): HTMLDivElement;
function createElement(tag: 'span'): HTMLSpanElement;
function createElement(tag: 'canvas'): HTMLCanvasElement;
function createElement(tag: string): HTMLElement;
function createElement(tag: string): HTMLElement {
  return document.createElement(tag);
}

const div = createElement('div');   // HTMLDivElement
const span = createElement('span'); // HTMLSpanElement
```

### When to Use Generics

Use generics when the return type flows from the input type:

```typescript
// Generic: return type is derived from input
function identity<T>(value: T): T {
  return value;
}

function wrap<T>(value: T): { value: T } {
  return { value };
}

// Works for ANY type, not just a fixed set
const result = wrap({ x: 1, y: 2 }); // { value: { x: number; y: number } }
```

### Rule of Thumb

- **Fixed set of input→output mappings** → overloads
- **Input type flows through to output** → generics
- **Composition of multiple functions** → overloads + generics (see compose pattern)

---

## Common Pitfalls

### Unnecessary Generics

```typescript
// Bad: generic adds no value — T is never used in return or elsewhere
function logLength<T extends { length: number }>(item: T): void {
  console.log(item.length);
}

// Good: just use the constraint directly
function logLength(item: { length: number }): void {
  console.log(item.length);
}
```

### Generics to Fix `any` vs `unknown`

```typescript
// Problem: using `any` for flexibility
function parse(input: any) { return input.data; }

// Bad fix: just replacing with unknown
function parse(input: unknown) { return input.data; }
//                                       ~~~~~~~~ Error

// Good fix: use a generic with constraint
function parse<T extends { data: unknown }>(input: T): T['data'] {
  return input.data;
}
```

### Over-Constraining

```typescript
// Too strict: needlessly requires exact type
function bad<T extends string>(x: T): T { return x; }

// Better: just use string
function good(x: string): string { return x; }

// Const type parameter when literal inference IS needed
function literal<const T extends string>(x: T): T { return x; }
const lit = literal('hello'); // "hello" (literal type)
```

### Recursive Type Limits

```typescript
// Bad: unbounded recursion
type InfiniteNested<T> = { value: T; child: InfiniteNested<T> };

// Good: bounded recursion with depth counter
type Nested<T, D extends number = 5> =
  D extends 0
    ? { value: T }
    : { value: T; child?: Nested<T, [-1, 0, 1, 2, 3, 4][D]> };
```
