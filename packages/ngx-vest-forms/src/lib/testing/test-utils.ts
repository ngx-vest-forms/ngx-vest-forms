import { DebugElement, Type } from '@angular/core';
import { By } from '@angular/platform-browser';

/**
 * Typed alternative to `debugElement.query(By.directive(directive as any))`.
 *
 * Returns the first descendant `DebugElement` that hosts `directive`.
 */
export function queryDirective(
  debugElement: DebugElement,
  directive: Type<unknown>
): DebugElement {
  return debugElement.query(By.directive(directive));
}

/**
 * Typed alternative for reading a directive instance from the injector of
 * the element that hosts it.
 *
 * The result type follows from the `directive` class, so no cast is needed:
 * `getDirectiveInjector(fixture.debugElement, FormDirective)` returns a
 * `FormDirective`.
 */
export function getDirectiveInjector<T>(
  debugElement: DebugElement,
  directive: Type<T>
): T {
  return debugElement.query(By.directive(directive)).injector.get(directive);
}
