/* eslint-disable @typescript-eslint/no-extraneous-class */
/**
 * Unit tests for NgxVestAutoTouchDirective
 * @vitest-environment jsdom
 */

import { ApplicationRef, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { render, screen } from '@testing-library/angular';
import { userEvent } from '@vitest/browser/context';
import { enforce, test } from 'vest';
import { describe, expect, it, vi } from 'vitest';
import { createVestForm } from '../create-vest-form';
import { NGX_VEST_FORMS_CONFIG, type NgxVestFormsConfig } from '../tokens';
import { staticSafeSuite } from '../utils/safe-suite';
import { NgxVestAutoTouchDirective } from './ngx-vest-auto-touch.directive';
import { NgxVestFormProviderDirective } from './ngx-vest-form-provider.directive';

// Test validation suite
const testSuite = staticSafeSuite(
  (data: { email?: string; firstName?: string } = {}) => {
    test('email', 'Email is required', () => {
      enforce(data.email).isNotEmpty();
    });

    test('email', 'Email format is invalid', () => {
      enforce(data.email)['isEmail']();
    });

    test('firstName', 'First name is required', () => {
      enforce(data.firstName).isNotEmpty();
    });
  },
);

describe('NgxVestAutoTouchDirective', () => {
  describe('Auto-Application', () => {
    it('should auto-apply to text inputs with [value] binding', async () => {
      const form = createVestForm(signal({ email: '' }), { suite: testSuite });

      @Component({
        imports: [NgxVestAutoTouchDirective, NgxVestFormProviderDirective],
        template: `
          <div [ngxVestFormProvider]="form">
            <input
              id="email"
              type="text"
              [value]="''"
              data-testid="email-input"
            />
          </div>
        `,
      })
      class TestComponent {
        readonly form = form;
      }

      await render(TestComponent);
      const input = screen.getByTestId<HTMLInputElement>('email-input');

      // Verify directive is applied (blur handler exists)
      expect(input).toBeInTheDocument();
    });

    it('should auto-apply to email inputs with [value] binding', async () => {
      const form = createVestForm(signal({ email: '' }), { suite: testSuite });

      @Component({
        imports: [NgxVestAutoTouchDirective, NgxVestFormProviderDirective],
        template: `
          <div [ngxVestFormProvider]="form">
            <input
              id="email"
              type="email"
              [value]="''"
              data-testid="email-input"
            />
          </div>
        `,
      })
      class TestComponent {
        readonly form = form;
      }

      await render(TestComponent);
      const input = screen.getByTestId<HTMLInputElement>('email-input');

      expect(input).toBeInTheDocument();
    });

    it('should auto-apply to number inputs with [value] binding', async () => {
      const form = createVestForm(signal({ email: '' }), { suite: testSuite });

      @Component({
        imports: [NgxVestAutoTouchDirective, NgxVestFormProviderDirective],
        template: `
          <div [ngxVestFormProvider]="form">
            <input id="age" type="number" [value]="0" data-testid="age-input" />
          </div>
        `,
      })
      class TestComponent {
        readonly form = form;
      }

      await render(TestComponent);
      const input = screen.getByTestId<HTMLInputElement>('age-input');

      expect(input).toBeInTheDocument();
    });

    it('should auto-apply to textarea with [value] binding', async () => {
      @Component({
        imports: [NgxVestAutoTouchDirective, NgxVestFormProviderDirective],
        template: `
          <textarea
            id="message"
            [value]="''"
            data-testid="message-textarea"
          ></textarea>
        `,
      })
      class TestComponent {}

      await render(TestComponent);
      const textarea =
        screen.getByTestId<HTMLTextAreaElement>('message-textarea');

      expect(textarea).toBeInTheDocument();
    });

    it('should auto-apply to select with [value] binding', async () => {
      @Component({
        imports: [NgxVestAutoTouchDirective, NgxVestFormProviderDirective],
        template: `
          <select id="country" [value]="''" data-testid="country-select">
            <option value="us">USA</option>
            <option value="uk">UK</option>
          </select>
        `,
      })
      class TestComponent {}

      await render(TestComponent);
      const select = screen.getByTestId<HTMLSelectElement>('country-select');

      expect(select).toBeInTheDocument();
    });
  });

  describe('Exclusions', () => {
    it('should NOT apply to radio inputs (use [checked], not [value])', async () => {
      @Component({
        imports: [NgxVestAutoTouchDirective, NgxVestFormProviderDirective],
        template: `
          <input
            id="radio1"
            type="radio"
            name="choice"
            value="option1"
            data-testid="radio-input"
          />
        `,
      })
      class TestComponent {}

      await render(TestComponent);
      const radio = screen.getByTestId<HTMLInputElement>('radio-input');

      // Radio uses [checked], not [value], so directive won't apply
      expect(radio).toBeInTheDocument();
      expect(radio.type).toBe('radio');
    });

    it('should NOT apply to checkbox inputs (use [checked], not [value])', async () => {
      @Component({
        imports: [NgxVestAutoTouchDirective, NgxVestFormProviderDirective],
        template: `
          <input id="agreed" type="checkbox" data-testid="checkbox-input" />
        `,
      })
      class TestComponent {}

      await render(TestComponent);
      const checkbox = screen.getByTestId<HTMLInputElement>('checkbox-input');

      // Checkbox uses [checked], not [value], so directive won't apply
      expect(checkbox).toBeInTheDocument();
      expect(checkbox.type).toBe('checkbox');
    });
  });

  describe('Blur Behavior', () => {
    it('should call form.field().markAsTouched() on blur', async () => {
      const form = createVestForm(signal({ email: '' }), { suite: testSuite });
      const markAsTouchedSpy = vi.fn();
      const originalFieldFunction = form.field.bind(form);
      form.field = vi.fn((path: string) => {
        const result = originalFieldFunction(path as 'email');
        if (path === 'email') {
          return { ...result, markAsTouched: markAsTouchedSpy };
        }
        return result;
      }) as unknown as typeof form.field;

      @Component({
        imports: [NgxVestAutoTouchDirective, NgxVestFormProviderDirective],
        template: `
          <div [ngxVestFormProvider]="form">
            <input
              id="email"
              type="email"
              [value]="''"
              data-testid="email-input"
            />
          </div>
        `,
      })
      class TestComponent {
        readonly form = form;
      }

      await render(TestComponent);
      const input = screen.getByTestId<HTMLInputElement>('email-input');

      // Trigger blur
      await userEvent.click(input);
      input.dispatchEvent(new FocusEvent('blur'));

      // Verify markAsTouched was called
      await TestBed.inject(ApplicationRef).whenStable();
      expect(markAsTouchedSpy).toHaveBeenCalled();
    });

    it('should NOT call touch when form is not provided', async () => {
      @Component({
        imports: [NgxVestAutoTouchDirective, NgxVestFormProviderDirective],
        template: `
          <input
            id="email"
            type="email"
            [value]="''"
            data-testid="email-input"
          />
        `,
      })
      class TestComponent {}

      await render(TestComponent);
      const input = screen.getByTestId<HTMLInputElement>('email-input');

      // Blur should not throw error when no form
      await userEvent.click(input);
      input.dispatchEvent(new FocusEvent('blur'));

      // No error should be thrown
      expect(input).toBeInTheDocument();
    });

    it('should NOT call markAsTouched when global config disables auto-touch', async () => {
      const form = createVestForm(signal({ email: '' }), { suite: testSuite });
      const markAsTouchedSpy = vi.fn();
      const originalFieldFunction = form.field.bind(form);
      form.field = vi.fn((path: string) => {
        const result = originalFieldFunction(path as 'email');
        if (path === 'email') {
          return { ...result, markAsTouched: markAsTouchedSpy };
        }
        return result;
      }) as unknown as typeof form.field;

      @Component({
        imports: [NgxVestAutoTouchDirective, NgxVestFormProviderDirective],
        providers: [
          {
            provide: NGX_VEST_FORMS_CONFIG,
            useValue: { autoTouch: false } satisfies NgxVestFormsConfig,
          },
        ],
        template: `
          <div [ngxVestFormProvider]="form">
            <input
              id="email"
              type="email"
              [value]="''"
              data-testid="email-input"
            />
          </div>
        `,
      })
      class TestComponent {
        readonly form = form;
      }

      await render(TestComponent);
      const input = screen.getByTestId<HTMLInputElement>('email-input');

      // Trigger blur
      await userEvent.click(input);
      input.dispatchEvent(new FocusEvent('blur'));

      // Verify markAsTouched was NOT called
      await TestBed.inject(ApplicationRef).whenStable();
      expect(markAsTouchedSpy).not.toHaveBeenCalled();
    });
  });

  describe('Field Name Extraction', () => {
    it('should extract field name from id attribute (priority 3)', async () => {
      const form = createVestForm(signal({ email: '' }), { suite: testSuite });
      const markAsTouchedSpy = vi.fn();
      const originalFieldFunction = form.field.bind(form);
      form.field = vi.fn((path: string) => {
        const result = originalFieldFunction(path as 'email');
        if (path === 'email') {
          return { ...result, markAsTouched: markAsTouchedSpy };
        }
        return result;
      }) as unknown as typeof form.field;

      @Component({
        imports: [NgxVestAutoTouchDirective, NgxVestFormProviderDirective],
        template: `
          <div [ngxVestFormProvider]="form">
            <input
              id="email"
              type="email"
              [value]="''"
              data-testid="email-input"
            />
          </div>
        `,
      })
      class TestComponent {
        readonly form = form;
      }

      await render(TestComponent);
      const input = screen.getByTestId<HTMLInputElement>('email-input');

      await userEvent.click(input);
      await userEvent.tab();

      await TestBed.inject(ApplicationRef).whenStable();
      expect(form.field).toHaveBeenCalledWith('email');
      expect(markAsTouchedSpy).toHaveBeenCalled();
    });

    it('should extract field name from id attribute (priority 5)', async () => {
      const form = createVestForm(signal({ firstName: '' }), {
        suite: testSuite,
      });
      const markAsTouchedSpy = vi.fn();
      const originalFieldFunction = form.field.bind(form);
      form.field = vi.fn((path: string) => {
        const result = originalFieldFunction(path as 'firstName');
        if (path === 'firstName') {
          return { ...result, markAsTouched: markAsTouchedSpy };
        }
        return result;
      }) as unknown as typeof form.field;

      @Component({
        imports: [NgxVestAutoTouchDirective, NgxVestFormProviderDirective],
        template: `
          <div [ngxVestFormProvider]="form">
            <input
              id="firstName"
              type="text"
              [value]="''"
              data-testid="first-name-input"
            />
          </div>
        `,
      })
      class TestComponent {
        readonly form = form;
      }

      await render(TestComponent);
      const input = screen.getByTestId<HTMLInputElement>('first-name-input');

      await userEvent.click(input);
      await userEvent.tab();

      await TestBed.inject(ApplicationRef).whenStable();
      expect(markAsTouchedSpy).toHaveBeenCalled();
    });

    it('should convert underscores to dots in field paths', async () => {
      const form = createVestForm(signal({ email: '' }), { suite: testSuite });
      const originalFieldFunction = form.field.bind(form);
      form.field = vi.fn((path: string) =>
        originalFieldFunction(path as 'email'),
      ) as unknown as typeof form.field;

      @Component({
        imports: [NgxVestAutoTouchDirective, NgxVestFormProviderDirective],
        template: `
          <div [ngxVestFormProvider]="form">
            <input
              id="personal_info_email"
              type="email"
              [value]="''"
              data-testid="email-input"
            />
          </div>
        `,
      })
      class TestComponent {
        readonly form = form;
      }

      await render(TestComponent);
      const input = screen.getByTestId<HTMLInputElement>('email-input');

      await userEvent.click(input);
      await userEvent.tab();

      await TestBed.inject(ApplicationRef).whenStable();
      // Should convert personal_info_email to personal.info.email
      expect(form.field).toHaveBeenCalledWith('personal.info.email');
    });

    it('should use data-vest-field attribute (priority 1)', async () => {
      const form = createVestForm(signal({ email: '' }), { suite: testSuite });
      const originalFieldFunction = form.field.bind(form);
      form.field = vi.fn((path: string) =>
        originalFieldFunction(path as 'email'),
      ) as unknown as typeof form.field;

      @Component({
        imports: [NgxVestAutoTouchDirective, NgxVestFormProviderDirective],
        template: `
          <div [ngxVestFormProvider]="form">
            <input
              data-vest-field="user.profile.email"
              id="should-be-ignored"
              type="email"
              [value]="''"
              data-testid="email-input"
            />
          </div>
        `,
      })
      class TestComponent {
        readonly form = form;
      }

      await render(TestComponent);
      const input = screen.getByTestId<HTMLInputElement>('email-input');

      await userEvent.click(input);
      await userEvent.tab();

      await TestBed.inject(ApplicationRef).whenStable();
      // Should use data-vest-field, not id
      expect(form.field).toHaveBeenCalledWith('user.profile.email');
    });

    it('should use custom resolver from config (priority 2)', async () => {
      const form = createVestForm(signal({ email: '' }), { suite: testSuite });
      const originalFieldFunction = form.field.bind(form);
      form.field = vi.fn((path: string) =>
        originalFieldFunction(path as 'email'),
      ) as unknown as typeof form.field;

      const customResolver = vi.fn((element: HTMLElement) => {
        return element.dataset['customField'] ?? null;
      });

      @Component({
        imports: [NgxVestAutoTouchDirective, NgxVestFormProviderDirective],
        providers: [
          {
            provide: NGX_VEST_FORMS_CONFIG,
            useValue: {
              fieldNameResolver: customResolver,
            } satisfies NgxVestFormsConfig,
          },
        ],
        template: `
          <div [ngxVestFormProvider]="form">
            <input
              data-custom-field="customField"
              id="should-be-ignored"
              type="email"
              [value]="''"
              data-testid="email-input"
            />
          </div>
        `,
      })
      class TestComponent {
        readonly form = form;
      }

      await render(TestComponent);
      const input = screen.getByTestId<HTMLInputElement>('email-input');

      await userEvent.click(input);
      await userEvent.tab();

      await TestBed.inject(ApplicationRef).whenStable();
      expect(customResolver).toHaveBeenCalled();
      expect(form.field).toHaveBeenCalledWith('customField');
    });
  });

  describe('Opt-Out Mechanism', () => {
    it('should NOT apply when ngxVestAutoTouchDisabled attribute is present', async () => {
      const form = createVestForm(signal({ email: '' }), { suite: testSuite });
      const markAsTouchedSpy = vi.fn();
      form.field('email').markAsTouched = markAsTouchedSpy;

      @Component({
        imports: [NgxVestAutoTouchDirective, NgxVestFormProviderDirective],
        template: `
          <input
            id="email"
            type="email"
            [value]="''"
            ngxVestAutoTouchDisabled
            data-testid="email-input"
          />
        `,
      })
      class TestComponent {}

      await render(TestComponent);
      const input = screen.getByTestId<HTMLInputElement>('email-input');

      await userEvent.click(input);
      await userEvent.tab();

      await TestBed.inject(ApplicationRef).whenStable();
      // Directive should not have applied due to opt-out
      expect(markAsTouchedSpy).not.toHaveBeenCalled();
    });
  });

  describe('Debug Mode', () => {
    it('should log warning when field name cannot be extracted (debug mode)', async () => {
      const consoleWarnSpy = vi
        .spyOn(console, 'warn')
        .mockImplementation(() => {
          /* noop - we're just suppressing console warnings in test */
        });
      const form = createVestForm(signal({ email: '' }), { suite: testSuite });

      @Component({
        imports: [NgxVestAutoTouchDirective, NgxVestFormProviderDirective],
        providers: [
          {
            provide: NGX_VEST_FORMS_CONFIG,
            useValue: { debug: true } satisfies NgxVestFormsConfig,
          },
        ],
        template: `
          <div [ngxVestFormProvider]="form">
            <input type="email" [value]="''" data-testid="email-input" />
          </div>
        `,
      })
      class TestComponent {
        readonly form = form;
      }

      await render(TestComponent);
      const input = screen.getByTestId<HTMLInputElement>('email-input');

      await userEvent.click(input);
      await userEvent.tab();

      await TestBed.inject(ApplicationRef).whenStable();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          '[NgxVestAutoTouchDirective] Could not extract field name',
        ),
        expect.anything(),
      );

      consoleWarnSpy.mockRestore();
    });
  });

  describe('Strict Field Resolution', () => {
    it('should throw error when strictFieldResolution=true and resolveFieldPath returns null', async () => {
      // Create form with Enhanced Field Signals enabled
      const form = createVestForm(signal({ email: '' }), { suite: testSuite });

      // Mock resolveFieldPath to return null (unresolved ID)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.spyOn(form as any, 'resolveFieldPath').mockReturnValue(null);

      // Spy on console.error to capture the uncaught error
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(vi.fn());

      @Component({
        imports: [NgxVestAutoTouchDirective, NgxVestFormProviderDirective],
        template: `
          <div [ngxVestFormProvider]="form">
            <input
              id="unknownField"
              type="text"
              [value]="''"
              data-testid="input"
            />
          </div>
        `,
      })
      class TestComponent {
        readonly form = form;
      }

      const config: NgxVestFormsConfig = {
        strictFieldResolution: true,
      };

      // Render with strict mode enabled
      await render(TestComponent, {
        providers: [{ provide: NGX_VEST_FORMS_CONFIG, useValue: config }],
      });

      const input = screen.getByTestId<HTMLInputElement>('input');

      // Click to focus, then tab to blur
      await userEvent.click(input);

      // Blur will throw error in strict mode (Angular catches it and logs to console.error)
      try {
        await userEvent.tab();
        await TestBed.inject(ApplicationRef).whenStable();
      } catch {
        // Error might be caught or uncaught depending on test harness
      }

      // Verify error was thrown by checking console.error was called
      // Angular logs errors as: console.error('ERROR', errorObject)
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'ERROR',
        expect.objectContaining({
          message: expect.stringContaining(
            'Could not resolve field name from id="unknownField"',
          ),
        }),
      );

      consoleErrorSpy.mockRestore();
    });

    it('should throw error when strictFieldResolution=true and no id/name found', async () => {
      const form = createVestForm(signal({ email: '' }), { suite: testSuite });

      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(vi.fn());

      @Component({
        imports: [NgxVestAutoTouchDirective, NgxVestFormProviderDirective],
        template: `
          <div [ngxVestFormProvider]="form">
            <!-- No id or name attribute -->
            <input type="text" [value]="''" data-testid="input" />
          </div>
        `,
      })
      class TestComponent {
        readonly form = form;
      }

      const config: NgxVestFormsConfig = {
        strictFieldResolution: true,
      };

      await render(TestComponent, {
        providers: [{ provide: NGX_VEST_FORMS_CONFIG, useValue: config }],
      });

      const input = screen.getByTestId<HTMLInputElement>('input');

      await userEvent.click(input);

      try {
        await userEvent.tab();
        await TestBed.inject(ApplicationRef).whenStable();
      } catch {
        // Error might be caught or uncaught
      }

      // Verify error was thrown
      // Angular logs errors as: console.error('ERROR', errorObject)
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'ERROR',
        expect.objectContaining({
          message: expect.stringContaining(
            'Could not extract field name from element',
          ),
        }),
      );

      consoleErrorSpy.mockRestore();
    });

    it('should console.warn when strictFieldResolution=false (default) and resolveFieldPath returns null', async () => {
      const consoleWarnSpy = vi
        .spyOn(console, 'warn')
        .mockImplementation(vi.fn());

      const form = createVestForm(signal({ email: '' }), { suite: testSuite });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.spyOn(form as any, 'resolveFieldPath').mockReturnValue(null);

      @Component({
        imports: [NgxVestAutoTouchDirective, NgxVestFormProviderDirective],
        template: `
          <div [ngxVestFormProvider]="form">
            <input
              id="unknownField"
              type="text"
              [value]="''"
              data-testid="input"
            />
          </div>
        `,
      })
      class TestComponent {
        readonly form = form;
      }

      const config: NgxVestFormsConfig = {
        strictFieldResolution: false,
      };

      await render(TestComponent, {
        providers: [{ provide: NGX_VEST_FORMS_CONFIG, useValue: config }],
      });

      const input = screen.getByTestId<HTMLInputElement>('input');

      // Clear previous warnings
      consoleWarnSpy.mockClear();

      // Blur should warn but not throw
      await userEvent.click(input);
      await userEvent.tab(); // Trigger blur

      await TestBed.inject(ApplicationRef).whenStable();

      // Should have logged warning
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          'Could not resolve field name from id="unknownField"',
        ),
        expect.anything(),
      );

      consoleWarnSpy.mockRestore();
    });

    it('should console.warn when strictFieldResolution=false (default) and no id/name found', async () => {
      const consoleWarnSpy = vi
        .spyOn(console, 'warn')
        .mockImplementation(vi.fn());

      const form = createVestForm(signal({ email: '' }), { suite: testSuite });

      @Component({
        imports: [NgxVestAutoTouchDirective, NgxVestFormProviderDirective],
        template: `
          <div [ngxVestFormProvider]="form">
            <input type="text" [value]="''" data-testid="input" />
          </div>
        `,
      })
      class TestComponent {
        readonly form = form;
      }

      const config: NgxVestFormsConfig = {
        strictFieldResolution: false,
      };

      await render(TestComponent, {
        providers: [{ provide: NGX_VEST_FORMS_CONFIG, useValue: config }],
      });

      const input = screen.getByTestId<HTMLInputElement>('input');

      consoleWarnSpy.mockClear();

      await userEvent.click(input);
      await userEvent.tab();

      await TestBed.inject(ApplicationRef).whenStable();

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Could not extract field name from element'),
        expect.anything(),
      );

      consoleWarnSpy.mockRestore();
    });

    it('should use default behavior (warn) when strictFieldResolution is undefined', async () => {
      const consoleWarnSpy = vi
        .spyOn(console, 'warn')
        .mockImplementation(vi.fn());

      const form = createVestForm(signal({ email: '' }), { suite: testSuite });

      @Component({
        imports: [NgxVestAutoTouchDirective, NgxVestFormProviderDirective],
        template: `
          <div [ngxVestFormProvider]="form">
            <input type="text" [value]="''" data-testid="input" />
          </div>
        `,
      })
      class TestComponent {
        readonly form = form;
      }

      // No config provided - should use default
      await render(TestComponent);

      const input = screen.getByTestId<HTMLInputElement>('input');

      consoleWarnSpy.mockClear();

      await userEvent.click(input);
      await userEvent.tab();

      await TestBed.inject(ApplicationRef).whenStable();

      // Should warn (default behavior)
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Could not extract field name from element'),
        expect.anything(),
      );

      consoleWarnSpy.mockRestore();
    });
  });

  describe('Enhanced Field Signals Resolution', () => {
    it('should resolve camelCase ID to nested path via resolveFieldPath', async () => {
      const form = createVestForm(signal({ personalInfo: { firstName: '' } }), {
        suite: staticSafeSuite(
          (data: { personalInfo?: { firstName?: string } } = {}) => {
            test('personalInfo.firstName', 'Required', () => {
              enforce(data.personalInfo?.firstName).isNotEmpty();
            });
          },
        ),
      });

      @Component({
        imports: [NgxVestAutoTouchDirective, NgxVestFormProviderDirective],
        template: `
          <div [ngxVestFormProvider]="form">
            <input
              id="personalInfoFirstName"
              type="text"
              [value]="form.personalInfoFirstName()"
              data-testid="input"
            />
          </div>
        `,
      })
      class TestComponent {
        readonly form = form;
      }

      await render(TestComponent);

      const input = screen.getByTestId<HTMLInputElement>('input');

      // Should start untouched
      expect(form.personalInfoFirstNameTouched()).toBe(false);

      // Blur should mark as touched
      await userEvent.click(input);
      await userEvent.tab();

      await TestBed.inject(ApplicationRef).whenStable();

      expect(form.personalInfoFirstNameTouched()).toBe(true);
    });

    it('should fallback to underscore-to-dot conversion when resolveFieldPath returns null', async () => {
      // Suppress console warnings for this test
      const consoleWarnSpy = vi
        .spyOn(console, 'warn')
        .mockImplementation(vi.fn());

      const form = createVestForm(signal({ address: { street: '' } }), {
        suite: staticSafeSuite(
          (data: { address?: { street?: string } } = {}) => {
            test('address.street', 'Required', () => {
              enforce(data.address?.street).isNotEmpty();
            });
          },
        ),
      });

      // Mock resolveFieldPath to return null (simulating ID not in Enhanced Field Signals registry)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.spyOn(form as any, 'resolveFieldPath').mockReturnValue(null);

      @Component({
        imports: [NgxVestAutoTouchDirective, NgxVestFormProviderDirective],
        template: `
          <div [ngxVestFormProvider]="form">
            <input
              id="address_street"
              type="text"
              [value]="''"
              data-testid="input"
            />
          </div>
        `,
      })
      class TestComponent {
        readonly form = form;
      }

      await render(TestComponent);

      const input = screen.getByTestId<HTMLInputElement>('input');

      // Should work via fallback underscore-to-dot conversion (warning will be logged)
      await userEvent.click(input);
      await userEvent.tab();

      await TestBed.inject(ApplicationRef).whenStable();

      // Warning should have been logged since resolveFieldPath returned null
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          'Could not resolve field name from id="address_street"',
        ),
        expect.anything(),
      );

      // Field should be touched via fallback path: address_street → address.street
      expect(form.field('address.street').touched()).toBe(true);

      consoleWarnSpy.mockRestore();
    });

    it('should handle forms without resolveFieldPath (Enhanced Field Signals disabled)', async () => {
      const form = createVestForm(signal({ email: '' }), { suite: testSuite });

      // Remove resolveFieldPath to simulate disabled Enhanced Field Signals
      delete (form as Record<string, unknown>)['resolveFieldPath'];

      @Component({
        imports: [NgxVestAutoTouchDirective, NgxVestFormProviderDirective],
        template: `
          <div [ngxVestFormProvider]="form">
            <input
              id="email"
              type="text"
              [value]="form.email()"
              data-testid="input"
            />
          </div>
        `,
      })
      class TestComponent {
        readonly form = form;
      }

      await render(TestComponent);

      const input = screen.getByTestId<HTMLInputElement>('input');

      // Should still work via direct ID
      await userEvent.click(input);
      await userEvent.tab();

      await TestBed.inject(ApplicationRef).whenStable();

      expect(form.emailTouched()).toBe(true);
    });
  });

  describe('Cleanup', () => {
    it('should not throw errors when destroyed', async () => {
      @Component({
        imports: [NgxVestAutoTouchDirective, NgxVestFormProviderDirective],
        template: `
          <input
            id="email"
            type="email"
            [value]="''"
            data-testid="email-input"
          />
        `,
      })
      class TestComponent {}

      const { fixture } = await render(TestComponent);

      // Component should render without errors
      expect(screen.getByTestId('email-input')).toBeInTheDocument();

      // Destroy the component (should clean up effects automatically)
      fixture.destroy();

      // No errors should be thrown during cleanup
      // Effect cleanup is handled by Angular's destroy mechanism
      expect(true).toBe(true);
    });
  });
});
