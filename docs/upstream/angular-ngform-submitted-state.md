# Upstream request: public API to clear NgForm's submitted state

Ready to file at https://github.com/angular/angular/issues/new (feature
request, area: forms). Tracked locally in ngx-vest-forms#215.

---

**Title:** `NgForm`: public way to clear the submitted state without `resetForm()`

## Which `@angular/*` package is the feature request for?

forms

## Description

`NgForm.submitted` is a read-only getter. The state behind it lives in a
private signal, `submittedReactive`, which `onSubmit()` sets to `true` and
`resetForm()` sets back to `false`. There is no public way to end a submit
cycle on its own.

The need: **clear the submitted state without resetting the form.** After a
first submit, `submitted` stays `true`, so anything keyed on it (for example
"show errors after submit") stays on. An app that wants to keep the values,
dirty/touched state and validation results, but stop treating the form as
submitted, has no supported way to do so. A typical case is a long or
multi-form workflow: the user submitted once, fixed the reported errors, and
continues editing untouched parts of the page. Errors should not reappear on
every keystroke just because the form was submitted earlier.

ngx-vest-forms (a Vest.js validation layer for `NgForm`) exposes this as
`clearSubmittedState()`. It only ever writes `false`, and today it does so by
reaching into the private field:

```ts
(ngForm as unknown as { submittedReactive?: WritableSignal<boolean> })
  .submittedReactive?.set(false);
```

The write is guarded so it does nothing if the field is renamed, and a
contract test runs weekly against `@angular/core@next`. It is still a
dependency on an internal name that can change in any release. The private
field is present in `@angular/forms` 18.1.4, 18.2.x, 19.0.0 and 21.0.0
(checked in the published packages) and absent in 17.3.12 and 18.0.0.

### Why the public methods are not substitutes

- `NgForm.resetForm()` resets control values, `pristine`, `touched` and
  `untouched`, and the validation status of every control, in addition to
  clearing `submitted`. It emits `FormResetEvent`. We only want the flag.
- `NgForm.onSubmit($event)` can only set `submitted` to `true`. It also emits
  `ngSubmit`, which runs the app's submit handler and can trigger a server
  call.
- Reading `submitted` is also awkward: the getter uses `untracked()`, so it
  cannot drive a `computed()` or `effect()`. Consumers have to rebuild the
  state from `FormSubmittedEvent` / `FormResetEvent`.

## Proposed solution

Any one of these would do, in order of preference:

1. A reactive readonly signal plus a setter:

   ```ts
   class NgForm {
     /** Reactive; tracked by computed() and effect(). */
     readonly submittedState: Signal<boolean>;
     /** Sets the submitted flag only. Emits no ngSubmit and leaves control state alone. */
     setSubmitted(submitted: boolean): void;
   }
   ```

2. Only `setSubmitted(submitted: boolean): void`, keeping `submitted` as is.
3. A narrower `clearSubmitted(): void`, if a general setter is unwanted.

The use case is clearing. `setSubmitted(true)` is proposed only for API
symmetry; nothing in ngx-vest-forms needs it. Whether clearing should emit an
event (`FormResetEvent` would be wrong, since nothing was reset) is for the
Angular team to decide.

## Alternatives considered

- Calling `resetForm()` and restoring values and control state afterwards:
  loses `touched`/`dirty` metadata and fires reset listeners.
- Rebuilding the flag from `FormSubmittedEvent` / `FormResetEvent` in the
  library (what ngx-vest-forms does for reading): covers reads, not writes to
  `NgForm.submitted` itself.
- Writing the private signal (current workaround): fragile by definition.

## Minimal reproduction

```ts
import { Component, viewChild } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';

@Component({
  selector: 'app-repro',
  imports: [FormsModule],
  template: `
    <form #f="ngForm" (ngSubmit)="saved = true">
      <input name="email" [(ngModel)]="email" required />
      <button type="submit">Save</button>
      <button type="button" (click)="endSubmitCycle()">Clear submitted</button>
    </form>
    @if (f.submitted) {
      <p>submitted</p>
    }
  `,
})
export class Repro {
  email = '';
  saved = false;
  readonly form = viewChild.required(NgForm);

  endSubmitCycle(): void {
    // Goal: `submitted` becomes false while value, dirty and touched state stay.
    // this.form().submitted = false; // compile error: `submitted` is a getter only
    this.form().resetForm(); // works, but also clears the value and touched/dirty state
  }
}
```

Type something, press Save (the "submitted" text appears), then press "Clear
submitted": the only public route, `resetForm()`, also empties the input.

## Environment

- Angular 22.2
- Consumer: ngx-vest-forms (https://github.com/ngx-vest-forms/ngx-vest-forms)
