import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';

/**
 * Type-safe alternative to `By.directive(directive) as any`
 *
 * This helper properly types the DebugElement query result to avoid using `as any`
 * while maintaining the same functionality.
 */
export function queryDirective<T>(
  debugElement: DebugElement,
  directive: any
): DebugElement {
  return debugElement.query(By.directive(directive));
}

/**
 * Type-safe alternative for getting injector from queried directive
 *
 * This helper properly types the injector access to avoid using `as any`
 */
export function getDirectiveInjector<T>(
  debugElement: DebugElement,
  directive: any
): T {
  return debugElement.query(By.directive(directive)).injector.get(directive);
}
