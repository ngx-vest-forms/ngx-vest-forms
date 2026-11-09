import { untracked } from '@angular/core';
import type { FormGroup } from '@angular/forms';
import { distinctUntilChanged, filter, map, type Observable, tap } from 'rxjs';
import { mergeValuesAndRawValues } from '../utils/form-utils';
import type { FormValueSnapshot } from './form-value-snapshot';
import type { ModelFormSync } from './model-form-sync';

/**
 * @internal
 * The stream behind `FormDirective.formValueChange`: the merged form value
 * (disabled controls included) after each value change the user (or app code
 * outside the sync effect) made, deduplicated against the last value seen.
 *
 * Built on `snapshot.valueChanges`, so the snapshot is current for each
 * event. Records each emitted value with `sync.recordEmitted()`, so the sync
 * effect can tell a consumer's follow-up model write from a conflict.
 */
export function formValueChanges<T>(
  form: FormGroup,
  snapshot: FormValueSnapshot<T>,
  sync: ModelFormSync<T>
): Observable<T> {
  return snapshot.valueChanges.pipe(
    // Merge before deduplicating: the event's own value leaves out disabled
    // controls, so a programmatic setValue() on one would look unchanged.
    // The merged snapshot is the one `formState` and the sync effect read;
    // the snapshot tick has already counted this event. `untracked` keeps
    // a consumer effect that writes the form from tracking the snapshot.
    map(() => ({
      value:
        untracked(() => snapshot.value()) ?? mergeValuesAndRawValues<T>(form),
      fromModel: sync.applyingModelValue,
    })),
    // Model writes pass through deduplication so they move its baseline:
    // after a write of B, the user picking the earlier A again is a change.
    distinctUntilChanged((prev, curr) =>
      snapshot.isEqual(prev.value, curr.value)
    ),
    // A model write applied by the sync effect is not echoed back: the
    // consumer already holds that value.
    filter(({ fromModel }) => !fromModel),
    map(({ value }) => value),
    tap((value) => {
      sync.recordEmitted(value);
    })
  );
}
