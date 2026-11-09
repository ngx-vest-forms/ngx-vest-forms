import {
  type AbstractControl,
  FormArray,
  FormGroup,
  type NgForm,
} from '@angular/forms';
import {
  findRegisteredControl,
  findRegisteredGroupPath,
} from './field-element-registry';

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
 *
 * Strategies, in order:
 * 1. The nearest `ngModel` host registered by `FormModelDirective` at or
 *    above the target (covers custom controls whose inner element blurs).
 * 2. The target's `name` under the nearest registered `ngModelGroup`
 *    (covers dynamic `[ngModelGroup]` bindings).
 * 3. DOM heuristics for controls rendered without the ngx-vest-forms
 *    directives: static `ngModelGroup` attributes, then a walk of the
 *    form tree for a unique leaf with that name.
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

  const formEl = eventTarget.closest('form');
  if (!(formEl instanceof HTMLFormElement)) {
    return null;
  }

  const registered = findRegisteredControl(ngForm, eventTarget, formEl);
  if (registered && registered.element instanceof HTMLElement) {
    const { ngModel } = registered;
    const control = ngModel.control ?? ngForm.form.get(ngModel.path);
    if (control) {
      return {
        field: ngModel.path.join('.'),
        control,
        element: registered.element,
      };
    }
  }

  const fieldElement = eventTarget.closest('[name]');
  if (!(fieldElement instanceof HTMLElement)) {
    return null;
  }

  const name = fieldElement.getAttribute('name')?.trim();
  if (!name) {
    return null;
  }

  const groupPath = findRegisteredGroupPath(ngForm, fieldElement, formEl);
  if (groupPath) {
    const groupedPath = [...groupPath, name].join('.');
    const groupedControl = ngForm.form.get(groupedPath);
    if (groupedControl) {
      return {
        field: groupedPath,
        control: groupedControl,
        element: fieldElement,
      };
    }
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

/**
 * Last-resort lookup for a blurred element that no registry or static path
 * resolves: finds every leaf control named `leafName` and keeps the ones
 * whose path agrees with the element's `ngModelGroup` ancestors.
 *
 * "Agrees" means the ancestors' names appear in the path's group segments
 * in the same order (levels without an `ngModelGroup` element may be
 * skipped). Matching on the whole chain, not one key at a time, keeps an
 * index of a nested FormArray (`ngModelGroup="0"` on a line) from being
 * read as the index of an outer one. If more than one path agrees, the
 * element is ambiguous and the result is null: the wrong control would be
 * worse than none.
 */
function resolveControlPathByDomAncestors(
  root: FormGroup,
  fieldElement: HTMLElement,
  formEl: HTMLFormElement,
  leafName: string
): ResolvedFieldPath | null {
  const leaves: Array<{ segments: string[]; control: AbstractControl }> = [];
  const collect = (control: AbstractControl, segments: string[]): void => {
    const children: Array<[string, AbstractControl]> =
      control instanceof FormGroup
        ? Object.entries(control.controls)
        : control instanceof FormArray
          ? control.controls.map((child, index) => [String(index), child])
          : [];
    for (const [key, child] of children) {
      if (isLeafControl(child)) {
        if (key === leafName && control instanceof FormGroup) {
          leaves.push({ segments: [...segments, key], control: child });
        }
      } else {
        collect(child, [...segments, key]);
      }
    }
  };
  collect(root, []);

  const domGroups = collectNgModelGroupAttributes(fieldElement, formEl);
  const agreeing = leaves.filter((leaf) =>
    isOrderedSubsequence(domGroups, leaf.segments.slice(0, -1))
  );

  const match =
    agreeing.length === 1
      ? agreeing[0]
      : agreeing.length === 0 && leaves.length === 1
        ? leaves[0]
        : undefined;
  return match
    ? { path: match.segments.join('.'), control: match.control }
    : null;
}

/** Whether every item of `needle` occurs in `haystack`, in order. */
function isOrderedSubsequence(
  needle: readonly string[],
  haystack: readonly string[]
): boolean {
  let position = 0;
  for (const item of haystack) {
    if (position < needle.length && item === needle[position]) {
      position++;
    }
  }
  return position === needle.length;
}
