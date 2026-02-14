# Patterns & Idioms

Modern TypeScript patterns and idiomatic code for TS 5.0+.

## Table of Contents

- [satisfies Operator](#satisfies-operator)
- [as const & Deep Immutability](#as-const--deep-immutability)
- [Explicit Resource Management](#explicit-resource-management)
- [Result Type Pattern](#result-type-pattern)
- [Error Handling](#error-handling)
- [ESM & Module Patterns](#esm--module-patterns)
- [Import Organization](#import-organization)
- [Readonly by Default](#readonly-by-default)
- [Reducing Duplication](#reducing-duplication)

---

## satisfies Operator

TS 5.0+ — validate that a value matches a type without widening the inferred type.

### Core Concept

With `:` annotation, the **type beats the value** (widens).
With `satisfies`, the **value beats the type** (preserves literals).

```typescript
// Annotation: type wins — loses specific information
const configAnnotated: Record<string, string | number> = {
  api: 'https://api.example.com',
  timeout: 5000,
};
configAnnotated.api; // string | number — lost "it's a string"

// satisfies: value wins — preserves specific types
const configSatisfies = {
  api: 'https://api.example.com',
  timeout: 5000,
} satisfies Record<string, string | number>;
configSatisfies.api;     // string (preserved)
configSatisfies.timeout; // number (preserved)
```

### Five Key Use Cases

**1. Validate shape while preserving types**
```typescript
type Theme = Record<string, string | number[]>;

const palette = {
  red: [255, 0, 0],
  green: '#00ff00',
} satisfies Theme;

palette.red.map(x => x * 2);   // Works — inferred as number[]
palette.green.toUpperCase();     // Works — inferred as string
```

**2. Enforce exhaustive keys**
```typescript
type Routes = Record<'home' | 'about' | 'contact', string>;

const urls = {
  home: '/',
  about: '/about',
  contact: '/contact',
} satisfies Routes;
// Error if any key is missing
```

**3. Tuple inference in objects**
```typescript
const handlers = {
  click: [100, 200],
  hover: [0, 0],
} satisfies Record<string, [number, number]>;

handlers.click; // [number, number] — not number[]
```

**4. With `as const` for validated literals**
```typescript
const PERMISSIONS = {
  admin: ['read', 'write', 'delete'],
  viewer: ['read'],
} as const satisfies Record<string, readonly string[]>;

type AdminPerms = (typeof PERMISSIONS)['admin']; // readonly ["read", "write", "delete"]
```

**5. Inline parameter validation**
```typescript
function createUser(config: { name: string; role: 'admin' | 'user' }) {}

// satisfies validates inline, preserving literal types
createUser({
  name: 'Alice',
  role: 'admin',
} satisfies { name: string; role: 'admin' | 'user' });
```

---

## as const & Deep Immutability

### Basic Usage

```typescript
// Without as const: mutable, wide types
const config = { api: 'https://example.com', retries: 3 };
// { api: string; retries: number }

// With as const: deeply readonly, literal types
const config = { api: 'https://example.com', retries: 3 } as const;
// { readonly api: "https://example.com"; readonly retries: 3 }
```

### Array & Tuple Literals

```typescript
// Without: number[]
const nums = [1, 2, 3];

// With: readonly [1, 2, 3]
const nums = [1, 2, 3] as const;
type Num = (typeof nums)[number]; // 1 | 2 | 3
```

### as const on Return Values

```typescript
// Return tuple instead of (Error | undefined | any)[]
async function fetchData() {
  const res = await fetch('/');
  if (!res.ok) return [new Error('Failed')] as const;
  return [undefined, await res.json()] as const;
}

const [error, data] = await fetchData();
// error: Error | undefined
```

### as const vs Object.freeze

| Feature | `as const` | `Object.freeze` |
|---|---|---|
| Scope | Deep (all nested properties) | Shallow (first level only) |
| Runtime effect | None (compile-time only) | Yes (prevents mutation at runtime) |
| Type inference | Literal types | `Readonly<T>` with wide types |
| Performance | Zero cost | Small runtime overhead |

**Prefer `as const`** unless you specifically need runtime immutability at the top level.

### as const vs Type Annotation

When both are present, the annotation wins. `as const` is effectively overridden:

```typescript
// Annotation wins — status can be reassigned to any valid value
const config: { status: 'on' | 'off' } = { status: 'on' } as const;
config.status = 'off'; // No error
```

---

## Explicit Resource Management

TS 5.2+ — deterministic cleanup with `using` and `await using`.

### Synchronous Disposal

```typescript
class TempFile implements Disposable {
  constructor(public path: string) {
    // create temp file
  }

  [Symbol.dispose]() {
    // automatically called when scope exits
    fs.unlinkSync(this.path);
  }
}

function processData() {
  using file = new TempFile('/tmp/data.json');
  // Work with file.path...
  // file[Symbol.dispose]() called automatically here
}
```

### Async Disposal

```typescript
class DatabaseConnection implements AsyncDisposable {
  static async connect(url: string): Promise<DatabaseConnection> {
    const conn = new DatabaseConnection();
    await conn.init(url);
    return conn;
  }

  async [Symbol.asyncDispose]() {
    await this.close();
  }

  private async init(url: string) { /* ... */ }
  private async close() { /* ... */ }
}

async function queryDatabase() {
  await using db = await DatabaseConnection.connect('postgres://...');
  return db.query('SELECT * FROM users');
  // db[Symbol.asyncDispose]() called automatically
}
```

### When to Use

- File handles that must be closed
- Database connections with connection pools
- Locks and mutexes
- Temporary resources (temp dirs, staging areas)
- Any cleanup that must happen even if an exception is thrown

---

## Result Type Pattern

Prefer discriminated unions over thrown exceptions for expected error cases.

```typescript
type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };

// Constructor helpers
const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });
const err = <E>(error: E): Result<never, E> => ({ ok: false, error });

// Usage
function parseJSON<T>(input: string): Result<T, SyntaxError> {
  try {
    return ok(JSON.parse(input));
  } catch (e) {
    return err(e instanceof SyntaxError ? e : new SyntaxError(String(e)));
  }
}

const result = parseJSON<{ name: string }>('{"name":"Alice"}');
if (result.ok) {
  console.log(result.value.name); // string
} else {
  console.error(result.error.message); // SyntaxError
}
```

**When to use Result vs throw:**
- **Result**: Expected failure cases (validation, parsing, network), caller must handle
- **throw**: Unexpected errors (programming bugs, invariant violations), should crash

---

## Error Handling

### Custom Error Classes

```typescript
class DomainError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 500,
  ) {
    super(message);
    this.name = 'DomainError';
    // Maintains proper stack trace in V8
    Error.captureStackTrace?.(this, this.constructor);
  }
}

class NotFoundError extends DomainError {
  constructor(entity: string, id: string) {
    super(`${entity} with id ${id} not found`, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
  }
}
```

### Narrowing Caught Errors

```typescript
function handleError(error: unknown): string {
  // Always narrow unknown errors
  if (error instanceof DomainError) {
    return `[${error.code}] ${error.message}`;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}
```

### Exhaustive Error Handling with Discriminated Unions

```typescript
type AppError =
  | { type: 'validation'; fields: string[] }
  | { type: 'network'; status: number }
  | { type: 'auth'; reason: 'expired' | 'invalid' };

function formatError(error: AppError): string {
  switch (error.type) {
    case 'validation': return `Invalid fields: ${error.fields.join(', ')}`;
    case 'network':    return `Network error: ${error.status}`;
    case 'auth':       return `Auth failed: ${error.reason}`;
    default:           return assertNever(error);
  }
}
```

---

## ESM & Module Patterns

### Prefer ESM

- Set `"type": "module"` in `package.json`
- Use `"module": "ESNext"` or `"module": "preserve"` (when not transpiling with tsc)
- Use `"moduleResolution": "bundler"` for bundled apps
- Enable `"verbatimModuleSyntax": true` for strict import/export separation

### Type-Only Imports

```typescript
// Regular import — included in runtime bundle
import { UserService } from './services';

// Type-only — erased at compile time, no runtime cost
import type { User } from './models';

// Inline type-only — mixed import
import { UserService, type UserConfig } from './services';
```

### Dynamic Imports for Code Splitting

```typescript
// Lazy-load heavy modules
async function renderChart(data: number[]) {
  const { Chart } = await import('./chart-library');
  return new Chart(data);
}
```

### Re-exports

```typescript
// Barrel file (index.ts) — use sparingly to avoid over-bundling
export { UserService } from './user.service';
export type { User, UserConfig } from './user.types';

// Prefer direct imports in large codebases to enable tree-shaking
```

---

## Import Organization

Consistent import ordering for readability (no tooling dependency):

```typescript
// 1. Node built-ins
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

// 2. Third-party packages
import { z } from 'zod';

// 3. Internal absolute imports (aliases)
import { UserService } from '@/services/user';

// 4. Relative imports
import { formatDate } from './utils';

// 5. Type-only imports (last)
import type { Config } from '@/types';
```

---

## Readonly by Default

### Parameters

```typescript
// Prefer readonly arrays in function parameters
function sum(numbers: readonly number[]): number {
  return numbers.reduce((a, b) => a + b, 0);
  // numbers.push(4); // Error — readonly
}

// Mutable arrays can be passed to readonly parameters, but not vice versa
const mutable = [1, 2, 3];
sum(mutable); // OK — mutable assignable to readonly
```

### Tuples

```typescript
// Readonly tuples prevent accidental mutation
type Coordinate = readonly [number, number];

function distance(a: Coordinate, b: Coordinate): number {
  return Math.sqrt((b[0] - a[0]) ** 2 + (b[1] - a[1]) ** 2);
}
```

### Objects

```typescript
// Use Readonly<T> or readonly modifier for data that shouldn't change
interface Config {
  readonly apiUrl: string;
  readonly timeout: number;
}

// Deep readonly
type DeepReadonly<T> = T extends (...args: any[]) => any
  ? T
  : T extends object
    ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
    : T;
```

---

## Reducing Duplication

### Deriving Types from Values

See **[Deriving Union Types](type-system.md#deriving-union-types)** in the type system reference for the full pattern catalog (`typeof` + `as const` + indexed access for objects, arrays, and discriminated unions).

```typescript
// Quick reminder: value → type → union
const STATUS = { ACTIVE: 'active', INACTIVE: 'inactive' } as const;
type Status = (typeof STATUS)[keyof typeof STATUS]; // 'active' | 'inactive'
```

### Utility Type Composition

```typescript
// Combine Omit + Partial for update functions
interface Product {
  id: number;
  name: string;
  price: number;
}

type ProductUpdate = Partial<Omit<Product, 'id'>>;

function updateProduct(id: number, updates: ProductUpdate) { /* ... */ }
updateProduct(1, { name: 'New Name' }); // Only pass what changed
```

### Interface Extension Over Duplication

```typescript
// Bad: duplicated properties
interface User { id: string; createdAt: Date; name: string }
interface Product { id: string; createdAt: Date; title: string }

// Good: shared base
interface BaseEntity { id: string; createdAt: Date }
interface User extends BaseEntity { name: string }
interface Product extends BaseEntity { title: string }
```

### Pick/Omit for Derived Contracts

```typescript
interface FullUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: string;
}

// Expose only safe fields
type PublicUser = Pick<FullUser, 'id' | 'name' | 'email'>;

// Creation form — no id, no hash
type CreateUserInput = Omit<FullUser, 'id' | 'passwordHash'>;
```
