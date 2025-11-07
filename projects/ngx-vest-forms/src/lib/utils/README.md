# ngx-vest-forms Utility Types and Functions

This directory contains all utility types and functions provided by ngx-vest-forms. These utilities help with type safety, form state management, and common form operations.

## Table of Contents

- [Type Utilities](#type-utilities)
  - [NgxDeepPartial<T>](#ngxdeeppartialt)
  - [NgxDeepRequired<T>](#ngxdeeprequiredt)
  - [NgxFormCompatibleDeepRequired<T>](#ngxformcompatibledeeprequiredt)
  - [NgxVestSuite<T>](#ngxvestsuitet)
  - [NgxFieldKey<T>](#ngxfieldkeyt)
- [Form Utilities](#form-utilities)
  - [getAllFormErrors()](#getallformerrors)
  - [getFormControlField()](#getformcontrolfield)
  - [getFormGroupField()](#getformgroupfield)
  - [mergeValuesAndRawValues()](#mergevaluesandrawvalues)
  - [setValueAtPath()](#setvalueatpath)
- [Array/Object Conversion](#arrayobject-conversion)
  - [arrayToObject()](#arraytoobject)
  - [deepArrayToObject()](#deeparraytoobject)
  - [objectToArray()](#objecttoarray)
- [Field Path Utilities](#field-path-utilities)
  - [parseFieldPath()](#parsefieldpath)
  - [stringifyFieldPath()](#stringifyfieldpath)
- [Field Clearing Utilities](#field-clearing-utilities)
  - [clearFieldsWhen()](#clearfieldswhen)
  - [clearFields()](#clearfields)
  - [keepFieldsWhen()](#keepfieldswhen)
- [Equality Utilities](#equality-utilities)
  - [shallowEqual()](#shallowequal)
  - [fastDeepEqual()](#fastdeepequal)
- [Shape Validation](#shape-validation)
  - [validateShape()](#validateshape)

---

## Type Utilities

### NgxDeepPartial<T>

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

### NgxDeepRequired<T>

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

### NgxFormCompatibleDeepRequired<T>

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

### NgxVestSuite<T>

Type-safe wrapper for Vest.js StaticSuite with cleaner API.

```typescript
import { NgxVestSuite } from 'ngx-vest-forms';
import { staticSuite, test, enforce, only } from 'vest';

type FormModel = { email: string; password: string };

// ✅ Clean: Using NgxVestSuite
export const suite: NgxVestSuite<FormModel> = staticSuite((model, field?) => {
  if (field) {
    only(field);
  }
  test('email', 'Required', () => enforce(model.email).isNotBlank());
});

// ❌ Verbose: Without NgxVestSuite
export const suite: StaticSuite<
  string,
  string,
  (model: FormModel, field?: string) => void
> = staticSuite((model, field?) => {
  /* ... */
});
```

**When to use:**

- ✅ All validation suite type annotations
- ✅ When you want cleaner type signatures
- ✅ For better IDE autocomplete

---

### NgxFieldKey<T>

Type-safe field parameter for validation suites (provides autocomplete).

```typescript
import { NgxFieldKey } from 'ngx-vest-forms';
import { staticSuite, only } from 'vest';

type FormModel = { email: string; password: string };

// ✅ With NgxFieldKey: Get autocomplete for field names
export const suite = staticSuite(
  (model: FormModel, field?: NgxFieldKey<FormModel>) => {
    only(field); // TypeScript knows field is 'email' | 'password' | undefined
    // ... validations
  }
);
```

**When to use:**

- ✅ Optional: adds autocomplete hints for field names
- ✅ Type safety at validation suite level
- ✅ Better developer experience

---

## Form Utilities

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
import { Component, signal } from '@angular/core';
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
  protected readonly formValue = signal<FormModel>({
    phoneNumbers: {},
    addresses: {},
  });

  // LOAD: Convert backend arrays → form-compatible objects
  async ngOnInit() {
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
  async onSubmit() {
    const formData = this.formValue();
    const backendData = objectToArray(formData, [
      'phoneNumbers',
      'addresses',
      'phones',
    ]);
    await this.api.save(backendData);
  }

  // Add item dynamically
  addPhoneNumber(newNumber: string) {
    this.formValue.update((v) => ({
      ...v,
      phoneNumbers: arrayToObject([
        ...Object.values(v.phoneNumbers),
        newNumber,
      ]),
    }));
  }

  // Remove item dynamically
  removePhoneNumber(index: number) {
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
<form scVestForm [suite]="suite" (formValueChange)="formValue.set($event)">
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

Convert between different field path formats (useful for Standard Schema integration, Angular forms, and Vest.js field names).

### parseFieldPath()

Parses path string into segments array.

```typescript
import { parseFieldPath } from 'ngx-vest-forms';

const segments = parseFieldPath('addresses[0].street');
// ['addresses', 0, 'street']

parseFieldPath('users[0].contacts[1].email');
// ['users', 0, 'contacts', 1, 'email']
```

**When to use:**

- ✅ Converting path strings to arrays
- ✅ Standard Schema integration
- ✅ Path manipulation

---

### stringifyFieldPath()

Converts segments array to path string.

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

## Equality Utilities

Utilities for comparing values efficiently.

### shallowEqual()

Compares two objects shallowly (only first level).

```typescript
import { shallowEqual } from 'ngx-vest-forms';

const equal = shallowEqual({ a: 1, b: 2 }, { a: 1, b: 2 }); // true
const notEqual = shallowEqual({ a: 1, b: { c: 3 } }, { a: 1, b: { c: 3 } }); // false (different object references)
```

**When to use:**

- ✅ Fast shallow comparisons
- ✅ Change detection optimization
- ✅ When deep equality is not needed

---

### fastDeepEqual()

Compares two values deeply (recursive comparison).

```typescript
import { fastDeepEqual } from 'ngx-vest-forms';

const equal = fastDeepEqual({ a: 1, b: { c: 3 } }, { a: 1, b: { c: 3 } }); // true
```

**When to use:**

- ✅ Deep value comparisons
- ✅ Complex nested structures
- ✅ When reference equality is not enough

---

## Shape Validation

Runtime validation of form structure against expected shape (development mode only).

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

// Throws ShapeMismatchError if structure doesn't match
validateShape(formValue, formShape, 'formValue');
```

**When to use:**

- ✅ Development mode validation
- ✅ Catching typos in `name` attributes
- ✅ Ensuring form structure matches model
- ✅ Used internally by `scVestForm` directive

**Note:** Only runs in development mode (Angular `isDevMode()`).

---

## Importing Utilities

All utilities are exported from the main package:

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

// Form utilities
import {
  getAllFormErrors,
  getFormControlField,
  getFormGroupField,
  mergeValuesAndRawValues,
  setValueAtPath,
} from 'ngx-vest-forms';

// Array/Object conversion
import {
  arrayToObject,
  deepArrayToObject,
  objectToArray,
} from 'ngx-vest-forms';

// Field path utilities
import { parseFieldPath, stringifyFieldPath } from 'ngx-vest-forms';

// Field clearing
import { clearFieldsWhen, clearFields, keepFieldsWhen } from 'ngx-vest-forms';

// Equality utilities
import { shallowEqual, fastDeepEqual } from 'ngx-vest-forms';

// Shape validation
import { validateShape, ShapeMismatchError } from 'ngx-vest-forms';
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
- **Vest.js Documentation**: https://vestjs.dev/
- **Angular Forms Guide**: https://angular.dev/guide/forms/template-driven-forms

---

## Contributing

When adding new utilities:

1. Add comprehensive tests (`*.spec.ts`)
2. Export from `public-api.ts`
3. Document in this README
4. Update main instructions file
5. Consider adding `Ngx` prefixed alias for library-specific utilities
