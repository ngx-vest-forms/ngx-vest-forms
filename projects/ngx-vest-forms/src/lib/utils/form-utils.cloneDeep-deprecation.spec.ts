import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Isolated spec file: each spec file gets its own module instance under
// Vitest's browser mode, so the module-level warn-once flag inside
// `cloneDeep` starts unset here. That lets us assert exact warning counts
// without interference from other tests that may have already triggered
// the warning.

describe('cloneDeep deprecation warning (isolated)', () => {
  const ngDevModeKey = 'ngDevMode' as const;
  const globalRef = globalThis as { ngDevMode?: unknown };
  let originalNgDevMode: unknown;

  beforeEach(() => {
    originalNgDevMode = globalRef[ngDevModeKey];
    globalRef[ngDevModeKey] = true;
  });

  afterEach(() => {
    if (originalNgDevMode === undefined) {
      Reflect.deleteProperty(globalRef, ngDevModeKey);
    } else {
      globalRef[ngDevModeKey] = originalNgDevMode;
    }
    vi.restoreAllMocks();
  });

  it('warns exactly once on first call and never again in the same session', async () => {
    const { cloneDeep } = await import('./form-utils');
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    // First call: should warn exactly once.
    cloneDeep({ first: true });
    const afterFirst = warnSpy.mock.calls.filter((args) =>
      String(args[0] ?? '').includes('cloneDeep is deprecated')
    );
    expect(afterFirst).toHaveLength(1);

    // Subsequent calls: must not add any more warnings, no matter how many.
    cloneDeep([1, 2, 3]);
    cloneDeep('primitive');
    cloneDeep({ nested: { value: 42 } });
    cloneDeep(new Date());

    const afterMany = warnSpy.mock.calls.filter((args) =>
      String(args[0] ?? '').includes('cloneDeep is deprecated')
    );
    expect(afterMany).toHaveLength(1);
  });
});
