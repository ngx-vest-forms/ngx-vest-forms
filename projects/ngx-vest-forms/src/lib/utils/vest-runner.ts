import { DestroyRef } from '@angular/core';
import { Observable, catchError, map, of, switchMap, take, timer } from 'rxjs';

type VestRunnerResult = {
  done: (cb: (result: unknown) => void) => void;
};

type VestRunnerSuite<TModel> = (
  model: TModel,
  field?: string,
  options?: { signal: AbortSignal }
) => VestRunnerResult;

export type VestRunnerOptions<TModel, TResult> = {
  suite: VestRunnerSuite<TModel>;
  model: TModel;
  field?: string;
  debounceTime?: number;
  destroyRef: DestroyRef;
  mapResult: (result: unknown) => TResult;
  onError: (error: unknown) => TResult;
  onAbort?: () => TResult;
};

export function runVestSuite<TModel, TResult>({
  suite,
  model,
  field,
  debounceTime = 0,
  destroyRef,
  mapResult,
  onError,
  onAbort,
}: VestRunnerOptions<TModel, TResult>): Observable<TResult> {
  return timer(debounceTime).pipe(
    map(() => model),
    switchMap(
      (snapshot) =>
        new Observable<TResult>((observer) => {
          const controller = new AbortController();
          let settled = false;
          const settle = (value: TResult, emit: boolean): void => {
            if (settled || observer.closed) return;
            settled = true;
            if (emit) {
              observer.next(value);
            }
            observer.complete();
          };

          const unregisterDestroy = destroyRef.onDestroy(() => {
            controller.abort();
            if (onAbort) {
              settle(onAbort(), true);
              return;
            }
            settle(undefined as TResult, false);
          });

          try {
            suite(snapshot, field, { signal: controller.signal }).done(
              (result) => {
                if (controller.signal.aborted) {
                  settle(undefined as TResult, false);
                  return;
                }
                settle(mapResult(result), true);
              }
            );
          } catch (error) {
            if (controller.signal.aborted) {
              settle(undefined as TResult, false);
              return;
            }
            settle(onError(error), true);
          }

          return () => {
            unregisterDestroy();
            controller.abort();
            settle(undefined as TResult, false);
          };
        })
    ),
    catchError((error) => of(onError(error))),
    take(1)
  );
}
