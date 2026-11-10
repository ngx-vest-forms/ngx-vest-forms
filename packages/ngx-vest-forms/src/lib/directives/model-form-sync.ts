import { isDevMode, untracked } from '@angular/core';
import type { FormGroup } from '@angular/forms';
import {
  logDiagnostic,
  NGX_VEST_FORMS_DIAGNOSTICS,
} from '../errors/error-catalog';
import type { FormValueSnapshot } from './form-value-snapshot';

/**
 * @internal
 * The two-way synchronization between `FormDirective`'s `formValue` input
 * (the model) and its form controls: which side wins when one or both
 * changed, and the baselines that tell what changed since the last run.
 *
 * `FormDirective` calls {@link sync} from one effect that reads the merged
 * form snapshot and the `formValue` input. Model wins are written into the
 * form; form wins are not written back (the input is read-only), the
 * `formValueChange` output carries them to the consumer.
 */
export class ModelFormSync<T> {
  readonly #form: FormGroup;
  readonly #snapshot: FormValueSnapshot<T>;

  #lastSyncedFormValue: T | null = null;
  #lastSyncedModelValue: T | null = null;
  /**
   * The last value `formValueChange` handed to the consumer (see
   * {@link recordEmitted}). When the form still holds exactly this value,
   * the consumer has seen the form's latest change, so a model write made in
   * response to it is not a conflict.
   */
  #lastEmittedFormValue: T | null = null;
  /** The `formValue` input as the sync effect last read it. */
  #previousModelInput: T | null = null;
  /** True while the sync effect writes the model into the form. */
  #applyingModelValue = false;

  constructor(form: FormGroup, snapshot: FormValueSnapshot<T>) {
    this.#form = form;
    this.#snapshot = snapshot;
  }

  /**
   * Writes the model into the form controls. Events are emitted so async
   * validators report their results, `formState` refreshes, and
   * `validationConfig` revalidates dependent fields, the same as when
   * NgModel applies the value itself. `formValueChange` skips these events.
   *
   * Root `patchValue` (not per-key `setValue`) supports nested objects and
   * ignores keys without a control, which fits partial form models.
   *
   * Moves both sync baselines. The form baseline is the form's value after
   * the write, not the model: a partial model leaves other controls as they
   * were, and the model as baseline would make the next run see a form
   * change, then a model change, and write again on every validation.
   */
  #applyModelValue(modelValue: T | null): void {
    if (modelValue) {
      this.#applyingModelValue = true;
      try {
        this.#form.patchValue(modelValue);
      } finally {
        this.#applyingModelValue = false;
      }
    }
    this.#lastSyncedFormValue = this.#snapshot.read();
    this.#lastSyncedModelValue = modelValue;
  }

  /** True while the sync effect writes the model into the form. */
  get applyingModelValue(): boolean {
    return this.#applyingModelValue;
  }

  /** Records the value `formValueChange` just handed to the consumer. */
  recordEmitted(value: T | null): void {
    this.#lastEmittedFormValue = value;
  }

  /**
   * One run of the sync effect: compares the merged form value and the
   * model with their baselines, and writes the model into the form when
   * the model wins.
   */
  sync(formValue: T | null, modelValue: T | null): void {
    // Whether the consumer passed a new model since the last run. The
    // `lastSynced` baselines can't tell: the form-wins branch moves them.
    const modelInputChanged = !this.#snapshot.isEqual(
      modelValue,
      this.#previousModelInput
    );
    this.#previousModelInput = modelValue;

    // Skip if either is null
    if (!formValue && !modelValue) return;

    // Compute change flags first
    const formChanged = !this.#snapshot.isEqual(
      formValue,
      this.#lastSyncedFormValue
    );
    const modelChanged = !this.#snapshot.isEqual(
      modelValue,
      this.#lastSyncedModelValue
    );

    // Early return if nothing changed
    if (!formChanged && !modelChanged) {
      return;
    }

    if (formChanged && !modelChanged) {
      // Form was modified by user -> form wins
      // Note: We can't call this.formValue.set() since it's an input()
      // The formValueChange output will emit the new value
      this.#lastSyncedFormValue = formValue;
      this.#lastSyncedModelValue = formValue;
    } else if (modelChanged && !formChanged) {
      if (!modelInputChanged) {
        // The consumer passed no new model; only the baseline moved. The
        // form-wins branch records the form value as the model baseline,
        // expecting the consumer to echo `formValueChange` back. With a
        // one-way `[formValue]` binding that echo never comes, and treating
        // the stale input as a model change would write it over the
        // user's edits (or a reset) on the next status change.
        this.#lastSyncedModelValue = modelValue;
        return;
      }
      // Model was modified programmatically -> model wins
      // untracked(): the form write runs validators and other code that may
      // read signals; the sync effect must not start tracking those.
      untracked(() => {
        this.#applyModelValue(modelValue);
      });
    } else if (formChanged && modelChanged) {
      // Both form and model changed simultaneously
      // Check if they changed to the same value (synchronized change) or different values (conflict)
      const valuesEqual = this.#snapshot.isEqual(formValue, modelValue);

      if (valuesEqual) {
        // Both changed to the same value - this is a synchronized change, not a conflict
        // Just update tracking to acknowledge the change
        this.#lastSyncedFormValue = formValue;
        this.#lastSyncedModelValue = formValue;
      } else if (!formValue) {
        // The merged form snapshot is null (e.g. an empty form with no
        // controls yet, or all controls removed) while the model changed.
        // This is NOT a real divergence between two live values — there is
        // no form value to conflict with — so let the model win and apply
        // it, mirroring the `modelChanged && !formChanged` branch. This
        // also prevents a false-positive conflict warning during the
        // initial render of forms whose controls are not registered yet.
        untracked(() => {
          this.#applyModelValue(modelValue);
        });
      } else if (
        modelInputChanged &&
        this.#snapshot.isEqual(formValue, this.#lastEmittedFormValue)
      ) {
        // The consumer already received this form value through
        // `formValueChange` and wrote a different model in response, e.g.
        // clearing fields that a switched section no longer shows. That is
        // a follow-up write, not a conflict: the model wins.
        untracked(() => {
          this.#applyModelValue(modelValue);
        });
      } else if (this.#form.pristine) {
        // If Angular still considers the form pristine, the divergent form
        // snapshot was not produced by user input. This happens during
        // programmatic signal updates and initial control registration, where
        // a stale form snapshot can be observed in the same turn as the new
        // model input. Let the model win instead of reporting a user-edit
        // conflict.
        //
        // Unless the consumer passed no new model: then the model baseline
        // differs only because a one-way `[formValue]` binding never echoed
        // a form-wins sync (e.g. after `resetForm()`), and the form changed
        // structurally (a control was removed). Keep the form.
        untracked(() => {
          if (modelInputChanged) {
            this.#applyModelValue(modelValue);
          } else {
            this.#lastSyncedFormValue = formValue;
            this.#lastSyncedModelValue = formValue;
          }
        });
      } else {
        // Both sides hold distinct, non-null live values - this is a true
        // conflict. It is an edge case that should rarely happen in
        // practice.
        //
        // We keep the form's current values (form wins, consistent with the
        // `formChanged && !modelChanged` branch) but we MUST advance BOTH
        // tracking baselines. Previously this branch did nothing, so
        // `#lastSyncedFormValue`/`#lastSyncedModelValue` stayed stale and
        // every subsequent effect run was re-classified as a conflict
        // forever — permanently dropping later programmatic `formValue`
        // updates. Advancing the baselines lets the next single-sided
        // change synchronize correctly.
        this.#lastSyncedFormValue = formValue;
        this.#lastSyncedModelValue = formValue;

        if (isDevMode()) {
          logDiagnostic(NGX_VEST_FORMS_DIAGNOSTICS.SYNC_CONFLICT_DROPPED);
        }
      }
    }
  }

  /**
   * Resets the sync baselines after `resetForm()`: the form baseline is
   * cleared and the model baseline becomes the current `formValue` input.
   */
  resetBaselines(modelInput: T | null): void {
    this.#lastSyncedFormValue = null;
    this.#lastSyncedModelValue = modelInput;
  }
}
