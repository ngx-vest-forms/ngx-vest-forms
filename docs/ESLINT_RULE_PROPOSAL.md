# ESLint Rule Proposal: Enforce `if (field)` Guard Around `only(field)`

## Problem

Developers frequently forget to guard `only(field)` with an `if (field)` check in Vest validation suites, causing a critical bug where no validation tests run when `field` is `undefined`.

## Proposed ESLint Rule

### Rule Name

`vest/require-only-field-guard`

### Rule Description

Enforce that `only(field)` calls are wrapped in an `if (field)` or `if (field !== undefined)` conditional.

### Options

```json
{
  "vest/require-only-field-guard": [
    "error",
    {
      "allowExplicitUndefinedCheck": true,
      "allowTernary": false
    }
  ]
}
```

### Examples of **incorrect** code:

```typescript
// ❌ Direct call without guard
staticSuite((data, field) => {
  only(field);
  test('email', 'Required', () => enforce(data.email).isNotEmpty());
});

// ❌ Ternary expression (not obvious enough)
staticSuite((data, field) => {
  field && only(field);
  test('email', 'Required', () => enforce(data.email).isNotEmpty());
});

// ❌ Guard after test() call
staticSuite((data, field) => {
  test('email', 'Required', () => enforce(data.email).isNotEmpty());
  if (field) {
    only(field); // Should be at the top
  }
});
```

### Examples of **correct** code:

```typescript
// ✅ Proper if guard
staticSuite((data, field) => {
  if (field) {
    only(field);
  }
  test('email', 'Required', () => enforce(data.email).isNotEmpty());
});

// ✅ Explicit undefined check (if option enabled)
staticSuite((data, field) => {
  if (field !== undefined) {
    only(field);
  }
  test('email', 'Required', () => enforce(data.email).isNotEmpty());
});

// ✅ Early return pattern
staticSuite((data, field) => {
  if (!field) {
    // Run all tests
  } else {
    only(field);
  }
  test('email', 'Required', () => enforce(data.email).isNotEmpty());
});
```

### Rule Implementation (Pseudo-code)

```javascript
module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce if guard around only(field) calls in Vest suites',
      category: 'Best Practices',
      recommended: true,
    },
    messages: {
      missingGuard: 'only({{param}}) must be wrapped in if ({{param}}) guard',
      guardAfterTests: 'only({{param}}) guard must come before test() calls',
    },
  },

  create(context) {
    return {
      CallExpression(node) {
        // Check if this is a call to only()
        if (node.callee.name !== 'only') return;

        // Get the parameter name (e.g., 'field')
        const param = node.arguments[0]?.name;
        if (!param) return;

        // Check if only() is inside an if statement with the same parameter
        let parent = node.parent;
        let foundGuard = false;
        let foundTestBefore = false;

        while (parent) {
          if (parent.type === 'IfStatement') {
            // Check if condition is checking the parameter
            if (isCheckingParameter(parent.test, param)) {
              foundGuard = true;
              break;
            }
          }

          // Check if we've passed any test() calls
          if (
            parent.type === 'CallExpression' &&
            parent.callee.name === 'test'
          ) {
            foundTestBefore = true;
          }

          parent = parent.parent;
        }

        if (!foundGuard) {
          context.report({
            node,
            messageId: 'missingGuard',
            data: { param },
          });
        } else if (foundTestBefore) {
          context.report({
            node,
            messageId: 'guardAfterTests',
            data: { param },
          });
        }
      },
    };
  },
};

function isCheckingParameter(test, param) {
  // Check patterns like:
  // - field
  // - field !== undefined
  // - field !== null
  // - typeof field !== 'undefined'
  return (
    (test.type === 'Identifier' && test.name === param) ||
    (test.type === 'BinaryExpression' &&
      test.left.name === param &&
      (test.operator === '!==' || test.operator === '!=') &&
      (test.right.value === undefined || test.right.value === null))
  );
}
```

## Temporary Workaround: TypeScript Overload

Until an ESLint rule is available, add this to your Vest types:

```typescript
// vest.d.ts (in your project)
import 'vest';

declare module 'vest' {
  // Make only() require a non-undefined parameter
  export function only(fieldName: string): void;
  export function only(fieldName: undefined): never; // This will error!
}
```

**Problem with this approach:** TypeScript can't detect the runtime `undefined` value, so this won't actually prevent the bug. We need runtime checking (ESLint).

## Alternative: Runtime Wrapper

Create a wrapper that throws in development:

```typescript
// validation-utils.ts
import { only as vestOnly } from 'vest';

export function only(field: string | undefined) {
  if (field === undefined) {
    if (process.env.NODE_ENV === 'development') {
      throw new Error(
        'only() called with undefined! This will break validation. ' +
          'Wrap only(field) in: if (field) { only(field); }',
      );
    }
    return; // Don't call vestOnly in production to avoid breaking
  }
  vestOnly(field);
}

// Use this in your validation suites instead of Vest's only
export const suite = staticSuite((data, field) => {
  only(field); // Will throw in dev if field is undefined
  // ...
});
```

**Problem:** Developers might still import from 'vest' directly.

## Recommended Solution Stack

1. **Update documentation** (✅ Done)
   - Add prominent warnings in instruction files
   - Create validation suite checklist
   - Add bug fix documentation

2. **Create VS Code snippet** (✅ Done in checklist)
   - Pre-filled template with correct pattern
   - Developers type `vest-suite` and get safe boilerplate

3. **Add ESLint rule** (🔲 TODO)
   - Create custom ESLint plugin or rule
   - Add to project's ESLint configuration
   - Make it a required rule (error, not warning)

4. **Add pre-commit hook** (🔲 TODO)

   ```json
   // package.json
   {
     "husky": {
       "hooks": {
         "pre-commit": "lint-staged"
       }
     },
     "lint-staged": {
       "**/*.validation*.ts": [
         "eslint --rule 'vest/require-only-field-guard: error'"
       ]
     }
   }
   ```

5. **Add unit test template** (🔲 TODO)
   - Provide test that verifies all tests run when field is undefined
   - Copy-paste template developers can use

6. **CI/CD checks** (🔲 TODO)
   - Fail build if pattern is found
   - Grep for `only(field);` without preceding `if (field)`

## Example CI Check (grep-based)

```bash
# .github/workflows/validation-pattern-check.yml
name: Check Validation Patterns

on: [push, pull_request]

jobs:
  check-patterns:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Check for unguarded only() calls
        run: |
          # Find validation files
          FILES=$(find . -name "*.validation*.ts" -o -name "*.validations.ts")

          # Check for pattern: only(field) without preceding if (field)
          # This is a simplified check - real ESLint rule would be better
          for file in $FILES; do
            if grep -Pzo '(?<!if \(field\) \{\n  )only\(field\)' "$file"; then
              echo "❌ Found unguarded only(field) in: $file"
              echo "Must wrap only(field) with: if (field) { only(field); }"
              exit 1
            fi
          done

          echo "✅ All validation suites use proper only() guard pattern"
```

## Priority

**HIGH** - This bug has major UX impact and is easy to introduce. Prevention tooling should be implemented soon.

## Next Steps

1. ✅ Update documentation (completed)
2. 🔲 Create ESLint rule for the project
3. 🔲 Add pre-commit hooks
4. 🔲 Add CI check
5. 🔲 Consider publishing ESLint plugin for community use

## References

- [Bug Fix Documentation](./bug-fixes/only-field-validation-bug.md)
- [Vest.js Instructions](../.github/instructions/vest.instructions.md)
- [Validation Suite Checklist](./VALIDATION_SUITE_CHECKLIST.md)
- [ESLint Custom Rules Documentation](https://eslint.org/docs/latest/extend/custom-rules)
