import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  logDiagnostic,
  logWarning,
  NGX_VEST_FORMS_DIAGNOSTICS,
  NGX_VEST_FORMS_ERRORS,
} from './error-catalog';

describe('error-catalog', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  describe('NGX_VEST_FORMS_ERRORS catalog', () => {
    it('assigns the documented stable codes to each entry', () => {
      expect(NGX_VEST_FORMS_ERRORS.EXTRA_PROPERTY.code).toBe('NGX-001');
      expect(NGX_VEST_FORMS_ERRORS.TYPE_MISMATCH.code).toBe('NGX-002');
      expect(NGX_VEST_FORMS_ERRORS.CONTROL_NOT_FOUND.code).toBe('NGX-003');
      expect(NGX_VEST_FORMS_ERRORS.SCHEMA_ISSUE.code).toBe('NGX-004');
    });

    it('renders EXTRA_PROPERTY with the supplied path', () => {
      expect(NGX_VEST_FORMS_ERRORS.EXTRA_PROPERTY.message('user.email')).toBe(
        "Contract mismatch: Property 'user.email' is present in the form value but not defined in the form contract."
      );
    });

    it('renders TYPE_MISMATCH with path, expected, and actual', () => {
      expect(
        NGX_VEST_FORMS_ERRORS.TYPE_MISMATCH.message('age', 'number', 'string')
      ).toBe("Type mismatch at 'age': Expected 'number' but got 'string'.");
    });

    it('renders CONTROL_NOT_FOUND with the supplied path', () => {
      expect(
        NGX_VEST_FORMS_ERRORS.CONTROL_NOT_FOUND.message('addresses[0].street')
      ).toBe(
        "Control not found: Could not find form control at path 'addresses[0].street'. Check your [ngModel] name attributes."
      );
    });

    it('renders SCHEMA_ISSUE with path and message', () => {
      expect(
        NGX_VEST_FORMS_ERRORS.SCHEMA_ISSUE.message('age', 'Expected number')
      ).toBe("Form contract issue at 'age': Expected number");
    });
  });

  describe('NGX_VEST_FORMS_DIAGNOSTICS catalog', () => {
    it('assigns the documented NGX-1xx codes', () => {
      expect(NGX_VEST_FORMS_DIAGNOSTICS.SYNC_CONFLICT_DROPPED.code).toBe(
        'NGX-100'
      );
      expect(NGX_VEST_FORMS_DIAGNOSTICS.ROOT_FORM_NGFORM_MISSING.code).toBe(
        'NGX-101'
      );
      expect(NGX_VEST_FORMS_DIAGNOSTICS.ROOT_FORM_VALIDATION_ERROR.code).toBe(
        'NGX-102'
      );
      expect(NGX_VEST_FORMS_DIAGNOSTICS.ASYNC_BRIDGE_NO_CONTEXT.code).toBe(
        'NGX-103'
      );
      expect(NGX_VEST_FORMS_DIAGNOSTICS.ASYNC_BRIDGE_UNRESOLVED_PATH.code).toBe(
        'NGX-104'
      );
      expect(NGX_VEST_FORMS_DIAGNOSTICS.ERROR_DISPLAY_MODE_CONFLICT.code).toBe(
        'NGX-105'
      );
    });

    it('renders ROOT_FORM_VALIDATION_ERROR with detail', () => {
      expect(
        NGX_VEST_FORMS_DIAGNOSTICS.ROOT_FORM_VALIDATION_ERROR.message('boom')
      ).toBe('[validate-root-form] Observable error: boom');
    });

    it('renders ASYNC_BRIDGE_NO_CONTEXT with the source identifier', () => {
      expect(
        NGX_VEST_FORMS_DIAGNOSTICS.ASYNC_BRIDGE_NO_CONTEXT.message(
          'FormModelDirective'
        )
      ).toBe(
        '[ngx-vest-forms] FormModelDirective: No FormDirective context found. Validation skipped (fail-open).'
      );
    });

    it('renders ASYNC_BRIDGE_UNRESOLVED_PATH with the source identifier', () => {
      expect(
        NGX_VEST_FORMS_DIAGNOSTICS.ASYNC_BRIDGE_UNRESOLVED_PATH.message(
          'FormModelGroupDirective'
        )
      ).toContain('FormModelGroupDirective: Could not resolve control path.');
    });
  });

  describe('logWarning', () => {
    it('prefixes the message with the catalog code and appends the contract hint', () => {
      logWarning(NGX_VEST_FORMS_ERRORS.EXTRA_PROPERTY, 'profile.nickname');

      expect(warnSpy).toHaveBeenCalledTimes(1);
      const message = warnSpy.mock.calls[0]?.[0] as string;
      expect(message).toContain('[NGX-001]');
      expect(message).toContain(
        "Property 'profile.nickname' is present in the form value but not defined in the form contract."
      );
      expect(message).toContain(
        'Check your [formContract] input, provideFormContract(...) provider, and the initial [formValue].'
      );
    });

    it('forwards rest arguments to the catalog message function', () => {
      logWarning(
        NGX_VEST_FORMS_ERRORS.TYPE_MISMATCH,
        'amount',
        'number',
        'string'
      );

      const message = warnSpy.mock.calls[0]?.[0] as string;
      expect(message).toContain('[NGX-002]');
      expect(message).toContain(
        "Type mismatch at 'amount': Expected 'number' but got 'string'."
      );
    });
  });

  describe('logDiagnostic', () => {
    it('prefixes the message with the diagnostic code without the contract hint', () => {
      logDiagnostic(NGX_VEST_FORMS_DIAGNOSTICS.ROOT_FORM_NGFORM_MISSING);

      expect(warnSpy).toHaveBeenCalledTimes(1);
      const message = warnSpy.mock.calls[0]?.[0] as string;
      expect(message).toContain('[NGX-101]');
      expect(message).toContain('[ValidateRootFormDirective] NgForm not found');
      expect(message).not.toContain('[formContract]');
    });

    it('forwards rest arguments to the diagnostic message function', () => {
      logDiagnostic(
        NGX_VEST_FORMS_DIAGNOSTICS.ROOT_FORM_VALIDATION_ERROR,
        'network down'
      );

      const message = warnSpy.mock.calls[0]?.[0] as string;
      expect(message).toBe(
        '[NGX-102] [validate-root-form] Observable error: network down'
      );
    });
  });
});
