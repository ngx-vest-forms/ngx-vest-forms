import { NgForm, NgModel, NgModelGroup } from '@angular/forms';

/**
 * @internal
 * Host elements of the `ngModel` / `ngModelGroup` directives inside one
 * `NgForm`, registered by `FormModelDirective` and `FormModelGroupDirective`.
 *
 * Blur handling uses this to map a DOM element back to its control path with
 * public APIs only, instead of reading `NgForm._directives` and the value
 * accessor's `_elementRef`. Paths are read from the directive at lookup time,
 * so a `[name]` or `[ngModelGroup]` binding that changes later is picked up.
 */
type FieldElementRegistry = {
  readonly controls: Map<Element, NgModel>;
  readonly groups: Map<Element, NgModelGroup>;
};

const registries = new WeakMap<NgForm, FieldElementRegistry>();

function getRegistry(ngForm: NgForm): FieldElementRegistry {
  let registry = registries.get(ngForm);
  if (!registry) {
    registry = { controls: new Map(), groups: new Map() };
    registries.set(ngForm, registry);
  }
  return registry;
}

/**
 * @internal
 * Registers the host element of an `ngModel`. Returns the unregister function.
 */
export function registerControlElement(
  ngForm: NgForm,
  element: Element,
  ngModel: NgModel
): () => void {
  return register(getRegistry(ngForm).controls, element, ngModel);
}

/**
 * @internal
 * Registers the host element of an `ngModelGroup`. Returns the unregister
 * function.
 */
export function registerGroupElement(
  ngForm: NgForm,
  element: Element,
  group: NgModelGroup
): () => void {
  return register(getRegistry(ngForm).groups, element, group);
}

function register<D>(
  map: Map<Element, D>,
  element: Element,
  directive: D
): () => void {
  map.set(element, directive);
  return () => {
    if (map.get(element) === directive) {
      map.delete(element);
    }
  };
}

/**
 * @internal
 * Finds the nearest registered `ngModel` host at or above `start`, stopping
 * at `formElement`. Standalone `ngModel`s are skipped: they are not part of
 * the form tree.
 */
export function findRegisteredControl(
  ngForm: NgForm,
  start: Element,
  formElement: Element
): { element: Element; ngModel: NgModel } | null {
  const registry = registries.get(ngForm);
  if (!registry || registry.controls.size === 0) return null;

  let current: Element | null = start;
  while (current && current !== formElement) {
    const ngModel = registry.controls.get(current);
    if (ngModel && !ngModel.options?.standalone) {
      return { element: current, ngModel };
    }
    current = current.parentElement;
  }
  return null;
}

/**
 * @internal
 * Returns the path of the nearest registered `ngModelGroup` that contains
 * `start`, or `null` when no registered group does.
 */
export function findRegisteredGroupPath(
  ngForm: NgForm,
  start: Element,
  formElement: Element
): string[] | null {
  const registry = registries.get(ngForm);
  if (!registry || registry.groups.size === 0) return null;

  let current: Element | null = start.parentElement;
  while (current && current !== formElement) {
    const group = registry.groups.get(current);
    if (group) {
      return group.path;
    }
    current = current.parentElement;
  }
  return null;
}
