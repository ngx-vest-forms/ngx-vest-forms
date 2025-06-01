# ngx-vest-forms Example Gallery

A curated set of examples demonstrating best practices and advanced features of `ngx-vest-forms` with Angular Template Driven Forms. Start with the basics and progress to advanced scenarios, including dynamic fields and schema validation with Zod/Valibot.

---

## Example Navigation Table

| Example Name             | File/Folder                         | Key Concepts                                                         | Complexity   |
| ------------------------ | ----------------------------------- | -------------------------------------------------------------------- | ------------ |
| Simple Form              | `simple-form/`                      | Basic group, two fields, minimal validation                          | Basic        |
| Field Path Example       | `simple-form/field-path-example.ts` | Field path utilities, signals, computed, modern Angular control flow | Intermediate |
| Cyclic Dependencies Form | `cyclic-dependencies-form/`         | `validationConfig` for interdependent fields, cycle handling         | Intermediate |

---

## Field Path Example: Deep/Nested Access with Field Path Utilities

**Location:** `src/app/simple-form/field-path-example.ts`

- Demonstrates robust, type-safe access to deeply nested form values and errors using `getValueAtPath` and `setValueAtPath` utilities.
- Uses Angular signals and `computed` for reactive access to nested state.
- Leverages the new Angular control flow syntax (`@if`, `@for`) for dynamic rendering.
- Shows programmatic updates to nested values and custom error display.
- **Recommended for:** Developers building dynamic forms, custom wrappers, or needing programmatic access to nested fields/errors.

---

| Phone Numbers Form | `phone-numbers-form/` | Minimal form array, two-way binding, signals | Basic |
| Business Hours Form | `business-hours-form/` | Array of objects, cross-field, array validation | Intermediate |
| Purchase Form | `purchase-form/` | Deeply nested, async, conditional, dynamic, schema | Advanced |

---

## 1. Simple Form

**Location:** `src/app/simple-form/`

- Shows a basic form group with two fields (`firstName`, `lastName`).
- Demonstrates minimal setup with `ngxVestForm`, `[vestSuite]`, and `[formSchema]`.
- Uses the new `formState` API for value and error access.
- **Recommended for:** New users, onboarding, and as a starting template.

---

## 2. Phone Numbers Form

**Location:** `src/app/phone-numbers-form/`

- Demonstrates a minimal form array pattern using a custom component (`ngx-phone-numbers`).
- Uses signals and two-way binding for array values.
- Error display is handled by `ngxControlWrapper`.
- **Recommended for:** Learning dynamic arrays and signal-based patterns.

---

## 3. Business Hours Form

**Location:** `src/app/business-hours-form/`

- Shows a form with an array of objects (business hours entries).
- Demonstrates cross-field and array-level validation (e.g., no overlap, required fields).
- Uses `[formSchema]` for type safety and typo detection.
- Uses robust error display and modern Angular control flow (`@if`, `@for`).
- **Recommended for:** Intermediate users, custom validation logic, and array-of-object forms.

---

## 4. Purchase Form (Advanced)

**Location:** `src/app/purchase-form/`

- Deeply nested form with multiple groups, arrays, and conditional fields.
- Demonstrates:
  - Async validation (e.g., user ID uniqueness)
  - Dynamic field requirements (e.g., emergency contact, shipping address)
  - Cross-field and root-level validation
  - Integration with external APIs (e.g., SWAPI, product service)
  - Use of `[formSchema]` and type inference
  - Advanced error display and debug patterns
- **Recommended for:** Advanced users, real-world complex forms, and as a reference for best practices.

---

## 5. Advanced: Using Zod/Valibot/ArkType Schemas

**Location:** See `business-hours-form.zod-example.ts` or create your own in any example folder.

- Shows how to use Zod, Valibot, or ArkType schemas with `ngx-vest-forms` for runtime and compile-time validation.
- Demonstrates type inference and schema-driven validation.
- **Recommended for:** Users needing runtime validation, advanced type safety, or integration with external schema libraries.

---

## 6. Dynamic Fields & Arrays

- All array examples (`phone-numbers-form`, `business-hours-form`, `purchase-form`) show how to add/remove fields dynamically.
- Use signals and `[formValue]` for dynamic updates.
- See the `onAdd...` and `onRemove...` handlers in each example for patterns.

---

## 7. Cyclic Field Dependencies

**Location:** `src/app/cyclic-dependencies-form/`

- Illustrates how to configure `validationConfig` for fields that have mutual dependencies (e.g., field A requires field B, and field B requires field A under certain conditions).
- Shows a Vest suite structured with `only(field)` to correctly handle such scenarios.
- Demonstrates that `ngx-vest-forms` prevents infinite validation loops that can arise from cyclic dependencies.
- **Recommended for:** Forms where the validity or requirement of one field directly influences another in a reciprocal manner.

---

## How to Use These Examples

- Each example is self-contained and can be run independently.
- Start with the simplest example and progress to more advanced ones as needed.
- Use the code as a template for your own forms, adapting patterns as required.
- Refer to the in-file comments and the main `README.md` for further guidance.

---

## Contributing More Examples

If you have a use case not covered here (e.g., file uploads, custom widgets, third-party schema libraries), feel free to add a new folder under `src/app/` and document it in this file.
