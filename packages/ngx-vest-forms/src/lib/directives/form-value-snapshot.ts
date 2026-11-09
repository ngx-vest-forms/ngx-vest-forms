import { computed, type Signal, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  type FormGroup,
  StatusChangeEvent,
  ValueChangeEvent,
} from '@angular/forms';
import { filter, type Observable, tap } from 'rxjs';
import type { NgxEqualityFn } from '../tokens/equality.token';
import { mergeValuesAndRawValues } from '../utils/form-utils';

/**
 * @internal
 * The merged form value (disabled controls included) of one root form, as a
 * signal, plus the memoized deep-equality check that `FormDirective` uses to
 * compare form snapshots and models.
 *
 * Must be created in an injection context (its `form.events` subscription
 * ends with the injector). A stream that reads the snapshot on a form event
 * builds on {@link valueChanges}, which brings the tick (and the cleared
 * equality memo) up to date for each event before passing it on, whatever
 * the subscription order.
 */
export class FormValueSnapshot<T> {
  readonly #form: FormGroup;

  /**
   * Deep-equality comparator. Defaults to `fastDeepEqual`; can be overridden
   * application-wide or per-component via `NGX_EQUALITY_FN`.
   */
  readonly #equal: NgxEqualityFn;

  /**
   * The last two pairs `isEqual` compared, with their results. One value
   * event makes `formValueChange`, `formState` and the sync effect compare
   * the same two form snapshots (previous and current); this lets the first
   * comparison answer the others. Cleared on every value event, so a result
   * never outlives the change cycle that computed it.
   */
  #equalMemo: Array<{ a: unknown; b: unknown; equal: boolean }> = [];

  /**
   * The root form's last `ValueChangeEvent`, with the root `value` object at
   * that moment, until the next root event arrives.
   */
  #lastValueEvent: { source: unknown; rootValue: unknown } | null = null;

  /** The last form event {@link observe} handled, so each counts once. */
  #lastObservedEvent: unknown = null;

  // Internal signal tracking changes that can affect the merged form snapshot.
  // ValueChangeEvent keeps the cache fresh for blur-driven consumers like
  // draft auto-save, even when a value update doesn't change form validity.
  //
  // Both the snapshot's own `form.events` subscription and `valueChanges`
  // feed each event through `#observe`, so the tick (and the cleared
  // `isEqual` memo) is current for whichever of them sees an event first.
  readonly #formSnapshotTick = signal(0);

  /**
   * The merged form value (including disabled controls), recomputed whenever
   * a value or status event fires. `formValueChange`, `formState` and the
   * sync effect all read this one snapshot, so each value event copies the
   * form value once, and their comparisons of the same two snapshots share
   * one `isEqual` result.
   */
  readonly value: Signal<T | null>;

  /**
   * The root form's `ValueChangeEvent`s, each passed on only after the
   * snapshot has taken it into account, so `value()` and `isEqual()` are
   * current for it. The `formValueChange` output is built on this.
   */
  readonly valueChanges: Observable<ValueChangeEvent<unknown>>;

  constructor(form: FormGroup, equal: NgxEqualityFn) {
    this.#form = form;
    this.#equal = equal;
    form.events.pipe(takeUntilDestroyed()).subscribe((event) => {
      this.#observe(event);
    });
    this.valueChanges = form.events.pipe(
      filter((event) => event instanceof ValueChangeEvent),
      tap((event) => {
        this.#observe(event);
      })
    );
    this.value = computed(() => {
      // Track changes that affect the merged form snapshot.
      this.#formSnapshotTick();
      return this.read();
    });
  }

  /**
   * The equality comparator with two shortcuts: identical references are
   * equal without a call, and a pair compared earlier in this change cycle
   * (in either order) reuses that result. Form snapshots are never mutated
   * after they are created, so a result stays true for the cycle.
   */
  isEqual(a: unknown, b: unknown): boolean {
    if (Object.is(a, b)) {
      return true;
    }
    for (const entry of this.#equalMemo) {
      if (
        (entry.a === a && entry.b === b) ||
        (entry.a === b && entry.b === a)
      ) {
        return entry.equal;
      }
    }
    const equal = this.#equal(a, b);
    this.#equalMemo = [{ a, b, equal }, ...this.#equalMemo.slice(0, 1)];
    return equal;
  }

  /** A fresh copy of the merged form value, or `null` without controls. */
  read(): T | null {
    if (Object.keys(this.#form.controls).length === 0) {
      // No controls remain (e.g. dynamic group removal): expose `null` so
      // consumers don't see ghost data from a previous form contract.
      return null;
    }
    return mergeValuesAndRawValues<T>(this.#form);
  }

  /**
   * Takes one root form event into account, once: a value event clears the
   * equality memo, and an event that can change the merged snapshot moves
   * the tick.
   */
  #observe(event: unknown): void {
    if (event === this.#lastObservedEvent) {
      return;
    }
    this.#lastObservedEvent = event;
    if (event instanceof ValueChangeEvent) {
      this.#equalMemo = [];
    }
    if (this.#changesFormSnapshot(event)) {
      this.#formSnapshotTick.update((count) => count + 1);
    }
  }

  /**
   * Whether a root form event can change the merged snapshot. Every value
   * event and every status event can, except the status event Angular emits
   * right after a value event in the same `updateValueAndValidity` call:
   * nothing runs between the two but the value event's own subscribers. The
   * root `value` object must also be the one the value event saw, because
   * Angular replaces it on any change (even one made with `emitEvent: false`).
   * The snapshot read for the value event (by `formValueChange`) then stays
   * current for the status event instead of being copied a second time.
   */
  #changesFormSnapshot(event: unknown): boolean {
    const lastValueEvent = this.#lastValueEvent;
    this.#lastValueEvent = null;
    if (event instanceof ValueChangeEvent) {
      this.#lastValueEvent = {
        source: event.source,
        rootValue: this.#form.value,
      };
      return true;
    }
    if (event instanceof StatusChangeEvent) {
      return !(
        lastValueEvent &&
        lastValueEvent.source === event.source &&
        lastValueEvent.rootValue === this.#form.value
      );
    }
    return false;
  }
}
