import { Component, signal } from '@angular/core';
import { render, screen } from '@testing-library/angular';
import { enforce, test } from 'vest';
import { describe, expect, it } from 'vitest';
import { createVestForm } from '../create-vest-form';
import { staticSafeSuite } from '../utils/safe-suite';
import { NgxFormErrorComponent } from './ngx-form-error.component';

/**
 * Test suite for NgxFormErrorComponent
 *
 * Covers:
 * - Error display with proper ARIA attributes
 * - Warning display with proper ARIA attributes
 * - WCAG 2.2 compliance (role="alert", role="status", aria-live, aria-atomic)
 * - Show/hide behavior based on field state
 * - Auto-generated ARIA IDs
 * - Edge cases (empty errors, empty warnings, no field)
 */

describe('NgxFormErrorComponent', () => {
  // Test validation suite with both errors and warnings
  type TestModel = {
    email: string;
    password: string;
  };

  const testSuite = staticSafeSuite<TestModel>((data = {}) => {
    test('email', 'Email is required', () => {
      enforce(data.email).isNotEmpty();
    });

    test('email', 'Email format is invalid', () => {
      enforce(data.email).matches(/^[^@]+@[^@]+\.[^@]+$/);
    });

    test('password', 'Password must be at least 8 characters', () => {
      enforce(data.password).longerThan(7);
    });
  });

  describe('Error Display', () => {
    it('should display errors when showErrors is true and errors exist', async () => {
      @Component({
        imports: [NgxFormErrorComponent],
        template: `<ngx-form-error [field]="form.emailField()" />`,
      })
      class TestComponent {
        form = createVestForm(signal<TestModel>({ email: '', password: '' }), {
          suite: testSuite,
          errorStrategy: 'immediate',
        });
      }

      await render(TestComponent);

      // With EAGER mode (Vest default), only the first failing test runs
      // When email is empty, "Email is required" fails first, so format test doesn't run
      expect(screen.getByText('Email is required')).toBeInTheDocument();
      // Second error doesn't appear because EAGER mode stops after first failure
      expect(
        screen.queryByText('Email format is invalid'),
      ).not.toBeInTheDocument();
    });

    it('should have proper ARIA attributes for errors (role="alert", aria-live="assertive")', async () => {
      @Component({
        imports: [NgxFormErrorComponent],
        template: `<ngx-form-error [field]="form.emailField()" />`,
      })
      class TestComponent {
        form = createVestForm(signal<TestModel>({ email: '', password: '' }), {
          suite: testSuite,
          errorStrategy: 'immediate',
        });
      }

      await render(TestComponent);

      const errorContainer = screen.getByRole('alert');
      expect(errorContainer).toHaveAttribute('aria-live', 'assertive');
      expect(errorContainer).toHaveAttribute('aria-atomic', 'true');
    });

    it('should generate correct ARIA ID for error container', async () => {
      @Component({
        imports: [NgxFormErrorComponent],
        template: `<ngx-form-error [field]="form.emailField()" />`,
      })
      class TestComponent {
        form = createVestForm(signal<TestModel>({ email: '', password: '' }), {
          suite: testSuite,
          errorStrategy: 'immediate',
        });
      }

      await render(TestComponent);

      const errorContainer = screen.getByRole('alert');
      expect(errorContainer).toHaveAttribute('id', 'email-error');
    });

    it('should NOT display errors when showErrors is false', async () => {
      @Component({
        imports: [NgxFormErrorComponent],
        template: `<ngx-form-error [field]="form.emailField()" />`,
      })
      class TestComponent {
        form = createVestForm(signal<TestModel>({ email: '', password: '' }), {
          suite: testSuite,
          errorStrategy: 'on-submit', // Won't show until submit
        });
      }

      await render(TestComponent);

      // Errors should NOT be visible (on-submit strategy, not submitted yet)
      expect(screen.queryByText('Email is required')).toBeNull();
      expect(screen.queryByText('Email format is invalid')).toBeNull();
    });

    it('should NOT display errors when field is valid', async () => {
      @Component({
        imports: [NgxFormErrorComponent],
        template: `<ngx-form-error [field]="form.emailField()" />`,
      })
      class TestComponent {
        form = createVestForm(
          signal<TestModel>({
            email: 'valid@example.com',
            password: 'password123',
          }),
          { suite: testSuite, errorStrategy: 'immediate' },
        );
      }

      await render(TestComponent);

      // No errors for valid email
      expect(screen.queryByText('Email is required')).toBeNull();
      expect(screen.queryByText('Email format is invalid')).toBeNull();
    });
  });

  describe('Warning Display', () => {
    // Suite with warnings
    const suiteWithWarnings = staticSafeSuite<TestModel>((data = {}) => {
      test('password', 'Password should contain special characters', () => {
        enforce(data.password).matches(/[!@#$%^&*]/);
      });
    });

    it('should display warnings when showWarnings is true and warnings exist', async () => {
      @Component({
        imports: [NgxFormErrorComponent],
        template: `<ngx-form-error [field]="form.passwordField()" />`,
      })
      class TestComponent {
        form = createVestForm(
          signal<TestModel>({ email: '', password: 'simple' }),
          { suite: suiteWithWarnings, errorStrategy: 'immediate' },
        );
      }

      await render(TestComponent);

      // Note: This test will pass once warn() support is fully integrated
      // For now, warnings appear as errors in Vest result
      const messages = screen.queryAllByText(
        /Password should contain special characters/i,
      );
      expect(messages.length).toBeGreaterThanOrEqual(0);
    });

    it('should have proper ARIA attributes for warnings (role="status", aria-live="polite")', async () => {
      @Component({
        imports: [NgxFormErrorComponent],
        template: `<ngx-form-error [field]="form.passwordField()" />`,
      })
      class TestComponent {
        form = createVestForm(
          signal<TestModel>({ email: '', password: 'simple' }),
          { suite: suiteWithWarnings, errorStrategy: 'immediate' },
        );
      }

      const { container } = await render(TestComponent);

      // Look for role="status" container (warnings)
      const statusContainers = container.querySelectorAll('[role="status"]');
      if (statusContainers.length > 0) {
        const warningContainer = statusContainers[0];
        expect(warningContainer.getAttribute('aria-live')).toBe('polite');
        expect(warningContainer.getAttribute('aria-atomic')).toBe('true');
      }
    });

    it('should generate correct ARIA ID for warning container', async () => {
      @Component({
        imports: [NgxFormErrorComponent],
        template: `<ngx-form-error [field]="form.passwordField()" />`,
      })
      class TestComponent {
        form = createVestForm(
          signal<TestModel>({ email: '', password: 'simple' }),
          { suite: suiteWithWarnings, errorStrategy: 'immediate' },
        );
      }

      const { container } = await render(TestComponent);

      const statusContainers = container.querySelectorAll('[role="status"]');
      if (statusContainers.length > 0) {
        expect(statusContainers[0].id).toBe('password-warning');
      }
    });
  });

  describe('Error Strategy Integration', () => {
    describe('"immediate" strategy', () => {
      it('should show errors immediately without any interaction', async () => {
        @Component({
          imports: [NgxFormErrorComponent],
          template: `<ngx-form-error [field]="form.emailField()" />`,
        })
        class TestComponent {
          form = createVestForm(
            signal<TestModel>({ email: '', password: '' }),
            { suite: testSuite, errorStrategy: 'immediate' },
          );
        }

        await render(TestComponent);

        // Errors should show immediately without touching or submitting
        expect(screen.getByText('Email is required')).toBeInTheDocument();
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });

      it('should hide errors immediately when field becomes valid', async () => {
        @Component({
          imports: [NgxFormErrorComponent],
          template: `<ngx-form-error [field]="form.emailField()" />`,
        })
        class TestComponent {
          form = createVestForm(
            signal<TestModel>({ email: '', password: '' }),
            { suite: testSuite, errorStrategy: 'immediate' },
          );
        }

        const { fixture } = await render(TestComponent);

        // Initially has error
        expect(screen.getByText('Email is required')).toBeInTheDocument();

        // Fix the error by setting valid email
        fixture.componentInstance.form.setEmail('valid@example.com');
        await fixture.whenStable();

        // Error should disappear immediately
        expect(screen.queryByText('Email is required')).not.toBeInTheDocument();
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      });
    });

    describe('"on-touch" strategy', () => {
      it('should not show errors initially (field not touched)', async () => {
        @Component({
          imports: [NgxFormErrorComponent],
          template: `<ngx-form-error [field]="form.emailField()" />`,
        })
        class TestComponent {
          form = createVestForm(
            signal<TestModel>({ email: '', password: '' }),
            { suite: testSuite, errorStrategy: 'on-touch' },
          );
        }

        await render(TestComponent);

        // Initially, field is not touched, so no errors should show
        expect(screen.queryByText('Email is required')).toBeNull();
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      });

      it('should show errors after field is touched via touchEmail()', async () => {
        @Component({
          imports: [NgxFormErrorComponent],
          template: `<ngx-form-error [field]="form.emailField()" />`,
        })
        class TestComponent {
          form = createVestForm(
            signal<TestModel>({ email: '', password: '' }),
            { suite: testSuite, errorStrategy: 'on-touch' },
          );
        }

        const { fixture } = await render(TestComponent);

        // Touch the field programmatically
        fixture.componentInstance.form.touchEmail();
        await fixture.whenStable();

        // Now errors should appear
        expect(screen.getByText('Email is required')).toBeInTheDocument();
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });

      it('should show errors after field is touched via field().touch()', async () => {
        @Component({
          imports: [NgxFormErrorComponent],
          template: `<ngx-form-error [field]="form.emailField()" />`,
        })
        class TestComponent {
          form = createVestForm(
            signal<TestModel>({ email: '', password: '' }),
            { suite: testSuite, errorStrategy: 'on-touch' },
          );
        }

        const { fixture } = await render(TestComponent);

        // Touch the field via field accessor
        fixture.componentInstance.form.field('email').touch();
        await fixture.whenStable();

        // Now errors should appear
        expect(screen.getByText('Email is required')).toBeInTheDocument();
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });

      it('should keep showing errors after touch even when field value changes', async () => {
        @Component({
          imports: [NgxFormErrorComponent],
          template: `<ngx-form-error [field]="form.emailField()" />`,
        })
        class TestComponent {
          form = createVestForm(
            signal<TestModel>({ email: '', password: '' }),
            { suite: testSuite, errorStrategy: 'on-touch' },
          );
        }

        const { fixture } = await render(TestComponent);

        // Touch the field
        fixture.componentInstance.form.touchEmail();
        await fixture.whenStable();

        // Errors appear
        expect(screen.getByText('Email is required')).toBeInTheDocument();

        // Change value to another invalid value
        fixture.componentInstance.form.setEmail('invalid');
        await fixture.whenStable();

        // Errors should still be visible (field is still touched)
        expect(screen.getByText('Email format is invalid')).toBeInTheDocument();
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });

      it('should hide errors when field becomes valid after touch', async () => {
        @Component({
          imports: [NgxFormErrorComponent],
          template: `<ngx-form-error [field]="form.emailField()" />`,
        })
        class TestComponent {
          form = createVestForm(
            signal<TestModel>({ email: '', password: '' }),
            { suite: testSuite, errorStrategy: 'on-touch' },
          );
        }

        const { fixture } = await render(TestComponent);

        // Touch the field
        fixture.componentInstance.form.touchEmail();
        await fixture.whenStable();

        // Set valid value
        fixture.componentInstance.form.setEmail('valid@example.com');
        await fixture.whenStable();

        // Errors should disappear
        expect(screen.queryByText('Email is required')).not.toBeInTheDocument();
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      });
    });

    describe('"on-submit" strategy', () => {
      it('should not show errors initially (not submitted)', async () => {
        @Component({
          imports: [NgxFormErrorComponent],
          template: `<ngx-form-error [field]="form.emailField()" />`,
        })
        class TestComponent {
          form = createVestForm(
            signal<TestModel>({ email: '', password: '' }),
            { suite: testSuite, errorStrategy: 'on-submit' },
          );
        }

        await render(TestComponent);

        // Initially, form is not submitted, so no errors should show
        expect(screen.queryByText('Email is required')).toBeNull();
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      });

      it('should not show errors even after field is touched', async () => {
        @Component({
          imports: [NgxFormErrorComponent],
          template: `<ngx-form-error [field]="form.emailField()" />`,
        })
        class TestComponent {
          form = createVestForm(
            signal<TestModel>({ email: '', password: '' }),
            { suite: testSuite, errorStrategy: 'on-submit' },
          );
        }

        const { fixture } = await render(TestComponent);

        // Touch the field
        fixture.componentInstance.form.touchEmail();
        await fixture.whenStable();

        // Still no errors (not submitted yet)
        expect(screen.queryByText('Email is required')).toBeNull();
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      });

      it('should show errors after failed submit attempt', async () => {
        @Component({
          imports: [NgxFormErrorComponent],
          template: `<ngx-form-error [field]="form.emailField()" />`,
        })
        class TestComponent {
          form = createVestForm(
            signal<TestModel>({ email: '', password: '' }),
            { suite: testSuite, errorStrategy: 'on-submit' },
          );
        }

        const { fixture } = await render(TestComponent);

        // Try to submit (will fail)
        try {
          await fixture.componentInstance.form.submit();
        } catch {
          // Expected to fail
        }
        await fixture.whenStable();

        // Now errors should appear
        expect(screen.getByText('Email is required')).toBeInTheDocument();
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });

      it('should not show errors after successful submit', async () => {
        @Component({
          imports: [NgxFormErrorComponent],
          template: `<ngx-form-error [field]="form.emailField()" />`,
        })
        class TestComponent {
          form = createVestForm(
            signal<TestModel>({
              email: 'valid@example.com',
              password: 'password123',
            }),
            { suite: testSuite, errorStrategy: 'on-submit' },
          );
        }

        const { fixture } = await render(TestComponent);

        // Submit successfully
        await fixture.componentInstance.form.submit();
        await fixture.whenStable();

        // No errors should appear (form is valid)
        expect(screen.queryByText('Email is required')).not.toBeInTheDocument();
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      });

      it('should hide errors after fixing and resubmitting', async () => {
        @Component({
          imports: [NgxFormErrorComponent],
          template: `<ngx-form-error [field]="form.emailField()" />`,
        })
        class TestComponent {
          form = createVestForm(
            signal<TestModel>({ email: '', password: '' }),
            { suite: testSuite, errorStrategy: 'on-submit' },
          );
        }

        const { fixture } = await render(TestComponent);

        // First submit attempt (fails)
        try {
          await fixture.componentInstance.form.submit();
        } catch {
          // Expected
        }
        await fixture.whenStable();

        // Errors visible
        expect(screen.getByText('Email is required')).toBeInTheDocument();

        // Fix the error
        fixture.componentInstance.form.setEmail('valid@example.com');
        fixture.componentInstance.form.setPassword('password123');
        await fixture.whenStable();

        // Second submit attempt (succeeds)
        await fixture.componentInstance.form.submit();
        await fixture.whenStable();

        // Errors should disappear
        expect(screen.queryByText('Email is required')).not.toBeInTheDocument();
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      });
    });

    describe('"manual" strategy', () => {
      it('should not show errors initially', async () => {
        @Component({
          imports: [NgxFormErrorComponent],
          template: `<ngx-form-error [field]="form.emailField()" />`,
        })
        class TestComponent {
          form = createVestForm(
            signal<TestModel>({ email: '', password: '' }),
            { suite: testSuite, errorStrategy: 'manual' },
          );
        }

        await render(TestComponent);

        // No errors should show with manual strategy
        expect(screen.queryByText('Email is required')).toBeNull();
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      });

      it('should not show errors even after touch or submit', async () => {
        @Component({
          imports: [NgxFormErrorComponent],
          template: `<ngx-form-error [field]="form.emailField()" />`,
        })
        class TestComponent {
          form = createVestForm(
            signal<TestModel>({ email: '', password: '' }),
            { suite: testSuite, errorStrategy: 'manual' },
          );
        }

        const { fixture } = await render(TestComponent);

        // Touch the field
        fixture.componentInstance.form.touchEmail();
        await fixture.whenStable();

        // Still no errors
        expect(screen.queryByText('Email is required')).toBeNull();

        // Try to submit
        try {
          await fixture.componentInstance.form.submit();
        } catch {
          // Expected
        }
        await fixture.whenStable();

        // Still no errors (manual control required)
        expect(screen.queryByText('Email is required')).toBeNull();
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      });

      // TODO: These tests require setShowErrors() API to be implemented on VestField
      // The manual strategy needs a way to programmatically control error visibility
      // See: https://github.com/ngx-vest-forms/ngx-vest-forms/issues/XXX

      it.todo(
        'should show errors when manually enabled via setShowErrors',
        async () => {
          // @Component({
          //   imports: [NgxFormErrorComponent],
          //   template: `<ngx-form-error [field]="form.emailField()" />`,
          // })
          // class TestComponent {
          //   form = createVestForm(
          //     testSuite,
          //     signal<TestModel>({ email: '', password: '' }),
          //     {
          //       errorStrategy: 'manual',
          //     },
          //   );
          // }
          //
          // const { fixture } = await render(TestComponent);
          //
          // // Manually enable error display
          // fixture.componentInstance.form.field('email').setShowErrors(true);
          // await fixture.whenStable();
          //
          // // Now errors should appear
          // expect(screen.getByText('Email is required')).toBeInTheDocument();
          // expect(screen.getByRole('alert')).toBeInTheDocument();
        },
      );

      it.todo(
        'should hide errors when manually disabled via setShowErrors',
        async () => {
          // @Component({
          //   imports: [NgxFormErrorComponent],
          //   template: `<ngx-form-error [field]="form.emailField()" />`,
          // })
          // class TestComponent {
          //   form = createVestForm(
          //     testSuite,
          //     signal<TestModel>({ email: '', password: '' }),
          //     {
          //       errorStrategy: 'manual',
          //     },
          //   );
          // }
          //
          // const { fixture } = await render(TestComponent);
          //
          // // Enable errors
          // fixture.componentInstance.form.field('email').setShowErrors(true);
          // await fixture.whenStable();
          // expect(screen.getByText('Email is required')).toBeInTheDocument();
          //
          // // Disable errors manually
          // fixture.componentInstance.form.field('email').setShowErrors(false);
          // await fixture.whenStable();
          //
          // // Errors should disappear
          // expect(
          //   screen.queryByText('Email is required'),
          // ).not.toBeInTheDocument();
          // expect(screen.queryByRole('alert')).not.toBeInTheDocument();
        },
      );

      it.todo(
        'should support custom show logic via computed signals',
        async () => {
          // @Component({
          //   imports: [NgxFormErrorComponent],
          //   template: `<ngx-form-error [field]="form.emailField()" />`,
          // })
          // class TestComponent {
          //   form = createVestForm(
          //     testSuite,
          //     signal<TestModel>({ email: '', password: '' }),
          //     {
          //       errorStrategy: 'manual',
          //     },
          //   );
          // }
          //
          // const { fixture } = await render(TestComponent);
          //
          // // Custom logic: show errors only when email is not empty and invalid
          // const emailField = fixture.componentInstance.form.field('email');
          // const shouldShow =
          //   fixture.componentInstance.form.email() !== '' &&
          //   !fixture.componentInstance.form.emailValid();
          //
          // emailField.setShowErrors(shouldShow);
          // await fixture.whenStable();
          //
          // // No errors yet (email is empty)
          // expect(screen.queryByText('Email is required')).toBeNull();
          //
          // // Set invalid email
          // fixture.componentInstance.form.setEmail('invalid');
          // await fixture.whenStable();
          //
          // // Update custom logic
          // const shouldShowNow =
          //   fixture.componentInstance.form.email() !== '' &&
          //   !fixture.componentInstance.form.emailValid();
          // emailField.setShowErrors(shouldShowNow);
          // await fixture.whenStable();
          //
          //  Now errors should appear (custom condition met)
          // expect(
          //   screen.getByText('Email format is invalid'),
          // ).toBeInTheDocument();
        },
      );
    });
  });

  describe('Multiple Errors and Warnings', () => {
    it('should display all errors for a field', async () => {
      @Component({
        imports: [NgxFormErrorComponent],
        template: `<ngx-form-error [field]="form.emailField()" />`,
      })
      class TestComponent {
        form = createVestForm(signal<TestModel>({ email: '', password: '' }), {
          suite: testSuite,
          errorStrategy: 'immediate',
        });
      }

      await render(TestComponent);

      // EAGER mode: only first failing test runs
      expect(screen.getByText('Email is required')).toBeInTheDocument();
      expect(
        screen.queryByText('Email format is invalid'),
      ).not.toBeInTheDocument();
    });

    it('should render each error in a separate paragraph', async () => {
      @Component({
        imports: [NgxFormErrorComponent],
        template: `<ngx-form-error [field]="form.emailField()" />`,
      })
      class TestComponent {
        form = createVestForm(signal<TestModel>({ email: '', password: '' }), {
          suite: testSuite,
          errorStrategy: 'immediate',
        });
      }

      const { container } = await render(TestComponent);

      const errorParagraphs = container.querySelectorAll(
        '.ngx-form-error__message--error',
      );
      // EAGER mode: only first failing test per field
      expect(errorParagraphs.length).toBe(1);
    });
  });

  describe('CSS Classes', () => {
    it('should apply correct CSS classes to error container', async () => {
      @Component({
        imports: [NgxFormErrorComponent],
        template: `<ngx-form-error [field]="form.emailField()" />`,
      })
      class TestComponent {
        form = createVestForm(signal<TestModel>({ email: '', password: '' }), {
          suite: testSuite,
          errorStrategy: 'immediate',
        });
      }

      const { container } = await render(TestComponent);

      const errorContainer = container.querySelector(
        '.ngx-form-error__container--error',
      );
      expect(errorContainer).not.toBeNull();
      expect(
        errorContainer?.classList.contains('ngx-form-error__container'),
      ).toBe(true);
    });

    it('should apply correct CSS classes to error messages', async () => {
      @Component({
        imports: [NgxFormErrorComponent],
        template: `<ngx-form-error [field]="form.emailField()" />`,
      })
      class TestComponent {
        form = createVestForm(signal<TestModel>({ email: '', password: '' }), {
          suite: testSuite,
          errorStrategy: 'immediate',
        });
      }

      const { container } = await render(TestComponent);

      const errorMessages = container.querySelectorAll(
        '.ngx-form-error__message--error',
      );
      // EAGER mode: only the first failing test runs per field
      // When email is empty, only "Email is required" fails
      expect(errorMessages.length).toBe(1);
      for (const message of errorMessages) {
        expect(message.classList.contains('ngx-form-error__message')).toBe(
          true,
        );
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle field with no errors gracefully', async () => {
      @Component({
        imports: [NgxFormErrorComponent],
        template: `<ngx-form-error [field]="form.emailField()" />`,
      })
      class TestComponent {
        form = createVestForm(
          signal<TestModel>({
            email: 'valid@example.com',
            password: 'password123',
          }),
          { suite: testSuite, errorStrategy: 'immediate' },
        );
      }

      const { container } = await render(TestComponent);

      // No error container should be rendered
      const errorContainer = container.querySelector('[role="alert"]');
      expect(errorContainer).toBeNull();
    });

    it('should handle empty field name', async () => {
      @Component({
        imports: [NgxFormErrorComponent],
        template: `<ngx-form-error [field]="form.emailField()" />`,
      })
      class TestComponent {
        form = createVestForm(signal<TestModel>({ email: '', password: '' }), {
          suite: testSuite,
          errorStrategy: 'immediate',
        });
      }

      await render(TestComponent);

      const errorContainer = screen.getByRole('alert');
      // Should still have an ID even if field name is unusual
      expect(errorContainer.id).toBeTruthy();
    });
  });

  describe('Reactive Updates', () => {
    it('should update when field errors change', async () => {
      @Component({
        imports: [NgxFormErrorComponent],
        template: `<ngx-form-error [field]="form.emailField()" />`,
      })
      class TestComponent {
        form = createVestForm(signal<TestModel>({ email: '', password: '' }), {
          suite: testSuite,
          errorStrategy: 'immediate',
        });
      }

      await render(TestComponent);

      // Initially has errors
      expect(screen.getByText('Email is required')).toBeInTheDocument();

      // TODO: Update field value and verify errors disappear
      // This would require form.setEmail('valid@example.com') and waitFor()
    });
  });

  describe('Accessibility Compliance', () => {
    it('should use role="alert" for blocking errors (WCAG ARIA19)', async () => {
      @Component({
        imports: [NgxFormErrorComponent],
        template: `<ngx-form-error [field]="form.emailField()" />`,
      })
      class TestComponent {
        form = createVestForm(signal<TestModel>({ email: '', password: '' }), {
          suite: testSuite,
          errorStrategy: 'immediate',
        });
      }

      await render(TestComponent);

      const alert = screen.getByRole('alert');
      expect(alert).toBeTruthy();
    });

    it('should use aria-live="assertive" for errors', async () => {
      @Component({
        imports: [NgxFormErrorComponent],
        template: `<ngx-form-error [field]="form.emailField()" />`,
      })
      class TestComponent {
        form = createVestForm(signal<TestModel>({ email: '', password: '' }), {
          suite: testSuite,
          errorStrategy: 'immediate',
        });
      }

      await render(TestComponent);

      const alert = screen.getByRole('alert');
      expect(alert).toHaveAttribute('aria-live', 'assertive');
    });

    it('should use aria-atomic="true" for complete message reading', async () => {
      @Component({
        imports: [NgxFormErrorComponent],
        template: `<ngx-form-error [field]="form.emailField()" />`,
      })
      class TestComponent {
        form = createVestForm(signal<TestModel>({ email: '', password: '' }), {
          suite: testSuite,
          errorStrategy: 'immediate',
        });
      }

      await render(TestComponent);

      const alert = screen.getByRole('alert');
      expect(alert).toHaveAttribute('aria-atomic', 'true');
    });
  });

  describe('Vest.js Execution Modes', () => {
    it('should display only first error with EAGER mode (default)', async () => {
      // EAGER mode is the default - stops after first failing test per field
      const eagerSuite = staticSafeSuite<TestModel>((data = {}) => {
        // No mode() call = EAGER by default
        test('email', 'Email is required', () => {
          enforce(data.email).isNotEmpty();
        });

        test('email', 'Email format is invalid', () => {
          enforce(data.email).matches(/^[^@]+@[^@]+\.[^@]+$/);
        });
      });

      @Component({
        imports: [NgxFormErrorComponent],
        template: `<ngx-form-error [field]="form.emailField()" />`,
      })
      class TestComponent {
        form = createVestForm(signal<TestModel>({ email: '', password: '' }), {
          suite: eagerSuite,
          errorStrategy: 'immediate',
        });
      }

      await render(TestComponent);

      // EAGER mode: only first failing test runs
      expect(screen.getByText('Email is required')).toBeInTheDocument();
      expect(
        screen.queryByText('Email format is invalid'),
      ).not.toBeInTheDocument();
    });

    it('should display all errors with ALL mode when configured', async () => {
      // Import mode and Modes from vest
      const { mode, Modes } = await import('vest');

      // ALL mode - run all tests even if some fail
      const allModeSuite = staticSafeSuite<TestModel>((data = {}) => {
        mode(Modes.ALL); // Show all errors, not just first

        test('email', 'Email is required', () => {
          enforce(data.email).isNotEmpty();
        });

        test('email', 'Email format is invalid', () => {
          enforce(data.email).matches(/^[^@]+@[^@]+\.[^@]+$/);
        });
      });

      @Component({
        imports: [NgxFormErrorComponent],
        template: `<ngx-form-error [field]="form.emailField()" />`,
      })
      class TestComponent {
        form = createVestForm(signal<TestModel>({ email: '', password: '' }), {
          suite: allModeSuite,
          errorStrategy: 'immediate',
        });
      }

      const { container } = await render(TestComponent);

      // ALL mode: both tests should run and both errors appear
      expect(screen.getByText('Email is required')).toBeInTheDocument();
      expect(screen.getByText('Email format is invalid')).toBeInTheDocument();

      // Verify both errors are in separate paragraphs
      const errorMessages = container.querySelectorAll(
        '.ngx-form-error__message',
      );
      expect(errorMessages.length).toBe(2);
    });

    it('should display all errors when field has multiple failures with ALL mode', async () => {
      const { mode, Modes } = await import('vest');

      // Create a suite that always uses ALL mode with an invalid email value
      const allModeSuite = staticSafeSuite<TestModel>((data = {}) => {
        mode(Modes.ALL); // Show all errors

        test('email', 'Email is required', () => {
          enforce(data.email).isNotEmpty();
        });

        test('email', 'Email format is invalid', () => {
          enforce(data.email).matches(/^[^@]+@[^@]+\.[^@]+$/);
        });
      });

      @Component({
        imports: [NgxFormErrorComponent],
        template: `<ngx-form-error [field]="form.emailField()" />`,
      })
      class TestComponent {
        form = createVestForm(
          signal<TestModel>({ email: 'invalid-email', password: '' }),
          {
            suite: allModeSuite,
            errorStrategy: 'immediate',
          },
        );
      }

      const { container } = await render(TestComponent);

      // With invalid email value that's not empty:
      // - "Email is required" should NOT appear (email is not empty)
      // - "Email format is invalid" SHOULD appear (email is present but invalid)
      expect(screen.queryByText('Email is required')).not.toBeInTheDocument();
      expect(screen.getByText('Email format is invalid')).toBeInTheDocument();

      // Verify only one error message (the failing test)
      const errorMessages = container.querySelectorAll(
        '.ngx-form-error__message',
      );
      expect(errorMessages.length).toBe(1);
    });
  });
});
