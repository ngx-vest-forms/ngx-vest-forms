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
};

export function runVestSuite<TModel, TResult>({
  suite,
  model,
  field,
  debounceTime = 0,
  destroyRef,
  mapResult,
  onError,
}: VestRunnerOptions<TModel, TResult>): Observable<TResult> {
  return timer(debounceTime).pipe(
    map(() => model),
    switchMap(
      (snapshot) =>
        new Observable<TResult>((observer) => {
          const controller = new AbortController();
          const unregisterDestroy = destroyRef.onDestroy(() => {
            controller.abort();
          });

          const complete = (value: TResult): void => {
            observer.next(value);
            observer.complete();
          };

          try {
            suite(snapshot, field, { signal: controller.signal }).done(
              (result) => {
                if (controller.signal.aborted) return;
                complete(mapResult(result));
              }
            );
          } catch (error) {
            if (!controller.signal.aborted) {
              complete(onError(error));
            }
          }

          return () => {
            unregisterDestroy();
            controller.abort();
          };
        })
    ),
    catchError((error) => of(onError(error))),
    take(1)
  );
}
