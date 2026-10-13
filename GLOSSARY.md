# ngx-vest-forms

ngx-vest-forms connects Angular template-driven forms to Vest.js validation. This glossary covers the library's language and the workspace that builds and publishes it.

## Language

### Forms

**Form Model**:
The typed data a form edits. It is always partial, because a template-driven form builds its value one control at a time.
_Avoid_: form data, form shape

**Form Contract**:
The complete expected structure of a Form Model, used during development to catch controls whose names don't match it.
_Avoid_: form shape, shape

**Field Path**:
The dotted path from the form root to one value, such as `address.street`. A control's Field Path is its enclosing `ngModelGroup` names followed by its own `name`: `name="street"` inside `ngModelGroup="address"` is `address.street`.
_Avoid_: property path, control name

**Root Form**:
The whole form treated as one validation target, for messages that belong to no single field.
_Avoid_: form-level field, global errors

**Child Form Component**:
A component that renders part of a parent form's controls and joins the parent form rather than creating its own.
_Avoid_: sub-form, nested form

### Validation

**Suite**:
The Vest suite that holds every validation rule for one Form Model.
_Avoid_: validator, schema

**Error**:
A validation message that makes its field, or the Root Form, invalid.

**Warning**:
A validation message that informs while leaving its field's validity unchanged.
_Avoid_: advisory, soft error

**Root-Form Rule**:
A rule whose message belongs to the Root Form instead of a field.
_Avoid_: form-level validation, global rule

**Focused Run**:
A validation run limited to selected fields or groups of the Suite.
_Avoid_: focus, partial validation

**Trigger Field**:
A field whose change revalidates other fields.

**Dependent Field**:
A field revalidated when its Trigger Field changes, because its rules read the Trigger Field's value.
_Avoid_: linked field, watched field

**Validation Config**:
The map from each Trigger Field to its Dependent Fields.
_Avoid_: dependency map, triggers

**Pending**:
The state of a field while one of its asynchronous rules is still running.

### Feedback

**Control Wrapper**:
The component around one control that shows its Errors, Warnings and Pending state.
_Avoid_: field wrapper, error wrapper

**Form Group Wrapper**:
The component around a nested group of controls that shows the group's Errors and Warnings.
_Avoid_: group control wrapper

**Display Mode**:
The policy that decides when an Error or a Warning becomes visible, such as after blur or after submit. Errors and Warnings each have their own.
_Avoid_: show mode, visibility mode

**Submitted State**:
Whether the form has been submitted since it was last reset or cleared. Display Modes that wait for submit read it.

**First-Invalid Focus**:
Moving keyboard focus to the first invalid control after a failed submit.
_Avoid_: auto-focus, scroll-to-error

**Field Blur Event**:
The notice a form emits when a control loses focus, carrying that field's freshly validated state and the whole Form Model.
_Avoid_: blur save, blur hook

### Dynamic forms

**Structure Change**:
A change in which controls a form renders that changes no value, such as replacing an input with static text.

**Field Clearing**:
Removing the values of controls that are no longer rendered, so hidden data stops affecting validation and submit.

**Composite Adapter**:
A component that edits several Field Paths through one widget, such as a date-range picker.
_Avoid_: compound control, multi-field control

### Workspace

**Published Package**:
A package built with Angular package semantics and published to npm for external consumers. `packages/` holds only published packages.
_Avoid_: publishable library, npm package

**Stable Import Path**:
The import specifier consumers use (`ngx-vest-forms`). It stays the same through any internal workspace change.

**Examples App**:
The runnable application that demonstrates and exercises the library. It is built and deployed, never published to npm.
_Avoid_: demo app, companion app, playground

**Examples E2E App**:
The end-to-end test project that checks the behaviour of the Examples App.
