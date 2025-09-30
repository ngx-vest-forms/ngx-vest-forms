# Codemod: `migrate-to-safe-suite`

## Purpose

Automatically migrate existing Vest.js validation suites from unsafe patterns (manual `only(field)` guards) to safe wrappers (`staticSafeSuite` / `createSafeSuite`), eliminating the risk of the `only(undefined)` bug.

## Target Patterns

### Pattern 1: `staticSuite` with Manual Guard

**Before:**

```typescript
import { staticSuite, only, test, enforce } from 'vest';

export const userSuite = staticSuite((data, field) => {
  if (field) {
    only(field);
  }
  test('email', 'Required', () => enforce(data.email).isNotEmpty());
});
```

**After:**

```typescript
import { staticSafeSuite } from 'ngx-vest-forms/core';
import { test, enforce } from 'vest';

export const userSuite = staticSafeSuite((data) => {
  test('email', 'Required', () => enforce(data.email).isNotEmpty());
});
```

### Pattern 2: `create` with Manual Guard

**Before:**

```typescript
import { create, only, test, enforce } from 'vest';

export const userSuite = create((data, field) => {
  if (field) {
    only(field);
  }
  test('email', 'Required', () => enforce(data.email).isNotEmpty());
});
```

**After:**

```typescript
import { createSafeSuite } from 'ngx-vest-forms/core';
import { test, enforce } from 'vest';

export const userSuite = createSafeSuite((data) => {
  test('email', 'Required', () => enforce(data.email).isNotEmpty());
});
```

### Pattern 3: Type Parameters Preservation

**Before:**

```typescript
import { staticSuite, only, test, enforce } from 'vest';

interface UserModel {
  email: string;
  password: string;
}

type UserFields = 'email' | 'password';

export const userSuite = staticSuite((data: UserModel, field?: UserFields) => {
  if (field) {
    only(field);
  }
  test('email', 'Required', () => enforce(data.email).isNotEmpty());
});
```

**After:**

```typescript
import { staticSafeSuite } from 'ngx-vest-forms/core';
import { test, enforce } from 'vest';

interface UserModel {
  email: string;
  password: string;
}

type UserFields = 'email' | 'password';

export const userSuite = staticSafeSuite<UserModel, UserFields>((data) => {
  test('email', 'Required', () => enforce(data.email).isNotEmpty());
});
```

### Pattern 4: Comments and JSDoc Preservation

**Before:**

```typescript
import { staticSuite, only, test, enforce } from 'vest';

/**
 * User registration validation suite
 * @param data - User form data
 * @param field - Optional field for selective validation
 */
export const userSuite = staticSuite((data, field) => {
  // Optimize performance with selective validation
  if (field) {
    only(field);
  }

  test('email', 'Email is required', () => {
    enforce(data.email).isNotEmpty();
  });
});
```

**After:**

```typescript
import { staticSafeSuite } from 'ngx-vest-forms/core';
import { test, enforce } from 'vest';

/**
 * User registration validation suite
 * @param data - User form data
 */
export const userSuite = staticSafeSuite((data) => {
  test('email', 'Email is required', () => {
    enforce(data.email).isNotEmpty();
  });
});
```

## Transformation Rules

### 1. Import Statement Updates

**Rules:**

1. Add import for `staticSafeSuite` or `createSafeSuite` from `'ngx-vest-forms/core'`
2. Remove `only` from vest imports if no longer used
3. Remove `staticSuite` or `create` from vest imports
4. Preserve all other vest imports (`test`, `enforce`, etc.)
5. Maintain import order and formatting

**Examples:**

```typescript
// Before
import { staticSuite, only, test, enforce, skipWhen } from 'vest';

// After
import { staticSafeSuite } from 'ngx-vest-forms/core';
import { test, enforce, skipWhen } from 'vest';
```

```typescript
// Before (only used elsewhere)
import { staticSuite, only, test } from 'vest';
only('someField'); // Used outside suite

// After (preserve only import)
import { staticSafeSuite } from 'ngx-vest-forms/core';
import { only, test } from 'vest';
only('someField'); // Still used
```

### 2. Function Signature Transformation

**Rules:**

1. Replace `staticSuite` → `staticSafeSuite`
2. Replace `create` → `createSafeSuite`
3. Remove `field` parameter from suite function
4. Extract type annotations from `data` and `field` parameters
5. Apply as generic type parameters: `staticSafeSuite<DataType, FieldType>`
6. Preserve default values for `data` parameter

**Examples:**

```typescript
// Before
staticSuite((data, field) => { ... })
// After
staticSafeSuite((data) => { ... })

// Before
staticSuite((data: UserModel, field?: string) => { ... })
// After
staticSafeSuite<UserModel, string>((data) => { ... })

// Before
staticSuite((data = {}, field) => { ... })
// After
staticSafeSuite((data = {}) => { ... })

// Before
create((data: Partial<User>, field?: keyof User) => { ... })
// After
createSafeSuite<Partial<User>, keyof User>((data) => { ... })
```

### 3. Guard Removal

**Rules:**

1. Detect `if (field)` blocks at the start of suite function
2. Detect `if (field != null)` or `if (field !== undefined)` variants
3. Remove the entire conditional statement
4. Remove `only(field)` call inside the conditional
5. Preserve any other code in the suite body

**Examples:**

```typescript
// Before
if (field) {
  only(field);
}
test('email', ...);

// After
test('email', ...);
```

```typescript
// Before
if (field != null) {
  only(field);
}
test('email', ...);

// After
test('email', ...);
```

```typescript
// Before (complex guard)
if (field && typeof field === 'string') {
  only(field);
}
test('email', ...);

// After
test('email', ...);
```

### 4. Comment Preservation

**Rules:**

1. Preserve JSDoc comments above suite declaration
2. Preserve inline comments within suite body
3. Remove comments that reference `field` parameter
4. Update JSDoc `@param` to remove `field` parameter

**Examples:**

```typescript
// Before
/**
 * User validation suite
 * @param data - User form data
 * @param field - Field to validate
 */
export const suite = staticSuite((data, field) => { ... });

// After
/**
 * User validation suite
 * @param data - User form data
 */
export const suite = staticSafeSuite((data) => { ... });
```

### 5. Edge Cases

**Rules:**

1. Skip transformation if `only()` is called without a guard (report as manual fix needed)
2. Skip transformation if `field` is used elsewhere in suite body (report as manual fix needed)
3. Skip transformation if suite is not exported or assigned to a variable
4. Handle multiple suite declarations in the same file independently

## CLI Usage

### Basic Usage

```bash
# Dry-run mode (preview changes without applying)
npx @ngx-vest-forms/codemod migrate-to-safe-suite src/**/*.ts --dry-run

# Apply transformations
npx @ngx-vest-forms/codemod migrate-to-safe-suite src/**/*.ts

# Apply with confirmation prompts
npx @ngx-vest-forms/codemod migrate-to-safe-suite src/**/*.ts --interactive

# Apply to specific files
npx @ngx-vest-forms/codemod migrate-to-safe-suite src/validations/user.ts src/validations/product.ts
```

### Options

| Option          | Alias | Default  | Description                                        |
| --------------- | ----- | -------- | -------------------------------------------------- |
| `--dry-run`     | `-d`  | `false`  | Preview changes without applying                   |
| `--interactive` | `-i`  | `false`  | Prompt for confirmation before each transformation |
| `--verbose`     | `-v`  | `false`  | Show detailed transformation logs                  |
| `--skip-errors` |       | `false`  | Continue on errors instead of stopping             |
| `--extensions`  | `-e`  | `ts,tsx` | File extensions to transform                       |
| `--parser`      | `-p`  | `ts`     | Parser to use (ts, tsx, babel)                     |

### Output Format

```
🔍 Analyzing files...
  ✓ src/validations/user.ts (1 suite found)
  ✓ src/validations/product.ts (2 suites found)
  ⚠ src/validations/order.ts (manual fix needed - field used in suite body)

📝 Preview of changes:

  src/validations/user.ts
  ────────────────────────────────────────
  - import { staticSuite, only, test } from 'vest';
  + import { staticSafeSuite } from 'ngx-vest-forms/core';
  + import { test } from 'vest';

  - export const userSuite = staticSuite((data, field) => {
  -   if (field) {
  -     only(field);
  -   }
  + export const userSuite = staticSafeSuite((data) => {
      test('email', ...);
    });

✅ Successfully transformed 3 files
⚠ 1 file requires manual review
📄 Changes written to disk

Run with --dry-run to preview without applying changes.
```

## Implementation Details

### Technology Stack

**Option A: jscodeshift (Recommended)**

- Battle-tested for large-scale codemods
- Used by React, Next.js, and Angular
- Good TypeScript support via `@types/jscodeshift`

**Option B: ts-morph**

- Native TypeScript AST manipulation
- Type-aware transformations
- Better for complex type operations

**Recommendation:** Start with jscodeshift for initial implementation, consider ts-morph if type-aware transformations are needed.

### AST Transformation Steps

1. **Parse**: Parse TypeScript file into AST
2. **Find**: Locate all `staticSuite` / `create` call expressions
3. **Extract**: Extract type parameters from function signature
4. **Transform**: Apply transformation rules
5. **Validate**: Ensure transformed code is valid
6. **Format**: Format output using Prettier
7. **Write**: Write changes back to file

### Type Extraction Algorithm

```typescript
// Input AST node
const arrowFunction = path.node.arguments[0];

// Extract parameter types
const dataParam = arrowFunction.params[0];
const fieldParam = arrowFunction.params[1];

let dataType: string | undefined;
let fieldType: string | undefined;

if (dataParam.typeAnnotation) {
  dataType = extractTypeAnnotation(dataParam.typeAnnotation);
}

if (fieldParam?.typeAnnotation) {
  fieldType = extractTypeAnnotation(fieldParam.typeAnnotation);
}

// Build generic type parameters
const typeParams = [dataType, fieldType].filter(Boolean).join(', ');
const genericString = typeParams ? `<${typeParams}>` : '';

// Apply to new function call
return `staticSafeSuite${genericString}((data) => { ... })`;
```

### Testing Strategy

#### Unit Tests

1. **Import transformation**
   - ✅ Add `staticSafeSuite` import
   - ✅ Remove `only` import when unused
   - ✅ Preserve other imports
   - ✅ Handle multiple import statements

2. **Function signature transformation**
   - ✅ Remove `field` parameter
   - ✅ Extract and apply type parameters
   - ✅ Preserve `data` default values
   - ✅ Handle various type annotation formats

3. **Guard removal**
   - ✅ Remove `if (field)` blocks
   - ✅ Remove `only(field)` calls
   - ✅ Handle different guard patterns
   - ✅ Preserve other code

4. **Comment preservation**
   - ✅ Keep JSDoc comments
   - ✅ Update `@param` tags
   - ✅ Keep inline comments
   - ✅ Remove field-related comments

#### Integration Tests

1. **Real-world examples**
   - ✅ Transform actual validation files
   - ✅ Verify TypeScript compilation succeeds
   - ✅ Verify tests still pass
   - ✅ Verify runtime behavior unchanged

2. **Edge cases**
   - ✅ Multiple suites per file
   - ✅ Nested function calls
   - ✅ Complex type parameters
   - ✅ Mixed safe and unsafe patterns

## Implementation Checklist

### Phase 1: Setup

- [ ] Create codemod package structure
- [ ] Set up jscodeshift or ts-morph
- [ ] Configure TypeScript and build tools
- [ ] Set up testing infrastructure (Jest or Vitest)

### Phase 2: Core Transformation

- [ ] Implement import statement transformation
- [ ] Implement function signature transformation
- [ ] Implement guard detection and removal
- [ ] Implement type parameter extraction
- [ ] Implement comment preservation

### Phase 3: CLI

- [ ] Build CLI with commander.js or yargs
- [ ] Implement dry-run mode
- [ ] Implement interactive mode
- [ ] Implement verbose logging
- [ ] Add progress indicators

### Phase 4: Testing

- [ ] Write unit tests for each transformation
- [ ] Write integration tests with real examples
- [ ] Test edge cases and error handling
- [ ] Add regression tests

### Phase 5: Documentation

- [ ] Write usage guide
- [ ] Create video tutorial
- [ ] Add examples repository
- [ ] Document edge cases and limitations

### Phase 6: Distribution

- [ ] Publish to npm as `@ngx-vest-forms/codemod`
- [ ] Add to main package as optional dependency
- [ ] Create GitHub releases
- [ ] Announce in documentation and blog

## Usage Examples

### Example 1: Simple Migration

```bash
# Before running codemod
cat src/validations/user.ts
```

```typescript
import { staticSuite, only, test, enforce } from 'vest';

export const userSuite = staticSuite((data, field) => {
  if (field) {
    only(field);
  }
  test('email', 'Required', () => enforce(data.email).isNotEmpty());
});
```

```bash
# Run codemod
npx @ngx-vest-forms/codemod migrate-to-safe-suite src/validations/user.ts

# After running codemod
cat src/validations/user.ts
```

```typescript
import { staticSafeSuite } from 'ngx-vest-forms/core';
import { test, enforce } from 'vest';

export const userSuite = staticSafeSuite((data) => {
  test('email', 'Required', () => enforce(data.email).isNotEmpty());
});
```

### Example 2: Batch Migration

```bash
# Migrate all validation files
npx @ngx-vest-forms/codemod migrate-to-safe-suite "src/**/*.validations.ts"

# Output
✅ Transformed 24 files
⚠ 2 files require manual review:
  - src/validations/complex.ts (field used in suite body)
  - src/validations/legacy.ts (no guard found - unsafe pattern)
```

### Example 3: Interactive Mode

```bash
npx @ngx-vest-forms/codemod migrate-to-safe-suite src/**/*.ts --interactive

# Output
🔍 Found suite in src/validations/user.ts

  Preview:
  - staticSuite((data, field) => {
  -   if (field) { only(field); }
  + staticSafeSuite((data) => {

  Apply this transformation? (y/N/all/quit) y
  ✅ Transformed src/validations/user.ts

🔍 Found suite in src/validations/product.ts
  ...
```

## Related Resources

- [Safe Suite Implementation Guide](./SAFE_SUITE_IMPLEMENTATION.md)
- [Safe Suite Migration Guide](./SAFE_SUITE_MIGRATION.md)
- [ESLint Rule Proposal](./ESLINT_RULE_PROPOSAL.md)
- [jscodeshift Documentation](https://github.com/facebook/jscodeshift)
- [ts-morph Documentation](https://ts-morph.com/)

## Future Enhancements

1. **Auto-detect model types** from nearby interface/type declarations
2. **Suggest type parameters** based on usage analysis
3. **Migrate test helpers** (e.g., update `include().when()` usage)
4. **Format output** using project's Prettier config
5. **VS Code extension** for inline transformations
6. **Git integration** for automatic commit messages
