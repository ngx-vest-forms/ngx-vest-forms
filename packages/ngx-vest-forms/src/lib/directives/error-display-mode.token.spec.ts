import { Component, inject } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import {
  NGX_ERROR_DISPLAY_MODE_TOKEN,
  NGX_WARNING_DISPLAY_MODE_TOKEN,
} from './error-display-mode.token';

describe('error-display-mode tokens', () => {
  describe('NGX_ERROR_DISPLAY_MODE_TOKEN', () => {
    it('should default to "on-blur-or-submit"', () => {
      @Component({ template: '' })
      class TestComponent {
        mode = inject(NGX_ERROR_DISPLAY_MODE_TOKEN);
      }

      TestBed.configureTestingModule({});
      const fixture = TestBed.createComponent(TestComponent);

      expect(fixture.componentInstance.mode).toBe('on-blur-or-submit');
    });

    it('should allow global override via providers', () => {
      @Component({ template: '' })
      class TestComponent {
        mode = inject(NGX_ERROR_DISPLAY_MODE_TOKEN);
      }

      TestBed.configureTestingModule({
        providers: [
          { provide: NGX_ERROR_DISPLAY_MODE_TOKEN, useValue: 'on-submit' },
        ],
      });
      const fixture = TestBed.createComponent(TestComponent);

      expect(fixture.componentInstance.mode).toBe('on-submit');
    });
  });

  describe('NGX_WARNING_DISPLAY_MODE_TOKEN', () => {
    it('should default to "on-validated-or-touch"', () => {
      @Component({ template: '' })
      class TestComponent {
        mode = inject(NGX_WARNING_DISPLAY_MODE_TOKEN);
      }

      TestBed.configureTestingModule({});
      const fixture = TestBed.createComponent(TestComponent);

      expect(fixture.componentInstance.mode).toBe('on-validated-or-touch');
    });

    it('should allow component-level override', () => {
      @Component({
        template: '',
        providers: [
          { provide: NGX_WARNING_DISPLAY_MODE_TOKEN, useValue: 'always' },
        ],
      })
      class TestComponent {
        mode = inject(NGX_WARNING_DISPLAY_MODE_TOKEN);
      }

      TestBed.configureTestingModule({});
      const fixture = TestBed.createComponent(TestComponent);

      expect(fixture.componentInstance.mode).toBe('always');
    });
  });
});
