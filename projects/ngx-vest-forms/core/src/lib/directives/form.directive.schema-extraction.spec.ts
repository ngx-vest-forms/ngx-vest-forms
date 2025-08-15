import { ApplicationRef } from '@angular/core';
import { render } from '@testing-library/angular';
import { userEvent } from '@vitest/browser/context';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Hoisted mock: replace validateModelTemplate with a vi.fn to allow call count assertions in Vitest Browser
vi.mock('../utils/shape-validation', async () => {
  const actual = await vi.importActual<
    typeof import('../utils/shape-validation')
  >('../utils/shape-validation');
  return {
    ...actual,
    validateModelTemplate: vi.fn(actual.validateModelTemplate),
  };
});

import { ngxModelToStandardSchema } from 'ngx-vest-forms/schemas';
import { z } from 'zod';
import * as shapeValidation from '../utils/shape-validation';
import { TestFormComponent } from './__tests__/components/test-form.component';

describe('NgxFormDirective - schema template extraction', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.clearAllMocks();
  });

  it('should call validateModelTemplate when schema has _shape (ngxModelToStandardSchema)', async () => {
    const spy = shapeValidation.validateModelTemplate as unknown as ReturnType<
      typeof vi.fn
    >;

    const { fixture } = await render(TestFormComponent);
    const appReference = fixture.debugElement.injector.get(ApplicationRef);

    // Provide schema created via ngxModelToStandardSchema with matching template
    const template = { email: '', password: '' };
    const schema = ngxModelToStandardSchema(template);
    fixture.componentInstance.formSchema.set(
      schema as unknown as {
        parse: (d: unknown) => { email: string; password: string };
      },
    );

    // Stabilize Angular and allow effects to run
    await fixture.whenStable();
    await appReference.whenStable();

    // Small interaction to ensure value signal flushes
    const emailInput = fixture.nativeElement.querySelector(
      '#email',
    ) as HTMLInputElement;
    await userEvent.clear(emailInput);
    await userEvent.type(emailInput, 'a');
    await fixture.whenStable();
    await appReference.whenStable();

    expect(spy).toHaveBeenCalled();
  });

  it('should NOT call validateModelTemplate for Zod/standard schemas without _shape', async () => {
    const spy = shapeValidation.validateModelTemplate as unknown as ReturnType<
      typeof vi.fn
    >;

    const { fixture } = await render(TestFormComponent);
    const appReference = fixture.debugElement.injector.get(ApplicationRef);

    // Provide a Zod schema (StandardSchemaV1 via adapter) – no _shape available
    const zodSchema = z.object({ email: z.string(), password: z.string() });
    fixture.componentInstance.formSchema.set(
      zodSchema as unknown as {
        parse: (d: unknown) => { email: string; password: string };
      },
    );

    await fixture.whenStable();
    await appReference.whenStable();

    // Interaction to flush
    const passwordInput = fixture.nativeElement.querySelector(
      '#password',
    ) as HTMLInputElement;
    await userEvent.clear(passwordInput);
    await userEvent.type(passwordInput, 'a');
    await fixture.whenStable();
    await appReference.whenStable();

    expect(spy).not.toHaveBeenCalled();
  });
});
