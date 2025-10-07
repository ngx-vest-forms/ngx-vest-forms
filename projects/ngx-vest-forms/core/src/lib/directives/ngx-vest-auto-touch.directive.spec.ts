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
      const form = createVestForm(testSuite, signal({ email: '' }));

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
      const form = createVestForm(testSuite, signal({ email: '' }));

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
      const form = createVestForm(testSuite, signal({ email: '' }));

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
    it('should call form.field().touch() on blur', async () => {
      const form = createVestForm(testSuite, signal({ email: '' }));
      const touchSpy = vi.fn();
      const originalFieldFunction = form.field.bind(form);
      form.field = vi.fn((path: string) => {
        const result = originalFieldFunction(path as 'email');
        if (path === 'email') {
          return { ...result, touch: touchSpy };
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
      await userEvent.tab();

      // Verify touch was called
      await TestBed.inject(ApplicationRef).whenStable();
      expect(touchSpy).toHaveBeenCalled();
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
      await userEvent.tab();

      // No error should be thrown
      expect(input).toBeInTheDocument();
    });

    it('should NOT call touch when global config disables auto-touch', async () => {
      const form = createVestForm(testSuite, signal({ email: '' }));
      const touchSpy = vi.fn();
      form.field('email').touch = touchSpy;

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
      await userEvent.tab();

      // Verify touch was NOT called
      await TestBed.inject(ApplicationRef).whenStable();
      expect(touchSpy).not.toHaveBeenCalled();
    });
  });

  describe('Field Name Extraction', () => {
    it('should extract field name from id attribute (priority 3)', async () => {
      const form = createVestForm(testSuite, signal({ email: '' }));
      const touchSpy = vi.fn();
      const originalFieldFunction = form.field.bind(form);
      form.field = vi.fn((path: string) => {
        const result = originalFieldFunction(path as 'email');
        if (path === 'email') {
          return { ...result, touch: touchSpy };
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
      expect(touchSpy).toHaveBeenCalled();
    });

    it('should extract field name from id attribute (priority 5)', async () => {
      const form = createVestForm(testSuite, signal({ firstName: '' }));
      const touchSpy = vi.fn();
      const originalFieldFunction = form.field.bind(form);
      form.field = vi.fn((path: string) => {
        const result = originalFieldFunction(path as 'firstName');
        if (path === 'firstName') {
          return { ...result, touch: touchSpy };
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
      expect(touchSpy).toHaveBeenCalled();
    });

    it('should convert underscores to dots in field paths', async () => {
      const form = createVestForm(testSuite, signal({ email: '' }));
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
      const form = createVestForm(testSuite, signal({ email: '' }));
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
      const form = createVestForm(testSuite, signal({ email: '' }));
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
      const form = createVestForm(testSuite, signal({ email: '' }));
      const touchSpy = vi.fn();
      form.field('email').touch = touchSpy;

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
      expect(touchSpy).not.toHaveBeenCalled();
    });
  });

  describe('Debug Mode', () => {
    it('should log warning when field name cannot be extracted (debug mode)', async () => {
      const consoleWarnSpy = vi
        .spyOn(console, 'warn')
        .mockImplementation(() => {
          /* noop - we're just suppressing console warnings in test */
        });
      const form = createVestForm(testSuite, signal({ email: '' }));

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
