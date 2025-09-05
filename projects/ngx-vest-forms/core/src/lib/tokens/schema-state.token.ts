import { InjectionToken } from '@angular/core';

/**
 * Lightweight schema validation state shared via DI between the schemas
 * directive and the full form directive. Defined in core to avoid
 * core->schemas coupling and circular dependencies.
 */
export type NgxSchemaValidationState = {
  hasRun: boolean;
  success: boolean | null;
  issues: readonly { path?: string; message: string }[];
  errorMap: Readonly<Record<string, readonly string[]>>;
} | null;

/**
 * Optional provider that, when present, exposes a function-like accessor
 * (Signal-compatible) returning the current schema validation state.
 */
export const NGX_SCHEMA_STATE = new InjectionToken<
  () => NgxSchemaValidationState
>('NGX_SCHEMA_STATE');
