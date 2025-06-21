import { computed, Directive, effect, Input, signal } from '@angular/core';
import { SmartStateExtension } from './smart-state-extension';
import type {
  ConflictState,
  SmartStateOptions,
} from './smart-state-extension.types';

/**
 * Directive to provide smart-state management for Angular forms.
 * Usage: attach to a form and bind [externalData] and [smartStateOptions].
 */
@Directive({
  selector: '[ngxSmartStateExtension]',
  standalone: true,
})
export class NgxVestFormsSmartStateDirective<TModel> {
  @Input() externalData: TModel | null = null;
  @Input() smartStateOptions: SmartStateOptions<TModel> = {};
  @Input() formValue: TModel | null = null;
  @Input() isDirty = false;
  @Input() isValid = true;

  readonly #conflictState = signal<ConflictState<TModel> | null>(null);
  readonly smartState = new SmartStateExtension<TModel>(this.#conflictState);

  readonly mergedValue = computed(() =>
    this.smartState.smartMerge(
      this.formValue,
      this.externalData,
      this.formValue,
      this.externalData,
      this.smartStateOptions,
      this.isDirty,
      this.isValid,
    ),
  );

  constructor() {
    // Optionally, add effects for conflict detection, etc.
    effect(() => {
      // Example: update conflict state if needed
      // this.#conflictState.set(...)
    });
  }
}
