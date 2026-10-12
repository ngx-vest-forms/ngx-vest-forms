import {
  AbstractControl,
  ControlValueAccessor,
  FormArray,
  FormGroup,
  NgForm,
  NgModel,
} from '@angular/forms';
import { stringifyFieldPath } from '../utils/field-path.utils';

type ResolvedFieldPath = {
  path: string;
  control: AbstractControl;
};

function isLeafControl(control: AbstractControl): boolean {
  return !(control instanceof FormGroup || control instanceof FormArray);
}

/**
 * @internal
 * Resolves a blurred event target to its dotted form path, Angular control,
 * and resolved host element.
 */
export function resolveFieldFromBlur(
  ngForm: NgForm,
  eventTarget: EventTarget | null
): {
  field: string;
  control: AbstractControl;
  element: HTMLElement;
} | null {
  if (!(eventTarget instanceof Element)) {
    return null;
  }

  const fieldElement = eventTarget.closest('[name]');
  if (!(fieldElement instanceof HTMLElement)) {
    return null;
  }

  const name = fieldElement.getAttribute('name')?.trim();
  if (!name) {
    return null;
  }

  const formEl = fieldElement.closest('form');
  if (!(formEl instanceof HTMLFormElement)) {
    return null;
  }

  const directiveMatch = resolveControlPathByNgModelDirective(
    ngForm,
    fieldElement
  );
  if (directiveMatch) {
    return {
      field: directiveMatch.path,
      control: directiveMatch.control,
      element: fieldElement,
    };
  }

  const staticGroups = collectNgModelGroupAttributes(fieldElement, formEl);
  const staticPath = [...staticGroups, name].join('.');
  const staticControl = ngForm.form.get(staticPath);
  if (staticControl) {
    return { field: staticPath, control: staticControl, element: fieldElement };
  }

  const dynamicMatch = resolveControlPathByDomAncestors(
    ngForm.form,
    fieldElement,
    formEl,
    name
  );
  if (!dynamicMatch) {
    return null;
  }

  return {
    field: dynamicMatch.path,
    control: dynamicMatch.control,
    element: fieldElement,
  };
}

/**
 * @internal
 * Reads the most current DOM value for blur-driven snapshots when the element
 * type exposes it safely.
 */
export function readElementValueForBlur(element: HTMLElement): unknown {
  if (element instanceof HTMLInputElement) {
    if (element.type === 'radio') return undefined;
    if (element.type === 'checkbox') return element.checked;
    if (element.type === 'number') {
      return element.value === '' ? null : element.valueAsNumber;
    }
    return element.value;
  }
  if (
    element instanceof HTMLTextAreaElement ||
    element instanceof HTMLSelectElement
  ) {
    return element.value;
  }
  return undefined;
}

function collectNgModelGroupAttributes(
  start: HTMLElement,
  formEl: HTMLFormElement
): string[] {
  const groups: string[] = [];
  let current: Element | null = start.parentElement;
  while (current && current !== formEl && formEl.contains(current)) {
    const groupName = current.getAttribute('ngModelGroup')?.trim();
    if (groupName) {
      groups.unshift(groupName);
    }
    current = current.parentElement;
  }
  return groups;
}

function resolveControlPathByDomAncestors(
  root: FormGroup,
  fieldElement: HTMLElement,
  formEl: HTMLFormElement,
  leafName: string
): ResolvedFieldPath | null {
  type Frame = { control: AbstractControl; path: Array<string | number> };

  const subtreeHasLeafName = (control: AbstractControl): boolean => {
    if (control instanceof FormGroup) {
      for (const [key, child] of Object.entries(control.controls)) {
        if (key === leafName && isLeafControl(child)) {
          return true;
        }
        if (!isLeafControl(child) && subtreeHasLeafName(child)) {
          return true;
        }
      }
      return false;
    }

    if (control instanceof FormArray) {
      for (const child of control.controls) {
        if (!isLeafControl(child) && subtreeHasLeafName(child)) {
          return true;
        }
      }
      return false;
    }

    return false;
  };

  const selectNextCandidates = (candidates: Frame[]): Frame[] => {
    const domCandidates = candidates.filter((candidate) =>
      subtreeContainsElement(fieldElement, formEl, candidate.path.at(-1) ?? '')
    );

    return domCandidates.length > 0 ? domCandidates : candidates;
  };

  const descend = (frame: Frame): Frame | null => {
    if (frame.control instanceof FormGroup) {
      for (const [key, child] of Object.entries(frame.control.controls)) {
        if (key === leafName && isLeafControl(child)) {
          return { control: child, path: [...frame.path, key] };
        }
      }

      const candidates: Frame[] = [];
      for (const [key, child] of Object.entries(frame.control.controls)) {
        if (isLeafControl(child)) {
          continue;
        }
        const branch = { control: child, path: [...frame.path, key] };
        if (subtreeHasLeafName(branch.control)) {
          candidates.push(branch);
        }
      }

      const next = selectNextCandidates(candidates);
      if (next.length === 1 && next[0]) {
        return descend(next[0]);
      }
      return null;
    }

    if (frame.control instanceof FormArray) {
      const candidates: Frame[] = [];
      frame.control.controls.forEach((child, index) => {
        if (isLeafControl(child)) {
          return;
        }
        const branch = { control: child, path: [...frame.path, index] };
        if (subtreeHasLeafName(branch.control)) {
          candidates.push(branch);
        }
      });

      const next = selectNextCandidates(candidates);
      if (next.length === 1 && next[0]) {
        return descend(next[0]);
      }
    }

    return null;
  };

  const result = descend({ control: root, path: [] });
  if (!result) return null;
  return { path: stringifyFieldPath(result.path), control: result.control };
}

function subtreeContainsElement(
  fieldElement: HTMLElement,
  formEl: HTMLFormElement,
  key: string | number
): boolean {
  if (typeof key !== 'string') return false;
  const selector = `[ngModelGroup="${CSS.escape(key)}"]`;
  const candidates = formEl.querySelectorAll(selector);
  for (const candidate of candidates) {
    if (candidate.contains(fieldElement)) return true;
  }
  return false;
}

function resolveControlPathByNgModelDirective(
  ngForm: NgForm,
  fieldElement: HTMLElement
): ResolvedFieldPath | null {
  const directives = readNgFormDirectives(ngForm);
  if (!directives) return null;

  for (const directive of directives) {
    const accessorEl = readValueAccessorElement(directive.valueAccessor);
    if (accessorEl !== fieldElement) continue;
    const control = directive.control ?? ngForm.form.get(directive.path);
    if (!control) return null;
    return { path: directive.path.join('.'), control };
  }
  return null;
}

function readNgFormDirectives(ngForm: NgForm): Iterable<NgModel> | null {
  const set = (ngForm as unknown as { _directives?: Set<NgModel> })._directives;
  return set ?? null;
}

function readValueAccessorElement(
  accessor: ControlValueAccessor | null | undefined
): HTMLElement | null {
  if (!accessor) return null;
  const elementRef = (accessor as { _elementRef?: { nativeElement?: unknown } })
    ._elementRef;
  const native = elementRef?.nativeElement;
  return native instanceof HTMLElement ? native : null;
}
