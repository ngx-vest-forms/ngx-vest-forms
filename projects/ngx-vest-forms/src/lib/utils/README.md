# ngx-vest-forms Utility Types and Functions

This directory contains all utility types and functions provided by ngx-vest-forms. These utilities help with type safety, form state management, and common form operations.

## Table of Contents

- [Type Utilities](#type-utilities)
  - [NgxDeepPartial\<T\>](#ngxdeeppartialt)
  - [NgxDeepRequired\<T\>](#ngxdeeprequiredt)
  - [NgxFormCompatibleDeepRequired\<T\>](#ngxformcompatibledeeprequiredt)
  - [NgxVestSuite\<T\>](#ngxvestsuitet-and-deprecated-ngxtypedvestsuitet)
  - [NgxFieldKey\<T\>](#ngxfieldkeyt)
- [Form Utilities](#form-utilities)
  - [setValueAtPath()](#setvalueatpath)
  - [createDebouncedPendingState()](#createdebouncedpendingstate)
- [Internal Form Utilities](#internal-form-utilities) ⚠️
  - [getAllFormErrors()](#getallformerrors)
  - [getFormControlField()](#getformcontrolfield)
  - [getFormGroupField()](#getformgroupfield)
  - [mergeValuesAndRawValues()](#mergevaluesandrawvalues)
- [Array/Object Conversion](#arrayobject-conversion)
  - [arrayToObject()](#arraytoobject)
  - [deepArrayToObject()](#deeparraytoobject)
  - [objectToArray()](#objecttoarray)
- [Field Path Utilities](#field-path-utilities)
  - [stringifyFieldPath()](#stringifyfieldpath)
- [Internal Path Utilities](#internal-path-utilities) ⚠️
  - [parseFieldPath()](#parsefieldpath)
- [Field Clearing Utilities](#field-clearing-utilities)
  - [clearFieldsWhen()](#clearfieldswhen)
  - [clearFields()](#clearfields)
  - [keepFieldsWhen()](#keepfieldswhen)
- [Internal Equality Utilities](#internal-equality-utilities) ⚠️
  - [shallowEqual()](#shallowequal)
  - [fastDeepEqual()](#fastdeepequal)
- [Internal Shape Validation](#internal-shape-validation) ⚠️
  - [validateShape()](#validateshape)

---

## Type Utilities

### NgxDeepPartial\<T\>

**Recommended** - Makes every property and child property partial recursively.

**Why?** Template-driven forms are inherently deep partial since they're created incrementally by the DOM.

```typescript
import { NgxDeepPartial } from 'ngx-vest-forms';

interface UserModel {
  name: string;
  profile: {
    age: number;
    isActive: boolean;
  };
}

// All properties become optional recursively
type PartialUser = NgxDeepPartial<UserModel>;
// Result: {
//   name?: string;
//   profile?: {
//     age?: number;
//     isActive?: boolean;
//   };
// }

// Typical for template-driven forms
const formValue = signal<NgxDeepPartial<UserModel>>({});
```

**Backward Compatible Alias:** `DeepPartial<T>` (use `NgxDeepPartial<T>` in new code)

**When to use:**

- ✅ Form model types (forms build incrementally)
- ✅ Optional configuration objects
- ✅ Partial updates to existing data

---

### NgxDeepRequired\<T\>

Makes every property required recursively (opposite of `NgxDeepPartial`).

```typescript
import { NgxDeepRequired, NgxDeepPartial } from 'ngx-vest-forms';

type FormModel = NgxDeepPartial<{
  name: string;
  profile: { age: number };
}>;

// For runtime validation shapes
const formShape: NgxDeepRequired<FormModel> = {
  name: '',
  profile: {
    age: 0,
  },
};
```

**Backward Compatible Alias:** `DeepRequired<T>` (use `NgxDeepRequired<T>` in new code)

**When to use:**

- ✅ Creating form shapes for runtime validation
- ✅ Ensuring complete data before API submission
- ✅ Default values or initial state

---

### NgxFormCompatibleDeepRequired\<T\>

**Recommended for Date fields** - Makes properties required while converting `Date` to `Date | string`.

**Why?** Solves the `Date !== string` type mismatch that occurs in form initialization.

```typescript
import { NgxFormCompatibleDeepRequired } from 'ngx-vest-forms';

interface UserModel {
  id?: number;
  name?: string;
  birthDate?: Date;
  profile?: {
    createdAt?: Date;
    isActive?: boolean;
  };
}

type FormUser = NgxFormCompatibleDeepRequired<UserModel>;
// Result: {
//   id: number;
//   name: string;
//   birthDate: Date | string;  // <-- Date gets union treatment
//   profile: {
//     createdAt: Date | string;  // <-- Recursive application
//     isActive: boolean;         // <-- Other types unchanged
//   };
// }

// Now you can safely initialize with empty strings for dates
const formData: FormUser = {
  id: 0,
  name: '',
  birthDate: '', // ✅ Valid: string allowed for Date properties
  profile: {
    createdAt: '', // ✅ Valid: works recursively
    isActive: false,
  },
};
```

**Backward Compatible Alias:** `FormCompatibleDeepRequired<T>` (use `NgxFormCompatibleDeepRequired<T>` in new code)

**When to use:**

- ✅ Form models with Date fields
- ✅ Avoiding type errors on form initialization
- ✅ Creating form shapes that accept both Date objects and date strings

---

### NgxVestSuite\<T\> (and deprecated NgxTypedVestSuite\<T\>)

`NgxVestSuite<T>` is the canonical public suite type in v3.x.

**Use for**: suite definitions, component properties, helper function parameters, and public APIs.

```typescript
import { NgxVestSuite } from 'ngx-vest-forms';
import { create, test, enforce } from 'vest';

type FormModel = { email: string; password: string };

// ✅ Simple: Using NgxVestSuite (no autocomplete, but works everywhere)
export const suite: NgxVestSuite<FormModel> = create((model) => {
  test('email', 'Required', () => enforce(model.email).isNotBlank());
});
// Field focus at call site: suite.only('email').run(model)

// Component - works seamlessly
@Component({...})
class MyFormComponent {
  protected readonly suite: NgxVestSuite<FormModel> = suite;
}
```

#### NgxTypedVestSuite\<T\> - Deprecated alias

`NgxTypedVestSuite<T>` still works, but it is a deprecated alias of `NgxVestSuite<T>`.

```typescript
import { NgxTypedVestSuite } from 'ngx-vest-forms';

// ✅ Backward-compatible, but deprecated naming
export const suite: NgxTypedVestSuite<FormModel> = create(
  (model: FormModel) => {
    // IDE suggests field names for test() calls: 'email' | 'password' | typeof ROOT_FORM
    test('email', 'Required', () => enforce(model.email).isNotBlank());
  }
);
```

#### Recommended Pattern

Define and consume suites with `NgxVestSuite<T>` unless you are keeping an older file stable during migration:

```typescript
import { NgxVestSuite } from 'ngx-vest-forms';

export const userSuite: NgxVestSuite<FormModel> = create(
  (model: FormModel) => {
    // ✅ IDE autocomplete for test() field names: 'email' | 'password' | typeof ROOT_FORM
    test('email', 'Required', () => enforce(model.email).isNotBlank());
  }
);

@Component({...})
class MyFormComponent {
  protected readonly suite: NgxVestSuite<FormModel> = userSuite;
}
```

#### Three Usage Options Compared

| Approach                                                | Autocomplete     | Explicit Type    | Flexible             | Recommended             |
| ------------------------------------------------------- | ---------------- | ---------------- | -------------------- | ----------------------- |
| **Recommended Pattern** (use `NgxVestSuite` everywhere) | ✅ At definition | ✅ In component  | ✅ Accepts any suite | ✅ **Best**             |
| **Type Inference** (`const suite = ...`)                | ✅ At definition | ❌ Inferred only | ❌ Too specific      | ⚠️ Works but less clear |
| **Deprecated Alias** (`NgxTypedVestSuite<T>`)           | ✅ At definition | ✅ Explicit      | ✅ Accepts any suite | ⚠️ Back-compat only     |

**When to use:**

- ✅ **NgxVestSuite**: Component properties (template compatibility)
- ✅ **Recommended Pattern**: New code and updated examples
- ✅ **Simple NgxVestSuite**: Simple forms without autocomplete needs
- ⚠️ **NgxTypedVestSuite**: Older code you have not renamed yet

---

### NgxFieldKey\<T\>

Type-safe field parameter for validation suites (provides autocomplete).

```typescript
import { NgxFieldKey } from 'ngx-vest-forms';
import { create } from 'vest';

type FormModel = { email: string; password: string };

// NgxFieldKey provides type-safe field keys: 'email' | 'password'
// In Vest 6, field focus is at the call site — not in the callback
// Example: suite.only('email' as NgxFieldKey<FormModel>).run(model)
export const suite = create((model: FormModel) => {
  // ... validations
});
```

**When to use:**

- ✅ Optional: adds autocomplete hints for field names
- ✅ Type safety at validation suite level
- ✅ Better developer experience

---

## Form Utilities

### setValueAtPath()

Sets a value at a nested path using dot notation (creates intermediate objects).

```typescript
import { setValueAtPath } from 'ngx-vest-forms';

const obj = {};
setValueAtPath(obj, 'user.profile.name', 'John');
// obj = { user: { profile: { name: 'John' } } }

setValueAtPath(obj, 'addresses[0].street', 'Main St');
// obj = { addresses: { 0: { street: 'Main St' } } }
```

**Backward Compatible Alias:** `set()` (use `setValueAtPath()` in new code)

**When to use:**

- ✅ Dynamic form value updates
- ✅ Programmatic form population
- ✅ Handling deeply nested structures

---

### createDebouncedPendingState()

Creates a debounced pending state signal that prevents flashing validation messages during async validations.

```typescript
import { createDebouncedPendingState } from 'ngx-vest-forms';
import { Component, inject } from '@angular/core';
import { FormErrorDisplayDirective } from 'ngx-vest-forms';

@Component({
  selector: 'ngx-custom-wrapper',
  hostDirectives: [
    { directive: FormErrorDisplayDirective, inputs: ['errorDisplayMode'] },
  ],
  template: `
    <ng-content />
    @if (showPendingMessage()) {
      <div role="status" aria-live="polite" aria-atomic="true">
        <span aria-hidden="true">⏳</span>
        Validating…
      </div>
    }
  `,
})
export class CustomWrapperComponent {
  protected readonly errorDisplay = inject(FormErrorDisplayDirective, {
    self: true,
  });

  // Create debounced pending state
  private readonly pendingState = createDebouncedPendingState(
    this.errorDisplay.isPending,
    { showAfter: 200, minimumDisplay: 500 }
  );

  protected readonly showPendingMessage = this.pendingState.showPendingMessage;
}
```

**Options:**

- `showAfter` (default: 200ms) - Delay before showing pending message
- `minimumDisplay` (default: 500ms) - Minimum time to keep message visible once shown

**Returns:**

- `showPendingMessage` - Signal that is true when pending message should be shown
- `cleanup()` - Optional cleanup function (effect cleanup handles most cases)

**When to use:**

- ✅ Creating custom control wrappers with async validation feedback
- ✅ Preventing "Validating..." message from flashing for quick validations
- ✅ Ensuring pending messages stay visible long enough to be noticed
- ✅ Improving UX for async form validation

**How it works:**

1. When validation starts, waits `showAfter`ms before showing pending message
2. If validation completes before `showAfter`, message never appears (prevents flash)
3. Once shown, keeps message visible for at least `minimumDisplay`ms (prevents flicker)

---

## Internal Form Utilities

> **⚠️ Internal API**: These utilities are marked with `@internal` in their source files and are not part of the primary public API. They are exported for advanced use cases but may change without notice. Consider using alternative approaches or Angular's built-in form APIs instead.

### getAllFormErrors()

Gets all form errors organized by field path (supports nested fields and arrays).

```typescript
import { getAllFormErrors } from 'ngx-vest-forms';

const errors = getAllFormErrors(form);
// {
//   'email': ['Email is required'],
//   'addresses.billing.street': ['Street is required'],
//   'phoneNumbers[0].number': ['Invalid format']
// }
```

**When to use:**

- ✅ Displaying all errors on submit
- ✅ Custom error summaries
- ✅ Debugging form validation state

---

### getFormControlField()

Gets the dot-notation path of a form control relative to root form.

```typescript
import { getFormControlField } from 'ngx-vest-forms';

const path = getFormControlField(rootForm, control);
// 'addresses.billing.street'
```

**When to use:**

- ✅ Building dynamic validation logic
- ✅ Custom error display components
- ✅ Debugging control paths

---

### getFormGroupField()

Gets the dot-notation path of a form group relative to root form.

```typescript
import { getFormGroupField } from 'ngx-vest-forms';

const path = getFormGroupField(rootForm, group);
// 'addresses.billing'
```

**When to use:**

- ✅ Working with nested form groups
- ✅ Group-level validation
- ✅ Dynamic form structure

---

### mergeValuesAndRawValues()

Merges enabled and disabled field values (includes disabled fields in result).

```typescript
import { mergeValuesAndRawValues } from 'ngx-vest-forms';

const allValues = mergeValuesAndRawValues(form);
// Includes both enabled and disabled field values
```

**When to use:**

- ✅ Submitting forms with disabled fields
- ✅ Getting complete form state
- ✅ Conditional field handling

---

## Array/Object Conversion

Angular template-driven forms struggle with arrays. These utilities convert arrays to objects with numeric keys, enabling `ngModelGroup` to work with dynamic arrays (phone numbers, addresses, etc.).

### arrayToObject()

Converts arrays to objects with numeric keys (shallow conversion).

```typescript
import { arrayToObject } from 'ngx-vest-forms';

const phoneNumbers = ['123-4567', '987-6543'];
const phoneObject = arrayToObject(phoneNumbers);
// { 0: '123-4567', 1: '987-6543' }

// Use in form model
this.formValue.update((v) => ({
  ...v,
  phoneNumbers: arrayToObject(phoneNumbers),
}));
```

**When to use:**

- ✅ Converting single-level arrays for forms
- ✅ Loading backend arrays into form
- ✅ Simple list structures

---

### deepArrayToObject()

Converts all arrays to objects recursively (deep conversion).

```typescript
import { deepArrayToObject } from 'ngx-vest-forms';

const addresses = [
  { street: 'Main St', phones: ['111', '222'] },
  { street: '2nd Ave', phones: ['333'] },
];

const converted = deepArrayToObject(addresses);
// {
//   0: { street: 'Main St', phones: { 0: '111', 1: '222' } },
//   1: { street: '2nd Ave', phones: { 0: '333' } }
// }
```

**When to use:**

- ✅ Complex nested array structures
- ✅ Arrays of objects containing arrays
- ✅ When all arrays need conversion

---

### objectToArray()

Converts specified object properties back to arrays (selective reverse conversion).

```typescript
import { objectToArray } from 'ngx-vest-forms';

const formData = {
  name: 'John',
  phoneNumbers: { 0: '123-4567', 1: '987-6543' },
  addresses: {
    0: { street: 'Main St', phones: { 0: '111', 1: '222' } },
    1: { street: '2nd Ave', phones: { 0: '333' } },
  },
};

// Convert back to arrays for API
const apiData = objectToArray(formData, [
  'phoneNumbers',
  'addresses',
  'phones',
]);
// {
//   name: 'John',
//   phoneNumbers: ['123-4567', '987-6543'],
//   addresses: [
//     { street: 'Main St', phones: ['111', '222'] },
//     { street: '2nd Ave', phones: ['333'] }
//   ]
// }
```

**When to use:**

- ✅ Converting form data back to arrays before API submission
- ✅ Selective array conversion (specify which properties)
- ✅ Handling cascading nested arrays

---

### Complete Array Conversion Workflow

```typescript
import { Component, signal, inject, effect } from '@angular/core';
import { arrayToObject, objectToArray } from 'ngx-vest-forms';

type BackendData = {
  phoneNumbers: string[];
  addresses: Array<{ street: string; phones: string[] }>;
};

type FormModel = {
  phoneNumbers: { [key: number]: string };
  addresses: {
    [key: number]: { street: string; phones: { [key: number]: string } };
  };
};

@Component({
  // ...
})
export class MyFormComponent {
  private readonly api = inject(ApiService);
  protected readonly formValue = signal<FormModel>({
    phoneNumbers: {},
    addresses: {},
  });

  constructor() {
    // LOAD: Convert backend arrays → form-compatible objects
    this.loadData();
  }

  private async loadData() {
    const data = await this.api.load();
    this.formValue.set({
      phoneNumbers: arrayToObject(data.phoneNumbers),
      addresses: arrayToObject(
        data.addresses.map((addr) => ({
          ...addr,
          phones: arrayToObject(addr.phones),
        }))
      ),
    });
  }

  // SUBMIT: Convert form objects → backend arrays
  protected async save() {
    const formData = this.formValue();
    const backendData = objectToArray(formData, [
      'phoneNumbers',
      'addresses',
      'phones',
    ]);
    await this.api.save(backendData);
  }

  // Add item dynamically
  protected addPhoneNumber(newNumber: string) {
    this.formValue.update((v) => ({
      ...v,
      phoneNumbers: arrayToObject([
        ...Object.values(v.phoneNumbers),
        newNumber,
      ]),
    }));
  }

  // Remove item dynamically
  protected removePhoneNumber(index: number) {
    this.formValue.update((v) => {
      const phones = Object.values(v.phoneNumbers).filter(
        (_, i) => i !== index
      );
      return { ...v, phoneNumbers: arrayToObject(phones) };
    });
  }
}
```

**Template usage with ngModelGroup:**

```html
<form ngxVestForm [suite]="suite" (formValueChange)="formValue.set($event)">
  <!-- Use ngModelGroup with numeric keys -->
  <div
    *ngFor="let phoneKV of formValue().phoneNumbers | keyvalue: originalOrder"
  >
    <div [ngModelGroup]="phoneKV.key">
      <input name="number" [ngModel]="phoneKV.value" />
      <button type="button" (click)="removePhoneNumber(+phoneKV.key)">
        Remove
      </button>
    </div>
  </div>

  <button type="button" (click)="addPhoneNumber('')">Add Phone</button>
</form>
```

---

## Field Path Utilities

> **💡 Type Safety**: For compile-time type checking and IDE autocomplete of field paths, see the **[Field Path Types Guide](../../../../docs/FIELD-PATHS.md)** which covers `FieldPath<T>`, `ValidationConfigMap<T>`, and `FormFieldName<T>`.

### stringifyFieldPath()

Converts segments array to path string (public API).

```typescript
import { stringifyFieldPath } from 'ngx-vest-forms';

const path = stringifyFieldPath(['addresses', 0, 'street']);
// 'addresses[0].street'

stringifyFieldPath(['form', 'sections', 0, 'fields', 'name']);
// 'form.sections[0].fields.name'
```

**When to use:**

- ✅ Converting arrays to path strings
- ✅ Building dynamic field paths
- ✅ Error message formatting

---

## Internal Path Utilities

> **⚠️ Internal API**: This utility is marked with `@internal` and is not part of the primary public API. It's exported for advanced use cases but may change without notice.

### parseFieldPath()

Parses path string into segments array (internal utility).

```typescript
import { parseFieldPath } from 'ngx-vest-forms';

const segments = parseFieldPath('addresses[0].street');
// ['addresses', 0, 'street']

parseFieldPath('users[0].contacts[1].email');
// ['users', 0, 'contacts', 1, 'email']
```

**When to use:**

- ⚠️ Advanced integration scenarios only
- ⚠️ May change without notice
- ✅ Consider using `stringifyFieldPath()` for most use cases

---

## Field Clearing Utilities

Utilities for conditionally clearing form fields based on conditions.

### clearFieldsWhen()

Clears specified fields when conditions are met.

```typescript
import { clearFieldsWhen } from 'ngx-vest-forms';

this.formValue.update((v) =>
  clearFieldsWhen(v, {
    shippingAddress: !needsShipping,
    emergencyContact: isAdult,
  })
);
```

**When to use:**

- ✅ Conditional field clearing
- ✅ Multi-step forms
- ✅ Dynamic form logic

---

### clearFields()

Unconditionally clears specified fields.

```typescript
import { clearFields } from 'ngx-vest-forms';

this.formValue.update((v) => clearFields(v, ['tempData', 'draft']));
```

**When to use:**

- ✅ Reset specific fields
- ✅ Cleanup temporary data
- ✅ Form section reset

---

### keepFieldsWhen()

Whitelist approach - keeps only fields that meet conditions.

```typescript
import { keepFieldsWhen } from 'ngx-vest-forms';

this.formValue.update((v) =>
  keepFieldsWhen(v, {
    basicInfo: true,
    shipping: needsShipping,
    billing: true,
  })
);
```

**When to use:**

- ✅ Whitelist approach to field preservation
- ✅ Complex conditional logic
- ✅ Multi-step form navigation

---

## Internal Equality Utilities

> **⚠️ Internal API**: These utilities are marked with `@internal` and are not part of the primary public API. They are exported for advanced use cases but may change without notice. Consider using your own comparison logic or a library like lodash if you need equality checks in your application.

### shallowEqual()

Compares two objects shallowly (only first level) - internal utility.

```typescript
import { shallowEqual } from 'ngx-vest-forms';

const equal = shallowEqual({ a: 1, b: 2 }, { a: 1, b: 2 }); // true
const notEqual = shallowEqual({ a: 1, b: { c: 3 } }, { a: 1, b: { c: 3 } }); // false (different object references)
```

**When to use:**

- ⚠️ Advanced performance optimization only
- ⚠️ Used internally for form change detection
- ✅ Consider using your own comparison logic instead

---

### fastDeepEqual()

Compares two values deeply (recursive comparison) - internal utility.

```typescript
import { fastDeepEqual } from 'ngx-vest-forms';

const equal = fastDeepEqual({ a: 1, b: { c: 3 } }, { a: 1, b: { c: 3 } }); // true
```

**When to use:**

- ⚠️ Advanced performance optimization only
- ⚠️ Used internally for form value comparison
- ✅ Consider using your own comparison logic instead

---

## Internal Shape Validation

> **⚠️ Internal API**: This utility is used internally by the library and may change without notice.

### validateShape()

Validates form value matches expected shape.

```typescript
import { validateShape, NgxDeepRequired, NgxDeepPartial } from 'ngx-vest-forms';

type FormModel = NgxDeepPartial<{
  name: string;
  profile: { age: number };
}>;

const formShape: NgxDeepRequired<FormModel> = {
  name: '',
  profile: { age: 0 },
};

// Logs a warning if structure doesn't match in dev mode
validateShape(formValue, formShape, 'formValue');
```

**When to use:**

- ⚠️ Used internally by `ngxVestForm` directive
- ⚠️ Development mode validation only
- ✅ The directive handles this automatically

**Note:** Only runs in development mode (Angular `isDevMode()`).

---

## Importing Utilities

### Public API (Recommended)

```typescript
// Type utilities
import {
  NgxDeepPartial,
  NgxDeepRequired,
  NgxFormCompatibleDeepRequired,
  NgxVestSuite,
  NgxFieldKey,
  // Backward compatible aliases
  DeepPartial,
  DeepRequired,
  FormCompatibleDeepRequired,
} from 'ngx-vest-forms';

// Public form utilities
import { setValueAtPath } from 'ngx-vest-forms';

// Array/Object conversion
import {
  arrayToObject,
  deepArrayToObject,
  objectToArray,
} from 'ngx-vest-forms';

// Field path utilities
import { stringifyFieldPath } from 'ngx-vest-forms';

// Field clearing
import { clearFieldsWhen, clearFields, keepFieldsWhen } from 'ngx-vest-forms';

// Form state utilities
import { createEmptyFormState, NgxFormState } from 'ngx-vest-forms';
```

### Internal API (Advanced Use Only)

> **⚠️ Warning**: These are marked with `@internal` and may change without notice.

```typescript
// Internal form utilities (consider alternatives)
import {
  getAllFormErrors,
  getFormControlField,
  getFormGroupField,
  mergeValuesAndRawValues,
} from 'ngx-vest-forms';

// Internal path utilities (consider alternatives)
import { parseFieldPath } from 'ngx-vest-forms';

// Internal equality utilities (consider lodash or custom logic)
import { shallowEqual, fastDeepEqual } from 'ngx-vest-forms';

// Internal shape validation (automatic via directive)
import { validateShape } from 'ngx-vest-forms';
```

---

## Naming Convention

**Recommended:** Use `Ngx` prefixed versions in new code:

- ✅ `NgxDeepPartial<T>` (prevents naming conflicts with other libraries)
- ✅ `NgxDeepRequired<T>` (clearly identifies ngx-vest-forms utilities)
- ✅ `NgxFormCompatibleDeepRequired<T>` (explicit library association)

**Backward Compatible:** Non-prefixed aliases available:

- `DeepPartial<T>` → use `NgxDeepPartial<T>` in new code
- `DeepRequired<T>` → use `NgxDeepRequired<T>` in new code
- `FormCompatibleDeepRequired<T>` → use `NgxFormCompatibleDeepRequired<T>` in new code

Both versions work identically; the `Ngx`-prefixed versions are recommended for new code to avoid conflicts and clearly identify library utilities.

---

## Related Documentation

- **Main README**: [/README.md](../../../../../README.md)
- **Instructions**: [/.github/instructions/ngx-vest-forms.instructions.md](../../../../../.github/instructions/ngx-vest-forms.instructions.md)
- **Vest.js Documentation**: <https://vestjs.dev/>
- **Angular Forms Guide**: <https://angular.dev/guide/forms/template-driven-forms>

---

## Contributing

When adding new utilities:

1. Add comprehensive tests (`*.spec.ts`)
2. Export from `public-api.ts`
3. Document in this README
4. Update main instructions file
5. Consider adding `Ngx` prefixed alias for library-specific utilities
