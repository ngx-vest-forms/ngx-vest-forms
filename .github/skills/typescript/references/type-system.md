# Type System Patterns

Core TypeScript type system patterns and techniques for TS 5.0+.

## Table of Contents

- [Type Guards & Narrowing](#type-guards--narrowing)
- [Discriminated Unions](#discriminated-unions)
- [Union Tricks & Escape Hatches](#union-tricks--escape-hatches)
- [Branded Types](#branded-types)
- [Conditional Types](#conditional-types)
- [Mapped Types](#mapped-types)
- [Template Literal Types](#template-literal-types)
- [Indexed Access Types](#indexed-access-types)
- [Deriving Union Types](#deriving-union-types)
- [Module Declarations](#module-declarations)
- [Types vs Interfaces](#types-vs-interfaces)

---

## Type Guards & Narrowing

### Built-in Guards

```typescript
// typeof — primitives
function format(value: string | number): string {
  if (typeof value === 'string') return value.toUpperCase();
  return value.toFixed(2);
}

// instanceof — class instances
function serialize(err: Error | TypeError): string {
  if (err instanceof TypeError) return `Type: ${err.message}`;
  return err.message;
}

// in — property existence
interface Bird { fly(): void }
interface Fish { swim(): void }

function move(animal: Bird | Fish) {
  if ('fly' in animal) animal.fly();
  else animal.swim();
}

// Truthiness — null/undefined
function greet(name: string | null) {
  if (name) return `Hello, ${name}`;
  return 'Hello, stranger';
}
```

### Custom Type Guards

```typescript
// Type predicate — narrows the argument's type
function isString(value: unknown): value is string {
  return typeof value === 'string';
}

// Guard for complex types
interface ApiError {
  code: number;
  message: string;
}

function isApiError(err: unknown): err is ApiError {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    'message' in err &&
    typeof (err as ApiError).code === 'number'
  );
}

// Usage
function handle(err: unknown) {
  if (isApiError(err)) {
    console.error(`API ${err.code}: ${err.message}`);
  }
}
```

### Assertion Functions

```typescript
// Assertion — throws if condition fails, narrows after call
function assertDefined<T>(val: T | undefined | null, msg?: string): asserts val is T {
  if (val == null) throw new Error(msg ?? 'Value is not defined');
}

function process(input: string | undefined) {
  assertDefined(input, 'Input required');
  // input is string here
  return input.toUpperCase();
}
```

### Array Narrowing

```typescript
// Filter with type predicate to narrow arrays
const mixed: (string | null)[] = ['a', null, 'b', null];
const strings: string[] = mixed.filter((x): x is string => x !== null);

// Array.isArray narrows to any[] — re-narrow element type if needed
function flatten(input: unknown): string[] {
  if (Array.isArray(input)) {
    return input.filter((x): x is string => typeof x === 'string');
  }
  return [];
}
```

---

## Discriminated Unions

Model states, results, and polymorphic data with a shared literal discriminant.

### State Modeling

```typescript
type State<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: Error };

function render<T>(state: State<T>): string {
  switch (state.status) {
    case 'idle':    return 'Ready';
    case 'loading': return 'Loading...';
    case 'success': return `Data: ${state.data}`;
    case 'error':   return `Error: ${state.error.message}`;
  }
}
```

### Exhaustive Checking

```typescript
// Compile-time guarantee all variants are handled
function assertNever(value: never): never {
  throw new Error(`Unhandled variant: ${JSON.stringify(value)}`);
}

type Shape =
  | { kind: 'circle'; radius: number }
  | { kind: 'rect'; width: number; height: number };

function area(shape: Shape): number {
  switch (shape.kind) {
    case 'circle': return Math.PI * shape.radius ** 2;
    case 'rect':   return shape.width * shape.height;
    default:       return assertNever(shape);
    // Adding a new Shape variant without a case → compile error
  }
}
```

### Result Type Pattern

```typescript
type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };

function divide(a: number, b: number): Result<number, string> {
  if (b === 0) return { ok: false, error: 'Division by zero' };
  return { ok: true, value: a / b };
}

const result = divide(10, 2);
if (result.ok) {
  console.log(result.value); // number
} else {
  console.error(result.error); // string
}
```

---

## Union Tricks & Escape Hatches

Practical patterns for working around union type limitations.

### `string & {}` — Autocomplete-Friendly Open Unions

When you union a set of string literals with plain `string`, TypeScript widens the entire type to `string` and you lose autocomplete. The `string & {}` trick preserves IDE suggestions for known literals while still accepting any arbitrary string.

```typescript
// ❌ Widens to string — no autocomplete
type Color = 'red' | 'blue' | string;

const pick: Color = 'r'; // No suggestions

// ✅ Preserves autocomplete for known values
type Color = 'red' | 'blue' | (string & {});

const pick: Color = 'r'; // IDE suggests 'red'
const custom: Color = '#ff00ff'; // Also valid
```

**Why it works:** `string & {}` is equivalent to `string` at runtime (every string is also `{}`), but TypeScript treats the intersection as a distinct type that doesn't absorb the literal members of the union. The literals remain visible to autocomplete.

**Real-world example — field names with autocomplete:**

```typescript
// Known keys get autocomplete, but any nested path is accepted
type FieldKey<T> = Extract<keyof T, string> | (string & {});

interface User { name: string; email: string; age: number }

const field: FieldKey<User> = 'name';  // ✅ autocomplete: name, email, age
const nested: FieldKey<User> = 'address.street'; // ✅ also valid
```

**Variants:**

```typescript
// number & {} — same trick for numeric literals
type Port = 80 | 443 | (number & {});

// Works with template literals too
type EventName = 'click' | 'focus' | `on${string}` | (string & {});
```

### Discriminated Tuples

Tuples can serve as discriminated unions where the first element is the discriminant. TypeScript tracks the relationship between destructured tuple elements.

```typescript
type Result<T> = ['ok', T] | ['error', string];

async function fetchUser(id: string): Promise<Result<User>> {
  try {
    const res = await fetch(`/api/users/${id}`);
    if (!res.ok) return ['error', `HTTP ${res.status}`];
    return ['ok', await res.json()];
  } catch {
    return ['error', 'Network failure'];
  }
}

const [status, value] = await fetchUser('123');
if (status === 'ok') {
  value; // User — TypeScript tracks the tuple relationship
} else {
  value; // string
}
```

**Key insight:** Unlike discriminated objects, destructured tuple variables maintain their relationship. Checking `status` narrows `value` even though they're separate variables.

### `as never` — Union Function Dispatch

When indexing into an object to get a function based on a union key, the resulting function type is a union of functions with incompatible parameters. TypeScript collapses those parameters to `never` — and `as never` is the only escape hatch.

```typescript
const formatters = {
  string:  (input: string)  => input.toUpperCase(),
  number:  (input: number)  => input.toFixed(2),
  boolean: (input: boolean) => (input ? 'true' : 'false'),
};

const format = (input: string | number | boolean) => {
  const inputType = typeof input as 'string' | 'number' | 'boolean';
  const formatter = formatters[inputType];
  // formatter: ((input: string) => string) | ((input: number) => string) | ...
  // Parameters collapse to: (input: never) => string

  return formatter(input as never); // ✅ Only `as never` works here
};
```

**Why `as any` doesn't work:** `any` is not assignable to `never` — this is one of `never`'s defining properties. `as never` is the only type that satisfies a `never` parameter.

**When you need `as never`:**
- Calling a union of functions obtained by dynamic key lookup
- The logic is sound but TypeScript can't prove type correspondence
- You've verified the runtime behavior is safe

**Prefer alternatives when possible:**

```typescript
// Overloaded function — avoids the union-of-functions problem
function format(input: string): string;
function format(input: number): string;
function format(input: boolean): string;
function format(input: string | number | boolean): string {
  // implementation
}

// Generic approach
function format<T extends string | number | boolean>(
  input: T,
  formatter: (val: T) => string
): string {
  return formatter(input);
}
```

---

## Branded Types

Prevent primitive obsession by creating nominal types from structural ones.

```typescript
type Brand<K, T> = K & { readonly __brand: T };

type UserId  = Brand<string, 'UserId'>;
type OrderId = Brand<string, 'OrderId'>;
type Email   = Brand<string, 'Email'>;

// Constructor with validation
function createEmail(input: string): Email {
  if (!input.includes('@')) throw new Error('Invalid email');
  return input as Email;
}

function createUserId(id: string): UserId {
  return id as UserId;
}

// Type system prevents mixing
function sendEmail(to: Email, userId: UserId) { /* ... */ }

const email = createEmail('user@example.com');
const userId = createUserId('u-123');
sendEmail(email, userId);  // OK
// sendEmail(userId, email); // Compile error
```

**When to use:**
- Domain identifiers (UserId, OrderId, ProductId)
- Validated strings (Email, URL, PhoneNumber)
- Unit-bearing numbers (Meters, Seconds, USD)
- API boundaries where mixing primitives causes bugs

---

## Conditional Types

### Basics

```typescript
// Conditional type: T extends U ? X : Y
type IsString<T> = T extends string ? true : false;

type A = IsString<'hello'>; // true
type B = IsString<42>;      // false
```

### `infer` Keyword

```typescript
// Extract inner type
type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;
type Inner = UnwrapPromise<Promise<string>>; // string

// Extract array element
type ElementOf<T> = T extends readonly (infer E)[] ? E : never;
type Elem = ElementOf<string[]>; // string

// Extract function return
type ReturnOf<T> = T extends (...args: any[]) => infer R ? R : never;
```

### Distributive Conditional Types (Mapping Over Unions)

Conditional types automatically distribute over union members — this is how you "map" over a union.

```typescript
// Each union member is checked individually
type ToArray<T> = T extends any ? T[] : never;
type Dist = ToArray<string | number>; // string[] | number[]

// Filter: remove specific members
type RemoveC<T> = T extends 'c' ? never : T;
type AB = RemoveC<'a' | 'b' | 'c'>; // 'a' | 'b'

// Transform: replace specific members
type ReplaceC<T> = T extends 'c' ? 'd' : T;
type ABD = ReplaceC<'a' | 'b' | 'c'>; // 'a' | 'b' | 'd'

// Extract: keep only matching members (like built-in Extract)
type OnlyStrings<T> = T extends string ? T : never;
type Strings = OnlyStrings<string | number | boolean>; // string
```

**Key insight:** `never` in a union disappears. Return `never` to remove a member, return a new type to transform it.

### Preventing Distribution

```typescript
// Wrap in tuple to prevent distribution
type ToArrayND<T> = [T] extends [any] ? T[] : never;
type NonDist = ToArrayND<string | number>; // (string | number)[]
```

### Practical Patterns

```typescript
// Distributive Omit for unions (built-in Omit doesn't distribute)
type DistributiveOmit<T, K extends PropertyKey> =
  T extends any ? Omit<T, K> : never;

// Extract string keys only
type StringKeys<T> = Extract<keyof T, string>;

// Make certain keys required while keeping others optional
type RequireKeys<T, K extends keyof T> =
  Omit<T, K> & Required<Pick<T, K>>;
```

---

## Mapped Types

### Basic Patterns

```typescript
// Make all properties optional
type MyPartial<T> = { [K in keyof T]?: T[K] };

// Make all properties readonly
type MyReadonly<T> = { readonly [K in keyof T]: T[K] };

// Remove readonly
type Mutable<T> = { -readonly [K in keyof T]: T[K] };
```

### Key Remapping (TS 4.1+)

```typescript
// Rename keys with template literals
type Getters<T> = {
  [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K];
};

type Setters<T> = {
  [K in keyof T as `set${Capitalize<string & K>}`]: (val: T[K]) => void;
};

interface User { name: string; age: number }
type UserGetters = Getters<User>;
// { getName: () => string; getAge: () => number }
```

### Filtering Keys

```typescript
// Keep only string-valued properties
type StringProps<T> = {
  [K in keyof T as T[K] extends string ? K : never]: T[K];
};

// Keep only required properties
type RequiredProps<T> = {
  [K in keyof T as {} extends Pick<T, K> ? never : K]: T[K];
};
```

### Key Transformation with `infer` in Template Literals

Combine key remapping (`as` clause) with `infer` inside template literals to strip, add, or transform key prefixes.

```typescript
// Strip prefix from all keys
type RemovePrefix<T, P extends string> = {
  [K in keyof T as K extends `${P}${infer Rest}` ? Rest : K]: T[K];
};

interface ApiData {
  'maps:longitude': string;
  'maps:latitude': string;
  awesome: boolean;
}

type CleanData = RemovePrefix<ApiData, 'maps:'>;
// { longitude: string; latitude: string; awesome: boolean }

// Add prefix to all keys
type AddPrefix<T, P extends string> = {
  [K in keyof T as K extends string ? `${P}${K}` : K]: T[K];
};

type Prefixed = AddPrefix<{ name: string; age: number }, 'user_'>;
// { user_name: string; user_age: number }

// Transform keys: snake_case key → camelCase value access
type SnakeToCamel<S extends string> =
  S extends `${infer H}_${infer T}`
    ? `${H}${Capitalize<SnakeToCamel<T>>}`
    : S;

type CamelKeys<T> = {
  [K in keyof T as K extends string ? SnakeToCamel<K> : K]: T[K];
};

type Camelized = CamelKeys<{ first_name: string; last_name: string }>;
// { firstName: string; lastName: string }
```

---

## Template Literal Types

```typescript
// Combine unions
type Color = 'red' | 'blue';
type Size = 'sm' | 'lg';
type Token = `${Color}-${Size}`; // 'red-sm' | 'red-lg' | 'blue-sm' | 'blue-lg'

// Event handler names
type Events = 'click' | 'focus' | 'blur';
type Handler = `on${Capitalize<Events>}`; // 'onClick' | 'onFocus' | 'onBlur'

// Dot-path for nested objects
type PathOf<T, Prefix extends string = ''> = T extends object
  ? {
      [K in keyof T & string]: T[K] extends object
        ? `${Prefix}${K}` | PathOf<T[K], `${Prefix}${K}.`>
        : `${Prefix}${K}`;
    }[keyof T & string]
  : never;

interface Config {
  db: { host: string; port: number };
  app: { name: string };
}
type ConfigPath = PathOf<Config>; // 'db' | 'db.host' | 'db.port' | 'app' | 'app.name'
```

### Built-in String Manipulation Types

```typescript
type Upper = Uppercase<'hello'>;       // 'HELLO'
type Lower = Lowercase<'HELLO'>;       // 'hello'
type Cap   = Capitalize<'hello'>;      // 'Hello'
type Uncap = Uncapitalize<'Hello'>;    // 'hello'
```

---

## Indexed Access Types

Access nested types from objects, arrays, and tuples using bracket notation in the type world.

### Basic Object Access

```typescript
interface ColorVariants {
  primary: '#ff0000';
  secondary: '#00ff00';
  tertiary: '#0000ff';
}

// Access a single property type
type PrimaryColor = ColorVariants['primary']; // '#ff0000'

// Access via union — returns a union of matched types
type NonPrimary = ColorVariants['secondary' | 'tertiary']; // '#00ff00' | '#0000ff'

// Access all values via keyof
type EveryColor = ColorVariants[keyof ColorVariants]; // '#ff0000' | '#00ff00' | '#0000ff'
```

### Tuple & Array Access

```typescript
type Letters = ['a', 'b', 'c'];

// Specific indices
type First = Letters[0];       // 'a'
type AOrB = Letters[0 | 1];    // 'a' | 'b'

// All elements via [number]
type Letter = Letters[number];  // 'a' | 'b' | 'c'
```

### Deep Access Chaining

Chain indexed access to reach deeply nested types.

```typescript
interface UserRoleConfig {
  user: ['view', 'create', 'update'];
  superAdmin: ['view', 'create', 'update', 'delete'];
}

// Get all roles across all user types
type Role = UserRoleConfig[keyof UserRoleConfig][number];
// 'view' | 'create' | 'update' | 'delete'

// Nested object access
interface AppConfig {
  db: { host: string; port: number };
  auth: { provider: 'oauth' | 'saml'; timeout: number };
}

type AuthProvider = AppConfig['auth']['provider']; // 'oauth' | 'saml'
type AllDbValues = AppConfig['db'][keyof AppConfig['db']]; // string | number
```

### With `typeof` for Runtime Values

```typescript
const routes = {
  home: { path: '/', exact: true },
  about: { path: '/about', exact: false },
} as const;

type RoutePath = (typeof routes)[keyof typeof routes]['path']; // '/' | '/about'
```

---

## Deriving Union Types

A core pattern: derive union types from objects, arrays, and runtime values.

### From Object Values

```typescript
const STATUS = { ACTIVE: 'active', INACTIVE: 'inactive', PENDING: 'pending' } as const;
type Status = (typeof STATUS)[keyof typeof STATUS]; // 'active' | 'inactive' | 'pending'
```

### From Object Keys

```typescript
const handlers = { onClick: () => {}, onHover: () => {}, onFocus: () => {} };
type EventName = keyof typeof handlers; // 'onClick' | 'onHover' | 'onFocus'
```

### From Arrays

```typescript
const ROLES = ['admin', 'editor', 'viewer'] as const;
type Role = (typeof ROLES)[number]; // 'admin' | 'editor' | 'viewer'
```

### Object-to-Union of Discriminated Objects

Derive a union of per-key objects from a source object — extremely useful for creating discriminated unions from config.

```typescript
const fruitCounts = { apple: 1, banana: 26, pear: 4 } as const;
type FruitCounts = typeof fruitCounts;

// Step 1: Map each key to a single-key object
// Step 2: Index with [keyof T] to collapse into union
type SingleFruitCount = {
  [K in keyof FruitCounts]: { [K2 in K]: number };
}[keyof FruitCounts];
// { apple: number } | { banana: number } | { pear: number }
```

### Generic Helper: Object Values to Union

```typescript
type ValueOf<T> = T[keyof T];

interface Config {
  api: string;
  timeout: number;
  debug: boolean;
}

type ConfigValue = ValueOf<Config>; // string | number | boolean
```

---

## Module Declarations

### Declare Untyped Packages

```typescript
// types/untyped-lib.d.ts
declare module 'untyped-lib' {
  export function doSomething(input: string): void;
  export const VERSION: string;
}
```

### Augment Existing Modules

```typescript
// Extend Express Request
declare module 'express' {
  interface Request {
    user?: { id: string; role: string };
  }
}
```

### Global Augmentation

```typescript
// Add to global scope
declare global {
  interface Window {
    __APP_CONFIG__: Record<string, string>;
  }
}

export {}; // Required to make this a module
```

### Wildcard Module Declarations

```typescript
// Handle non-JS imports
declare module '*.svg' {
  const content: string;
  export default content;
}

declare module '*.css' {
  const classes: Record<string, string>;
  export default classes;
}
```

---

## Types vs Interfaces

### Use `type` when

- Defining unions, intersections, or conditional types
- Using mapped types or template literal types
- Creating utility types
- You want to prevent accidental declaration merging

### Use `interface` when

- Extending another object type (`interface extends` gives better errors and performance)
- Defining a contract that implementations must follow
- Working with class implementations (`class Foo implements Bar`)

### Key Differences

```typescript
// Declaration merging — interfaces merge, types error
interface A { x: number }
interface A { y: string } // OK, merged to { x: number; y: string }

type B = { x: number }
// type B = { y: string } // Error: Duplicate identifier

// Performance — interface extends is cached, intersections recompute
interface Fast extends Base { extra: string }     // Cached
type Slow = Base & { extra: string };             // Recomputed each use

// Flexibility — types can represent anything
type StringOrNumber = string | number;            // Union (impossible with interface)
type Callback = (x: number) => void;              // Function type
type Pair = [string, number];                     // Tuple
```

### Recommendation

Default to `type` for simple shapes. Use `interface extends` when building type hierarchies. Never use `interface` just because "it's for objects" — that's a myth.
