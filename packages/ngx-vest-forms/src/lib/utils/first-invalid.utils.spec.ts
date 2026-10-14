import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_FOCUS_SELECTOR,
  DEFAULT_INVALID_SELECTOR,
  resolveFirstInvalidElement,
  resolveFirstInvalidScrollBehavior,
} from './first-invalid.utils';

describe('first-invalid.utils', () => {
  describe('DEFAULT_INVALID_SELECTOR', () => {
    it('should be a non-empty comma-joined selector list', () => {
      expect(typeof DEFAULT_INVALID_SELECTOR).toBe('string');
      expect(DEFAULT_INVALID_SELECTOR.length).toBeGreaterThan(0);
    });

    it('should target both wrapper classes and ng-invalid controls', () => {
      const parts = DEFAULT_INVALID_SELECTOR.split(', ');
      expect(parts).toEqual([
        '.ngx-control-wrapper--invalid',
        '.ngx-form-group-wrapper--invalid',
        'input.ng-invalid:not([type="hidden"]):not([disabled])',
        'textarea.ng-invalid:not([disabled])',
        'select.ng-invalid:not([disabled])',
        'input[aria-invalid="true"]:not([type="hidden"]):not([disabled])',
        'textarea[aria-invalid="true"]:not([disabled])',
        'select[aria-invalid="true"]:not([disabled])',
      ]);
    });

    it('should exclude hidden and disabled controls', () => {
      expect(DEFAULT_INVALID_SELECTOR).toContain(':not([type="hidden"])');
      expect(DEFAULT_INVALID_SELECTOR).toContain(':not([disabled])');
    });

    it('should be a valid CSS selector usable by querySelectorAll', () => {
      expect(() =>
        document.createElement('div').querySelectorAll(DEFAULT_INVALID_SELECTOR)
      ).not.toThrow();
    });
  });

  describe('DEFAULT_FOCUS_SELECTOR', () => {
    it('should list the focusable element selectors', () => {
      const parts = DEFAULT_FOCUS_SELECTOR.split(', ');
      expect(parts).toEqual([
        'input:not([type="hidden"]):not([disabled])',
        'textarea:not([disabled])',
        'select:not([disabled])',
        'button:not([disabled])',
        'a[href]',
        '[tabindex]:not([tabindex="-1"]):not([disabled])',
      ]);
    });

    it('should be a valid CSS selector usable by querySelectorAll', () => {
      expect(() =>
        document.createElement('div').querySelectorAll(DEFAULT_FOCUS_SELECTOR)
      ).not.toThrow();
    });
  });

  describe('resolveFirstInvalidScrollBehavior', () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should return the explicitly provided behavior unchanged', () => {
      expect(resolveFirstInvalidScrollBehavior('auto')).toBe('auto');
      expect(resolveFirstInvalidScrollBehavior('smooth')).toBe('smooth');
    });

    it('should default to "smooth" when reduced motion is not preferred', () => {
      vi.spyOn(globalThis, 'matchMedia').mockReturnValue({
        matches: false,
      } as MediaQueryList);

      expect(resolveFirstInvalidScrollBehavior()).toBe('smooth');
    });

    it('should default to "auto" when reduced motion is preferred', () => {
      vi.spyOn(globalThis, 'matchMedia').mockReturnValue({
        matches: true,
      } as MediaQueryList);

      expect(resolveFirstInvalidScrollBehavior()).toBe('auto');
    });

    it('should prefer the explicit behavior even under reduced motion', () => {
      vi.spyOn(globalThis, 'matchMedia').mockReturnValue({
        matches: true,
      } as MediaQueryList);

      expect(resolveFirstInvalidScrollBehavior('smooth')).toBe('smooth');
    });
  });

  describe('resolveFirstInvalidElement', () => {
    afterEach(() => {
      document.body.innerHTML = '';
    });

    function renderForm(): HTMLFormElement {
      const form = document.createElement('form');
      form.innerHTML = `
        <details>
          <summary>Address</summary>
          <input id="collapsed" class="ng-invalid" />
        </details>
        <input id="visible" class="ng-invalid" />
      `;
      document.body.append(form);
      // The DOM test environment does no layout, so give each control the
      // client rects a browser would: none while a closed <details> hides it.
      for (const [id, rects] of [
        ['visible', [new DOMRect(0, 0, 10, 10)]],
        ['collapsed', []],
      ] as const) {
        const element = form.querySelector<HTMLElement>(`#${id}`);
        if (element) {
          element.getClientRects = () => rects as unknown as DOMRectList;
        }
      }
      return form;
    }

    it('skips invalid controls inside a closed <details> by default', () => {
      const form = renderForm();
      expect(
        resolveFirstInvalidElement(form, DEFAULT_INVALID_SELECTOR)?.id
      ).toBe('visible');
    });

    it('returns the collapsed control first when collapsed parents may be opened', () => {
      const form = renderForm();
      expect(
        resolveFirstInvalidElement(form, DEFAULT_INVALID_SELECTOR, true)?.id
      ).toBe('collapsed');
    });

    it('skips a collapsed control that opening its <details> would not reveal', () => {
      const form = renderForm();
      form.querySelector<HTMLElement>('#collapsed')?.setAttribute('hidden', '');
      expect(
        resolveFirstInvalidElement(form, DEFAULT_INVALID_SELECTOR, true)?.id
      ).toBe('visible');
    });
  });
});
