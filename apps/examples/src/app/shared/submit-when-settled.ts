import { computed, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { filter, take } from 'rxjs';

/**
 * Builds a submit handler that waits for async validation to settle before
 * deciding, for forms whose suite has async tests (a username or id lookup).
 *
 * A PENDING form is not an invalid form: checking `formState().valid` while a
 * request is in flight would drop the submission. The returned function runs
 * `decide` once `pending()` is false, and ignores repeated calls while one
 * submission is already waiting, so double clicks never submit twice.
 *
 * Call it in an injection context (a field initializer or the constructor).
 *
 * @example
 * ```ts
 * readonly #submitWhenSettled = createSubmitWhenSettled(() => this.feedback.pending());
 *
 * onSubmit(): void {
 *   this.#submitWhenSettled(() => {
 *     if (this.feedback.formState().valid) this.save(this.formValue());
 *   });
 * }
 * ```
 */
export function createSubmitWhenSettled(
  pending: () => boolean
): (decide: () => void) => void {
  const destroyRef = inject(DestroyRef);
  // `toObservable` replays its last value on subscribe, which can be a stale
  // `false` if validation went PENDING since; re-read the signal to be sure.
  const settled$ = toObservable(computed(pending)).pipe(
    filter((isPending) => !isPending && !pending())
  );
  let waiting = false;

  return (decide) => {
    if (waiting) {
      return;
    }
    waiting = true;
    settled$.pipe(take(1), takeUntilDestroyed(destroyRef)).subscribe(() => {
      try {
        decide();
      } finally {
        waiting = false;
      }
    });
  };
}
