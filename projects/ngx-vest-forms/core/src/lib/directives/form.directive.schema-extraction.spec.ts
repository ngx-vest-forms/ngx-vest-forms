import { ApplicationRef } from '@angular/core';
import { render } from '@testing-library/angular';
import { userEvent } from '@vitest/browser/context';
// Import directly from source to avoid secondary entrypoint resolution issues in Vitest
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import * as schemaAdapter from '../../../../schemas/src/lib/schema-adapter';
import { ngxModelToStandardSchema } from '../../../../schemas/src/lib/schema-adapter';
import { TestFormComponent } from './__tests__/components/test-form.component';

// Hoisted mock: replace validateModelTemplate with a vi.fn to allow call count assertions in Vitest Browser
vi.mock('../../../../schemas/src/lib/schema-adapter', async () => {
  const actual = await vi.importActual<
    typeof import('../../../../schemas/src/lib/schema-adapter')
  >('../../../../schemas/src/lib/schema-adapter');
  return {
    ...actual,
    ngxExtractTemplateFromSchema: vi.fn(actual.ngxExtractTemplateFromSchema),
  };
});

describe('NgxFormDirective - schema template extraction', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.clearAllMocks();
  });

  it('should call validateModelTemplate when schema has _shape (ngxModelToStandardSchema)', async () => {
    const spy =
      schemaAdapter.ngxExtractTemplateFromSchema as unknown as ReturnType<
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
    const spy =
      schemaAdapter.ngxExtractTemplateFromSchema as unknown as ReturnType<
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
