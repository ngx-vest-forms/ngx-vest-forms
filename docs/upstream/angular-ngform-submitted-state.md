# Upstream request: public API to set NgForm's submitted state

Ready to file at https://github.com/angular/angular/issues/new (feature request,
area: forms). Tracked locally in ngx-vest-forms#215. Replace the placeholders
before filing.

---

**Title:** `NgForm`: public way to set or clear the submitted state without `resetForm()` or `onSubmit()`

## Which `@angular/*` package is the feature request for?

forms

## Description

`NgForm.submitted` is a read-only getter. The state behind it lives in a
private signal, `submittedReactive`, which `onSubmit()` sets to `true` and
`resetForm()` sets back to `false`. There is no public way to change the
submitted state on its own.

Libraries built on template-driven forms need exactly that. ngx-vest-forms
(a Vest.js validation layer for `NgForm`) has two cases:

1. **Ending a submit cycle without a reset.** After a first submit, error
   display stays "on" because `submitted` stays `true`. An app that wants to
   keep the values, dirty/touched state and validation results but stop
   showing submit-triggered errors (for example in a long multi-step form,
   once the user has fixed the errors and moves on) has no supported way to do
   so.
2. **Running a submit pass without emitting `ngSubmit`.** A library may need
   to mark the form as submitted, re-run validators, and let the app decide
   whether to proceed.

Today the library reaches into the private field:

```ts
(ngForm as unknown as { submittedReactive?: WritableSignal<boolean> })
  .submittedReactive?.set(submitted);
```

This works on Angular 22, is guarded so it does nothing if the field is
renamed, and is covered by a contract test run weekly against `@angular/core@next`.
It is still a dependency on an internal name that can change in any release.

### Why the public methods are not substitutes

- `NgForm.resetForm()` resets control values, `pristine`, `touched` and
  `untouched`, and the validation status of every control, in addition to
  clearing `submitted`. It emits `FormResetEvent`. We only want the flag.
- `NgForm.onSubmit($event)` sets `submitted` to `true` but cannot set it to
  `false`. It also emits `ngSubmit`, which runs the app's submit handler and
  can trigger a server call, and it emits `FormSubmittedEvent`.
- Reading `submitted` is also awkward: the getter uses `untracked()`, so it
  cannot drive a `computed()` or `effect()`. Consumers have to rebuild the
  state from `FormSubmittedEvent` / `FormResetEvent`.

## Proposed solution

Any one of these would do, in order of preference:

1. Make the state a public readonly signal and add a setter:

   ```ts
   class NgForm {
     /** Reactive; tracked by computed() and effect(). */
     readonly submittedState: Signal<boolean>;
     /** Sets the submitted flag only. Emits no ngSubmit and does not touch control state. */
     setSubmitted(submitted: boolean): void;
   }
   ```

2. Only `setSubmitted(submitted: boolean): void`, keeping `submitted` as is.
3. Expose `submittedReactive` as a public, documented `WritableSignal<boolean>`.

`setSubmitted(true)` should emit `FormSubmittedEvent` and `setSubmitted(false)`
should not emit `FormResetEvent` (nothing was reset), or a dedicated event
could be added. The maintainers will know which fits the events API best.

## Alternatives considered

- Calling `resetForm()` and restoring values and control state afterwards:
  loses `touched`/`dirty` metadata and fires reset listeners.
- Rebuilding the flag from `FormSubmittedEvent` / `FormResetEvent` in the
  library (what ngx-vest-forms does for reading): covers reads, not writes.
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
    </form>
    @if (f.submitted) { <p>submitted</p> }
  `,
})
export class Repro {
  email = '';
  saved = false;
  form = viewChild.required(NgForm);

  endSubmitCycle() {
    // Goal: submitted -> false, keeping value, dirty and touched state.
    // this.form().submitted = false;   // error: read-only getter
    // this.form().resetForm();         // resets value, dirty and touched too
    // this.form().onSubmit(null);      // can only set true, and emits ngSubmit
  }
}
```

## Environment

- Angular 22.2 (the private field exists since 22.0)
- Consumer: ngx-vest-forms (https://github.com/ngx-vest-forms/ngx-vest-forms)
