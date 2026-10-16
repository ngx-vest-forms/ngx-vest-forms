import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  logDiagnostic,
  logWarning,
  NGX_VEST_FORMS_DIAGNOSTICS,
  NGX_VEST_FORMS_ERRORS,
} from './error-catalog';

const CONTRACT_HINT =
  'Check your [formContract] input, provideFormContract(...) provider, and the initial [formValue].';

describe('NGX_VEST_FORMS_ERRORS', () => {
  it('assigns a unique NGX-00x code to each contract error', () => {
    expect(NGX_VEST_FORMS_ERRORS.EXTRA_PROPERTY.code).toBe('NGX-001');
    expect(NGX_VEST_FORMS_ERRORS.TYPE_MISMATCH.code).toBe('NGX-002');
    expect(NGX_VEST_FORMS_ERRORS.CONTROL_NOT_FOUND.code).toBe('NGX-003');
    expect(NGX_VEST_FORMS_ERRORS.SCHEMA_ISSUE.code).toBe('NGX-004');
  });

  it('EXTRA_PROPERTY names the offending path', () => {
    expect(NGX_VEST_FORMS_ERRORS.EXTRA_PROPERTY.message('address.zip')).toBe(
      "Contract mismatch: Property 'address.zip' is present in the form value but not defined in the form contract."
    );
  });

  it('TYPE_MISMATCH names the path, expected and actual types', () => {
    expect(
      NGX_VEST_FORMS_ERRORS.TYPE_MISMATCH.message('age', 'number', 'string')
    ).toBe("Type mismatch at 'age': Expected 'number' but got 'string'.");
  });

  it('CONTROL_NOT_FOUND names the path and points at the name attributes', () => {
    expect(NGX_VEST_FORMS_ERRORS.CONTROL_NOT_FOUND.message('a.b')).toBe(
      "Control not found: Could not find form control at path 'a.b'. Check your [ngModel] name attributes."
    );
  });

  it('SCHEMA_ISSUE combines the path and the schema message', () => {
    expect(
      NGX_VEST_FORMS_ERRORS.SCHEMA_ISSUE.message('email', 'Expected string')
    ).toBe("Form contract issue at 'email': Expected string");
  });
});

describe('NGX_VEST_FORMS_DIAGNOSTICS', () => {
  it('assigns sequential NGX-1xx codes', () => {
    expect(
      Object.values(NGX_VEST_FORMS_DIAGNOSTICS).map(({ code }) => code)
    ).toEqual([
      'NGX-100',
      'NGX-101',
      'NGX-102',
      'NGX-103',
      'NGX-104',
      'NGX-105',
      'NGX-106',
      'NGX-107',
    ]);
  });

  it('NGX-100 SYNC_CONFLICT_DROPPED explains the dropped change', () => {
    const message = NGX_VEST_FORMS_DIAGNOSTICS.SYNC_CONFLICT_DROPPED.message();
    expect(message).toContain('divergent simultaneous change');
    expect(message).toContain('form value wins');
    expect(message).toContain('[formValue] with (formValueChange)');
  });

  it('NGX-101 ROOT_FORM_NGFORM_MISSING lists the common setup mistakes', () => {
    const message =
      NGX_VEST_FORMS_DIAGNOSTICS.ROOT_FORM_NGFORM_MISSING.message();
    expect(message).toMatch(
      /^\[ValidateRootFormDirective\] NgForm not found\./
    );
    expect(message).toContain('(1) Missing ngxVestForm directive');
    expect(message).toContain('(2) Directive on non-form element');
    expect(message).toContain('(3) NgForm not imported');
  });

  it('NGX-102 ROOT_FORM_VALIDATION_ERROR includes the error detail', () => {
    expect(
      NGX_VEST_FORMS_DIAGNOSTICS.ROOT_FORM_VALIDATION_ERROR.message('boom')
    ).toBe('[validate-root-form] Observable error: boom');
  });

  it('NGX-103 ASYNC_BRIDGE_NO_CONTEXT names the source directive', () => {
    expect(
      NGX_VEST_FORMS_DIAGNOSTICS.ASYNC_BRIDGE_NO_CONTEXT.message(
        'FormModelDirective'
      )
    ).toBe(
      '[ngx-vest-forms] FormModelDirective: No FormDirective context found. Validation skipped (fail-open).'
    );
  });

  it('NGX-104 ASYNC_BRIDGE_UNRESOLVED_PATH names the source directive', () => {
    expect(
      NGX_VEST_FORMS_DIAGNOSTICS.ASYNC_BRIDGE_UNRESOLVED_PATH.message(
        'FormModelGroupDirective'
      )
    ).toBe(
      '[ngx-vest-forms] FormModelGroupDirective: Could not resolve control path. Ensure the control has a valid name/path and is registered in the form tree.'
    );
  });

  it('NGX-105 ERROR_DISPLAY_MODE_CONFLICT describes the on-blur/submit clash', () => {
    expect(
      NGX_VEST_FORMS_DIAGNOSTICS.ERROR_DISPLAY_MODE_CONFLICT.message()
    ).toContain('errorDisplayMode is "on-blur" but updateOn is "submit"');
  });

  it('NGX-106 VALIDATION_CONFIG_IDLE_TIMEOUT mentions the PENDING state', () => {
    expect(
      NGX_VEST_FORMS_DIAGNOSTICS.VALIDATION_CONFIG_IDLE_TIMEOUT.message()
    ).toContain('timed out waiting for the form to leave the PENDING state');
  });

  it('NGX-107 VALIDATION_CONFIG_DEPENDENTS_TIMEOUT lists the missing controls', () => {
    expect(
      NGX_VEST_FORMS_DIAGNOSTICS.VALIDATION_CONFIG_DEPENDENTS_TIMEOUT.message(
        'confirmPassword, email'
      )
    ).toBe(
      '[ngx-vest-forms] validationConfig: timed out waiting for dependent controls: confirmPassword, email. Continuing without them.'
    );
  });
});

describe('logWarning / logDiagnostic', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it('logWarning prefixes the code and appends the form-contract hint', () => {
    logWarning(NGX_VEST_FORMS_ERRORS.TYPE_MISMATCH, 'age', 'number', 'string');

    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledWith(
      `[NGX-002] Type mismatch at 'age': Expected 'number' but got 'string'.\n${CONTRACT_HINT}`
    );
  });

  it('logDiagnostic prefixes the code without the form-contract hint', () => {
    logDiagnostic(
      NGX_VEST_FORMS_DIAGNOSTICS.ROOT_FORM_VALIDATION_ERROR,
      'network down'
    );

    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledWith(
      '[NGX-102] [validate-root-form] Observable error: network down'
    );
    expect(String(warnSpy.mock.calls[0][0])).not.toContain('[formContract]');
  });
});
